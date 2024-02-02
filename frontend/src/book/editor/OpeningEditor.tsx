import { Node, OpeningBook, calcNodeInfo } from "chess-tree"
import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import { updateBook } from "../../api/bookApi"
import Editor from './Editor'

export interface OpeningEditorProps {
    book: OpeningBook;
}

const OpeningEditor: React.FC<OpeningEditorProps> = ({book}) => {
    const navigate = useNavigate()

    const onSave = useCallback((rootNode: Node) => {
        const initialLineCount = calcNodeInfo(book.rootNode).lineCount
        updateBook(
            'test-user',
            { ...book, rootNode, lineCount: calcNodeInfo(rootNode).lineCount },
            initialLineCount
        )
    }, [book])

    const onDiscard = useCallback(() => {
        navigate('/book/')
    }, [navigate])

    return <Editor
        name={book.name}
        color={book.color}
        initialPosition={book.position}
        initialRootNode={book.rootNode}
        initialPly={book.initialMoves.length}
        showDatabase={true}
        onDiscard={onDiscard}
        onSave={onSave}
    />
}

export default OpeningEditor
