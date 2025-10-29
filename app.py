from flask import Flask, render_template, request, jsonify
import random
import requests
import re
import os
from dotenv import load_dotenv


app = Flask(__name__)

# Configuration for Open WebUI
WEBUI_URL: str = os.getenv('WEBUI_URL', 'http://localhost:3000/api/chat/completions')
OLLAMA_MODEL: str = os.getenv('OLLAMA_MODEL', 'gpt-oss:20b')
WEBUI_API_KEY: str = os.getenv('WEBUI_API_KEY', '')

# Basic Tic-Tac-Toe board (3x3)
board = [['', '', ''], ['', '', ''], ['', '', '']]
current_player = 'X'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/reset', methods=['POST'])
def reset_game():
    global board, current_player
    board = [['', '', ''], ['', '', ''], ['', '', '']]
    current_player = 'X'
    return jsonify(success=True, board=board, currentPlayer=current_player)

@app.route('/make_move', methods=['POST'])
def make_move():
    global board, current_player
    data = request.get_json()
    row = data['row']
    col = data['col']

    if board[row][col] == '':
        board[row][col] = current_player
        winner = check_winner()
        if winner:
            return jsonify(success=True, board=board, winner=winner, currentPlayer=current_player)
        elif is_board_full():
            return jsonify(success=True, board=board, winner='draw', currentPlayer=current_player)
        else:
            current_player = 'O' if current_player == 'X' else 'X'
            return jsonify(success=True, board=board, currentPlayer=current_player)
    else:
        return jsonify(success=False, message="Invalid move, cell already taken.")

def check_winner():
    # Check rows
    for row in board:
        if row[0] == row[1] == row[2] and row[0] != '':
            return row[0]
    # Check columns
    for col in range(3):
        if board[0][col] == board[1][col] == board[2][col] and board[0][col] != '':
            return board[0][col]
    # Check diagonals
    if board[0][0] == board[1][1] == board[2][2] and board[0][0] != '':
            return board[0][0]
    if board[0][2] == board[1][1] == board[2][0] and board[0][2] != '':
            return board[0][2]
    return None

def is_board_full():
    for row in board:
        for cell in row:
            if cell == '':
                return False
    return True

# --- AI Logic ---
@app.route('/computer_move', methods=['POST'])
def computer_move_api():
    global board, current_player
    data = request.get_json()
    player_to_move = data.get('player', current_player)
    auto_play_mode = data.get('auto_play', False)
    ai_type = data.get('ai_type', 'minimax')  # 'minimax' or 'ollama'

    if not is_board_full() and not check_winner():
        if ai_type == 'ollama':
            best_move = get_ollama_move(board, player_to_move)
        else:
            best_move = find_best_move(board, player_to_move)

        if best_move and best_move != (-1, -1) and board[best_move[0]][best_move[1]] == '':
            board[best_move[0]][best_move[1]] = player_to_move
            winner = check_winner()
            if winner:
                return jsonify(success=True, board=board, winner=winner, currentPlayer=player_to_move)
            elif is_board_full():
                return jsonify(success=True, board=board, winner='draw', currentPlayer=player_to_move)
            else:
                if not auto_play_mode:
                    current_player = 'O' if player_to_move == 'X' else 'X'
                else:
                    current_player = player_to_move
                return jsonify(success=True, board=board, currentPlayer=current_player)
    return jsonify(success=False, message="No valid moves or game ended.")


