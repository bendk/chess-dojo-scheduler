package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

var repository database.UserUpdater = database.DynamoDB
var mediaStore database.MediaStore = database.S3
var stage = os.Getenv("stage")

const (
	referralSheetId = "198Me8Qm7YVKEtlY0Y56PbePaJz-Quqr4cA6hhhdRkgc"
	sheetRange      = "Sheet1"
)

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}

	update := &database.UserUpdate{}
	if err := json.Unmarshal([]byte(event.Body), update); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	autopickCohort, _ := event.QueryStringParameters["autopickCohort"]
	if autopickCohort == "true" {
		return handleAutopickCohort(user, update), nil
	}

	if update.DisplayName != nil {
		displayName := strings.TrimSpace(*update.DisplayName)
		update.DisplayName = &displayName
		if *update.DisplayName == "" {
			return api.Failure(errors.New(400, "Invalid request: displayName cannot be empty", "")), nil
		}
	}
	if update.RatingSystem != nil {
		ratingSystem := strings.TrimSpace(string(*update.RatingSystem))
		update.RatingSystem = (*database.RatingSystem)(&ratingSystem)
		if *update.RatingSystem == "" {
			return api.Failure(errors.New(400, "Invalid request: ratingSystem cannot be empty", "")), nil
		}
	}
	if update.DojoCohort != nil {
		cohort := strings.TrimSpace(string(*update.DojoCohort))
		update.DojoCohort = (*database.DojoCohort)(&cohort)
		if *update.DojoCohort == "" {
			return api.Failure(errors.New(400, "Invalid request: dojoCohort cannot be empty", "")), nil
		}
	}

	if err := saveReferralSource(ctx, user, update); err != nil {
		return api.Failure(err), nil
	}

	if update.DiscordUsername != nil {
		username := strings.TrimSpace(*update.DiscordUsername)
		update.DiscordUsername = &username
		if *update.DiscordUsername != "" {
			avatarUrl, err := discord.GetDiscordAvatarURL(*update.DiscordUsername)
			if err != nil {
				return api.Failure(err), nil
			}
			if !user.ProfilePictureSet && avatarUrl != "" {
				if err := mediaStore.CopyImageFromURL(avatarUrl, fmt.Sprintf("/profile/%s", info.Username)); err != nil {
					log.Errorf("Failed to copy Discord avatar URL: %v", err)
				}
			}
		}
	}

	if err := fetchRatings(user, update); err != nil {
		return api.Failure(err), nil
	}

	if update.ProfilePictureData != nil {
		if *update.ProfilePictureData == "" {
			err = mediaStore.DeleteImage(fmt.Sprintf("/profile/%s", info.Username))
		} else {
			err = mediaStore.UploadImage(fmt.Sprintf("/profile/%s", info.Username), *update.ProfilePictureData)
		}
		if err != nil {
			return api.Failure(err), nil
		}
		update.ProfilePictureSet = aws.Bool(true)
	}

	update.SearchKey = aws.String(database.GetSearchKey(user, update))
	user, err = repository.UpdateUser(info.Username, update)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(user), nil
}

func fetchCurrentRating(rating *database.Rating, fetcher ratings.RatingFetchFunc) error {
	rating.Username = strings.TrimSpace(rating.Username)
	if rating.Username == "" {
		rating.CurrentRating = 0
		rating.StartRating = 0
		return nil
	}

	currentRating, err := fetcher(rating.Username)
	rating.CurrentRating = currentRating
	if rating.StartRating == 0 {
		rating.StartRating = currentRating
	}
	return err
}

func fetchRatings(user *database.User, update *database.UserUpdate) error {
	if update.Ratings == nil {
		return nil
	}

	for system, rating := range *update.Ratings {
		existingRating, _ := user.Ratings[system]
		if system != database.Custom && (existingRating == nil || rating.Username != existingRating.Username ||
			rating.CurrentRating == 0 || rating.StartRating == 0) {
			if err := fetchCurrentRating(rating, ratings.RatingFetchFuncs[system]); err != nil {
				return err
			}
		}
	}
	return nil
}

func handleAutopickCohort(user *database.User, update *database.UserUpdate) api.Response {
	if update.RatingSystem == nil || *update.RatingSystem == "" {
		return api.Failure(errors.New(400, "Invalid request: ratingSystem is required when autopickCohort is true", ""))
	}
	if *update.RatingSystem == database.Custom {
		return api.Failure(errors.New(400, "Invalid request: ratingSystem cannot be CUSTOM when autopickCohort is true", ""))
	}

	if err := fetchRatings(user, update); err != nil {
		return api.Failure(err)
	}
	if cohort := update.AutopickCohort(); cohort == database.NoCohort {
		return api.Failure(errors.New(500, "Unable to choose cohort. Please contact support", fmt.Sprintf("Autopick cohort returned NoCohort for update %+v", update)))
	}

	user, err := repository.UpdateUser(user.Username, update)
	if err != nil {
		return api.Failure(err)
	}
	return api.Success(user)
}

func saveReferralSource(ctx context.Context, user *database.User, update *database.UserUpdate) error {
	if update.ReferralSource == nil {
		return nil
	}

	source := strings.TrimSpace(*update.ReferralSource)
	update.ReferralSource = &source

	if *update.ReferralSource == "" {
		return errors.New(400, "Invalid request: referralSource cannot be empty", "")
	}

	// Do not return any further errors as not being able to write to the spreadsheet shouldn't block users
	// from signing up. Instead just log all errors

	client, err := getSheetsClient(ctx)
	if err != nil {
		log.Errorf("Failed to get sheets client: %v", err)
		return nil
	}

	valueRange := &sheets.ValueRange{
		MajorDimension: "ROWS",
		Values: [][]interface{}{
			{
				time.Now().Format(time.RFC3339),
				user.Username,
				user.Email,
				*update.ReferralSource,
				user.SubscriptionStatus,
			},
		},
	}
	call := client.Spreadsheets.Values.Append(referralSheetId, sheetRange, valueRange).ValueInputOption("RAW").Context(ctx)
	_, err = call.Do()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed Spreadsheet append call", err)
		log.Error(err)
	}

	if err := os.Remove("/tmp/openClassicalServiceAccountKey.json"); err != nil {
		log.Error(errors.Wrap(500, "Failed to remove JSON file: %v", "", err))
	}

	return nil
}

// Gets a client for Google Sheets.
func getSheetsClient(ctx context.Context) (*sheets.Service, error) {
	f, err := os.Create("/tmp/openClassicalServiceAccountKey.json")
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create file for service account key", err)
	}

	if err = mediaStore.Download(fmt.Sprintf("chess-dojo-%s-secrets", stage), "openClassicalServiceAccountKey.json", f); err != nil {
		return nil, err
	}
	if err = f.Close(); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to close file for service account key", err)
	}

	client, err := sheets.NewService(ctx, option.WithCredentialsFile("/tmp/openClassicalServiceAccountKey.json"))
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create Sheets client", err)
	}
	return client, nil
}
