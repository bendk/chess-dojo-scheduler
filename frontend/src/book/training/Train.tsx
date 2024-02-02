import { Chess } from '@jackstenglein/chess';
import { Key } from 'chessground/types';
import { DrawShape } from 'chessground/draw';
import { BookSummary, Training, TrainingReducer, nagText, restartTraining } from 'chess-tree'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { getBook, deleteTraining, putActivity, putTraining } from '../../api/bookApi'
import TrainingSidebar from './TrainingSidebar'
import TrainingVariation from './TrainingVariation'
import FeedbackIcon from './FeedbackIcon'
import { ChessContext, ChessContextType } from '../../board/pgn/PgnBoard';
import Board, { boardColors, reconcile, BoardApi, PrimitiveMove } from '../../board/Board';

export interface TrainProps {
    training: Training;
    books: BookSummary[];
}

function playAudio(name: string) {
    const audio = new Audio(`/training/${name}.mp3`)
    audio.play()
}

const Train: React.FC<TrainProps> = ({training: initialTraining, books}) => {
    const boardSize = 600;
    const variationSidebarSize = 300;
    const navigate = useNavigate()
    const [chessContext, setChessContext] = useState<ChessContextType>({
        chess: new Chess(),
        board: undefined,
        config: {
            allowMoveDeletion: false,
        },
    });
    const [lastFeedback, setLastFeedback] = useState<TrainingReducer.TrainingBoardFeedback|null>(null)
    const [{board, nextStep, training, activity}, dispatchAction] = useReducer(
        (state: TrainingReducer.State, action: TrainingReducer.Action) => {
            const newState = TrainingReducer.reduce(state, action)
            // Handle sounds here, since it's more likely to avoid autoplay restrictions if it runs
            // inside a click handler
            if (state !== newState) {
                if (newState.board.feedback) {
                    playAudio(newState.board.feedback.type)
                }
                setLastFeedback(newState.board.feedback)
            } else {
                // If nothing changed, then unset the feedback
                setLastFeedback(null)
            }
            // Always return a new state object, even if nothing changed.  We need to run some
            // effects for example to reconcile the chess instance with the training board.
            return {...newState}
        },
        {initialTraining, books},
        ({initialTraining, books}) => TrainingReducer.initialState(initialTraining, books),
    )

    // Load the next book
    const bookToLoad = nextStep.type === 'book-needed' ? nextStep.bookId : null
    useEffect(() => {
        if (bookToLoad !== null) {
            getBook('test-user', bookToLoad).then(book => {
                if (book) {
                    dispatchAction({ type: 'load-book', book })
                } else {
                    throw Error(`book missing: ${bookToLoad}`)
                }
            })
        }
    }, [bookToLoad])

    // Update the display based on the board position
    useEffect(() => {
        const { chess, board: boardApi } = chessContext
        if (chess) {
            if (chess.fen() !== board.position) {
                chess.load(board.position)
            }
            if(boardApi !== undefined) {
                reconcile(chess, boardApi)
                const shapes: DrawShape[] = [];
                if(board.annotations) {
                    shapes.push(...board.annotations.arrows.map(value => ({
                        brush: boardColors[value.substring(0, 1)],
                        orig: value.substring(1, 3) as Key,
                        dest: value.substring(3, 5) as Key,
                    })))
                    shapes.push(...board.annotations.squares.map(value => ({
                        brush: boardColors[value.substring(0, 1)],
                        orig: value.substring(1, 3) as Key,
                    })))
                }
                boardApi.set({drawable: { shapes }})
            }
        }
    })

    const moveForward = useCallback(() => {
        playAudio("move")
        dispatchAction({
            type: 'move-board-forward',
            fromCurrentLineIndex: board.currentLineIndex,
        })
    }, [board])

    const moveForwardWithAdjustment = useCallback((adjustment: TrainingReducer.ScoreAdjustment) => {
        playAudio("move")
        dispatchAction({
            type: 'move-board-forward',
            fromCurrentLineIndex: board.currentLineIndex,
            adjustment
        })
    }, [board])

    // Advance the board position
    useEffect(() => {
      if (nextStep.type === 'move-board-forward-after-delay' ) {
            setTimeout(moveForward, 500)
      }
    }, [nextStep, moveForward])
    // Ensure the board is on the correct color
    useEffect(() => {
        const color = training.currentBook?.currentPosition.color
        if (color && chessContext.board) {
            chessContext.board.set({
                orientation: color === "w" ? "white" : "black"
            })
        }
    }, [chessContext.board, training.currentBook?.currentPosition.color])

    const finishLine = useCallback(() => {
        playAudio("move")
        setLastFeedback(null)
        dispatchAction({type: 'finish-current-line'})
    }, [])

    const exit = useCallback((action: "exit"|"open-book"|"delete-training"|"restart-training") => {
        let updateTraining: Promise<void>
        if (action === "delete-training") {
            updateTraining = deleteTraining('test-user', training.id)
        } else if (action === "restart-training") {
            updateTraining = putTraining('test-user', restartTraining(training))
        } else {
            updateTraining = putTraining('test-user', training)
        }

        updateTraining
            .then(() => putActivity('test-user', activity))
            .then(() => {
                if (action === "open-book") {
                    navigate(`/book/books/${training.currentBook?.bookId}`)
                } else {
                    navigate("/book")
                }
            })
    }, [training, activity, navigate])

    const onMove = useCallback((_board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
        const move = chess.move({ from: primMove.orig, to: primMove.dest, promotion: primMove.promotion })
        if (move) {
            dispatchAction({ type: 'try-move', move: move.san })
        }
    }, [])

    const leadingMoves = []
    if(training.currentBook) {
        leadingMoves.push(...training.currentBook.currentPosition.initialMoves)
        for(const {move, nags} of training.currentBook.currentLine.moves.slice(0, board.currentLineIndex)) {
            const parts = [move, ...nags.map(nagText)]
            leadingMoves.push(parts.join(""))
        }
    }

    return <ChessContext.Provider value={chessContext}>
        <Container maxWidth='xl'>
            <Stack direction="row" pt={5} justifyContent="space-between">
                <Typography variant="h4" pr={2}>Training: {training.name}</Typography>
                <Stack direction="row" spacing={2}>
                    {
                        (training.currentBook !== null)
                        ? <Button variant="outlined" onClick={() => exit("open-book")}>Edit Book</Button>
                        : null
                    }
                    <Button variant="outlined" onClick={() => exit("exit")}>Exit</Button>
                </Stack>
            </Stack>

            <Stack pt={4} spacing={1}>
                <Stack direction="row" spacing={5}>
                    <Paper sx={{ width: variationSidebarSize }}>
                        {
                            (chessContext.chess && training.currentBook !== null)
                            ? <TrainingVariation
                                initialPosition={training.currentBook.currentPosition.position}
                                currentLine={training.currentBook.currentLine}
                            />
                            : null
                        }
                    </Paper>
                    <Box width={boardSize} height={boardSize} sx={{position: "relative"}}>
                        <Board
                            onInitialize={(board, chess) => setChessContext({...chessContext, board, chess})}
                            onMove={onMove}
                        />
                        { (lastFeedback !== null) ? <FeedbackIcon
                            color={training.currentBook?.currentPosition.color ?? "w"}
                            feedback={lastFeedback}
                        /> : null }
                    </Box>
                    <TrainingSidebar
                        training={training}
                        activity={activity}
                        nextStep={nextStep}
                        board={board}
                        moveForward={moveForward}
                        moveForwardWithAdjustment={moveForwardWithAdjustment}
                        finishLine={finishLine}
                        exit={exit}
                    />
                </Stack>
                { board.comment.length > 0 ?
                    <Paper sx={{ p: 1 }}><Typography>{ board.comment }</Typography></Paper> : 
                    null
                }
            </Stack>
        </Container>
    </ChessContext.Provider>
}

export default Train
