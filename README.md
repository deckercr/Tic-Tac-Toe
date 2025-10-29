# 🎮 Tic-Tac-Toe AI Battle Arena

<div align="center">

![Tic-Tac-Toe Banner](https://img.shields.io/badge/Game-Tic--Tac--Toe-blueviolet?style=for-the-badge&logo=gamepad)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-green?style=for-the-badge&logo=flask)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A modern Tic-Tac-Toe game featuring multiple AI opponents including Minimax algorithm and LLM-powered AI via Ollama/Open WebUI**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Game Modes](#-game-modes) • [AI Strategies](#-ai-strategies)

</div>

---

## ✨ Features

- 🤖 **Multiple AI Types**: Battle against perfect Minimax AI or unpredictable Ollama LLM
- 👥 **Flexible Game Modes**: Human vs AI, Human vs Human, or AI vs AI spectator mode
- 📊 **Live Scoreboard**: Track wins, losses, and draws across multiple games
- 🎨 **Beautiful UI**: Gradient backgrounds and smooth animations
- ⚡ **Auto-Play Mode**: Watch AI opponents battle it out in rapid succession (up to 50 games)
- 🔄 **Real-time Updates**: Instant board updates with visual feedback
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🎬 Demo

### Game Modes Available

| Mode | Description |
|------|-------------|
| **Human vs Minimax** | Test your skills against an unbeatable algorithm |
| **Human vs Ollama** | Play against an LLM-powered AI with personality |
| **2 Players** | Classic local multiplayer |
| **AI Battle Royale** | Watch Minimax vs Ollama or Ollama vs Ollama (50 games) |

### Visual Features

```
┌─────────────────────────────────┐
│  🏆 Scoreboard                  │
│  You (X): 12 | AI (O): 8 | ⚖️: 5│
├─────────────────────────────────┤
│                                 │
│     X  │  O  │                  │
│    ────┼─────┼────              │
│     O  │  X  │  O               │
│    ────┼─────┼────              │
│        │  X  │                  │
│                                 │
└─────────────────────────────────┘
```

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- (Optional) Ollama with Open WebUI for LLM-powered AI

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tictactoe-ai-arena.git
cd tictactoe-ai-arena
```

2. **Install dependencies**
```bash
pip install flask requests python-dotenv
```

3. **Configure environment (Optional for Ollama AI)**
```bash
cp .env.example .env
# Edit .env with your settings:
# WEBUI_URL=http://your-openwebui-url:3000/api/chat/completions
# OLLAMA_MODEL=gpt-oss:20b
# WEBUI_API_KEY=your-api-key
```

4. **Run the application**
```bash
python app.py
```

5. **Open your browser**
```
Navigate to http://localhost:5000
```

## 🎮 Usage

### Starting a Game

1. Launch the application and select your preferred game mode
2. For human vs AI modes, you play as **X** and go first
3. Click any empty cell to make your move
4. The scoreboard tracks your performance across multiple rounds
5. Use "Play Again" to start a new round or "Main Menu" to change modes

### Environment Variables

Create a `.env` file in the root directory:

```env
WEBUI_URL=http://10.0.0.5:3000/api/chat/completions
OLLAMA_MODEL=gpt-oss:20b
WEBUI_API_KEY=sk-your-api-key-here
```

| Variable | Description | Default |
|----------|-------------|---------|
| `WEBUI_URL` | Open WebUI API endpoint | `http://localhost:3000/api/chat/completions` |
| `OLLAMA_MODEL` | Ollama model name | `gpt-oss:20b` |
| `WEBUI_API_KEY` | API authentication key | (empty) |

## 🎯 Game Modes

### 1. Human vs AI

Choose between two AI opponents:
- **Minimax AI**: Uses the minimax algorithm with perfect play
- **Ollama AI**: LLM-powered AI with strategic reasoning

### 2. Human vs Human

Classic local multiplayer mode for two players sharing the same device.

### 3. AI vs AI (Spectator Mode)

Watch AI opponents battle each other:
- **Minimax vs Minimax**: Perfect play results in draws
- **Ollama vs Minimax**: Strategy vs unpredictability
- **Ollama vs Ollama**: Pure LLM battle with varying outcomes

Automatically plays up to 50 games with running statistics!

## 🧠 AI Strategies

### Minimax Algorithm

The Minimax AI uses game theory to play perfectly:
- Evaluates all possible game states
- Assumes optimal play from opponent
- Guarantees a draw or win (never loses)
- Computational complexity: O(b^d) where b=branching factor, d=depth

```python
def minimax(board, player, is_maximizing):
    # Base cases: win, lose, or draw
    if winner: return score
    
    # Recursive case: evaluate all moves
    best_score = -∞ if maximizing else +∞
    for each empty cell:
        simulate move
        score = minimax(new_board, opponent, !is_maximizing)
        update best_score
    return best_score
```

### Ollama LLM AI

The LLM-powered AI uses natural language reasoning:
- Receives board state and strategy instructions
- Evaluates positions using trained knowledge
- May exhibit creative or unexpected play
- Performance depends on model quality and prompting

**Strategy Hierarchy:**
1. Win if possible
2. Block opponent's winning move
3. Take center square
4. Take corner square
5. Take edge square

## 🏗️ Project Structure

```
tictactoe-ai-arena/
│
├── app.py                 # Flask backend and AI logic
├── .env                   # Environment configuration (not in repo)
├── .gitignore            # Git ignore rules
│
├── templates/
│   └── index.html        # Main HTML template
│
└── static/
    ├── style.css         # Styling and animations
    └── script.js         # Frontend game logic
```

## 🔧 Technical Details

### Backend (Flask)

- **Framework**: Flask web framework
- **AI Implementations**: 
  - Minimax with alpha-beta considerations
  - Ollama integration via Open WebUI API
- **Game State Management**: Server-side board state
- **API Endpoints**: `/make_move`, `/computer_move`, `/reset`

### Frontend

- **Vanilla JavaScript**: No frameworks, pure JS
- **CSS Grid**: Responsive board layout
- **Fetch API**: Asynchronous communication with backend
- **Visual Feedback**: Hover effects, animations, and score tracking

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- Add difficulty levels for AI
- Implement online multiplayer
- Add different board sizes (4x4, 5x5)
- Create AI training mode with hints
- Add sound effects and music
- Implement game replay feature

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Minimax algorithm based on classic game theory
- Ollama integration for LLM capabilities
- Flask for elegant Python web framework
- The open-source community

---

<div align="center">

**Made with ❤️ by developers who love games**

⭐ Star this repo if you enjoyed playing!

[Report Bug](https://github.com/yourusername/tictactoe-ai-arena/issues) • [Request Feature](https://github.com/yourusername/tictactoe-ai-arena/issues)

</div>
