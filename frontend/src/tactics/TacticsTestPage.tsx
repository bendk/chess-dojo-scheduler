import { Button, Container, Stack } from '@mui/material';
import React, { useRef, useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { BoardApi, Chess } from '../board/Board';
import PgnBoard, { PgnBoardApi } from '../board/pgn/PgnBoard';
import { addExtraVariation, getSolutionScore, scoreVariation } from './tactics';

const startingPositionFen = 'r1r3nk/p1q4p/4pppP/2B5/1pQ1P3/8/PPPR1PP1/2KR4 w q - 0 1';

const solutionPgn = `[Event "Tactics Test #1: From scratch #22"]
[Site "https://lichess.org/study/IIXmZsLb/wAhrGVAi"]
[Result "*"]
[Variant "Standard"]
[ECO "?"]
[Opening "?"]
[Annotator "https://lichess.org/@/jessekraai"]
[FEN "r1r3nk/p1q4p/4pppP/2B5/1pQ1P3/8/PPPR1PP1/2KR4 w q - 0 1"]
[SetUp "1"]
[UTCDate "2024.04.01"]
[UTCTime "15:08:39"]

1. Bf8! Qxc4 2. Bg7# { [1] } *


`;

const minuteSeconds = 60;
const hourSeconds = 3600;

const getTimeSeconds = (time: number) =>
    `0${(time % hourSeconds) % minuteSeconds | 0}`.slice(-2);
const getTimeMinutes = (time: number) => ((time % hourSeconds) / minuteSeconds) | 0;

const TacticsTestPage = () => {
    const pgnApi = useRef<PgnBoardApi>(null);
    const [completedPgn, setCompletedPgn] = useState('');

    const onFinish = () => {
        console.log('Current PGN: ', pgnApi.current?.getPgn());
        setCompletedPgn(pgnApi.current?.getPgn() || '');
    };

    if (completedPgn) {
        return <CompletedTacticsTest pgn={completedPgn} />;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <Stack direction='row' alignItems='center'>
                <CountdownCircleTimer
                    isPlaying
                    size={120}
                    strokeWidth={6}
                    duration={3600}
                    colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                    colorsTime={[7, 5, 2, 0]}
                    trailColor='rgba(0, 0, 0, 0)'
                >
                    {({ remainingTime, color }) => (
                        <span style={{ color }}>
                            <div>
                                {getTimeMinutes(remainingTime)}:
                                {getTimeSeconds(remainingTime)}
                            </div>
                        </span>
                    )}
                </CountdownCircleTimer>

                <Button variant='contained' onClick={onFinish}>
                    Finish Early
                </Button>
            </Stack>
            <PgnBoard ref={pgnApi} fen={startingPositionFen} showPlayerHeaders={false} />
        </Container>
    );
};

export default TacticsTestPage;

interface CompletedTacticsTestProps {
    pgn: string;
}

const CompletedTacticsTest: React.FC<CompletedTacticsTestProps> = ({ pgn }) => {
    const onInitialize = (_board: BoardApi, chess: Chess) => {
        const totalScore = getSolutionScore(chess.history());

        const answerChess = new Chess({ pgn });
        answerChess.seek(null);

        const answerScore = scoreVariation(chess.history(), null, answerChess);
        console.log('Total Score: ', totalScore);
        console.log('Answer Score: ', answerScore);
        console.log('Final Solution History: ', chess.history());

        addExtraVariation(answerChess.history(), null, chess);
    };

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <PgnBoard
                onInitialize={onInitialize}
                pgn={solutionPgn}
                showPlayerHeaders={false}
            />
        </Container>
    );
};
