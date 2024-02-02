import { Node, lineCount, EditorReducer, Priority} from "chess-tree"
import React, { useCallback } from 'react';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';

export interface PriorityButtonProps {
    currentNode: Node,
    priority: Priority,
    text: string
    setPriority: (priority: Priority) => void,
}

const PriorityButton: React.FC<PriorityButtonProps> = ({currentNode, priority, text, setPriority}) => {
    if (currentNode.priority === priority) {
        return <MenuItem >
            <ListItemIcon><CheckIcon /></ListItemIcon>
            <ListItemText>{ text }</ListItemText>
        </MenuItem>
    } else {
        return <MenuItem onClick={() => setPriority(priority)}>
            <ListItemText inset={true}>{ text }</ListItemText>
        </MenuItem>
    }
}

export interface LineMenuProps {
    menuAnchor: HTMLElement;
    currentNode: Node;
    dispatch: React.Dispatch<EditorReducer.Action>;
    onClose: () => void;
}

const LineMenu: React.FC<LineMenuProps> = ({menuAnchor, currentNode, dispatch, onClose}) => {
    const nodeLineCount = lineCount(currentNode)
    const title = (nodeLineCount === 1) ? "1 line" : `${nodeLineCount} lines`
    const deleteLine = useCallback(() => {
        dispatch({type: 'delete-branch'})
        onClose()
    }, [dispatch, onClose])

    const deleteFromHere = useCallback(() => {
        dispatch({type: 'delete-node'})
        onClose()
    }, [dispatch, onClose])

    const setPriority = useCallback((priority: Priority) => {
        dispatch({type: 'set-priority', priority})
        onClose()
    }, [dispatch, onClose])

    return <Menu
        id="line-menu"
        anchorEl={menuAnchor}
        anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        open={menuAnchor !== null}
        onClose={onClose}
    >
        <MenuItem disabled={true}>
            <ListItemText inset={true}>{ title }</ListItemText>
        </MenuItem>
        <MenuItem onClick={deleteLine}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Delete line</ListItemText>
        </MenuItem>
        <MenuItem onClick={deleteFromHere}>
            <ListItemIcon><ContentCutIcon /></ListItemIcon>
            <ListItemText>Delete from here</ListItemText>
        </MenuItem>
        <MenuItem divider={true} onClick={onClose}>
            <ListItemIcon><DriveFileMoveIcon /></ListItemIcon>
            <ListItemText>Move to other book</ListItemText>
        </MenuItem>
        <MenuItem disabled={true}>
            <ListItemText inset={true}>Training Priority</ListItemText>
        </MenuItem>
        <PriorityButton currentNode={currentNode} priority={Priority.TrainFirst} text="First" setPriority={setPriority} />
        <PriorityButton currentNode={currentNode} priority={Priority.Default} text="Normal" setPriority={setPriority} />
        <PriorityButton currentNode={currentNode} priority={Priority.TrainLast} text="Last" setPriority={setPriority} />
    </Menu>
};

export default LineMenu;
