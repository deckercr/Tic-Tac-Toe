// Game state variables
let currentPlayer = 'X'; // Tracks whose turn it is
let gameActive = true; // True if the game is currently ongoing
let players = null; // Stores the number of human players (0, 1, or 2)
let gameCount = 0; // Tracks the number of games played in AI vs AI mode
let xAiType = 'minimax'; // AI type for player X ('minimax' or 'ollama')
let oAiType = 'minimax'; // AI type for player O ('minimax' or 'ollama')
const MAX_GAMES = 50; // Maximum games for AI vs AI auto-play
const FLASH_DURATION = 50; // Duration of the body flash effect in ms
const MOVE_DELAY_MS = 500; // Delay between AI moves in ms

// Scores object to keep track of wins and draws
let scores = {
    X: 0,
    O: 0,
    draws: 0
};

// DOM element references
const statusDisplay = document.getElementById('status');
const boardCells = document.querySelectorAll('.cell'); // All 9 board cells
const resetButton = document.getElementById('reset-button');
const mainMenuButton = document.getElementById('main-menu-button');
const playerChoiceContainer = document.getElementById('player-choice-container');
const gameContainer = document.getElementById('game-container');
const boardElement = document.getElementById('board');
const scoreboardElement = document.getElementById('scoreboard');

/**
 * Sets up the game mode based on the number of players and AI types.
 * @param {number} numPlayers - 0 for AI vs AI, 1 for Human vs AI, 2 for Human vs Human.
 * @param {string} [xAi='minimax'] - AI type for player X if applicable ('minimax' or 'ollama').
 * @param {string} [oAi='minimax'] - AI type for player O if applicable ('minimax' or 'ollama').
 */
function setPlayers(numPlayers, xAi = 'minimax', oAi = 'minimax') {
    players = numPlayers;
    xAiType = xAi;
    oAiType = oAi;
    
    // Toggle visibility of game sections
    playerChoiceContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    resetButton.style.display = 'inline-block';
    mainMenuButton.style.display = 'inline-block';
    
    gameCount = 0; // Reset game count for new mode
    scores = { X: 0, O: 0, draws: 0 }; // Reset scores
    updateScoreboard(); // Update scoreboard display
    
    startGame(); // Begin the game
}

/**
 * Initializes a new game or continues an AI vs AI series.
 * Handles initial setup, status display, and triggers AI moves if necessary.
 * @returns {Promise<void>}
 */
async function startGame() {
    gameActive = true; // Set game to active
    currentPlayer = 'X'; // X always starts
    updateStatus(`Player ${currentPlayer}'s turn`); // Update status message
    await resetBoardUI(); // Reset the visual board

    if (players === 0) { // AI vs AI mode
        if (gameCount < MAX_GAMES) {
            updateStatus(`Computer vs. Computer (Game ${gameCount + 1}/${MAX_GAMES})`);
            await resetBackendGame(); // Reset the game state on the server
            await runZeroPlayerGame(); // Start the automated AI game sequence
        } else {
            // All AI vs AI games finished
            updateStatus("A strange game. The only winning move is not to play.");
            // Clear the board visually
            boardCells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('X', 'O');
            });
        }
    } else { // Human vs AI or Human vs Human
        // If it's Human vs AI and O's turn (meaning X is human),
        // and X has already made their move (handled by backend),
        // then the AI (O) should make its move after a delay.
        if (players === 1 && currentPlayer === 'O') {
            setTimeout(() => makeComputerMove(oAiType), MOVE_DELAY_MS);
        }
    }
}

/**
 * Sends a request to the backend to reset the game board.
 * @returns {Promise<boolean>} - True if reset was successful, false otherwise.
 */
async function resetBackendGame() {
    try {
        const response = await fetch('/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
            renderBoard(data.board); // Update UI with the empty board from backend
        }
        return data.success;
    } catch (error) {
        console.error('Error resetting backend game:', error);
        return false;
    }
}

/**
 * Updates the text content of the status display element.
 * @param {string} message - The message to display.
 */
