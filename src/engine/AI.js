const PIECE_VALUES = {
  P: 10, p: 10,
  A: 20, a: 20,
  E: 20, e: 20,
  H: 40, h: 40,
  C: 45, c: 45,
  R: 90, r: 90,
  K: 10000, k: 10000
};

// ============================================================
// KHAI CUỘC (Opening Book) cho Depth 3 (Medium+)
// Được encode theo định dạng: [fromRow, fromCol, toRow, toCol]
// Pháo đầu + Mã bình phong (cho cả Đỏ và Đen)
// ============================================================
const OPENING_BOOK = {
  // Đỏ đi trước: Pháo đầu (2,1->2,4), Mã bình phong (9,1->7,2), Xe phát triển
  'r': [
    // Turn 1: Pháo đầu - đưa pháo lên cột giữa
    { from: [9,7], to: [7,7], weight: 10 },  // Mã bên phải lên
    { from: [9,1], to: [7,2], weight: 10 },  // Mã bên trái lên
    { from: [7,4], to: [4,4], weight: 9 },   // Pháo đầu (hàng 7 cột 4)
    { from: [7,4], to: [2,4], weight: 8 },   // Pháo lên giữa
    { from: [9,0], to: [9,1], weight: 6 },   // Xe phát triển
    { from: [9,8], to: [9,7], weight: 6 },   // Xe phải phát triển
  ],
  // Đen phản công: Pháo đầu phản công + Mã phòng thủ
  'b': [
    { from: [0,1], to: [2,2], weight: 10 },  // Mã trái lên
    { from: [0,7], to: [2,6], weight: 10 },  // Mã phải lên
    { from: [2,4], to: [7,4], weight: 9 },   // Pháo đầu phản công
    { from: [2,4], to: [4,4], weight: 8 },   // Pháo trung tâm
    { from: [0,0], to: [0,1], weight: 6 },   // Xe phát triển
    { from: [0,8], to: [0,7], weight: 6 },
  ]
};

export class EngineAI {
  constructor(game, level) {
    this.game = game;
    // level: 'poor' | 'medium' | 'smart'
    this.level = level;
    this.isSmart = (level === 'smart');
    this.isMedium = (level === 'medium');
    this.nodesEvaluated = 0;
    this.analysisLog = []; // Log phân tích nước đi
    this.moveCount = 0; // Đếm số nước đã đi (để biết có còn trong khai cuộc không)
  }

