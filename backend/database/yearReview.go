package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type YearReviewFloatData struct {
	Value      float32 `dynamodbav:"value" json:"value"`
	Percentile float32 `dynamodbav:"percentile" json:"percentile"`
}

type YearReviewIntData struct {
	Value            int     `dynamodbav:"value" json:"value"`
	Percentile       float32 `dynamodbav:"percentile" json:"percentile"`
	CohortPercentile float32 `dynamodbav:"cohortPercentile" json:"cohortPercentile"`
}

type YearReviewGamesData struct {
	Total    YearReviewIntData `dynamodbav:"total" json:"total"`
	ByPeriod map[string]int    `dynamodbav:"byPeriod" json:"byPeriod"`
}

type YearReviewDojoPoints struct {
	Total      YearReviewFloatData `dynamodbav:"total" json:"total"`
	ByPeriod   map[string]float32  `dynamodbav:"byPeriod" json:"byPeriod"`
	ByCategory map[string]float32  `dynamodbav:"byCategory" json:"byCategory"`
	ByTask     map[string]float32  `dynamodbav:"byTask" json:"byTask"`
}

type YearReviewMinutesSpent struct {
	Total      YearReviewIntData `dynamodbav:"total" json:"total"`
	ByPeriod   map[string]int    `dynamodbav:"byPeriod" json:"byPeriod"`
	ByCategory map[string]int    `dynamodbav:"byCategory" json:"byCategory"`
	ByTask     map[string]int    `dynamodbav:"byTask" json:"byTask"`
}

type YearReviewData struct {
	StartDate string `dynamodbav:"startDate" json:"startDate"`
	EndDate   string `dynamodbav:"endDate" json:"endDate"`

	DojoPoints   YearReviewDojoPoints   `dynamodbav:"dojoPoints" json:"dojoPoints"`
	MinutesSpent YearReviewMinutesSpent `dynamodbav:"minutesSpent" json:"minutesSpent"`
	Games        YearReviewGamesData    `dynamodbav:"games" json:"games"`
}

type YearReviewRatingData struct {
	Username      string            `dynamodbav:"username,omitempty" json:"username,omitempty"`
	IsPreferred   bool              `dynamodbav:"isPreferred" json:"isPreferred"`
	StartRating   YearReviewIntData `dynamodbav:"startRating" json:"startRating"`
	CurrentRating YearReviewIntData `dynamodbav:"currentRating" json:"currentRating"`
	RatingChange  YearReviewIntData `dynamodbav:"ratingChange" json:"ratingChange"`
	History       []RatingHistory   `dynamodbav:"history" json:"history"`
}

type YearReview struct {
	Username     string `dynamodbav:"username" json:"username"`
	DisplayName  string `dynamodbav:"displayName" json:"displayName"`
	UserJoinedAt string `dynamodbav:"userJoinedAt" json:"userJoinedAt"`
	Period       string `dynamodbav:"period" json:"period"`

	Ratings map[RatingSystem]YearReviewRatingData `dynamodbav:"ratings" json:"ratings"`

	Graduations []DojoCohort                   `dynamodbav:"graduations" json:"graduations"`
	Cohorts     map[DojoCohort]*YearReviewData `dynamodbav:"cohorts" json:"cohorts"`

	Total YearReviewData `dynamodbav:"total" json:"total"`
}

func (repo *dynamoRepository) PutYearReviews(reviews []*YearReview) (int, error) {
	return batchWriteObjects(repo, reviews, yearReviewTable)
}

func (repo *dynamoRepository) GetYearReview(username, year string) (*YearReview, error) {
	input := dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {S: aws.String(username)},
			"period":   {S: aws.String(year)},
		},
		TableName: aws.String(yearReviewTable),
	}

	review := YearReview{}
	if err := repo.getItem(&input, &review); err != nil {
		return nil, err
	}
	return &review, nil
}
