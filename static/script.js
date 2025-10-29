let currentPlayer = 'X';
        let gameActive = true;
        let players = null;
        let gameCount = 0;
        let xAiType = 'minimax';
        let oAiType = 'minimax';
        const MAX_GAMES = 50;
        const FLASH_DURATION = 50;
        const MOVE_DELAY_MS = 500;

        let scores = {
            X: 0,
            O: 0,
            draws: 0
        };

        const statusDisplay = document.getElementById('status');
        const boardCells = document.querySelectorAll('.cell');
        const resetButton = document.getElementById('reset-button');
        const mainMenuButton = document.getElementById('main-menu-button');
        const playerChoiceContainer = document.getElementById('player-choice-container');
        const gameContainer = document.getElementById('game-container');
        const boardElement = document.getElementById('board');
        const scoreboardElement = document.getElementById('scoreboard');

        function setPlayers(numPlayers, xAi = 'minimax', oAi = 'minimax') {
            players = numPlayers;
            xAiType = xAi;
            oAiType = oAi;
            playerChoiceContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            resetButton.style.display = 'inline-block';
            mainMenuButton.style.display = 'inline-block';
            gameCount = 0;
            
            scores = { X: 0, O: 0, draws: 0 };
            updateScoreboard();
            
            startGame();
        }

        async function startGame() {
            gameActive = true;
            currentPlayer = 'X';
            updateStatus(`Player ${currentPlayer}'s turn`);
            await resetBoardUI();

            if (players === 0) {
                if (gameCount < MAX_GAMES) {
                    updateStatus(`Computer vs. Computer (Game ${gameCount + 1}/${MAX_GAMES})`);
                    await resetBackendGame();
                    await runZeroPlayerGame();
                } else {
                    updateStatus("A strange game. The only winning move is not to play.");
                    boardCells.forEach(cell => {
                        cell.textContent = '';
                        cell.classList.remove('X', 'O');
                    });
                }
            } else {
                if (players === 1 && currentPlayer === 'O') {
                    setTimeout(() => makeComputerMove(oAiType), MOVE_DELAY_MS);
                }
            }
        }

        async function resetBackendGame() {
            try {
                const response = await fetch('/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (data.success) {
                    renderBoard(data.board);
                }
                return data.success;
            } catch (error) {
                console.error('Error resetting backend game:', error);
                return false;
            }
        }

        function updateStatus(message) {
            statusDisplay.textContent = message;
        }

        function updateScoreboard() {
            const xLabel = players === 1 ? 'You (X)' : players === 2 ? 'Player X' : `X (${xAiType})`;
            const oLabel = players === 1 ? `AI (O)` : players === 2 ? 'Player O' : `O (${oAiType})`;
            
            scoreboardElement.innerHTML = `
                <div class="score-item">
                    <span class="score-label">${xLabel}</span>
                    <span class="score-value">${scores.X}</span>
                </div>
                <div class="score-item">
                    <span class="score-label">${oLabel}</span>
                    <span class="score-value">${scores.O}</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Draws</span>
                    <span class="score-value">${scores.draws}</span>
                </div>
            `;
            scoreboardElement.style.display = 'flex';
        }

        function returnToMainMenu() {
            gameContainer.style.display = 'none';
            playerChoiceContainer.style.display = 'block';
            resetButton.style.display = 'none';
            mainMenuButton.style.display = 'none';
            scoreboardElement.style.display = 'none';
            
            gameActive = false;
            players = null;
            gameCount = 0;
            scores = { X: 0, O: 0, draws: 0 };
            
            boardElement.style.border = '2px solid #333';
            boardElement.style.backgroundColor = '#eee';
        }

        async function resetBoardUI() {
            boardElement.style.border = '2px solid #333';
            boardElement.style.backgroundColor = '#eee';

            boardCells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('X', 'O');
            });
        }

        function renderBoard(boardData) {
            boardCells.forEach(cell => {
                const row = cell.dataset.row;
                const col = cell.dataset.col;
                const value = boardData[row][col];
                cell.textContent = value;
                if (value === 'X') {
                    cell.classList.add('X');
                    cell.classList.remove('O');
                } else if (value === 'O') {
                    cell.classList.add('O');
                    cell.classList.remove('X');
                } else {
                    cell.classList.remove('X', 'O');
                }
            });
        }

        function handleCellClick(event) {
            const cell = event.target;
            
            if (!cell.classList.contains('cell')) return;
            if (cell.textContent !== '') return;
            if (!gameActive) return;
            if (players === 1 && currentPlayer === 'O') return;
            if (players === 0) return;

            const row = cell.dataset.row;
            const col = cell.dataset.col;

            makeMove(parseInt(row), parseInt(col));
        }

        async function makeMove(row, col) {
            try {
                const response = await fetch('/make_move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ row: row, col: col }),
                });
                const data = await response.json();

                if (data.success) {
                    renderBoard(data.board);
                    if (data.winner) {
                        gameActive = false;
                        if (data.winner === 'draw') {
                            scores.draws++;
                            updateStatus("It's a draw!");
                        } else {
                            scores[data.winner]++;
                            updateStatus(`Player ${data.winner} wins!`);
                        }
                        updateScoreboard();
                    } else {
                        currentPlayer = data.currentPlayer;
                        updateStatus(`Player ${currentPlayer}'s turn`);
                        if (players === 1 && currentPlayer === 'O') {
                            setTimeout(() => makeComputerMove(oAiType), MOVE_DELAY_MS);
                        }
                    }
                } else {
                    updateStatus(data.message || "Invalid move!");
                    setTimeout(() => {
                        updateStatus(`Player ${currentPlayer}'s turn`);
                    }, 1000);
                }
            } catch (error) {
                console.error('Error:', error);
                updateStatus("Error making move. Please try again.");
            }
        }

        async function makeComputerMove(aiType) {
            if (!gameActive || players !== 1 || currentPlayer !== 'O') return;

            try {
                const response = await fetch('/computer_move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        player: currentPlayer,
                        ai_type: aiType
                    }),
                });
                const data = await response.json();

                if (data.success) {
                    renderBoard(data.board);
                    if (data.winner) {
                        gameActive = false;
                        if (data.winner === 'draw') {
                            scores.draws++;
                            updateStatus("It's a draw!");
                        } else {
                            scores[data.winner]++;
                            updateStatus(`Computer (${data.winner}) wins!`);
                        }
                        updateScoreboard();
                    } else {
                        currentPlayer = (currentPlayer === 'X' ? 'O' : 'X');
                        updateStatus(`Player ${currentPlayer}'s turn`);
                    }
                } else {
                    console.error("Computer move failed:", data.message);
                }
            } catch (error) {
                console.error('Error making computer move:', error);
            }
        }

        async function resetGame() {
            await resetBackendGame();
            if (players === 0) {
                gameCount = 0;
            }
            startGame();
        }

        resetButton.addEventListener('click', resetGame);
        mainMenuButton.addEventListener('click', returnToMainMenu);

        async function runZeroPlayerGame() {
            gameActive = true;
            currentPlayer = 'X';

            while (gameActive) {
                const aiType = currentPlayer === 'X' ? xAiType : oAiType;
                const aiName = aiType === 'ollama' ? 'Ollama' : 'Minimax';
                updateStatus(`${currentPlayer} (${aiName}) vs Computer (Game ${gameCount + 1}/${MAX_GAMES})`);
                await new Promise(resolve => setTimeout(resolve, MOVE_DELAY_MS));

                await makeAutomatedComputerMove(currentPlayer, aiType);
                if (!gameActive) break;

                currentPlayer = (currentPlayer === 'X' ? 'O' : 'X');
            }

            gameCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
            startGame();
        }

        async function makeAutomatedComputerMove(playerMarker, aiType) {
            if (!gameActive) return;

            document.body.classList.add('flash');
            await new Promise(resolve => setTimeout(resolve, FLASH_DURATION));
            document.body.classList.remove('flash');

            try {
                const response = await fetch('/computer_move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        player: playerMarker, 
                        auto_play: true,
                        ai_type: aiType
                    }),
                });
                const data = await response.json();

                if (data.success) {
                    renderBoard(data.board);
                    if (data.winner) {
                        gameActive = false;
                        if (data.winner === 'draw') {
                            scores.draws++;
                        } else {
                            scores[data.winner]++;
                        }
                        updateScoreboard();
                    }
                } else {
                    console.error(`Automated computer move failed for ${playerMarker}:`, data.message);
                    gameActive = false;
                }
            } catch (error) {
                console.error(`Error making automated computer move for ${playerMarker}:`, error);
                gameActive = false;
            }
        }

        boardElement.addEventListener('click', handleCellClick);

        gameContainer.style.display = 'none';
        resetButton.style.display = 'none';
        mainMenuButton.style.display = 'none';
        scoreboardElement.style.display = 'none';