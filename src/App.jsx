import React, { useEffect, useRef, useState } from 'react';
import { Game } from './engine/Game';
import { EngineAI } from './engine/AI';

const PIECE_LABELS = {
  K: '帥', A: '仕', E: '相', H: '傌', R: '俥', C: '炮', P: '兵',
  k: '將', a: '士', e: '象', h: '馬', r: '車', c: '砲', p: '卒'
};

const AI_LEVEL_LABELS = {
  poor: 'Tìm kiếm nông (Depth 2)',
  medium: 'Tìm kiếm vừa (Depth 3)',
  smart: 'Tìm kiếm sâu (Depth 4)'
};

const SAVE_FILE_VERSION = 1;
const FINISHED_STATUS_PATTERN = /thắng|hết/i;

const cloneBoard = (board) => board.map(row => [...row]);
const isFinishedStatus = (status) => FINISHED_STATUS_PATTERN.test(status);
const isRedPiece = (piece) => piece >= 'A' && piece <= 'Z';
const isBlackPiece = (piece) => piece >= 'a' && piece <= 'z';
const isPieceOfColor = (piece, color) => (color === 'r' ? isRedPiece(piece) : isBlackPiece(piece));

export default function App() {
  const initialGameRef = useRef(null);
  if (!initialGameRef.current) {
    initialGameRef.current = new Game();
  }

  const [screen, setScreen] = useState('setup');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [draftPlayerColor, setDraftPlayerColor] = useState('r');
  const [draftAiLevel, setDraftAiLevel] = useState('medium');

  const [game, setGame] = useState(initialGameRef.current);
  const [boardRender, setBoardRender] = useState(() => cloneBoard(initialGameRef.current.board));
  const [selectedPos, setSelectedPos] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [analysisLog, setAnalysisLog] = useState([]);
  const [aiLevel, setAiLevel] = useState('medium');
  const [playerColor, setPlayerColor] = useState('r');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState('Đang chơi');
  const [saveMessage, setSaveMessage] = useState('');

  const analysisRef = useRef(null);
  const fileInputRef = useRef(null);
  const aiTimeoutRef = useRef(null);

  const aiColor = playerColor === 'r' ? 'b' : 'r';
  const shouldFlip = playerColor === 'b';

  const clearAiTimeout = () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
  };

  const deriveGameStatus = (currentGame) => {
    const activeKing = currentGame.findKing(currentGame.turn);
    if (!activeKing) {
      return currentGame.turn === 'r' ? 'Đen thắng!' : 'Đỏ thắng!';
    }

    const moves = currentGame.getLegalMoves(currentGame.turn);
    if (moves.length === 0) {
      if (currentGame.isCheck(currentGame.turn)) {
        return currentGame.turn === 'r' ? 'Đen chiếu hết!' : 'Đỏ chiếu hết!';
      } else {
        return currentGame.turn === 'r' ? 'Đen thắng (Đỏ vây bí)!' : 'Đỏ thắng (Đen vây bí)!';
      }
    }

    if (currentGame.isCheck(currentGame.turn)) {
      return 'Bị Chiếu!';
    }

    return 'Đang chơi';
  };

  const syncBoardState = (
    currentGame,
    nextStatus = deriveGameStatus(currentGame),
    nextLastMove = currentGame.getLastRealMove(),
  ) => {
    setBoardRender(cloneBoard(currentGame.board));
    setSelectedPos(null);
    setLegalMoves([]);
    setLastMove(nextLastMove ? { ...nextLastMove } : null);
    setGameStatus(nextStatus);
  };

  const syncAnalysisLengthWithHistory = (currentGame, humanColor) => {
    const currentAiColor = humanColor === 'r' ? 'b' : 'r';
    const remainingAiTurns = currentGame.moveHistory.filter((move) => isPieceOfColor(move.piece, currentAiColor)).length;
    setAnalysisLog((prev) => prev.slice(0, remainingAiTurns));
  };

  const loadGameIntoUi = (nextGame, options = {}) => {
    const nextPlayerColor = options.playerColor ?? 'r';
    const nextAiLevel = options.aiLevel ?? 'medium';

    clearAiTimeout();
    setIsAiThinking(false);
    setGame(nextGame);
    setPlayerColor(nextPlayerColor);
    setAiLevel(nextAiLevel);
    setDraftPlayerColor(nextPlayerColor);
    setDraftAiLevel(nextAiLevel);
    setAnalysisLog(options.analysisLog ?? []);
    syncBoardState(nextGame, options.gameStatus ?? deriveGameStatus(nextGame), options.lastMove ?? nextGame.getLastRealMove());
    setHasActiveSession(true);
    setScreen('game');
  };

  const startNewGame = () => {
    const freshGame = new Game();
    setSaveMessage('');
    loadGameIntoUi(freshGame, {
      playerColor: draftPlayerColor,
      aiLevel: draftAiLevel,
      analysisLog: [],
      gameStatus: 'Đang chơi',
      lastMove: null,
    });
  };

  const executeRealMove = (move, log = null) => {
    const executedMove = game.commitMove(move);
    setLastMove({ ...executedMove });

    if (log && log.length > 0) {
      setAnalysisLog((prev) => [...prev, { turn: game.moveHistory.length, lines: log }]);
    }

    syncBoardState(game, undefined, executedMove);
  };

  useEffect(() => () => clearAiTimeout(), []);

  useEffect(() => {
    if (screen !== 'game') return;
    if (game.turn !== playerColor && !isAiThinking && !isFinishedStatus(gameStatus)) {
      clearAiTimeout();
      setIsAiThinking(true);
      aiTimeoutRef.current = setTimeout(() => {
        const ai = new EngineAI(game, aiLevel);
        const bestMove = ai.getBestMove(game.moveHistory.length);

        if (bestMove) {
          executeRealMove(bestMove, ai.analysisLog);
        }

        setIsAiThinking(false);
        aiTimeoutRef.current = null;
      }, 150);
    }
  }, [aiLevel, game, game.turn, gameStatus, isAiThinking, playerColor, screen]);

  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
    }
  }, [analysisLog]);

  const selectPiece = (r, c) => {
    setSelectedPos({ r, c });
    const moves = game.getLegalMoves(game.turn);
    const pieceMoves = moves.filter((move) => move.fromRow === r && move.fromCol === c);
    setLegalMoves(pieceMoves);
  };

  const handleSquareClick = (r, c) => {
    if (isAiThinking || isFinishedStatus(gameStatus)) return;

    const piece = game.board[r][c];
    if (selectedPos) {
      const move = legalMoves.find((candidate) => candidate.toRow === r && candidate.toCol === c);
      if (move) {
        executeRealMove(move);
        return;
      }

      if (piece && ((game.turn === 'r' && game.isRed(piece)) || (game.turn === 'b' && game.isBlack(piece)))) {
        selectPiece(r, c);
        return;
      }

      setSelectedPos(null);
      setLegalMoves([]);
      return;
    }

    if (!piece || game.turn !== playerColor) return;
    if ((game.turn === 'r' && game.isRed(piece)) || (game.turn === 'b' && game.isBlack(piece))) {
      selectPiece(r, c);
    }
  };

  const handleUndo = () => {
    if (isAiThinking || game.moveHistory.length === 0) return;

    clearAiTimeout();
    setIsAiThinking(false);

    let stepsToUndo = 1;
    if (game.turn === playerColor && game.moveHistory.length > 1) {
      stepsToUndo = 2;
    }

    while (stepsToUndo > 0 && game.moveHistory.length > 0) {
      game.undoLastRealMove();
      stepsToUndo -= 1;
    }

    syncAnalysisLengthWithHistory(game, playerColor);
    syncBoardState(game);
    setSaveMessage('Đã hoàn tác lượt gần nhất.');
  };

  const handleSaveGame = () => {
    if (isAiThinking) return;

    const payload = {
      version: SAVE_FILE_VERSION,
      savedAt: new Date().toISOString(),
      playerColor,
      aiLevel,
      gameStatus,
      analysisLog,
      lastMove,
      game: game.serialize(),
    };

    const fileNamePrefix = isFinishedStatus(gameStatus) ? 'xiangqi-finished' : 'xiangqi-save';
    const fileName = `${fileNamePrefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSaveMessage(`Đã lưu ${isFinishedStatus(gameStatus) ? 'ván cờ đã kết thúc' : 'ván cờ đang chơi'} ra file JSON.`);
  };

  const handleLoadButtonClick = () => {
    if (isAiThinking) return;
    fileInputRef.current?.click();
  };

  const handleLoadGame = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const savedData = JSON.parse(rawText);

      if (!savedData?.game) {
        throw new Error('Thiếu dữ liệu ván cờ.');
      }

      const nextPlayerColor = savedData.playerColor === 'b' ? 'b' : 'r';
      const nextAiLevel = ['poor', 'medium', 'smart'].includes(savedData.aiLevel) ? savedData.aiLevel : 'medium';
      const nextGame = Game.fromState(savedData.game);
      const nextStatus = typeof savedData.gameStatus === 'string'
        ? savedData.gameStatus
        : deriveGameStatus(nextGame);
      const nextAnalysisLog = Array.isArray(savedData.analysisLog) ? savedData.analysisLog : [];
      const trimmedLog = nextAnalysisLog.slice(
        0,
        nextGame.moveHistory.filter((move) => isPieceOfColor(move.piece, nextPlayerColor === 'r' ? 'b' : 'r')).length,
      );

      loadGameIntoUi(nextGame, {
        playerColor: nextPlayerColor,
        aiLevel: nextAiLevel,
        analysisLog: trimmedLog,
        gameStatus: nextStatus,
        lastMove: savedData.lastMove ?? nextGame.getLastRealMove(),
      });
      setSaveMessage(`Đã tải ván cờ từ file ${file.name}.`);
    } catch (error) {
      window.alert(`Không thể tải file lưu: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  };

  const handleReturnToSetup = () => {
    clearAiTimeout();
    setIsAiThinking(false);
    setSelectedPos(null);
    setLegalMoves([]);
    setScreen('setup');
  };

  const handleContinueSession = () => {
    setScreen('game');
  };

  const renderRow = (rowIndex) => (shouldFlip ? 9 - rowIndex : rowIndex);
  const renderCol = (colIndex) => (shouldFlip ? 8 - colIndex : colIndex);
  const saveButtonLabel = isFinishedStatus(gameStatus) ? 'Lưu ván đã xong' : 'Lưu ván đang chơi';
  const statusText = gameStatus !== 'Đang chơi'
    ? gameStatus
    : (game.turn === playerColor ? 'Đến lượt bạn' : 'Đến lượt AI');
  const statusClassName = [
    'status-text',
    isAiThinking ? 'thinking' : '',
    gameStatus.includes('Đỏ') ? 'red' : '',
    gameStatus.includes('Đen') ? 'black' : '',
    gameStatus === 'Bị Chiếu!' ? 'alert' : '',
  ].filter(Boolean).join(' ');

  const renderSetupScreen = () => (
    <section className="setup-screen">
      <div className="setup-panel standalone">
        <div>
          <p className="eyebrow">Thiết Lập</p>
          <h1 className="panel-title">Cờ Tướng Người vs AI</h1>
          <p className="panel-copy">
            Màn hình này chỉ dùng để cấu hình trước khi vào ván mới hoặc tải một ván cờ đã lưu.
          </p>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="player-color">Màu quân của bạn</label>
          <select id="player-color" value={draftPlayerColor} onChange={(event) => setDraftPlayerColor(event.target.value)}>
            <option value="r">Đỏ - đi trước</option>
            <option value="b">Đen - đi sau</option>
          </select>
          <span className="field-hint">Bàn cờ sẽ tự xoay để quân của bạn luôn nằm phía dưới.</span>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="ai-level">Độ sâu tìm kiếm của AI</label>
          <select id="ai-level" value={draftAiLevel} onChange={(event) => setDraftAiLevel(event.target.value)}>
            <option value="poor">Tìm kiếm nông (Depth 2)</option>
            <option value="medium">Tìm kiếm vừa (Depth 3)</option>
            <option value="smart">Tìm kiếm sâu (Depth 4)</option>
          </select>
          <span className="field-hint">Độ sâu càng lớn, AI đánh càng hay nhưng suy nghĩ càng lâu.</span>
        </div>

        <div className="setup-primary-actions">
          <button className="primary-button" onClick={startNewGame}>
            Bắt đầu ván mới
          </button>
          <button className="secondary-button" onClick={handleLoadButtonClick}>
            Tải ván từ file
          </button>
        </div>

        {hasActiveSession && (
          <div className="resume-card">
            <div>
              <span className="summary-label">Ván hiện tại</span>
              <strong>{playerColor === 'r' ? 'Bạn cầm Đỏ' : 'Bạn cầm Đen'} - {AI_LEVEL_LABELS[aiLevel]}</strong>
              <p className="field-hint">Bạn có thể quay lại tiếp tục ván đang chơi mà không đổi trạng thái của nó.</p>
            </div>
            <button className="secondary-button" onClick={handleContinueSession}>
              Tiếp tục ván hiện tại
            </button>
          </div>
        )}

        <div className="setup-summary">
          <div>
            <span className="summary-label">Chuẩn bị cho ván mới</span>
            <strong>{draftPlayerColor === 'r' ? 'Bạn cầm Đỏ' : 'Bạn cầm Đen'}</strong>
          </div>
          <div>
            <span className="summary-label">AI cho ván mới</span>
            <strong>{AI_LEVEL_LABELS[draftAiLevel]}</strong>
          </div>
        </div>

        <p className="save-note">
          {saveMessage || 'Bạn có thể tải ván đang chơi dở hoặc ván đã kết thúc từ file JSON ngay tại màn hình này.'}
        </p>
      </div>
    </section>
  );

  const renderGameScreen = () => (
    <main className="game-screen">
      <section className="play-panel">
        <div className="play-toolbar">
          <div>
            <p className="eyebrow">Bàn Cờ</p>
            <div className={statusClassName}>{isAiThinking ? 'AI đang suy nghĩ...' : statusText}</div>
          </div>

          <div className="toolbar-actions">
            <button className="secondary-button" onClick={handleReturnToSetup}>
              Trở lại thiết lập
            </button>
            <button className="secondary-button" onClick={handleUndo} disabled={isAiThinking || game.moveHistory.length === 0}>
              Hoàn tác lượt
            </button>
            <button className="secondary-button" onClick={handleSaveGame} disabled={isAiThinking}>
              {saveButtonLabel}
            </button>
          </div>
        </div>

        <div className="game-layout">
          <div className="board-section">
            <div className="player-label ai-label">
              <span className={`color-dot ${aiColor === 'r' ? 'red' : 'black'}`}></span>
              AI ({aiColor === 'r' ? 'Đỏ' : 'Đen'}) - {AI_LEVEL_LABELS[aiLevel]}
            </div>

            <div className="board-wrapper">
              <div className="board-grid">
                {Array.from({ length: 8 * 9 }).map((_, index) => (
                  <div key={index} className="board-cell"></div>
                ))}
                <div className="river-bg"></div>
                <div className="river-text">楚 河 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 漢 界</div>
                <div className="palace-line-1 ps-1"></div>
                <div className="palace-line-2 ps-2"></div>
                <div className="palace-line-1 ps-3"></div>
                <div className="palace-line-2 ps-4"></div>
              </div>

              <div className="intersections">
                {Array.from({ length: 10 }).map((_, ri) => (
                  Array.from({ length: 9 }).map((_, ci) => {
                    const rowIndex = renderRow(ri);
                    const colIndex = renderCol(ci);
                    const piece = boardRender[rowIndex]?.[colIndex];
                    const isSelected = selectedPos?.r === rowIndex && selectedPos?.c === colIndex;
                    const isLegalMove = legalMoves.find((move) => move.toRow === rowIndex && move.toCol === colIndex);
                    const isStartedHere = lastMove?.fromRow === rowIndex && lastMove?.fromCol === colIndex;
                    const isEndedHere = lastMove?.toRow === rowIndex && lastMove?.toCol === colIndex;

                    return (
                      <div key={`${ri}-${ci}`} className="point" onClick={() => handleSquareClick(rowIndex, colIndex)}>
                        {(isStartedHere || isEndedHere) && <div className="last-move-highlight"></div>}
                        {piece && (
                          <div className={`piece ${game.isRed(piece) ? 'red' : 'black'} ${isSelected ? 'selected' : ''}`}>
                            {PIECE_LABELS[piece]}
                          </div>
                        )}
                        {isLegalMove && <div className={`valid-move ${piece ? 'capture' : ''}`}></div>}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>

            <div className="player-label human-label">
              <span className={`color-dot ${playerColor === 'r' ? 'red' : 'black'}`}></span>
              Bạn ({playerColor === 'r' ? 'Đỏ' : 'Đen'})
            </div>
          </div>

          <aside className="history-panel">
            <h3 className="history-title">Phân tích nước đi của AI</h3>
            <div className="history-list" ref={analysisRef}>
              {analysisLog.length === 0 && (
                <span className="history-empty">Chưa có phân tích nào. Log đánh giá của AI sẽ xuất hiện tại đây.</span>
              )}
              {analysisLog.map((entry, index) => (
                <div key={index} className="history-entry">
                  <div className="history-turn">Lượt {entry.turn}</div>
                  {entry.lines.map((line, lineIndex) => (
                    <div key={lineIndex} className="history-line">{line}</div>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );

  return (
    <div className="app-container">
      {screen === 'setup' ? renderSetupScreen() : renderGameScreen()}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden-input"
        onChange={handleLoadGame}
      />
    </div>
  );
}
