import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    Typography,
    Link,
    Stack,
    Chip,
} from '@mui/material';

import { Event, EventStatus, getDisplayString } from '../database/event';
import { useAuth } from '../auth/Auth';
import React from 'react';
import Avatar from '../profile/Avatar';
import { toDojoDateString, toDojoTimeString } from '../calendar/displayDate';

function getTitle(event: Event): string {
    if (event.coaching) {
        return event.title;
    }
    if (event.maxParticipants > 1) {
        return 'Group Meeting';
    }
    return getDisplayString(event.bookedType);
}

interface MeetingListItemProps {
    meeting: Event;
}

const MeetingListItem: React.FC<MeetingListItemProps> = ({ meeting }) => {
    const user = useAuth().user!;
    const navigate = useNavigate();

    const onClick = () => {
        navigate('/meeting/' + meeting.id);
    };

    const start = new Date(meeting.bookedStartTime || meeting.startTime);

    let opponent = Object.values(meeting.participants)[0];
    if (opponent.username === user.username) {
        opponent = {
            username: meeting.owner,
            displayName: meeting.ownerDisplayName,
            cohort: meeting.ownerCohort,
            previousCohort: meeting.ownerPreviousCohort,
        };
    }

    const onClickOpponent = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/profile/${opponent.username}`);
    };

    return (
        <Card variant='outlined' sx={{ width: 1 }}>
            <CardActionArea onClick={onClick}>
                <CardHeader
                    title={getTitle(meeting)}
                    subheader={`${toDojoDateString(
                        start,
                        user.timezoneOverride
                    )} • ${toDojoTimeString(
                        start,
                        user.timezoneOverride,
                        user.timeFormat
                    )}`}
                    sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 0, mt: 1 }}>
                    {meeting.status === EventStatus.Canceled && (
                        <Chip sx={{ mb: 1 }} color='error' label='Canceled' />
                    )}

                    {meeting.maxParticipants > 1 ? (
                        <Typography variant='subtitle1' color='text.secondary'>
                            {Object.values(meeting.participants).length + 1} participants
                        </Typography>
                    ) : (
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <Avatar
                                username={opponent.username}
                                displayName={opponent.displayName}
                                size={25}
                            />
                            <Link
                                component={RouterLink}
                                to={`/profile/${opponent.username}`}
                                onClick={onClickOpponent}
                            >
                                <Typography variant='subtitle1'>
                                    {opponent.displayName} ({opponent.cohort})
                                </Typography>
                            </Link>
                        </Stack>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MeetingListItem;
