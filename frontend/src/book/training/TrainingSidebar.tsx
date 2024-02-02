import { Training, TrainingActivity, TrainingReducer, } from 'chess-tree'
import React from 'react'
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import AccuracyText from './AccuracyText'

interface TrainingSidebarProps {
    training: Training;
    activity: TrainingActivity;
    nextStep: TrainingReducer.Step;
    board: TrainingReducer.TrainingBoard;
    moveForward: () => void;
    moveForwardWithAdjustment: (adjustment: TrainingReducer.ScoreAdjustment) => void;
    finishLine: () => void;
    exit: (action: "delete-training"|"restart-training") => void;
}

const TrainingSidebar: React.FC<TrainingSidebarProps> = ({
    training,
    activity,
    nextStep,
    board,
    moveForward,
    moveForwardWithAdjustment,
    finishLine,
    exit,
}) => {
    let top = <Box />

    if (nextStep.type === "choose-move") {
        top = <Stack spacing={2} alignItems="flex-start">
            { nextStep.wrongMove === null ?
                <Typography variant="h5">Choose a move for { board.color === "w" ? "white" : "black" }</Typography> :
                <Typography variant="h5">{ nextStep.wrongMove } was incorrect</Typography>
            }
            <Button variant="outlined" onClick={moveForward}>Show Correct Move</Button>
        </Stack>

    } else if (nextStep.type === "show-correct-move") {
        const wrongMove = training.currentBook?.currentLine.wrongMove

        top = <Stack spacing={2}>
            <Stack>
                <Typography variant="h5">Correct move: { nextStep.move }</Typography>
                { wrongMove && wrongMove !== "<skipped>" ? <Typography variant="h6">Your move: {wrongMove}</Typography> : null }
            </Stack>
            <Stack spacing={5}>
                <Button sx={{ flexGrow: 1 }} variant="contained" onClick={moveForward}>Continue</Button>
                { wrongMove && wrongMove !== "<skipped>"
                    ? <Stack spacing={1}>
                        <Button variant="outlined" onClick={() => moveForwardWithAdjustment("count-as-correct")}>My move was just as good, give me full credit</Button>
                        <Button variant="outlined" onClick={() => moveForwardWithAdjustment("ignore")}>Mouse slip, skip it!</Button>
                      </Stack>
                    : null
                }
            </Stack>
        </Stack>
    } else if (nextStep.type === "show-line-summary") {
        top = <Stack spacing={1}>
            <Typography variant="h5">Line complete</Typography>
            <Button variant="contained" onClick={finishLine}>Continue</Button>
        </Stack>
    } else if (nextStep.type === "show-training-summary") {
        top = <Stack spacing={5}>
            <Stack spacing={1}>
                <Typography variant="h4">Training complete</Typography>
                <Grid container>
                    <Grid item xs={6}>Accuracy:</Grid>
                    <Grid item xs={6}><AccuracyText correctCount={training.correctCount} incorrectCount={training.incorrectCount} /></Grid>

                    <Grid item xs={6}>Correct Moves:</Grid>
                    <Grid item xs={6}>{training.correctCount}</Grid>

                    <Grid item xs={6}>Incorrect Moves:</Grid>
                    <Grid item xs={6}>{training.incorrectCount}</Grid>
                </Grid>
            </Stack>
            <Button variant="contained" sx={{ px: 5 }} onClick={() => exit("delete-training")}>Remove training</Button>
            <Button variant="contained" sx={{ px: 5 }} onClick={() => exit("restart-training")}>Restart training</Button>
        </Stack>
    }
    return <Stack justifyContent="space-between">
        { top }
        <Stack>
            <Typography variant="h6" pt={1}>Moves this session</Typography>
            <Grid container width="300px">
                <Grid item xs={6}>Correct:</Grid>
                <Grid item xs={6} color="#33ff44">{activity.correctCount}</Grid>
                <Grid item xs={6}>Incorrect:</Grid>
                <Grid item xs={6} color="#ff3333">{activity.incorrectCount}</Grid>
            </Grid>
        </Stack>
    </Stack>

}

export default TrainingSidebar
