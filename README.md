<h1 align="center">🁣 Dominoes 🁣</h1>

<p align="center">
A browser-based Dominoes game by Tre Thacker
</p>

<p align="center">

![Version](https://img.shields.io/badge/version-1.00-blue)
![Built With](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20JavaScript-orange)
![Status](https://img.shields.io/badge/status-release--ready-brightgreen)

</p>

---

## 🎮 Overview

**Dominoes** is a browser-based domino game built with plain HTML, CSS, and JavaScript.

Version 1.00 combines **Base (Block) Dominoes**, **Cross Dominoes**, and **All Fives scoring** into a complete playable experience featuring AI opponents, local save data, backup tools, theme selection, admin utilities, testing tools, and a comprehensive in-game Help system.

---

## ✨ Features

### 🧩 Gameplay

- 2 to 4 player setup
- Human player vs AI players
- Custom player name
- Automatic turn handling
- Draw and pass system
- Automatic round and game completion
- Persistent game log

### 🁣 Domino Rules

- Base (Block) Dominoes
- Cross Dominoes spinner layout
- All Fives scoring
- Doublet support
- Spinner branch selection
- Automatic valid-placement highlighting

### 💾 Save & Backup

- IndexedDB local save system
- Export backup
- Import backup
- Share backup
- Restore after browser refresh

### 🎨 Interface

- Responsive board layout
- Theme selector
- About window
- Full Help system
- Admin tools
- Sandbox testing tools
- Segment alignment tool

---

## 🏆 Active Rule Set

Version 1.00 currently includes:

| Rule / Variation | Status |
| --- | --- |
| Base (Block) Game | Active |
| Cross Dominoes | Active |
| All Fives | Active |
| All Fives & Threes | Coming Soon |
| Double Nine Cross | Coming Soon |
| Double Twelve | Coming Soon |
| More Bones | Coming Soon |

---

## 🕹️ Controls

| Action | Description |
| --- | --- |
| Drag Bone | Drag a domino from your hand to the board |
| Draw | Draw from the boneyard when no playable bone is available |
| Pass | Pass when no play is available and the boneyard is empty |
| Gear Button | Opens the Options window |
| Help | Opens the complete rules and help guide |
| Admin | Opens backup and testing tools |

---

## 🧪 Admin & Testing Tools

### Backup Tools

- Export saves the current game state to a backup file.
- Import restores a previously exported backup file.
- Share uses device sharing when available or copies backup data to the clipboard.

### Testing Tools

- Sandbox Mode
- Segment Alignment Tool
- Branch alignment testing
- AI turn control testing
- Human turn testing
- Full test hand support

Testing tools are intended for development and troubleshooting and are not part of standard gameplay.

---

## 📁 Project Structure

| File | Purpose |
| --- | --- |
| `index.html` | Main application page |
| `styles.css` | Styling, themes, layout, and responsive design |
| `app.js` | Core game logic |
| `manifest.json` | Progressive Web App configuration |
| `favicon.ico` | Browser favicon |
| `/image/icon/` | Application icons |

### Included Icons

- `icon-16.png` (16×16)
- `icon-32.png` (32×32)
- `icon-180.png` (180×180)
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

---

## 💽 Local Save Data

Game progress is stored locally using **IndexedDB**.

Saved data may be affected by:

- Clearing browser data
- Private / Incognito browsing
- Switching browsers
- Switching devices

Use **Export Backup** before clearing browser data or moving to another device.

---

## 🚧 Future Version Ideas

Planned or possible future enhancements include:

### 🎚️ Difficulty Options

- Draw Until It Plays
- Domino Laid = Domino Played
- Player Pip Count Display

### 🤖 AI

- AI Difficulty Selector
- Improved AI Branch Strategy

### 🎉 Stingers & Rewards

- Domino Stinger
- Round Win Stinger
- Game Win Stinger
- Achievement Notifications
- Reward Unlock Notifications

### 📊 Progression

- Statistics
- Achievements
- Rewards

### 🎨 Expansion

- Theme Expansion
- Sound System
- Additional Domino Variations
- Additional Domino Sets
- Advanced Alignment Presets
- Domino/Segment Alignment Editing Tools

---

## 🗺️ Roadmap

### Version 1.00

- ✅ Base (Block) Dominoes
- ✅ Cross Dominoes
- ✅ All Fives Scoring
- ✅ AI Opponents
- ✅ Backup System
- ✅ Help System
- ✅ About Window
- ✅ Admin Tools
- ✅ Sandbox Tools
- ✅ Alignment Tools

### Future Versions

- ⏳ AI Difficulty Levels
- ⏳ Statistics
- ⏳ Achievements
- ⏳ Rewards
- ⏳ Sound System
- ⏳ Theme Expansion
- ⏳ Additional Variations
- ⏳ Additional Domino Sets
- ⏳ Advanced Alignment Presets

---

## 🛠️ Built With

- HTML
- CSS
- JavaScript
- IndexedDB

No external frameworks are required.

---

## 👤 Credits

Created by **Tre Thacker**.

---

## 📄 License

TreThacker 2026

---

## 📌 Version

Current Release: **Version 1.00**