function updateStatus(message) {
    statusDisplay.textContent = message;
}

/**
 * Updates the scoreboard display with current scores for X, O, and draws.
 * Adjusts labels based on the current game mode (human/AI).
 */
function updateScoreboard() {
    // Determine labels for players based on game mode
    const xLabel = players === 1 ? 'You (X)' : players === 2 ? 'Player X' : `X (${xAiType})`;
    const oLabel = players === 1 ? `AI (O)` : players === 2 ? 'Player O' : `O (${oAiType})`;
    
    // Update inner HTML of the scoreboard
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
    scoreboardElement.style.display = 'flex'; // Make scoreboard visible
}

/**
 * Hides the game interface and displays the main menu.
 * Resets all game-related state variables.
 */
function returnToMainMenu() {
    gameContainer.style.display = 'none';
    playerChoiceContainer.style.display = 'block';
    resetButton.style.display = 'none';
    mainMenuButton.style.display = 'none';
    scoreboardElement.style.display = 'none';
    
    gameActive = false; // Stop any ongoing game logic
    players = null; // Clear player count
    gameCount = 0; // Reset game count
    scores = { X: 0, O: 0, draws: 0 }; // Reset scores
    
    // Reset board appearance
    boardElement.style.border = '2px solid #333';
    boardElement.style.backgroundColor = '#eee';
}

/**
 * Resets the visual state of the board cells (clears text, removes X/O classes).
 * @returns {Promise<void>}
 */
async function resetBoardUI() {
    // Reset board styling
    boardElement.style.border = '2px solid #333';
    boardElement.style.backgroundColor = '#eee';

    // Clear each cell's content and classes
    boardCells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('X', 'O');
    });
}

/**
 * Renders the Tic-Tac-Toe board based on the data received from the backend.
 * @param {Array<Array<string>>} boardData - A 2D array representing the board state.
 */