  evaluatePoor() {
    let score = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = this.game.board[r][c];
        if (!p) continue;
        const val = PIECE_VALUES[p.toUpperCase()];
        if (p >= 'A' && p <= 'Z') score += val;
        else score -= val;
      }
    }
    score += (Math.random() * 4 - 2);
    return this.aiColor === 'r' ? score : -score;
  }

  evaluateSmart() {
    let score = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = this.game.board[r][c];
        if (!p) continue;
        let val = PIECE_VALUES[p.toUpperCase()];
        const type = p.toUpperCase();
        if (type === 'P') {
          if (p === 'P') {
            if (r <= 4) val += 10;
            if (r <= 3 && c >= 3 && c <= 5) val += 15;
          } else {
            if (r >= 5) val += 10;
            if (r >= 6 && c >= 3 && c <= 5) val += 15;
          }
        } else if (type === 'H') {
          if (r > 2 && r < 7 && c > 1 && c < 7) val += 5;
        } else if (type === 'C') {
          if (c === 4) val += 5;
          if ((p === 'C' && r > 5) || (p === 'c' && r < 4)) val += 3;
        } else if (type === 'K') {
          if (p === 'K' && r === 9 && c === 4) val += 5;
          if (p === 'k' && r === 0 && c === 4) val += 5;
        }
        if (p >= 'A' && p <= 'Z') score += val;
        else score -= val;
      }
    }
    return this.aiColor === 'r' ? score : -score;
  }

  // Thử dùng khai cuộc nếu còn trong giai đoạn khai cuộc (≤ 8 nước)
  getOpeningMove(moveCount) {
    if (moveCount > 8) return null;
    const turn = this.game.turn;
    const candidates = OPENING_BOOK[turn] || [];
    // Lọc các nước hợp lệ còn trên bàn cờ
    const legalMoves = this.game.getLegalMoves(turn);
    const validBookMoves = [];
    for (const entry of candidates) {
      const [fr, fc, tr, tc] = [entry.from[0], entry.from[1], entry.to[0], entry.to[1]];
      const match = legalMoves.find(m =>
        m.fromRow === fr && m.fromCol === fc && m.toRow === tr && m.toCol === tc
      );
      if (match) validBookMoves.push({ move: match, weight: entry.weight });
    }
    if (validBookMoves.length === 0) return null;
    // Chọn nước có weight cao nhất (có thể random nhẹ giữa các nước tốt nhất)
    validBookMoves.sort((a, b) => b.weight - a.weight);
    const best = validBookMoves[0];
    return best.move;
  }

  minimax(depth, alpha, beta, isMaximizing) {
    this.nodesEvaluated++;
    const myKing = this.game.findKing(this.game.turn);
    if (!myKing) return isMaximizing ? -10000 + (6 - depth) : 10000 - (6 - depth);
    if (depth === 0) {
      if (this.isSmart || this.isMedium) return this.evaluateSmart();
      return this.evaluatePoor();
    }
    const moves = this.game.getLegalMoves(this.game.turn);
    if (moves.length === 0) return isMaximizing ? -10000 + (6 - depth) : 10000 - (6 - depth);

    if (this.isSmart || this.isMedium) {
      moves.sort((a, b) => {
        let scoreA = a.captured ? PIECE_VALUES[a.captured.toUpperCase()] : 0;
        let scoreB = b.captured ? PIECE_VALUES[b.captured.toUpperCase()] : 0;
        return scoreB - scoreA;
      });
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.game.makeMove(move);
        const ev = this.minimax(depth - 1, alpha, beta, false);
        this.game.undoMove(move);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.game.makeMove(move);
        const ev = this.minimax(depth - 1, alpha, beta, true);
        this.game.undoMove(move);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  getBestMove(moveCount = 99) {
    this.nodesEvaluated = 0;
    this.analysisLog = [];
    this.aiColor = this.game.turn; // Lưu màu quân của AI ở gốc tìm kiếm

    // Depth theo level
    let depth;
    if (this.level === 'poor') depth = 2;
    else if (this.level === 'medium') depth = 3;
    else depth = 4; // smart

    // Depth 3 (medium) dùng khai cuộc
    if (this.level === 'medium') {
      const openingMove = this.getOpeningMove(moveCount);
      if (openingMove) {
        this.analysisLog.push(`📖 Dùng khai cuộc: Pháo đầu / Mã bình phong`);
        this.analysisLog.push(`🎯 Nước khai cuộc được chọn từ thư viện mở đầu`);
        return openingMove;
      }
    }

    const moves = this.game.getLegalMoves(this.game.turn);
    if (moves.length === 0) return null;

    if (this.isSmart || this.isMedium) {
      moves.sort((a, b) => {
        let scoreA = a.captured ? PIECE_VALUES[a.captured.toUpperCase()] : 0;
        let scoreB = b.captured ? PIECE_VALUES[b.captured.toUpperCase()] : 0;
        return scoreB - scoreA;
      });
    }

    let bestMove = null;
    let maxEval = -Infinity;
    const topCandidates = [];

    for (const move of moves) {
      this.game.makeMove(move);
      const ev = this.minimax(depth - 1, -Infinity, Infinity, false);
      this.game.undoMove(move);
      topCandidates.push({ move, score: ev });
      if (ev > maxEval || bestMove === null) {
        maxEval = ev;
        bestMove = move;
      }
    }

    // Tạo log phân tích
    topCandidates.sort((a, b) => b.score - a.score);
    const LABELS = {
      'K': 'Tướng', 'A': 'Sĩ', 'E': 'Tượng', 'H': 'Mã', 'R': 'Xe', 'C': 'Pháo', 'P': 'Tốt',
      'k': 'Tướng', 'a': 'Sĩ', 'e': 'Tượng', 'h': 'Mã', 'r': 'Xe', 'c': 'Pháo', 'p': 'Tốt'
    };

    this.analysisLog.push(`🔍 Độ sâu tìm kiếm: ${depth} nước | Nodes: ${this.nodesEvaluated.toLocaleString()}`);
    this.analysisLog.push(`📊 Đánh giá ${Math.min(topCandidates.length, 5)} nước tốt nhất:`);

    topCandidates.slice(0, 5).forEach((c, i) => {
      const piece = this.game.board[c.move.fromRow]?.[c.move.fromCol] 
        || (this.game.turn === 'r' ? 'R' : 'r');
      const label = LABELS[piece] || '?';
      const cap = c.move.captured ? ` ⚔️ ăn ${LABELS[c.move.captured]}` : '';
      this.analysisLog.push(
        `${i === 0 ? '✅' : `${i+1}.`} ${label} (${c.move.fromRow},${c.move.fromCol})→(${c.move.toRow},${c.move.toCol})${cap} [${c.score > 0 ? '+' : ''}${c.score}]`
      );
    });

    this.analysisLog.push(`🏆 Nước được chọn: (${bestMove.fromRow},${bestMove.fromCol}) → (${bestMove.toRow},${bestMove.toCol})`);

    console.log(`AI [${this.level}] depth=${depth} | Nodes: ${this.nodesEvaluated} | Score: ${maxEval}`);
    return bestMove;
  }
}
