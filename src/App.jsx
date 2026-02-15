import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { postChessApi } from "./services/chessApi";
import { getGameOverMessage } from "./utils";

import "./App.css";

import SettingsModal from "./components/SettingsModal/SettingsModal";
import Sidebar from "./components/Sidebar/Sidebar";
import Board from "./components/Board/Board";
import HoverBoard from "./components/HoverBoard/HoverBoard";

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([
    { fen: new Chess().fen(), move: null },
  ]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [evalData, setEvalData] = useState(null);
  const [orientation, setOrientation] = useState("white");
  const [calculating, setCalculating] = useState(false);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [apiLimitReached, setApiLimitReached] = useState(false);

  const fenCache = React.useRef(new Map());
  const activeBackgroundGeneration = React.useRef(0);
  const historyRef = React.useRef(history);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    try {
      const savedCache = localStorage.getItem("chess_analysis_cache");
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        Object.entries(parsed).forEach(([fen, data]) => {
          fenCache.current.set(fen, data);
        });
      }
    } catch (e) {
      console.error("Failed to load analysis cache:", e);
    }
  }, []);

  const saveCacheToStorage = () => {
    try {
      const entries = Array.from(fenCache.current.entries());
      const limited = entries.slice(-1000);
      const obj = Object.fromEntries(limited);
      localStorage.setItem("chess_analysis_cache", JSON.stringify(obj));
    } catch (e) {
      console.warn("Failed to persist analysis cache:", e);
    }
  };

  const addToCache = (fen, data) => {
    const normalized = fen.split(" ").slice(0, 4).join(" ");
    fenCache.current.set(normalized, data);
    saveCacheToStorage();
  };

  const boardOverlayRef = React.useRef(null);
  const moveHistoryRef = React.useRef(null);

  const currentFen = history[currentMoveIndex]?.fen || new Chess().fen();

  const [showSettings, setShowSettings] = useState(false);
  const [engineSettings, setEngineSettings] = useState({
    apiUrl: "https://chess-api.com/v1",
    depth: 18,
    variants: 1,
    maxThinkingTime: 100,
  });

  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [gameOverText, setGameOverText] = useState("");
  const [activeTab, setActiveTab] = useState("analysis");
  const [gamesList, setGamesList] = useState([]);
  const [inputFen, setInputFen] = useState("");
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [arrows, setArrows] = useState([]);
  const [customHighlights, setCustomHighlights] = useState({});

  const boardFen = history[currentMoveIndex]?.fen || new Chess().fen();

  const [hoveredFen, setHoveredFen] = useState(null);
  const [hoveredLastMove, setHoveredLastMove] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const gameForEnd = new Chess(boardFen);
    if (gameForEnd.isGameOver()) {
      const msg = getGameOverMessage(gameForEnd);
      if (msg) {
        setGameOverText(msg);
        setGameOverVisible(true);
        const timer = setTimeout(() => {
          setGameOverVisible(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setGameOverVisible(false);
    }
  }, [boardFen]);

  useEffect(() => {
    setInputFen(boardFen);
  }, [boardFen]);

  useEffect(() => {
    if (moveHistoryRef.current) {
      const activeMove =
        moveHistoryRef.current.querySelector(".move-item.active");
      if (activeMove) {
        activeMove.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [currentMoveIndex, history]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Control") setIsCtrlPressed(true);
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "ArrowLeft") jumpToMove(Math.max(0, currentMoveIndex - 1));
      if (e.key === "ArrowRight")
        jumpToMove(Math.min(history.length - 1, currentMoveIndex + 1));
      if (e.key === "ArrowUp") jumpToMove(0);
      if (e.key === "ArrowDown") jumpToMove(history.length - 1);
      if (e.key === "f")
        setOrientation((o) => (o === "white" ? "black" : "white"));
      if (e.code === "Space" || e.key === " ") {
        if (evalData && evalData.bestMove) {
          e.preventDefault();
          playSequence([evalData.bestMove]);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === "Control") setIsCtrlPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentMoveIndex, history, boardFen, evalData]);

  useEffect(() => {
    let isCancelled = false;
    const myGeneration = ++activeBackgroundGeneration.current;

    const backgroundAnalyzeHistory = async (startIndex) => {
      if (apiLimitReached) return;
      try {
        const hSnapshot = historyRef.current;
        const indices = [];

        for (let i = startIndex - 1; i >= 0; i--) indices.push(i);
        for (let i = startIndex + 1; i < hSnapshot.length; i++) indices.push(i);

        const targets = indices.filter((i) => {
          const node = hSnapshot[i];
          if (!node) return false;
          if (Math.abs(i - startIndex) > 3) return false;
          const normalized = node.fen.split(" ").slice(0, 4).join(" ");
          return !fenCache.current.has(normalized);
        });

        for (const i of targets) {
          if (
            isCancelled ||
            myGeneration !== activeBackgroundGeneration.current
          )
            break;

          const node = hSnapshot[i];
          await new Promise((r) => setTimeout(r, 200));

          if (
            isCancelled ||
            myGeneration !== activeBackgroundGeneration.current
          )
            break;

          const data = await postChessApi(node.fen, engineSettings);

          if (data && data.error === "HIGH_USAGE") {
            setApiLimitReached(true);
            break;
          }

          if (
            data &&
            data.move &&
            !isCancelled &&
            myGeneration === activeBackgroundGeneration.current
          ) {
            const formatted = {
              score: data.mate !== null ? data.mate : data.eval * 100,
              isMate: data.mate !== null,
              depth: data.depth,
              bestMove: data.move,
              text: data.text,
              continuation: data.continuationArr,
              variants: data.variants || [],
            };
            addToCache(node.fen, formatted);

            setHistory((prev) => {
              if (prev[i] && prev[i].fen === node.fen) {
                const newHist = [...prev];
                newHist[i] = { ...newHist[i], analysis: formatted };
                return newHist;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.error("Background analysis error:", e);
      }
    };

    const activeFen = boardFen;
    const normalizedFen = activeFen.split(" ").slice(0, 4).join(" ");


    const tempGame = new Chess(activeFen);
    if (tempGame.isCheckmate()) {
      const isWhiteMate = tempGame.turn() === "b";
      const mateData = {
        score: isWhiteMate ? 100 : -100,
        isMate: true,
        depth: 0,
        bestMove: null,
        text: "Checkmate",
        continuation: [],
        variants: [],
      };
      setEvalData(mateData);
      setCalculating(false);
      return;
    }


    if (fenCache.current.has(normalizedFen)) {
      const cachedData = fenCache.current.get(normalizedFen);
      setEvalData(cachedData);
      setCalculating(false);
      backgroundAnalyzeHistory(currentMoveIndex);
      return;
    }

    const currentNode = history[currentMoveIndex];
    if (
      currentNode &&
      currentNode.fen === activeFen &&
      currentNode.analysis
    ) {
      setEvalData(currentNode.analysis);
      setCalculating(false);
      addToCache(activeFen, currentNode.analysis);
      return;
    }


    setCalculating(true);

    const evaluatePosition = async () => {
      if (apiLimitReached) return;
      const data = await postChessApi(activeFen, engineSettings);
      if (isCancelled) return;
      setCalculating(false);

      if (data && data.error === "HIGH_USAGE") {
        setApiLimitReached(true);
        return;
      }

      if (data && data.move) {
        const formattedData = {
          score: data.mate !== null ? data.mate : data.eval * 100,
          isMate: data.mate !== null,
          depth: data.depth,
          bestMove: data.move,
          text: data.text,
          continuation: data.continuationArr,
          variants: data.variants || [],
        };

        setEvalData(formattedData);
        addToCache(activeFen, formattedData);

        setHistory((prev) => {
          const idx = prev.findIndex((h) => h.fen === activeFen);
          if (idx !== -1) {
            const newHist = [...prev];
            newHist[idx] = { ...newHist[idx], analysis: formattedData };
            return newHist;
          }
          return prev;
        });

        backgroundAnalyzeHistory(currentMoveIndex);
      }
    };

    const timer = setTimeout(() => {
      evaluatePosition();
    }, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [boardFen, engineSettings, currentMoveIndex]);

  useEffect(() => {
    const saved = localStorage.getItem("chess_games");
    const lastActiveId = localStorage.getItem("last_active_game_id");

    if (saved && JSON.parse(saved).length > 0) {
      const games = JSON.parse(saved);
      setGamesList(games);

      if (lastActiveId) {
        const activeGame = games.find((g) => g.id === Number(lastActiveId));
        if (activeGame) {
          const tempGame = new Chess(activeGame.fen);
          setGame(tempGame);
          if (activeGame.history && activeGame.history.length > 0) {
            setHistory(activeGame.history);
            setCurrentMoveIndex(activeGame.history.length - 1);
          } else {
            setHistory([
              { fen: tempGame.fen(), move: activeGame.lastMove || null },
            ]);
            setCurrentMoveIndex(0);
          }
          setCurrentGameId(activeGame.id);
          setInputFen(activeGame.fen);
          return;
        }
      }
      setCurrentGameId(games[0].id);
    } else {
      const defaultFen = new Chess().fen();
      const newId = Date.now();
      const newEntry = {
        id: newId,
        fen: defaultFen,
        history: [{ fen: defaultFen, move: null }],
        date: new Date().toLocaleString(),
      };
      setGamesList([newEntry]);
      localStorage.setItem("chess_games", JSON.stringify([newEntry]));
      setCurrentGameId(newId);
      localStorage.setItem("last_active_game_id", newId);
    }
  }, []);

  useEffect(() => {
    if (currentGameId) {
      localStorage.setItem("last_active_game_id", currentGameId);
    }
  }, [currentGameId]);

  const saveCurrentGame = (
    fenToSave,
    lastMoveArg = null,
    histOverride = null,
  ) => {
    const lastMove = lastMoveArg || history[currentMoveIndex]?.move;
    const currentHist = histOverride || history;

    setGamesList((prev) => {
      let updatedList;
      if (currentGameId) {
        updatedList = prev.map((g) =>
          g.id === currentGameId
            ? {
              ...g,
              fen: fenToSave,
              history: currentHist,
              lastMove: lastMove,
              date: new Date().toLocaleString(),
            }
            : g,
        );
      } else {
        const newId = Date.now();
        const newGameEntry = {
          id: newId,
          fen: fenToSave,
          history: currentHist,
          lastMove: lastMove,
          date: new Date().toLocaleString(),
        };
        setCurrentGameId(newId);
        updatedList = [newGameEntry, ...prev];
      }
      localStorage.setItem("chess_games", JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const jumpToMove = (index) => {
    const targetFen = history[index].fen;
    const normalized = targetFen.split(" ").slice(0, 4).join(" ");
    setCurrentMoveIndex(index);
    setGame(new Chess(targetFen));
    setArrows([]);
    setCustomHighlights({});
    setInputFen(targetFen);
    const cached = fenCache.current.get(normalized) || history[index].analysis;
    if (cached) setEvalData(cached);
    else setEvalData(null);
  };

  const onDrop = (sourceSquare, targetSquare) => {
    const move = { from: sourceSquare, to: targetSquare, promotion: "q" };
    try {
      const gameCopy = new Chess(boardFen);
      const result = gameCopy.move(move);
      if (result) {
        const newFen = gameCopy.fen();
        setGame(gameCopy);
        const newNode = {
          fen: newFen,
          move: result,
          variations: [],
          analysis: null,
        };
        if (currentMoveIndex === history.length - 1) {
          const newHistory = [...history, newNode];
          setHistory(newHistory);
          setCurrentMoveIndex(newHistory.length - 1);
          saveCurrentGame(newFen, result, newHistory);
        } else {
          const nextMoveNode = history[currentMoveIndex + 1];
          const isNextMove =
            nextMoveNode &&
            nextMoveNode.move.from === result.from &&
            nextMoveNode.move.to === result.to;
          if (isNextMove) setCurrentMoveIndex(currentMoveIndex + 1);
          else {
            const currentTail = history.slice(currentMoveIndex + 1);
            const parentNode = history[currentMoveIndex];
            if (currentTail.length > 0) {
              if (!parentNode.variations) parentNode.variations = [];
              parentNode.variations.push(currentTail);
            }
            const newHistory = [
              ...history.slice(0, currentMoveIndex + 1),
              newNode,
            ];
            setHistory(newHistory);
            setCurrentMoveIndex(newHistory.length - 1);
            saveCurrentGame(newFen, result, newHistory);
          }
        }
        setArrows([]);
        setCustomHighlights({});
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const handleFenLoad = () => {
    try {
      const tempGame = new Chess(inputFen);
      const newFen = tempGame.fen();
      setGame(tempGame);
      const newHistory = [{ fen: newFen, move: null }];
      setHistory(newHistory);
      setCurrentMoveIndex(0);
      setEvalData(null);
      saveCurrentGame(newFen, null, newHistory);
    } catch (e) {
      alert("Invalid FEN string");
    }
  };

  const handleNewGame = () => {
    const defaultFen = new Chess().fen();
    const newId = Date.now();
    const newEntry = {
      id: newId,
      fen: defaultFen,
      history: [{ fen: defaultFen, move: null }],
      date: new Date().toLocaleString(),
    };
    const updatedList = [newEntry, ...gamesList];
    setGamesList(updatedList);
    localStorage.setItem("chess_games", JSON.stringify(updatedList));
    setCurrentGameId(newId);
    setGame(new Chess());
    setHistory(newEntry.history);
    setCurrentMoveIndex(0);
    setEvalData(null);
    setInputFen(defaultFen);
  };

  const loadGameFromList = (g) => {
    const tempGame = new Chess(g.fen);
    setGame(tempGame);
    if (g.history && g.history.length > 0) {
      setHistory(g.history);
      setCurrentMoveIndex(g.history.length - 1);
    } else {
      setHistory([{ fen: tempGame.fen(), move: g.lastMove || null }]);
      setCurrentMoveIndex(0);
    }
    setCurrentGameId(g.id);
    setInputFen(g.fen);
  };

  const playSequence = (moves) => {
    try {
      const tempGame = new Chess(boardFen);
      let currentPathIndex = currentMoveIndex;
      let currentPathHistory = [...history];
      for (const m of moves) {
        const result = tempGame.move(m);
        if (result) {
          const newFen = tempGame.fen();
          const newNode = {
            fen: newFen,
            move: result,
            variations: [],
            analysis: null,
          };
          const nextMoveNode = currentPathHistory[currentPathIndex + 1];
          const isNextMove =
            nextMoveNode &&
            (nextMoveNode.move.san === result.san ||
              (nextMoveNode.move.from === result.from &&
                nextMoveNode.move.to === result.to));
          if (isNextMove) currentPathIndex++;
          else {
            const currentTail = currentPathHistory.slice(currentPathIndex + 1);
            const parentNode = currentPathHistory[currentPathIndex];
            if (currentTail.length > 0) {
              if (!parentNode.variations) parentNode.variations = [];
              parentNode.variations.push(currentTail);
            }
            currentPathHistory = [
              ...currentPathHistory.slice(0, currentPathIndex + 1),
              newNode,
            ];
            currentPathIndex = currentPathHistory.length - 1;
          }
        }
      }
      setHistory(currentPathHistory);
      setCurrentMoveIndex(currentPathIndex);
      setGame(tempGame);
      saveCurrentGame(
        tempGame.fen(),
        currentPathHistory[currentPathIndex].move,
        currentPathHistory,
      );
      setArrows([]);
      setCustomHighlights({});
    } catch (e) {
      console.error("Sequence error:", e);
    }
  };

  const swapVariation = (moveIndex, varIndex) => {
    const newHist = [...history];
    const node = newHist[moveIndex];
    if (!node.variations || !node.variations[varIndex]) return;
    const currentLine = newHist.slice(moveIndex + 1);
    const newLine = node.variations[varIndex];
    const updatedVariations = [...node.variations];
    updatedVariations[varIndex] = currentLine;
    newHist[moveIndex] = { ...node, variations: updatedVariations };
    const truncated = newHist.slice(0, moveIndex + 1);
    const finalHist = [...truncated, ...newLine];
    setHistory(finalHist);
    setCurrentMoveIndex(moveIndex + 1);
    setGame(new Chess(finalHist[moveIndex + 1].fen));
    saveCurrentGame(finalHist[finalHist.length - 1].fen, null, finalHist);
  };

  const onBoardMouseDown = (e) => {
    const rect = boardOverlayRef.current.getBoundingClientRect();
    const width = rect.width;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fileIdx = Math.floor((x / width) * 8);
    const rankIdx = Math.floor((y / width) * 8);
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
    let file, rank;
    if (orientation === "white") {
      file = files[fileIdx];
      rank = ranks[rankIdx];
    } else {
      file = files[7 - fileIdx];
      rank = ranks[7 - rankIdx];
    }
    setDragStart(file + rank);
  };

  const onBoardMouseUp = (e) => {
    if (!dragStart) return;
    const rect = boardOverlayRef.current.getBoundingClientRect();
    const width = rect.width;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fileIdx = Math.floor((x / width) * 8);
    const rankIdx = Math.floor((y / width) * 8);
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
    let file, rank;
    if (orientation === "white") {
      file = files[fileIdx];
      rank = ranks[rankIdx];
    } else {
      file = files[7 - fileIdx];
      rank = ranks[7 - rankIdx];
    }
    const dragEnd = file + rank;
    if (dragStart === dragEnd) {
      setCustomHighlights((prev) => {
        const newH = { ...prev };
        if (newH[dragStart]) delete newH[dragStart];
        else newH[dragStart] = { backgroundColor: "rgba(255, 0, 0, 0.4)" };
        return newH;
      });
    } else {
      const filesMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
      const f1 = filesMap[dragStart[0]],
        r1 = parseInt(dragStart[1]);
      const f2 = filesMap[dragEnd[0]],
        r2 = parseInt(dragEnd[1]);
      const df = Math.abs(f2 - f1);
      const dr = Math.abs(r2 - r1);
      const pieceAtStart = game.get(dragStart);
      const isKnight =
        pieceAtStart &&
        pieceAtStart.type === "n" &&
        ((df === 1 && dr === 2) || (df === 2 && dr === 1));
      const newArrows = [...arrows];
      const color = "rgba(255, 255, 0, 0.8)";
      setCustomHighlights((prev) => ({
        ...prev,
        [dragEnd]: { backgroundColor: "rgba(255, 0, 0, 0.4)" },
      }));
      if (isKnight) {
        let midSquare;
        if (dr === 2) {
          const midR = r2,
            midF = f1;
          const midFileChar = Object.keys(filesMap).find(
            (k) => filesMap[k] === midF,
          );
          midSquare = midFileChar + midR;
        } else {
          const midR = r1,
            midF = f2;
          const midFileChar = Object.keys(filesMap).find(
            (k) => filesMap[k] === midF,
          );
          midSquare = midFileChar + midR;
        }
        newArrows.push([dragStart, midSquare, color]);
        newArrows.push([midSquare, dragEnd, color]);
      } else newArrows.push([dragStart, dragEnd, color]);
      setArrows(newArrows);
    }
    setDragStart(null);
  };

  const clearBoardMarkup = () => {
    setCustomHighlights({});
    setArrows([]);
  };

  return (
    <div className="app-container">
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={engineSettings}
        onSave={(newSettings) => {
          setEngineSettings(newSettings);
          setShowSettings(false);
        }}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calculating={calculating}
        evalData={evalData}
        history={history}
        currentMoveIndex={currentMoveIndex}
        jumpToMove={jumpToMove}
        moveHistoryRef={moveHistoryRef}
        inputFen={inputFen}
        setInputFen={setInputFen}
        handleFenLoad={handleFenLoad}
        handleNewGame={handleNewGame}
        setOrientation={setOrientation}
        gamesList={gamesList}
        loadGameFromList={loadGameFromList}
        setHoveredFen={setHoveredFen}
        setHoveredLastMove={setHoveredLastMove}
        setHoverPos={setHoverPos}
        currentGameId={currentGameId}
        setGamesList={setGamesList}
        playSequence={playSequence}
        setShowSettings={setShowSettings}
        engineSettings={engineSettings}
        fenCache={fenCache}
        swapVariation={swapVariation}
        boardFen={boardFen}
      />

      <Board
        currentFen={currentFen}
        onDrop={onDrop}
        orientation={orientation}
        customSquareStyles={(() => {
          const lastMove = history[currentMoveIndex]?.move;
          if (lastMove) {
            return {
              [lastMove.from]: { backgroundColor: "rgba(255, 255, 0, 0.5)" },
              [lastMove.to]: { backgroundColor: "rgba(255, 255, 0, 0.5)" },
            };
          }
          return {};
        })()}
        customHighlights={customHighlights}
        dragStart={dragStart}
        evalData={evalData}
        calculating={calculating}
        clearBoardMarkup={clearBoardMarkup}
        arrows={arrows}
        gameOverVisible={gameOverVisible}
        gameOverText={gameOverText}
        boardOverlayRef={boardOverlayRef}
        isCtrlPressed={isCtrlPressed}
        onBoardMouseDown={onBoardMouseDown}
        onBoardMouseUp={onBoardMouseUp}
      />

      {hoveredFen && (
        <HoverBoard
          fen={hoveredFen}
          x={hoverPos.x}
          y={hoverPos.y}
          orientation={orientation}
          customPieces={null}
          customSquareStyles={
            hoveredLastMove
              ? {
                [hoveredLastMove.from]: {
                  backgroundColor: "rgba(255, 255, 0, 0.4)",
                },
                [hoveredLastMove.to]: {
                  backgroundColor: "rgba(255, 255, 0, 0.4)",
                },
              }
              : {}
          }
        />
      )}
    </div>
  );
};

export default App;
