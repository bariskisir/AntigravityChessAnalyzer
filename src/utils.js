export const getAnnotation = (diff) => {
    if (diff >= 1.0) return { symbol: "!!", color: "#26c281", title: "Perfect" };
    if (diff >= 0.3) return { symbol: "!", color: "#81b64c", title: "Good" };
    if (diff >= -0.5)
        return { symbol: "!?", color: "#5bc0de", title: "Interesting" };
    if (diff >= -1.0) return { symbol: "?!", color: "#f7c045", title: "Dubious" };
    if (diff >= -2.0) return { symbol: "?", color: "#e6912c", title: "Mistake" };
    return { symbol: "??", color: "#d9534f", title: "Blunder" };
};

export const getGameOverMessage = (chessGame, history = []) => {
    if (chessGame.isCheckmate()) return "Checkmate!";
    if (chessGame.isStalemate()) return "Draw (Stalemate)";

    if (history.length > 0) {
        const currentFen = chessGame.fen().split(" ").slice(0, 4).join(" ");
        let count = 0;
        for (const node of history) {
            const histFen = node.fen.split(" ").slice(0, 4).join(" ");
            if (histFen === currentFen) {
                count++;
            }
        }
        if (count >= 3) return "Draw (Threefold Repetition)";
    }

    if (chessGame.isThreefoldRepetition()) return "Draw (Threefold Repetition)";
    if (chessGame.isInsufficientMaterial())
        return "Draw (Dead Position)";
    if (chessGame.isDraw()) return "Draw (50-move rule)";
    return null;
};