function renderBoard(boardData) {
    boardCells.forEach(cell => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        const value = boardData[row][col]; // Get value from backend board data
        cell.textContent = value; // Update cell text
        
        // Add/remove X/O classes for styling
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

/**
 * Handles a click event on a board cell.
 * Validates the click before attempting to make a move.
 * @param {Event} event - The click event object.
 */
function handleCellClick(event) {
    const cell = event.target;
    
    // Guard clauses for invalid clicks
    if (!cell.classList.contains('cell')) return; // Not a cell element
    if (cell.textContent !== '') return; // Cell already taken
    if (!gameActive) return; // Game is not active
    if (players === 1 && currentPlayer === 'O') return; // Human vs AI, and it's AI's turn
    if (players === 0) return; // AI vs AI mode, no human input

    const row = cell.dataset.row;
    const col = cell.dataset.col;

    makeMove(parseInt(row), parseInt(col)); // Process the move
}

/**
 * Sends a player's move to the backend and updates the UI based on the response.
 * @param {number} row - The row index of the move.
 * @param {number} col - The column index of the move.
 * @returns {Promise<void>}
 */
async function makeMove(row, col) {
    try {
        const response = await fetch('/make_move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row: row, col: col }),
        });
        const data = await response.json();

        if (data.success) {
            renderBoard(data.board); // Update UI with new board state
            if (data.winner) { // Game has ended
                gameActive = false; // Deactivate game
                if (data.winner === 'draw') {
                    scores.draws++;
                    updateStatus("It's a draw!");
                } else {
                    scores[data.winner]++;
                    updateStatus(`Player ${data.winner} wins!`);
                }
                updateScoreboard(); // Update scoreboard
            } else {
                currentPlayer = data.currentPlayer; // Switch current player
                updateStatus(`Player ${currentPlayer}'s turn`);
                if (players === 1 && currentPlayer === 'O') {
                    // If Human vs AI and it's AI's turn, trigger AI move after a delay
                    setTimeout(() => makeComputerMove(oAiType), MOVE_DELAY_MS);
                }
            }
        } else {
            // Invalid move (e.g., cell already taken)
            updateStatus(data.message || "Invalid move!");
            setTimeout(() => {
                updateStatus(`Player ${currentPlayer}'s turn`); // Revert status after a brief message
            }, 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        updateStatus("Error making move. Please try again.");
    }
}

/**
 * Triggers an AI move for the current player in Human vs AI mode.
 * @param {string} aiType - The type of AI to use ('minimax' or 'ollama').
 * @returns {Promise<void>}
 */
async function makeComputerMove(aiType) {
    // Guard clauses
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
            renderBoard(data.board); // Update UI
            if (data.winner) { // Game has ended
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
                currentPlayer = (currentPlayer === 'X' ? 'O' : 'X'); // Switch player
                updateStatus(`Player ${currentPlayer}'s turn`);
            }
        } else {
            console.error("Computer move failed:", data.message);
        }
    } catch (error) {
        console.error('Error making computer move:', error);
    }
}

/**
 * Resets the game to start a new round, either for human play or to restart an AI vs AI series.
 * @returns {Promise<void>}
 */
async function resetGame() {
    await resetBackendGame(); // Reset backend board
    if (players === 0) {
        gameCount = 0; // If AI vs AI, reset game count
    }
    startGame(); // Start a new game
}

// Event listeners for buttons
resetButton.addEventListener('click', resetGame);
mainMenuButton.addEventListener('click', returnToMainMenu);

/**
 * Runs an automated sequence of games for AI vs AI mode.
 * Makes moves for both X and O AI players until a game ends or maximum games are reached.
 * @returns {Promise<void>}
 */
async function runZeroPlayerGame() {
    gameActive = true;
    currentPlayer = 'X';

    while (gameActive) {
        // Determine AI type for the current player
        const aiType = currentPlayer === 'X' ? xAiType : oAiType;
        const aiName = aiType === 'ollama' ? 'Ollama' : 'Minimax';
        updateStatus(`${currentPlayer} (${aiName}) vs Computer (Game ${gameCount + 1}/${MAX_GAMES})`);
        
        await new Promise(resolve => setTimeout(resolve, MOVE_DELAY_MS)); // Delay between moves

        await makeAutomatedComputerMove(currentPlayer, aiType); // Trigger AI move
        if (!gameActive) break; // Exit loop if game ended

        currentPlayer = (currentPlayer === 'X' ? 'O' : 'X'); // Switch player
    }

    gameCount++; // Increment game count after a game finishes
    await new Promise(resolve => setTimeout(resolve, 500)); // Short pause before starting next game
    startGame(); // Start the next game in the series
}

/**
 * Makes an automated computer move for AI vs AI mode, including a visual flash effect.
 * @param {string} playerMarker - The marker of the player making the move ('X' or 'O').
 * @param {string} aiType - The type of AI to use ('minimax' or 'ollama').
 * @returns {Promise<void>}
 */
async function makeAutomatedComputerMove(playerMarker, aiType) {
    if (!gameActive) return;

    // Visual flash effect on the body
    document.body.classList.add('flash');
    await new Promise(resolve => setTimeout(resolve, FLASH_DURATION));
    document.body.classList.remove('flash');

    try {
        const response = await fetch('/computer_move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                player: playerMarker, 
                auto_play: true, // Indicate automated play
                ai_type: aiType
            }),
        });
        const data = await response.json();

        if (data.success) {
            renderBoard(data.board); // Update UI
            if (data.winner) { // Game has ended
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
            gameActive = false; // Stop game if error occurs
        }
    } catch (error) {
        console.error(`Error making automated computer move for ${playerMarker}:`, error);
        gameActive = false; // Stop game if error occurs
    }
}

// Add event listener to the board for cell clicks
boardElement.addEventListener('click', handleCellClick);

// Initial state: hide game elements and show player choice
gameContainer.style.display = 'none';
resetButton.style.display = 'none';
mainMenuButton.style.display = 'none';
scoreboardElement.style.display = 'none';