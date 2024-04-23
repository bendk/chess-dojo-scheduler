import { Book, BookSummary, Move } from "chess-tree"
import { Chess } from '@jackstenglein/chess';
import React, { useCallback, useState } from 'react';
import { Button, Container, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material'
import { reconcile, BoardApi } from '../board/Board';
import { useChess } from '../board/pgn/PgnBoard';
import BookBoard from './BookBoard'
import BookBoardControls from './BookBoardControls'
import BookLine from './BookLine'
import VariationList from './editor/VariationList'

interface SplitLinesProps {
    book: Book,
    otherBooks: BookSummary[];
    onBoardInitialize: (board: BoardApi, chess: Chess) => void;
}

const BookSplit: React.FC<SplitLinesProps> = ({book, otherBooks, onBoardInitialize}) => {
    const [moves, setMoves] = useState<Move[]>([])
    const { chess, board } = useChess()

    const setMovesAndUpdateBoard = useCallback((moves: Move[]) => {
        setMoves(moves)
        if (chess) {
            chess.seek(null)
            chess.pgn.history.clear()
            for(const move of moves) {
                if (chess.move(move) === null) {
                    throw Error(`Illegal move in EditorReducer.State: ${moves}`)
                }
            }
            if(board) {
                reconcile(chess, board)
            }
        }
    }, [chess, board, setMoves])

    if (book.type != "opening") {
        throw Error("Move lines: can't handle non-opening books")
    }

    return <Container maxWidth='xl' sx={{ py: 5 }}>
        <Stack spacing={2}>
            <Stack direction="row" spacing={20}>
                <Stack width="500px">
                    <Typography variant="h5">Select position</Typography>
                    <Typography variant="body1">All lines from the position will be moved</Typography>
                    <BookBoard
                        size="500px"
                        initialPosition={book.position}
                        onInitialize={onBoardInitialize}
                        onMovesChange={setMoves}
                    />
                    <BookLine moves={moves} initialPly={book.initialMoves.length} sx={{ flexGrow: 1 }} />
                    <BookBoardControls onMovesChange={setMoves}/>
                </Stack>
                <Stack spacing={1} flexGrow={1} maxWidth="400px">
                    <Typography variant="h5">Move lines to</Typography>
                    <FormControl>
                        <Select>
                            { otherBooks.map(book => <MenuItem value={book.id}>{ book.name }</MenuItem>) }
                            <MenuItem value="new-book">New book</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained">Move</Button>
                </Stack>
            </Stack>
            <VariationList
                initialPly={book.initialMoves.length}
                rootNode={book.rootNode}
                moves={moves}
                setMoves={setMovesAndUpdateBoard}
                variant="split-book"
            />
        </Stack>
    </Container>
}

export default BookSplit
