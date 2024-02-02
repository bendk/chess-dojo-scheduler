import { Chess } from '@jackstenglein/chess';
import { CurrentLine } from 'chess-tree';
import React from 'react'
import { Grid } from '@mui/material';
import MoveDisplay from '../../board/pgn/pgnText/MoveDisplay';

interface TrainingVariationProps {
    initialPosition: string;
    currentLine: CurrentLine;
}

const TrainingVariation: React.FC<TrainingVariationProps> = ({initialPosition, currentLine}) => {
    const chess = new Chess(initialPosition)
    currentLine.moves.forEach((moveNode, i) => {
        const mainlineMove = chess.move(moveNode.move)
        if (mainlineMove === null) {
            throw Error(`Illegal move: ${moveNode.move}`)
        }
        const prevMove = mainlineMove.previous
        currentLine.history[i].otherMoves.forEach(move => chess.move(move, prevMove))
        chess.seek(mainlineMove)
    })

    return <Grid container> {
        chess.history().map((move, i) => {
            return <MoveDisplay
                key={i}
                move={move}
                handleScroll={() => []}
                onClickMove={() => []}
            />
        })
    }
    </Grid>
}

export default TrainingVariation
