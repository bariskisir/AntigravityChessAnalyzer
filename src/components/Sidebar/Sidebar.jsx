import React from "react";
import { Chess } from "chess.js";
import {
    Search,
    History,
    Compass,
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    ArrowLeftRight,
    Trash2,
} from "lucide-react";
import "./Sidebar.css";
import { getAnnotation } from "../../utils";

const Sidebar = ({
    activeTab,
    setActiveTab,
    calculating,
    evalData,
    history,
    currentMoveIndex,
    jumpToMove,
    moveHistoryRef,
    inputFen,
    setInputFen,
    handleFenLoad,
    handleNewGame,
    setOrientation,
    gamesList,
    loadGameFromList,
    setHoveredFen,
    setHoveredLastMove,
    setHoverPos,
    currentGameId,
    setGamesList,
    playSequence,
    setShowSettings,
    engineSettings,
    fenCache,
    swapVariation,
    boardFen,
}) => {
    const movePairs = [];
    for (let i = 1; i < history.length; i += 2) {
        movePairs.push({
            moveNumber: Math.ceil(i / 2),
            white: history[i],
            whiteIndex: i,
            black: history[i + 1] || null,
            blackIndex: i + 1,
        });
    }

    const handleMoveHover = (moves, e) => {
        try {
            const temp = new Chess(boardFen);
            let lastMove = null;
            for (const m of moves) {
                lastMove = temp.move(m);
            }
            if (lastMove) {
                setHoveredFen(temp.fen());
                setHoveredLastMove(lastMove);
                updateHoverPos(e);
            }
        } catch (err) {
            console.error("Hover error:", err);
        }
    };

    const updateHoverPos = (e) => {
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        if (x + 220 > window.innerWidth) x = e.clientX - 235;
        if (y + 150 > window.innerHeight) y = e.clientY - 165;
        setHoverPos({ x, y });
    };

    return (
        <div className="sidebar">
            <div className="panel-header">
                <div
                    className={`panel-tab ${activeTab === "analysis" ? "active" : ""}`}
                    onClick={() => setActiveTab("analysis")}
                >
                    <Compass size={20} style={{ marginRight: 8 }} />
                    Analysis
                </div>
                <div
                    className={`panel-tab ${activeTab === "games" ? "active" : ""}`}
                    onClick={() => setActiveTab("games")}
                >
                    <History size={20} style={{ marginRight: 8 }} />
                    Games
                </div>
            </div>

            <div className="panel-content">
                {activeTab === "analysis" ? (
                    <>
                        <div className="eval-box">
                            <div className="settings-bar">
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.2rem", fontWeight: "600", color: "#ccc" }}>
                                    <span>
                                        Stockfish 17 (chess-api.com) | Depth {engineSettings.depth} | MultiPV {engineSettings.variants} | {engineSettings.maxThinkingTime}ms
                                    </span>
                                </div>
                                <div
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setShowSettings(true)}
                                >
                                    <Settings size={16} />
                                </div>
                            </div>

                            <div className="engine-lines">
                                {calculating && (
                                    <div className="engine-line" style={{ justifyContent: "center", fontStyle: "italic", color: "#81b64c", fontSize: "1rem" }}>
                                        Calculating...
                                    </div>
                                )}
                                {!calculating && evalData && (
                                    <div className="engine-line" key="best">
                                        <div
                                            className={`line-score ${evalData.score >= 0 ? "plus" : "minus"}`}
                                        >
                                            {evalData.isMate
                                                ? `M${Math.abs(evalData.score)}`
                                                : (evalData.score / 100).toFixed(2)}
                                        </div>
                                        <div className="line-moves">
                                            <span
                                                className="highlight"
                                                onMouseEnter={(e) => handleMoveHover([evalData.bestMove], e)}
                                                onMouseMove={updateHoverPos}
                                                onMouseLeave={() => setHoveredFen(null)}
                                                onClick={() => {
                                                    const movesArr = evalData.continuation || [];
                                                    playSequence([evalData.bestMove, ...movesArr]);
                                                }}
                                            >
                                                {evalData.bestMove}
                                            </span>{" "}
                                            {evalData.continuation &&
                                                evalData.continuation.map((m, i) => {
                                                    return (
                                                        <span
                                                            key={i}
                                                            className="hover-move"
                                                            onMouseEnter={(e) => handleMoveHover([evalData.bestMove, ...evalData.continuation.slice(0, i + 1)], e)}
                                                            onMouseMove={updateHoverPos}
                                                            onMouseLeave={() => setHoveredFen(null)}
                                                            onClick={() => {
                                                                const movesArr = evalData.continuation.slice(0, i + 1);
                                                                playSequence([evalData.bestMove, ...movesArr]);
                                                            }}
                                                        >
                                                            {m}{" "}
                                                        </span>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                                {evalData?.variants &&
                                    evalData.variants
                                        .filter((v) => v.pv.split(" ")[0] !== evalData.bestMove)
                                        .map((v, idx) => (
                                            <div className="engine-line" key={idx}>
                                                <div
                                                    className={`line-score ${v.eval >= 0 ? "plus" : "minus"}`}
                                                >
                                                    {v.mate
                                                        ? `M${Math.abs(v.mate)}`
                                                        : (v.eval / 100).toFixed(2)}
                                                </div>
                                                <div className="line-moves">
                                                    {v.pv.split(" ").map((m, i) => {
                                                        return (
                                                            <span
                                                                key={i}
                                                                className="hover-move"
                                                                onMouseEnter={(e) => handleMoveHover(v.pv.split(" ").slice(0, i + 1), e)}
                                                                onMouseMove={updateHoverPos}
                                                                onMouseLeave={() => setHoveredFen(null)}
                                                                onClick={() => playSequence(v.pv.split(" ").slice(0, i + 1))}
                                                            >
                                                                {m}{" "}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                            </div>
                        </div>

                        <div className="move-list-header">Moves</div>

                        <div
                            className="move-history"
                            ref={moveHistoryRef}
                            style={{ flex: 1, overflowY: "auto" }}
                        >
                            <div className="move-list">
                                {movePairs.map((pair, idx) => {
                                    const renderMove = (moveData, index, isWhite) => {
                                        if (!moveData) return null;
                                        const prevFen = history[index - 1]?.fen;
                                        const moveSan =
                                            typeof moveData.move === "string"
                                                ? moveData.move
                                                : moveData.move.san;
                                        const currFen = moveData.fen;
                                        let annotation = null;

                                        if (prevFen) {
                                            const prevEval = fenCache.current.get(prevFen);
                                            const currEval = fenCache.current.get(currFen);
                                            if (prevEval && currEval) {
                                                if (!prevEval.isMate && !currEval.isMate) {
                                                    const diff = isWhite
                                                        ? (currEval.score - prevEval.score) / 100
                                                        : (prevEval.score - currEval.score) / 100;
                                                    annotation = getAnnotation(diff);
                                                }
                                            }
                                        }

                                        return (
                                            <div
                                                className={`move-item ${index === currentMoveIndex ? "active" : ""}`}
                                                onClick={() => jumpToMove(index)}
                                                style={{
                                                    position: "relative",
                                                    overflow: "visible",
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {moveSan}

                                                {annotation && (
                                                    <span
                                                        style={{
                                                            color: annotation.color,
                                                            marginLeft: 2,
                                                            fontSize: "0.75rem",
                                                        }}
                                                        title={annotation.title}
                                                    >
                                                        {annotation.symbol}
                                                    </span>
                                                )}
                                                {history[index]?.variations?.length > 0 && (
                                                    <div
                                                        className="variation-indicator"
                                                        style={{
                                                            marginLeft: 4,
                                                            fontSize: "0.8rem",
                                                            color: "#666",
                                                            cursor: "pointer",
                                                            background: "#333",
                                                            borderRadius: "3px",
                                                            padding: "0 4px",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            swapVariation(index, 0);
                                                        }}
                                                    >
                                                        +{history[index].variations.length}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    };

                                    return (
                                        <div key={idx} className="move-row">
                                            <div className="move-num" style={{ color: "var(--accent-green)", fontWeight: "bold" }}>{pair.moveNumber}.</div>
                                            {renderMove(pair.white, pair.whiteIndex, true)}
                                            {pair.black &&
                                                renderMove(pair.black, pair.blackIndex, false)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "8px 12px",
                                background: "#262522",
                                borderTop: "1px solid #333",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <span
                                style={{
                                    color: "#bababa",
                                    fontSize: "1.1rem",
                                    fontWeight: "800",
                                }}
                            >
                                FEN:
                            </span>
                            <input
                                type="text"
                                value={inputFen}
                                onChange={(e) => setInputFen(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFenLoad()}
                                placeholder="Paste FEN and press Enter..."
                                style={{
                                    flex: 1,
                                    background: "#1e1e1e",
                                    border: "1px solid #444",
                                    color: "#fff",
                                    padding: "8px 12px",
                                    borderRadius: 4,
                                    fontSize: "1rem",
                                }}
                            />
                        </div>

                        <div className="controls-footer">
                            <div className="nav-buttons">
                                <button
                                    className="nav-btn"
                                    onClick={() => jumpToMove(0)}
                                    disabled={currentMoveIndex === 0}
                                >
                                    <ChevronsLeft size={20} />
                                </button>
                                <button
                                    className="nav-btn"
                                    onClick={() => jumpToMove(Math.max(0, currentMoveIndex - 1))}
                                    disabled={currentMoveIndex === 0}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    className="nav-btn"
                                    onClick={() =>
                                        jumpToMove(
                                            Math.min(history.length - 1, currentMoveIndex + 1)
                                        )
                                    }
                                    disabled={currentMoveIndex === history.length - 1}
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <button
                                    className="nav-btn"
                                    onClick={() => jumpToMove(history.length - 1)}
                                    disabled={currentMoveIndex === history.length - 1}
                                >
                                    <ChevronsRight size={20} />
                                </button>
                            </div>
                            <div className="action-buttons">
                                <button
                                    onClick={handleNewGame}
                                    className="action-btn"
                                    title="New Game"
                                >
                                    <Plus size={16} /> New Game
                                </button>
                                <button
                                    onClick={() =>
                                        setOrientation((o) => (o === "white" ? "black" : "white"))
                                    }
                                    className="action-btn"
                                >
                                    <ArrowLeftRight size={16} /> Flip
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: 12, overflowY: "auto" }}>
                        <h3 style={{ color: "#ccc", fontSize: "1rem", marginTop: 0 }}>
                            Saved Games
                        </h3>
                        {gamesList.length === 0 && (
                            <div style={{ color: "#777", fontStyle: "italic" }}>
                                No saved games yet.
                            </div>
                        )}
                        {gamesList.map((g) => (
                            <div
                                key={g.id}
                                onClick={() => loadGameFromList(g)}
                                onMouseEnter={() => {
                                    setHoveredFen(g.fen);
                                    setHoveredLastMove(g.lastMove);
                                }}
                                onMouseMove={(e) => {
                                    let x = e.clientX + 15;
                                    let y = e.clientY + 15;
                                    if (x + 220 > window.innerWidth) x = e.clientX - 235;
                                    if (y + 150 > window.innerHeight) y = e.clientY - 165;
                                    setHoverPos({ x, y });
                                }}
                                onMouseLeave={() => {
                                    setHoveredFen(null);
                                    setHoveredLastMove(null);
                                }}
                                style={{
                                    background: "#262522",
                                    padding: 10,
                                    marginBottom: 8,
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    border: "1px solid #333",
                                    position: "relative",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ overflow: "hidden", marginRight: 10 }}>
                                    <div
                                        style={{
                                            color: "#81b64c",
                                            fontWeight: "bold",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        {g.date}
                                    </div>
                                    <div
                                        style={{
                                            color: "#999",
                                            fontSize: "0.8rem",
                                            whiteSpace: "normal",
                                            overflow: "visible",
                                            height: "auto",
                                            textOverflow: "ellipsis",
                                            marginTop: 4,
                                        }}
                                    >
                                        <span style={{ color: "#666", marginRight: 4 }}>FEN:</span>
                                        {g.fen}
                                    </div>
                                </div>
                                {g.id !== currentGameId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newList = gamesList.filter(
                                                (game) => game.id !== g.id
                                            );
                                            setGamesList(newList);
                                            localStorage.setItem(
                                                "chess_games",
                                                JSON.stringify(newList)
                                            );
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#666",
                                            cursor: "pointer",
                                            padding: 4,
                                        }}
                                        title="Delete Game"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
