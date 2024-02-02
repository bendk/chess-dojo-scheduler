import { EditorReducer, Node, Priority } from "chess-tree"
import React from 'react';
import { Button, ButtonGroup, Stack, Typography } from '@mui/material';

interface PriorityButtonProps {
    node: Node;
    dispatch: React.Dispatch<EditorReducer.Action>,
    priority: Priority;
    text: string;
}

const PriorityButton: React.FC<PriorityButtonProps> = ({node, dispatch, priority, text}) => {
    return <Button
        variant={node.priority === priority ? "contained" : "outlined"}
        onClick={() => dispatch({type: "set-priority", priority})}
    >{text}</Button>
}

interface PrioritySectionProps {
    node: Node;
    dispatch: React.Dispatch<EditorReducer.Action>,
}

const PrioritySection: React.FC<PrioritySectionProps> = ({node, dispatch}) => {
    return <Stack>
        <Typography variant="h6">Training Priority</Typography>
        <ButtonGroup aria-label="Training Priority" fullWidth>
            <PriorityButton node={node} dispatch={dispatch} priority={Priority.Default} text="Normal" />
            <PriorityButton node={node} dispatch={dispatch} priority={Priority.TrainFirst} text="First" />
            <PriorityButton node={node} dispatch={dispatch} priority={Priority.TrainLast} text="Last" />
        </ButtonGroup>
    </Stack>
}

export default PrioritySection
