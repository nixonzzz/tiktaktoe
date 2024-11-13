import { PLAYERS } from "./constants";
import { BackLink } from "./ui/back-link";
import { GameCell } from "./ui/game-cell";
import { GameInfo } from "./ui/game-info";
import { GameLayout } from "./ui/game-layout";
import { GameMoveInfo } from "./ui/game-move-info";
import { GameTitle } from "./ui/game-title";
import { PlayerInfo } from "./ui/player-info";
import { GameOverModal } from "./ui/game-over-modal";
import {
    GAME_STATE_ACTIONS,
    gameStateReducer,
    initGameState,
} from "./model/game-state-reducer";
import { getNextMove } from "./model/get-next-move";
import { computeWinner } from "./model/compute-winner";
import { useMemo, useReducer, useCallback, useState, useEffect } from "react";
import { computeWinnerSymbol } from "./model/compute-winner-symbol";
import { computePlayerTimer } from "./model/compute-player-timer";
import { useInterval } from "../lib/timers";
import { PlayerCountInput } from "./model/player-count-input";

export function Game() {
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [playersCount, setPlayersCount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [playerAvatars, setPlayerAvatars] = useState([]);

    const [gameState, dispatch] = useReducer(
        gameStateReducer,
        {
            playersCount: playersCount || 2,
            defaultTimer: 10000,
            currentMoveStart: Date.now(),
            timers: {},
            timerStartAt: {},
        },
        (state) => ({
            ...initGameState(state),
            timers: PLAYERS.slice(0, state.playersCount).reduce((acc, player) => {
                acc[player.symbol] = state.defaultTimer;
                return acc;
            }, {}),
            timerStartAt: PLAYERS.slice(0, state.playersCount).reduce((acc, player) => {
                acc[player.symbol] = Date.now();
                return acc;
            }, {}),
        })
    );

    // Добавляем состояние для отслеживания текущего игрока
    const [activePlayerIndex, setActivePlayerIndex] = useState(0);

    useInterval(
        1000,
        !!gameState.currentMoveStart && isGameStarted,
        useCallback(() => {
            const activePlayer = PLAYERS[activePlayerIndex];
            dispatch({
                type: GAME_STATE_ACTIONS.TICK,
                now: Date.now(),
                activePlayerSymbol: activePlayer.symbol,
            });
        }, [gameState.currentMoveStart, isGameStarted, activePlayerIndex])
    );

    const winnerSequence = useMemo(() => computeWinner(gameState), [gameState]);
    const nextMove = getNextMove(gameState);
    const winnerSymbol = computeWinnerSymbol(gameState, {
        winnerSequence,
        nextMove,
    });
    const winnerPlayer = PLAYERS.find((player) => player.symbol === winnerSymbol);

    const handleCellClick = useCallback((index) => {
        dispatch({
            type: GAME_STATE_ACTIONS.CELL_CLICK,
            index,
            now: Date.now(),
        });

        // Переключаем игрока после хода
        setActivePlayerIndex((prevIndex) => (prevIndex + 1) % playersCount);
    }, [playersCount]);

    // Функция для запроса аватаров
    const fetchPlayerAvatars = async (count) => {
        setLoading(true);
        try {
            const responses = await Promise.all(
                Array.from({ length: count }, () =>
                    fetch("https://api.thecatapi.com/v1/images/search")
                        .then((res) => res.json())
                        .then((data) => data[0]?.url)
                )
            );
            setPlayerAvatars(responses);
        } catch (error) {
            console.error("Error fetching avatars:", error);
        } finally {
            setLoading(false);
        }
    };

    // Функция старта игры с установкой таймеров и аватаров
    const startGame = (count) => {
        setPlayersCount(count);
        fetchPlayerAvatars(count);
        setIsGameStarted(true);

        // Инициализация таймеров для всех игроков
        const initialTimers = {};
        const initialStartTimes = {};
        PLAYERS.slice(0, count).forEach(player => {
            initialTimers[player.symbol] = gameState.defaultTimer;
            initialStartTimes[player.symbol] = Date.now();
        });

        dispatch({
            type: GAME_STATE_ACTIONS.INIT_TIMERS,
            timers: initialTimers,
            timerStartAt: initialStartTimes,
        });
    };

    // Показ инпута для ввода количества игроков перед началом игры
    if (!isGameStarted) {
        return <PlayerCountInput onStartGame={startGame} />;
    }

    // Проверка на загрузку
    if (loading) {
        return <div className="spinner">Загрузка...</div>;
    }

    const { cells, currentMove } = gameState;

    return (
        <>
            <GameLayout
                backLink={<BackLink />}
                title={<GameTitle />}
                gameInfo={
                    <GameInfo isRatingGame playersCount={playersCount} timeMode={"1 мин на ход"} />
                }
                playersList={PLAYERS.slice(0, playersCount).map((player, index) => {
                    const { timer, timerStartAt } = computePlayerTimer(
                        gameState,
                        player.symbol
                    );
                    return (
                        <PlayerInfo
                            key={player.id}
                            avatar={playerAvatars[index] || player.avatar}
                            name={player.name}
                            rating={player.rating}
                            symbol={player.symbol}
                            timer={index === activePlayerIndex ? timer : null}
                            timerStartAt={index === activePlayerIndex ? timerStartAt : null}
                            isRight={index % 2 === 1}
                        />
                    );
                })}
                gameMoveInfo={
                    <GameMoveInfo currentMove={currentMove} nextMove={nextMove} />
                }
                gameCells={cells.map((cell, index) => (
                    <GameCell
                        key={index}
                        index={index}
                        isWinner={winnerSequence?.includes(index)}
                        disabled={!!winnerSymbol}
                        onClick={handleCellClick}
                        symbol={cell}
                    />
                ))}
            />
            <GameOverModal
                winnerName={winnerPlayer?.name}
                players={PLAYERS.slice(0, playersCount).map((player, index) => (
                    <PlayerInfo
                        key={player.id}
                        avatar={playerAvatars[index] || player.avatar}
                        name={player.name}
                        rating={player.rating}
                        timer={gameState.timers[player.symbol]}
                        symbol={player.symbol}
                        isRight={index % 2 === 1}
                    />
                ))}
            />
        </>
    );
}
