import { POSITION_NAGS, MOVE_NAGS, nagText, Nag, Node, EditorReducer } from "chess-tree"
import React, { useEffect, useState } from 'react'
import { Button, ButtonGroup, Stack, TextField, Typography } from '@mui/material';

interface NagButtonProps {
    node: Node;
    nag: Nag;
    onClick: (nag: Nag) => void
}

const NagButton: React.FC<NagButtonProps> = ({node, nag, onClick}) => {
    const variant = (node.nags.indexOf(nag) !== -1) ? "contained" : undefined

    return <Button onClick={() => onClick(nag)} variant={variant}>{ nagText(nag) }</Button>
}

interface CommentSectionProps {
    node: Node;
    dispatch: React.Dispatch<EditorReducer.Action>,
}

const CommentSection: React.FC<CommentSectionProps> = ({node, dispatch}) => {
    let [comment, setComment] = useState(node.comment)
    useEffect(() => setComment(node.comment), [node])

    const updateComment = () => {
        if(comment !== node.comment) {
            dispatch({ type: 'set-comment', comment })
        }
    }

    const onNagToggle = (nag: Nag, nagGroup: Nag[]) => {
        let sawNagForButton = false
        const nags = node.nags.filter(n => {
            if (n === nag) {
                // Nag already set, toggle it off
                sawNagForButton = true
                return false
            } else {
                // Otherwise, filter out any nags in this group
                return nagGroup.indexOf(n) === -1
            }
        })
        if (!sawNagForButton) {
            nags.push(nag)
        }
        nags.sort()
        dispatch({ type: 'set-nags', nags })
    }

    const onMoveNagToggle = (nag: Nag) => onNagToggle(nag, MOVE_NAGS)
    const onPositionNagToggle = (nag: Nag) => onNagToggle(nag, POSITION_NAGS)

    return <Stack>
        <Typography variant="h6">Comments</Typography>
        <TextField
            multiline
            rows={2}
            variant="outlined"
            value={comment}
            onChange={evt => setComment(evt.target.value)}
            onBlur={() => updateComment()}
            sx={{ mb: 1 }}
        />
        <ButtonGroup variant="outlined" fullWidth={true}>
            <NagButton node={node} nag={Nag.BrilliantMove} onClick={onMoveNagToggle} />
            <NagButton node={node} nag={Nag.GoodMove} onClick={onMoveNagToggle} />
            <NagButton node={node} nag={Nag.InterestingMove} onClick={onMoveNagToggle} />
            <NagButton node={node} nag={Nag.DubiousMove} onClick={onMoveNagToggle} />
            <NagButton node={node} nag={Nag.PoorMove} onClick={onMoveNagToggle} />
            <NagButton node={node} nag={Nag.BlunderMove} onClick={onMoveNagToggle} />
        </ButtonGroup>
        <ButtonGroup variant="outlined" fullWidth={true}>
            <NagButton node={node} nag={Nag.PlusMinusPosition} onClick={onPositionNagToggle} />
            <NagButton node={node} nag={Nag.PlusEqualsPosition} onClick={onPositionNagToggle} />
            <NagButton node={node} nag={Nag.EqualPosition} onClick={onPositionNagToggle} />
            <NagButton node={node} nag={Nag.UnclearPosition} onClick={onPositionNagToggle} />
            <NagButton node={node} nag={Nag.EqualsPlusPosition} onClick={onPositionNagToggle} />
            <NagButton node={node} nag={Nag.MinusPlusPosition} onClick={onPositionNagToggle} />
        </ButtonGroup>
    </Stack>
}

export default CommentSection
