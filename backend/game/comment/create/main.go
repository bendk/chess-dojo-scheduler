package main

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameCommenter = database.DynamoDB

const funcName = "game-comment-create-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(funcName, err), nil
	}
	cohort = strings.ReplaceAll(cohort, "%2B", "+")

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}
	id = strings.ReplaceAll(id, "%3F", "?")

	comment := database.Comment{}
	if err := json.Unmarshal([]byte(event.Body), &comment); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
		return api.Failure(funcName, err), nil
	}

	if comment.Owner != api.GetUserInfo(event).Username {
		err := errors.New(400, "Invalid request: owner does not match caller", "")
		return api.Failure(funcName, err), nil
	}

	if comment.OwnerDiscord == "" {
		err := errors.New(400, "Invalid request: ownerDiscord must not be empty", "")
		return api.Failure(funcName, err), nil
	}

	if string(comment.OwnerCohort) == "" {
		err := errors.New(400, "Invalid request: ownerCohort must not be empty", "")
		return api.Failure(funcName, err), nil
	}

	if comment.Content == "" {
		err := errors.New(400, "Invalid request: content must not be empty", "")
		return api.Failure(funcName, err), nil
	}

	comment.Id = uuid.NewString()
	comment.CreatedAt = time.Now().Format(time.RFC3339)
	comment.UpdatedAt = comment.CreatedAt

	game, err := repository.CreateComment(cohort, id, &comment)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, game), nil
}

func main() {
	lambda.Start(Handler)
}
