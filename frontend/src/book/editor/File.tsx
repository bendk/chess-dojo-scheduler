import { Node, lineCount } from "chess-tree"
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { Button, Popover, Stack, Typography } from '@mui/material';

export interface FileProps {
    hasChanges: boolean;
    rootNode: Node;
    onSave: (rootNode: Node) => void;
    onDiscard: () => void;
}

const File: React.FC<FileProps> = ({hasChanges, rootNode, onSave, onDiscard}) => {
    const [discardWarningAnchor, setDiscardWarningAnchor] = useState< HTMLElement|null>(null)
    const nodeLineCount = useMemo(() => rootNode ? lineCount(rootNode) : undefined, [rootNode])

    const onSaveClick = useCallback(() => onSave(rootNode), [rootNode, onSave])

    const onDiscardClick = useCallback((evt: MouseEvent<HTMLElement>, force=false) => {
        if(!hasChanges || force) {
            onDiscard()
        } else {
            setDiscardWarningAnchor(evt.currentTarget)
        }
    }, [hasChanges, onDiscard])

    return <Stack direction="row" justifyContent="space-between">
        {
            nodeLineCount ?
            <Typography variant="h5">Total lines: {nodeLineCount}</Typography> :
            ""
        }
        <Stack spacing={1}>
            <Button variant="contained" onClick={onSaveClick} disabled={!hasChanges}>Save changes</Button>
            <Button aria-describedby="discard-warning" variant="outlined" onClick={(evt) => onDiscardClick(evt)}>Exit</Button>
            <Popover
                id="discard-warning"
                open={discardWarningAnchor !== null}
                anchorEl={discardWarningAnchor}
                onClose={() => setDiscardWarningAnchor(null)}
                sx={{ mt: 1 }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Stack p={2} width="450px">
                    <Typography variant="h5">Unsaved changes</Typography>
                    <Typography variant="body1">Are you sure you want to discard them?</Typography>
                    <Stack pt={2} direction="row" justifyContent="space-between">
                        <Button variant="outlined" onClick={(evt) => onDiscardClick(evt, true)}>Discard</Button>
                        <Button variant="outlined" onClick={() => setDiscardWarningAnchor(null)}>Cancel</Button>
                    </Stack>
                </Stack>
            </Popover>
        </Stack>
    </Stack>
}

export default File