def get_ollama_move(current_board, player_marker):
    """Get move from Ollama LLM via Open WebUI with better instructions and fallback."""
    opponent = 'O' if player_marker == 'X' else 'X'

    # --- Build a visual board string ---
    board_str = ""
    for i, row in enumerate(current_board):
        row_str = ""
        for j, cell in enumerate(row):
            row_str += f"[{i},{j}]" if cell == '' else f" {cell} "
            if j < 2:
                row_str += " | "
        board_str += row_str + "\n"
        if i < 2:
            board_str += "---+-----+---\n"

    # --- Get list of open moves ---
    available_moves = [f"row {i}, col {j}" for i in range(3) for j in range(3) if current_board[i][j] == '']

    # --- Build a more detailed prompt ---
    prompt = f"""
You are an expert Tic-Tac-Toe player.
You are '{player_marker}' and your opponent is '{opponent}'.

Goal: Get three of your marks in a row (horizontal, vertical, or diagonal).
If your opponent can win next turn, block them.

Current board (empty spaces shown as [row,col]):
{board_str}

Available moves: {', '.join(available_moves)}

Follow this strategy strictly:
1. If you can win in one move, take that move.
2. If the opponent can win next, block them.
3. Take the center if available.
4. Take a corner if available.
5. Otherwise, take an edge.

Example:
If the board is:
X | O | [0,2]
[1,0] | X | O
O | [2,1] | [2,2]
Then you should reply exactly:
row 2, col 2

Now, based on the above, respond with ONLY the move, in this format:
row X, col Y
"""

    try:
        headers = {"Content-Type": "application/json"}
        if WEBUI_API_KEY:
            headers["Authorization"] = f"Bearer {WEBUI_API_KEY}"

        response = requests.post(
            WEBUI_URL,
            headers=headers,
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 50,
            },
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()
            text = result["choices"][0]["message"]["content"].strip()
            print(f"Ollama raw response: {text}")

            # Extract move coordinates
            row_match = re.search(r"row\s*(\d+)", text.lower())
            col_match = re.search(r"col\s*(\d+)", text.lower())

            if row_match and col_match:
                row, col = int(row_match.group(1)), int(col_match.group(1))
                if 0 <= row <= 2 and 0 <= col <= 2 and current_board[row][col] == "":
                    print(f"Ollama move: row {row}, col {col} ✅")
                    return (row, col)

            # --- If invalid output, fallback ---
            print(f"⚠️ Invalid Ollama response '{text}', falling back to minimax.")
            return find_best_move(current_board, player_marker)

        else:
            print(f"WebUI request failed: {response.status_code} - {response.text}")
            return find_best_move(current_board, player_marker)

    except Exception as e:
        print(f"Error calling Ollama via WebUI: {e}")
        return find_best_move(current_board, player_marker)


def get_random_move(current_board):
    """Get a random valid move as fallback."""
    available = []
    for i in range(3):
        for j in range(3):
            if current_board[i][j] == '':
                available.append((i, j))
    return random.choice(available) if available else (-1, -1)


def find_best_move(current_board, player_marker):
    """Find the best move using minimax algorithm."""
    opponent = 'O' if player_marker == 'X' else 'X'
    best_val = -float('inf')
    best_moves = []

    for i in range(3):
        for j in range(3):
            if current_board[i][j] == '':
                temp_board = [row[:] for row in current_board]
                temp_board[i][j] = player_marker
                
                winner = check_winner_for_board(temp_board)
                if winner == player_marker:
                    move_val = 10
                elif winner is not None:
                    move_val = -10
                elif is_board_full_check(temp_board):
                    move_val = 0
                else:
                    move_val = minimax(temp_board, player_marker, opponent, False)
                
                if move_val > best_val:
                    best_val = move_val
                    best_moves = [(i, j)]
                elif move_val == best_val:
                    best_moves.append((i, j))
    
    return random.choice(best_moves) if best_moves else (-1, -1)


def minimax(current_board, max_player, current_player, is_maximizing):
    """Minimax algorithm."""
    winner = check_winner_for_board(current_board)
    if winner == max_player:
        return 10
    elif winner is not None:
        return -10
    elif is_board_full_check(current_board):
        return 0
    
    opponent = 'O' if current_player == 'X' else 'X'
    
    if is_maximizing:
        max_eval = -float('inf')
        for i in range(3):
            for j in range(3):
                if current_board[i][j] == '':
                    temp_board = [row[:] for row in current_board]
                    temp_board[i][j] = current_player
                    eval_score = minimax(temp_board, max_player, opponent, False)
                    max_eval = max(max_eval, eval_score)
        return max_eval
    else:
        min_eval = float('inf')
        for i in range(3):
            for j in range(3):
                if current_board[i][j] == '':
                    temp_board = [row[:] for row in current_board]
                    temp_board[i][j] = current_player
                    eval_score = minimax(temp_board, max_player, opponent, True)
                    min_eval = min(min_eval, eval_score)
        return min_eval


def check_winner_for_board(board_state):
    """Check winner for a specific board state."""
    for row in board_state:
        if row[0] == row[1] == row[2] and row[0] != '':
            return row[0]
    for col in range(3):
        if board_state[0][col] == board_state[1][col] == board_state[2][col] and board_state[0][col] != '':
            return board_state[0][col]
    if board_state[0][0] == board_state[1][1] == board_state[2][2] and board_state[0][0] != '':
        return board_state[0][0]
    if board_state[0][2] == board_state[1][1] == board_state[2][0] and board_state[0][2] != '':
        return board_state[0][2]
    return None


def is_board_full_check(board_state):
    """Check if board is full."""
    for row in board_state:
        for cell in row:
            if cell == '':
                return False
    return True


if __name__ == '__main__':
    app.run(debug=True)