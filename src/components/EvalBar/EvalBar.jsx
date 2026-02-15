import React from "react";
import "./EvalBar.css";

const EvalBar = ({ score, isMate, orientation = "white" }) => {
    let percentage = 50;

    if (isMate) {
        if (score > 0) percentage = 100;
        else percentage = 0;
    } else {
        const winChance = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * score)) - 1);
        percentage = winChance;
    }

    percentage = Math.max(0, Math.min(100, percentage));

    const isWhiteAtBottom = orientation === "white";
    const flexDirection = isWhiteAtBottom ? "column-reverse" : "column";

    const isWhiteWinning = percentage > 50;
    const showScoreAtBottom = isWhiteAtBottom ? isWhiteWinning : !isWhiteWinning;

    return (
        <div
            className="eval-bar-container"
            style={{
                display: "flex",
                flexDirection: flexDirection,
                height: "100%",
                width: "100%",
                backgroundColor: "#403d39",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                className="eval-bar-fill"
                style={{
                    height: `${percentage}%`,
                    backgroundColor: "#ffffff",
                    transition: "height 0.4s ease-out",
                }}
            />

            <div
                className={`eval-score ${showScoreAtBottom ? "bottom" : "top"}`}
                style={{
                    position: "absolute",
                    width: "100%",
                    textAlign: "center",
                    zIndex: 10,
                    bottom: showScoreAtBottom ? "8px" : "auto",
                    top: showScoreAtBottom ? "auto" : "8px",
                    color: showScoreAtBottom ? "#333" : "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                }}
            >
                {isMate ? `M${Math.abs(score)}` : (score / 100).toFixed(1)}
            </div>
        </div>
    );
};

export default EvalBar;
