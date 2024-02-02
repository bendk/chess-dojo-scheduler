import { Node, OpeningBook, lineCount } from "chess-tree"
import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { updateBook } from "../../api/bookApi"
import Editor from './Editor'

export interface OpeningEditorProps {
    book: OpeningBook;
}

const OpeningEditor: React.FC<OpeningEditorProps> = ({book}) => {
    const navigate = useNavigate()
    const [initialLineCount, setInitialLineCount] = useState(lineCount(book.rootNode))

    const onSave = useCallback((rootNode: Node) => {
        const newLineCount = lineCount(rootNode)
        updateBook(
            'test-user',
            { ...book, rootNode, lineCount: newLineCount },
            initialLineCount
        ).then(() => setInitialLineCount(newLineCount))
    }, [book, initialLineCount])

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
