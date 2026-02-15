import React from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import EvalBar from "../EvalBar/EvalBar";
import "./Board.css";


const customPieces = () => {
    const pieces = [
        "wP",
        "wN",
        "wB",
        "wR",
        "wQ",
        "wK",
        "bP",
        "bN",
        "bB",
        "bR",
        "bQ",
        "bK",
    ];
    const returnObj = {};
    pieces.forEach((p) => {
        returnObj[p] = ({ squareWidth }) => (
            <div
                style={{
                    width: squareWidth,
                    height: squareWidth,
                    backgroundImage: `url(/pieces/${p.toLowerCase()}.png)`,
                    backgroundSize: "100%",
                }}
            />
        );
    });
    return returnObj;
};

const Board = ({
    currentFen,
    onDrop,
    orientation,
    customSquareStyles,
    customHighlights,
    dragStart,
    evalData,
    calculating,
    clearBoardMarkup,
    arrows,
    gameOverVisible,
    gameOverText,
    boardOverlayRef,
    isCtrlPressed,
    onBoardMouseDown,
    onBoardMouseUp,
}) => {
    const engineHighlights = !calculating && evalData?.bestMove ? (() => {
        try {
            const gameCopy = new Chess(currentFen);
            const move = gameCopy.move(evalData.bestMove);
            if (move) {
                return {
                    [move.from]: { backgroundColor: "rgba(0, 255, 0, 0.4)" },
                    [move.to]: { backgroundColor: "rgba(0, 255, 0, 0.4)" },
                };
            }
        } catch (e) {
            console.error("Board move calculation error:", e);
        }
        return {};
    })() : {};

    return (
        <div
            className="board-layout-main"
            onContextMenu={(e) => {
                e.preventDefault();
                clearBoardMarkup();
            }}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                flex: 1,
                width: "100%",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    width: "calc(min(calc(96vh - 60px), calc(100vw - 600px)) + 120px)",
                    height: "calc(min(calc(96vh - 60px), calc(100vw - 600px)) + 150px)",
                    maxWidth: "100%",
                    marginLeft: 180,
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 16,
                        alignItems: "stretch",
                    }}
                >
                    <div className="eval-bar-wrapper" style={{ width: 45, margin: 0 }}>
                        <EvalBar
                            score={evalData?.score || 0}
                            isMate={evalData?.isMate || false}
                        />
                    </div>

                    <div
                        className="board-wrapper"
                        style={{ flex: 1, position: "relative" }}
                    >
                        <Chessboard
                            position={currentFen}
                            onPieceDrop={onDrop}
                            boardOrientation={orientation}
                            customDarkSquareStyle={{ backgroundColor: "#779954" }}
                            customLightSquareStyle={{ backgroundColor: "#e9edcc" }}
                            customSquareStyles={{
                                ...customSquareStyles,
                                ...customHighlights,
                                ...(dragStart
                                    ? {
                                        [dragStart]: {
                                            backgroundColor: "rgba(255, 0, 0, 0.4)",
                                        },
                                    }
                                    : {}),
                                ...engineHighlights,
                            }}
                            customArrows={arrows}
                            customPieces={customPieces()}
                            animationDuration={200}
                            onSquareRightClick={clearBoardMarkup}
                        />
                        {gameOverVisible && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    background: "rgba(0, 0, 0, 0.85)",
                                    color: "white",
                                    padding: "24px 40px",
                                    borderRadius: "12px",
                                    zIndex: 200,
                                    fontSize: "2rem",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                    border: "1px solid #444",
                                    pointerEvents: "none",
                                    animation: "fadeIn 0.3s ease-out",
                                }}
                            >
                                {gameOverText}
                            </div>
                        )}
                        <div
                            ref={boardOverlayRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                zIndex: 100,
                                display: isCtrlPressed ? "block" : "none",
                            }}
                            onMouseDown={onBoardMouseDown}
                            onMouseUp={onBoardMouseUp}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
