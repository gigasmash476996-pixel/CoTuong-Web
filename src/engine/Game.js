export class Game {
  constructor(state = null) {
    this.board = this.getInitialBoard();
    this.turn = 'r'; // 'r' cho Đỏ (đi trước), 'b' cho Đen
    this.realBoardStates = {};
    this.positionHistory = [];
    this.moveHistory = [];

    if (state) {
      this.loadState(state);
    } else {
      this.pushRealState();
    }
  }

  getBoardString() {
    let s = this.turn;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        s += this.board[r][c] || '-';
      }
    }
    return s;
  }

  pushRealState() {
    const hash = this.getBoardString();
    this.positionHistory.push(hash);
    this.realBoardStates[hash] = (this.realBoardStates[hash] || 0) + 1;
  }

  popRealState() {
    const hash = this.positionHistory.pop();
    if (!hash) return;

    const nextCount = (this.realBoardStates[hash] || 0) - 1;
    if (nextCount > 0) {
      this.realBoardStates[hash] = nextCount;
    } else {
      delete this.realBoardStates[hash];
    }
  }

  getInitialBoard() {
    return [
      ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'],
      ['', '', '', '', '', '', '', '', ''],
      ['', 'c', '', '', '', '', '', 'c', ''],
      ['p', '', 'p', '', 'p', '', 'p', '', 'p'],
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['P', '', 'P', '', 'P', '', 'P', '', 'P'],
      ['', 'C', '', '', '', '', '', 'C', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R']
    ];
  }

  cloneBoard(board = this.board) {
    return board.map(row => [...row]);
  }

  rebuildRealBoardStates() {
    this.realBoardStates = {};
    for (const hash of this.positionHistory) {
      this.realBoardStates[hash] = (this.realBoardStates[hash] || 0) + 1;
    }
  }

  loadState(state) {
    this.board = Array.isArray(state?.board) ? this.cloneBoard(state.board) : this.getInitialBoard();
    this.turn = state?.turn === 'b' ? 'b' : 'r';
    this.moveHistory = Array.isArray(state?.moveHistory)
      ? state.moveHistory.map(move => ({ ...move }))
      : [];

    const currentHash = this.getBoardString();
    const savedHistory = Array.isArray(state?.positionHistory)
      ? state.positionHistory.filter(Boolean)
      : [];

    this.positionHistory = savedHistory.length > 0 ? [...savedHistory] : [currentHash];
    if (this.positionHistory[this.positionHistory.length - 1] !== currentHash) {
      this.positionHistory.push(currentHash);
    }

    this.rebuildRealBoardStates();
  }

  serialize() {
    return {
      board: this.cloneBoard(),
      turn: this.turn,
      moveHistory: this.moveHistory.map(move => ({ ...move })),
      positionHistory: [...this.positionHistory],
    };
  }

  static fromState(state) {
    return new Game(state);
  }

  // Tiện ích kiểm tra xem ô cờ có nằm trong bàn cờ không
  isValidPos(r, c) {
    return r >= 0 && r < 10 && c >= 0 && c < 9;
  }

  isRed(piece) {
    return piece >= 'A' && piece <= 'Z';
  }

  isBlack(piece) {
    return piece >= 'a' && piece <= 'z';
  }

  sameColor(p1, p2) {
    if (!p1 || !p2) return false;
    return (this.isRed(p1) && this.isRed(p2)) || (this.isBlack(p1) && this.isBlack(p2));
  }

  // Lấy danh sách nước đi hợp lệ (Mảng các object: {fromRow, fromCol, toRow, toCol, captured})
  getLegalMoves(color) {
    const moves = [];
    const colorIsRed = color === 'r';

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = this.board[r][c];
        if (!p) continue;
        if ((colorIsRed && this.isRed(p)) || (!colorIsRed && this.isBlack(p))) {
          this.getPseudoMoves(r, c, p, moves);
        }
      }
    }

    // Lọc lại những nước đi không làm Tướng bị chiếu và chặn lặp cờ
    return moves.filter(move => {
      this.makeMove(move);
      const isSafe = !this.isCheck(color);

      const hash = this.getBoardString();
      let isForbiddenRepetition = false;
      
      // Nếu nước đi tạo ra một thế cờ đã lặp lại từ 2 lần trước đó (chuẩn bị lặp lần thứ 3)
      if ((this.realBoardStates[hash] || 0) >= 2) {
        const enemyColor = color === 'r' ? 'b' : 'r';
        // Chỉ cấm lặp cờ nếu người chơi đang chiếu Tướng của đối phương (Trường Chiếu - Perpetual Check)
        if (this.isCheck(enemyColor)) {
          isForbiddenRepetition = true;
        }
      }

      this.undoMove(move);
      return isSafe && !isForbiddenRepetition;
    });
  }

  getPseudoMoves(r, c, p, moves) {
    const type = p.toUpperCase();
    const isRed = this.isRed(p);

    const addIfValid = (nr, nc) => {
      if (this.isValidPos(nr, nc)) {
        const target = this.board[nr][nc];
        if (!this.sameColor(p, target)) {
          moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc, captured: target });
        }
      }
    };

    if (type === 'P') { // TỐT
      const dir = isRed ? -1 : 1;
      // Đi thẳng
      addIfValid(r + dir, c);
      // Đã qua sông thì được đi ngang
      const crossedRiver = isRed ? r <= 4 : r >= 5;
      if (crossedRiver) {
        addIfValid(r, c - 1);
        addIfValid(r, c + 1);
      }
    }
    else if (type === 'R') { // XE
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (this.isValidPos(nr, nc)) {
          const target = this.board[nr][nc];
          if (!target) {
            addIfValid(nr, nc);
          } else {
            if (!this.sameColor(p, target)) addIfValid(nr, nc);
            break; // Gặp vật cản thì dừng
          }
          nr += dr; nc += dc;
        }
      }
    }
    else if (type === 'C') { // PHÁO
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        let jumped = false;
        while (this.isValidPos(nr, nc)) {
          const target = this.board[nr][nc];
          if (!jumped) {
            if (!target) {
              addIfValid(nr, nc);
            } else {
              jumped = true; // Gặp ngòi
            }
          } else {
            if (target) {
              if (!this.sameColor(p, target)) addIfValid(nr, nc);
              break; // Ăn xong quân sau ngòi hoặc bị cản bởi quân nhà
            }
          }
          nr += dr; nc += dc;
        }
      }
    }
    else if (type === 'H') { // MÃ
      const moves_H = [
        { dr: -2, dc: -1, br: -1, bc: 0 }, { dr: -2, dc: 1, br: -1, bc: 0 },
        { dr: 2, dc: -1, br: 1, bc: 0 }, { dr: 2, dc: 1, br: 1, bc: 0 },
        { dr: -1, dc: -2, br: 0, bc: -1 }, { dr: 1, dc: -2, br: 0, bc: -1 },
        { dr: -1, dc: 2, br: 0, bc: 1 }, { dr: 1, dc: 2, br: 0, bc: 1 }
      ];
      for (const m of moves_H) {
        const nr = r + m.dr, nc = c + m.dc;
        const blockR = r + m.br, blockC = c + m.bc;
        if (this.isValidPos(nr, nc) && !this.board[blockR][blockC]) {
          addIfValid(nr, nc);
        }
      }
    }
    else if (type === 'E') { // TƯỢNG
      const moves_E = [
        { dr: -2, dc: -2, br: -1, bc: -1 }, { dr: -2, dc: 2, br: -1, bc: 1 },
        { dr: 2, dc: -2, br: 1, bc: -1 }, { dr: 2, dc: 2, br: 1, bc: 1 }
      ];
      for (const m of moves_E) {
        const nr = r + m.dr, nc = c + m.dc;
        const blockR = r + m.br, blockC = c + m.bc;
        // Không được qua sông
        if (isRed && nr < 5) continue;
        if (!isRed && nr > 4) continue;

        if (this.isValidPos(nr, nc) && !this.board[blockR][blockC]) {
          addIfValid(nr, nc);
        }
      }
    }
    else if (type === 'A') { // SĨ
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (this.isInPalace(nr, nc, isRed)) {
          addIfValid(nr, nc);
        }
      }
    }
    else if (type === 'K') { // TƯỚNG
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (this.isInPalace(nr, nc, isRed)) {
          addIfValid(nr, nc);
        }
      }
    }
  }

  isInPalace(r, c, isRed) {
    if (c < 3 || c > 5) return false;
    if (isRed) return r >= 7 && r <= 9;
    return r >= 0 && r <= 2;
  }

  makeMove(move) {
    move.captured = this.board[move.toRow][move.toCol];
    this.board[move.toRow][move.toCol] = this.board[move.fromRow][move.fromCol];
    this.board[move.fromRow][move.fromCol] = '';
    this.turn = this.turn === 'r' ? 'b' : 'r';
  }

  commitMove(move) {
    const executedMove = {
      ...move,
      piece: this.board[move.fromRow][move.fromCol],
    };

    this.makeMove(executedMove);
    this.moveHistory.push({ ...executedMove });
    this.pushRealState();
    return executedMove;
  }

  undoMove(move) {
    this.board[move.fromRow][move.fromCol] = this.board[move.toRow][move.toCol];
    this.board[move.toRow][move.toCol] = move.captured;
    this.turn = this.turn === 'r' ? 'b' : 'r';
  }

  undoLastRealMove() {
    if (this.moveHistory.length === 0) return null;

    this.popRealState();
    const lastMove = this.moveHistory.pop();
    this.undoMove(lastMove);
    return { ...lastMove };
  }

  getLastRealMove() {
    if (this.moveHistory.length === 0) return null;
    return { ...this.moveHistory[this.moveHistory.length - 1] };
  }

  findKing(color) {
    const k = color === 'r' ? 'K' : 'k';
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] === k) return { r, c };
      }
    }
    return null;
  }

  isCheck(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return true; // Mất tướng = bị chiếu chết

    const enemyTurn = color === 'r' ? 'b' : 'r';
    const moves = [];
    // Quét sơ pseudo moves của đối thủ xem có ăn được Tướng không
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = this.board[r][c];
        if (!p) continue;
        if ((enemyTurn === 'r' && this.isRed(p)) || (enemyTurn === 'b' && this.isBlack(p))) {
          this.getPseudoMoves(r, c, p, moves);
        }
      }
    }

    for (const move of moves) {
      if (move.toRow === kingPos.r && move.toCol === kingPos.c) {
        return true;
      }
    }

    // Luật Tướng lườm nhau (Flying King)
    const otherKingPos = this.findKing(enemyTurn);
    if (kingPos && otherKingPos && kingPos.c === otherKingPos.c) {
      let hasPieceBetween = false;
      const minR = Math.min(kingPos.r, otherKingPos.r);
      const maxR = Math.max(kingPos.r, otherKingPos.r);
      for (let i = minR + 1; i < maxR; i++) {
        if (this.board[i][kingPos.c]) {
          hasPieceBetween = true;
          break;
        }
      }
      if (!hasPieceBetween) return true;
    }

    return false;
  }
}
