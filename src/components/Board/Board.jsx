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
    onPromotionCheck,
    onPromotionPieceSelect,
    onSquareClick,
    selectedSquare,
    promotionSquare,
}) => {
    const engineHighlights = !calculating && evalData?.bestMove ? (() => {
        try {
            const gameCopy = new Chess(currentFen);
            const uci = evalData.bestMove;
            const from = uci.substring(0, 2);
            const to = uci.substring(2, 4);
            const promotion = uci.length === 5 ? uci.substring(4, 5) : undefined;

            const move = gameCopy.move({ from, to, promotion });
            if (move) {
                return {
                    [move.from]: { backgroundColor: "rgba(0, 255, 0, 0.4)" },
                    [move.to]: { backgroundColor: "rgba(0, 255, 0, 0.4)" },
                };
            }
        } catch (e) {
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
        >
            <div className="board-container">
                <div className="board-row">
                    <div className="eval-bar-wrapper">
                        <EvalBar
                            score={evalData?.score || 0}
                            isMate={evalData?.isMate || false}
                            orientation={orientation}
                        />
                    </div>

                    <div className="board-wrapper">
                        <Chessboard
                            position={currentFen}
                            onPieceDrop={onDrop}
                            boardOrientation={orientation}
                            onPromotionCheck={onPromotionCheck}
                            onPromotionPieceSelect={onPromotionPieceSelect}
                            promotionDialogVariant="modal"
                            customDarkSquareStyle={{ backgroundColor: "#779954" }}
                            customLightSquareStyle={{ backgroundColor: "#e9edcc" }}
                            customSquareStyles={{
                                ...customSquareStyles,
                                ...customHighlights,
                                // Only show engine highlights if they aren't the selected square
                                ...Object.fromEntries(
                                    Object.entries(engineHighlights).filter(
                                        ([sq]) => sq !== selectedSquare
                                    )
                                ),
                                ...(dragStart
                                    ? {
                                        [dragStart]: {
                                            backgroundColor: "rgba(255, 0, 0, 0.4)",
                                        },
                                    }
                                    : {}),
                                ...(selectedSquare && window.innerWidth <= 900
                                    ? {
                                        [selectedSquare]: {
                                            backgroundColor: "rgba(0, 0, 0, 0.85)",
                                            zIndex: 999
                                        },
                                    }
                                    : {}),
                            }}
                            customArrows={arrows}
                            customPieces={customPieces()}
                            animationDuration={200}
                            onSquareClick={onSquareClick}
                            onSquareRightClick={clearBoardMarkup}
                            arePiecesDraggable={window.innerWidth > 900}
                            {...(promotionSquare ? {
                                showPromotionDialog: true,
                                promotionToSquare: promotionSquare
                            } : {})}
                        />
                        {gameOverVisible && (
                            <div className="game-over-modal">
                                {gameOverText}
                            </div>
                        )}
                        <div
                            ref={boardOverlayRef}
                            className="board-overlay"
                            style={{
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
