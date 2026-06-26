const PIECE_VALUES = {
  P: 10, p: 10,
  A: 20, a: 20,
  E: 20, e: 20,
  H: 40, h: 40,
  C: 45, c: 45,
  R: 90, r: 90,
  K: 10000, k: 10000
};

export class EngineAI {
  constructor(game, level = 'smart') {
    this.game = game;
    // Cấu hình độ sâu tìm kiếm theo level
    if (level === 'poor') this.SEARCH_DEPTH = 2;
    else if (level === 'medium') this.SEARCH_DEPTH = 3;
    else this.SEARCH_DEPTH = 4;
  }

  evaluate() {
    let score = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = this.game.board[r][c];
        if (!p) continue;
        
        let val = PIECE_VALUES[p.toUpperCase()];
        const type = p.toUpperCase();
        
        // Bonus vị trí cho quân
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
    // Trả về điểm đánh giá theo màu đang tìm kiếm
    return this.aiColor === 'r' ? score : -score;
  }

  // Thuật toán Minimax với Cắt tỉa Alpha-Beta và Quay lui (Backtracking)
  minimax(depth, alpha, beta, isMaximizing) {
    const myKing = this.game.findKing(this.game.turn);
    // Tính điểm sâu nếu mất Tướng để AI ưu tiên đường ngắn nhất đến chiến thắng / kéo dài lâu nhất nếu thua
    if (!myKing) return isMaximizing ? -10000 - depth : 10000 + depth;
    
    // Nếu đạt đến giới hạn độ sâu (DFS limit), gọi hàm định giá
    if (depth === 0) {
      return this.evaluate();
    }
    
    const moves = this.game.getLegalMoves(this.game.turn);
    if (moves.length === 0) return isMaximizing ? -10000 - depth : 10000 + depth;

    // Sắp xếp các nước ăn quân trước để tối ưu Cắt tỉa Alpha-Beta (Move Ordering)
    moves.sort((a, b) => {
      let scoreA = a.captured ? PIECE_VALUES[a.captured.toUpperCase()] : 0;
      let scoreB = b.captured ? PIECE_VALUES[b.captured.toUpperCase()] : 0;
      return scoreB - scoreA;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.game.makeMove(move); // Đi tới - Khám phá nhánh con
        const ev = this.minimax(depth - 1, alpha, beta, false); // Tìm kiếm theo chiều sâu (DFS)
        this.game.undoMove(move); // Quay lui (Backtracking) - Khôi phục trạng thái cũ
        
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break; // Cắt tỉa Alpha-Beta Pruning (Beta Cut-off)
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.game.makeMove(move); // Đi tới - Khám phá nhánh con
        const ev = this.minimax(depth - 1, alpha, beta, true); // Tìm kiếm theo chiều sâu (DFS)
        this.game.undoMove(move); // Quay lui (Backtracking) - Khôi phục trạng thái cũ
        
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break; // Cắt tỉa Alpha-Beta Pruning (Alpha Cut-off)
      }
      return minEval;
    }
  }

  getBestMove() {
    this.aiColor = this.game.turn; 
    this.analysisLog = [];
    const moves = this.game.getLegalMoves(this.game.turn);
    if (moves.length === 0) return null;

    // Sắp xếp các nước đi tốt nhất lên trên cùng (Move Ordering)
    moves.sort((a, b) => {
      let scoreA = a.captured ? PIECE_VALUES[a.captured.toUpperCase()] : 0;
      let scoreB = b.captured ? PIECE_VALUES[b.captured.toUpperCase()] : 0;
      return scoreB - scoreA;
    });

    let bestMove = null;
    let maxEval = -Infinity;
    const topCandidates = [];

    // Duyệt qua tất cả các nước đi khả dĩ
    for (const move of moves) {
      this.game.makeMove(move);
      const ev = this.minimax(this.SEARCH_DEPTH - 1, -Infinity, Infinity, false);
      this.game.undoMove(move);
      
      topCandidates.push({ move, score: ev });
      if (ev > maxEval || bestMove === null) {
        maxEval = ev;
        bestMove = move;
      }
    }

    // Tạo log phân tích cho giao diện
    topCandidates.sort((a, b) => b.score - a.score);
    const LABELS = {
      'K': 'Tướng', 'A': 'Sĩ', 'E': 'Tượng', 'H': 'Mã', 'R': 'Xe', 'C': 'Pháo', 'P': 'Tốt',
      'k': 'Tướng', 'a': 'Sĩ', 'e': 'Tượng', 'h': 'Mã', 'r': 'Xe', 'c': 'Pháo', 'p': 'Tốt'
    };

    this.analysisLog.push(`🔍 Độ sâu tìm kiếm: ${this.SEARCH_DEPTH} nước`);
    this.analysisLog.push(`📊 Đánh giá top nước đi tốt nhất:`);

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

    return bestMove;
  }
}
