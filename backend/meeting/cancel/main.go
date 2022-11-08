package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

var repository database.MeetingCanceler = database.DynamoDB

const funcName = "meeting-cancel-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(funcName, err), nil
	}

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}

	meeting, err := repository.GetMeeting(id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if info.Username != meeting.Owner && info.Username != meeting.Participant {
		err := errors.New(403, "Invalid request: user is not a member of this meeting", "")
		return api.Failure(funcName, err), nil
	}

	meeting, err = repository.CancelMeeting(meeting)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if user, err := repository.GetUser(info.Username); err != nil {
		log.Error("Failed GetUser: ", err)
	} else if err := repository.RecordMeetingCancelation(user.DojoCohort); err != nil {
		log.Error("Failed RecordMeetingCancelation: ", err)
	}

	var opponentUsername = meeting.Owner
	if info.Username == meeting.Owner {
		opponentUsername = meeting.Participant
	}
	if err := discord.SendCancellationNotification(opponentUsername, meeting.Id); err != nil {
		log.Error("Failed SendCancellationNotification: ", err)
	}

	return api.Success(funcName, meeting), nil
}

func main() {
	lambda.Start(Handler)
}
