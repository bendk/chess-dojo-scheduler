import { Book } from "chess-tree"
import { Chess } from '@jackstenglein/chess';
import { useCallback, useEffect, useState } from 'react';
import { BoardApi } from '../board/Board';
import { useParams } from 'react-router-dom';
import { ChessContext, ChessContextType } from '../board/pgn/PgnBoard';
import LoadingPage from '../loading/LoadingPage';
import { getBook, listBooks } from "../api/bookApi"
import BookSplit from './BookSplit'

const BookSplitPage = () => {
    const { bookId } = useParams();
    const [chessContext, setChessContext] = useState<ChessContextType>({
        chess: new Chess(),
    });
    const [book, setBook] = useState<Book>();
    const [otherBooks, setOtherBooks] = useState<Book[]>();

    useEffect(() => {
        if(bookId === undefined) {
            throw Error("No book parameter")
        }
        getBook('test-user', bookId)
            .then(book => {
                if (book !== undefined) {
                    setBook(book)
                }
            })
            .catch(reason => {
                throw Error(`Error loading book ${reason}`)
            })
    }, [bookId])

    useEffect(() => {
        listBooks('test-user')
            .then(books => setOtherBooks(books.filter(book => book.id != bookId)))
            .catch(reason => {
                throw Error(`Error loading book ${reason}`)
            })
    }, [])

    const onBoardInitialize = useCallback((board: BoardApi, chess: Chess) => {
        setChessContext({...chessContext, board, chess})
    }, [chessContext, setChessContext])

    if (book === undefined || otherBooks === undefined) {
        return <LoadingPage />
    } else {
        return <ChessContext.Provider value={chessContext}>
            <SplitLines
                book={book}
                otherBooks={otherBooks}
                onBoardInitialize={onBoardInitialize}
            />
        </ChessContext.Provider>
    }
}

export default BookSplitPage
