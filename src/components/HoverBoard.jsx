import React from "react";
import { Chessboard } from "react-chessboard";

const HoverBoard = ({
  fen,
  x,
  y,
  orientation,
  customPieces,
  customSquareStyles,
}) => {
  if (!fen) return null;

  const style = {
    position: "fixed",
    left: x + 15,
    top: y + 15,
    width: "200px",
    height: "200px",
    zIndex: 1000,
    backgroundColor: "#302e2b",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
    borderRadius: "4px",
    border: "2px solid #555",
    pointerEvents: "none",
  };

  return (
    <div style={style}>
      <Chessboard
        position={fen}
        boardOrientation={orientation}
        customPieces={customPieces}
        animationDuration={0}
        customDarkSquareStyle={{ backgroundColor: "#779954" }}
        customLightSquareStyle={{ backgroundColor: "#e9edcc" }}
        customSquareStyles={customSquareStyles}
      />
    </div>
  );
};

export default HoverBoard;
