import { useMemo, useState } from 'react';
import { Button, IconButton, Menu, Stack, Tooltip, Typography } from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';

import { TimelineEntry, Reaction } from '../../database/timeline';
import { useAuth } from '../../auth/Auth';
import { User } from '../../database/user';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';

const ReactionTypes = [
    ':WhiteLogoText:',
    ':DojoHeart:',
    ':JessePOG1:',
    ':YodaKraai:',
    ':LevelUp:',
    ':LetsGo:',
    ':SlowDown:',
    ':Exclam:',
    ':DoubleExclam:',
    ':Mate:',
    '♟️', // Pawn
    '🦖',
    '📈',
    '🥥',
    '💪',
    '🦀',
    '⚔️', // crossed swords
    '🛠️',
    '\u2764\uFE0F', // heart
    '😃',
    '👍',
    '🤯',
    '🎉',
];

const ReactionTypesToImage = {
    ':LetsGo:':
        'https://cdn.discordapp.com/emojis/1024465432763191447.webp?size=96&quality=lossless',
    ':JessePOG1:':
        'https://cdn.discordapp.com/emojis/998387680826097735.webp?size=96&quality=lossless',
    ':DojoHeart:':
        'https://cdn.discordapp.com/emojis/998387887966007326.webp?size=96&quality=lossless',
    ':WhiteLogoText:':
        'https://cdn.discordapp.com/emojis/1113470918006689863.webp?size=64&quality=lossless',
    ':DoubleExclam:':
        'https://cdn.discordapp.com/emojis/1010005248540168243.webp?size=240&quality=lossless',
    ':Exclam:':
        'https://cdn.discordapp.com/emojis/1010005249450328065.webp?size=240&quality=lossless',
    ':SlowDown:':
        'https://cdn.discordapp.com/emojis/998387885667524689.webp?size=240&quality=lossless',
    ':LevelUp:':
        'https://cdn.discordapp.com/emojis/986602661535170610.webp?size=240&quality=lossless',
    ':YodaKraai:':
        'https://cdn.discordapp.com/emojis/1105292629329055845.webp?size=96&quality=lossless',
    ':Mate:':
        'https://cdn.discordapp.com/emojis/1014865134054809651.webp?size=96&quality=lossless',
};

function isReactor(
    user: User,
    reactions: Record<string, Reaction> | null,
    type: string
): boolean {
    if (!reactions) {
        return false;
    }
    if (!reactions[user.username]) {
        return false;
    }
    return reactions[user.username].types?.includes(type) || false;
}

function getNewTypes(
    user: User,
    reactions: Record<string, Reaction> | null,
    type: string
): string[] {
    if (!reactions) {
        return [type];
    }
    if (!reactions[user.username]) {
        return [type];
    }

    const types = reactions[user.username].types?.filter((t) => t !== type) || [];
    if (types.length === (reactions[user.username].types?.length || 0)) {
        return types.concat(type);
    }
    return types;
}

const ReactionEmoji: React.FC<{ type: string; icon?: boolean }> = ({ type, icon }) => {
    switch (type) {
        case ':LetsGo:':
        case ':JessePOG1:':
        case ':DojoHeart:':
        case ':WhiteLogoText:':
        case ':DoubleExclam:':
        case ':Exclam:':
        case ':SlowDown:':
        case ':LevelUp:':
        case ':YodaKraai:':
        case ':Mate:':
            return (
                <img
                    alt={type}
                    width={icon ? '100%' : '20.1833px'}
                    height={icon ? '100%' : '30px'}
                    style={{ objectFit: 'contain' }}
                    src={ReactionTypesToImage[type]}
                />
            );
    }

    if (icon) return <>{type}</>;

    return <Typography fontSize='1.25rem'>{type}</Typography>;
};

interface ReactionListProps {
    owner: string;
    id: string;
    reactions: Record<string, Reaction> | null;
    onEdit: (entry: TimelineEntry) => void;
}

const ReactionList: React.FC<ReactionListProps> = ({ owner, id, reactions, onEdit }) => {
    const user = useAuth().user!;
    const api = useApi();
    const request = useRequest();

    const reactionMap = useMemo(() => {
        const reactionMap: Record<string, string[]> = {};
        for (const reaction of Object.values(reactions || {})) {
            for (const type of reaction.types || []) {
                if (reactionMap[type]) {
                    reactionMap[type].push(reaction.displayName);
                } else {
                    reactionMap[type] = [reaction.displayName];
                }
            }
        }
        return reactionMap;
    }, [reactions]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const onReact = (type: string) => {
        const types = getNewTypes(user, reactions, type);

        request.onStart();
        api.setNewsfeedReaction(owner, id, types)
            .then((resp) => {
                console.log('setNewsfeedReaction: ', resp);
                onEdit(resp.data);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
        handleClose();
    };

    return (
        <Stack direction='row' spacing={1} mt={1}>
            <RequestSnackbar request={request} />

            {Object.entries(reactionMap).map(([type, reactors]) => (
                <Tooltip title={`Reacted by ${reactors.join(', ')}`}>
                    <Button
                        key={type}
                        variant={
                            isReactor(user, reactions, type) ? 'contained' : 'outlined'
                        }
                        onClick={() => onReact(type)}
                    >
                        <ReactionEmoji type={type} />

                        <Typography ml='0.375rem' fontWeight='600'>
                            {reactors.length}
                        </Typography>
                    </Button>
                </Tooltip>
            ))}

            <Tooltip title='Add Reaction'>
                <IconButton color='primary' onClick={handleClick}>
                    <AddReactionIcon />
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <Stack
                    px={1}
                    columnGap={0.5}
                    direction='row'
                    flexWrap='wrap'
                    sx={{ maxWidth: 'calc(6 * 2.96875rem)' }}
                >
                    {ReactionTypes.map((type) => (
                        <IconButton
                            key={type}
                            sx={{ width: '2.96875rem' }}
                            onClick={() => onReact(type)}
                        >
                            <ReactionEmoji type={type} icon />
                        </IconButton>
                    ))}
                </Stack>
            </Menu>
        </Stack>
    );
};

export default ReactionList;
