import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useState } from 'react';
import { Stack, Tooltip, IconButton, Paper } from '@mui/material';
import FlipIcon from '@mui/icons-material/WifiProtectedSetup';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import LinkIcon from '@mui/icons-material/Link';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckIcon from '@mui/icons-material/Check';
import SellIcon from '@mui/icons-material/Sell';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

import DeleteGameButton from '../../games/view/DeleteGameButton';
import { Game } from '../../database/game';

interface ToolsProps {
    pgn: string;
    onFirstMove: () => void;
    onPreviousMove: () => void;
    onNextMove: () => void;
    onLastMove: () => void;
    toggleOrientation: () => void;

    onSave?: () => void;
    showDelete?: boolean;
    game?: Game;

    underboard?: string;
    setUnderboard?: (value: string) => void;
    showTags?: boolean;
    showEditor?: boolean;
}

const Tools: React.FC<ToolsProps> = ({
    pgn,
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove,
    toggleOrientation,

    onSave,
    showDelete,
    game,

    underboard,
    setUnderboard,
    showTags,
    showEditor,
}) => {
    const [copied, setCopied] = useState('');

    const onCopy = (name: string) => {
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 2500);
    };

    return (
        <Paper elevation={3} sx={{ mt: 1, boxShadow: 'none' }}>
            <Stack direction='row' justifyContent='space-between' flexWrap='wrap'>
                <Stack direction='row'>
                    <CopyToClipboard
                        text={window.location.href}
                        onCopy={() => onCopy('link')}
                    >
                        <Tooltip title='Copy URL'>
                            <IconButton aria-label='copy-url'>
                                {copied === 'link' ? (
                                    <CheckIcon sx={{ color: 'text.secondary' }} />
                                ) : (
                                    <LinkIcon sx={{ color: 'text.secondary' }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    </CopyToClipboard>

                    <CopyToClipboard text={pgn} onCopy={() => onCopy('pgn')}>
                        <Tooltip title='Copy PGN'>
                            <IconButton aria-label='copy-pgn'>
                                {copied === 'pgn' ? (
                                    <CheckIcon sx={{ color: 'text.secondary' }} />
                                ) : (
                                    <ContentPasteIcon sx={{ color: 'text.secondary' }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    </CopyToClipboard>

                    {onSave && (
                        <Tooltip title='Save PGN'>
                            <IconButton onClick={onSave}>
                                <SaveIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {showDelete && game && <DeleteGameButton game={game} />}
                </Stack>

                <Stack direction='row'>
                    <Tooltip title='First Move'>
                        <IconButton aria-label='first move' onClick={onFirstMove}>
                            <FirstPageIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Previous Move'>
                        <IconButton aria-label='previous move' onClick={onPreviousMove}>
                            <ChevronLeftIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Next Move'>
                        <IconButton aria-label='next move' onClick={onNextMove}>
                            <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Last Move'>
                        <IconButton aria-label='last move' onClick={onLastMove}>
                            <LastPageIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title='Flip Board'>
                        <IconButton aria-label='flip board' onClick={toggleOrientation}>
                            <FlipIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Stack direction='row'>
                    {showTags && setUnderboard && (
                        <Tooltip title='PGN Tags'>
                            <IconButton
                                aria-label='pgn-tags'
                                sx={{
                                    color:
                                        underboard === 'tags'
                                            ? 'info.main'
                                            : 'text.secondary',
                                }}
                                onClick={() =>
                                    setUnderboard(underboard === 'tags' ? '' : 'tags')
                                }
                            >
                                <SellIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {showEditor && setUnderboard && (
                        <Tooltip title='Edit PGN'>
                            <IconButton
                                aria-label='edit-pgn'
                                sx={{
                                    color:
                                        underboard === 'editor'
                                            ? 'info.main'
                                            : 'text.secondary',
                                }}
                                onClick={() =>
                                    setUnderboard(underboard === 'editor' ? '' : 'editor')
                                }
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
};

export default Tools;
