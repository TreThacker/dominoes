# 🁣 Dominoes

**Dominoes** is a browser-based domino game created by **Tre Thacker**.

![Version](https://img.shields.io/badge/version-1.00-blue)
![Built With](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20JavaScript-orange)
![Status](https://img.shields.io/badge/status-release--ready-brightgreen)

---

## 🎮 Overview

Dominoes is a polished browser game built with plain **HTML**, **CSS**, and **JavaScript**. Version 1.00 combines **Base (Block) Dominoes**, **Cross Dominoes**, and **All Fives scoring** into one complete playable game.

The game includes AI opponents, local save data, backup tools, responsive board layout, theme selection, admin testing tools, and a full in-game Help system.

---

## ✨ Features

### 🧩 Gameplay
- 2 to 4 player setup
- Human player vs AI players
- Custom player name
- Automatic turn handling
- Draw and pass system
- Automatic round/game ending
- Persistent game log

### 🁣 Domino Rules
- Base (Block) Game foundation
- Cross Dominoes spinner layout
- All Fives scoring
- Doublet handling
- Branch selection from spinner
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
- Full Help window
- Admin tools
- Sandbox testing tools
- Segment alignment tool

---

## 🏆 Active Rule Set

Version 1.00 currently uses:

| Rule / Variation | Status |
|---|---|
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
|---|---|
| Drag Bone | Drag a domino from your hand to the board |
| Draw | Draw from the boneyard when no playable bone is available |
| Pass | Pass only when no play is available and the boneyard is empty |
| Gear Button | Opens Options |
| Help | Opens the full rule/help guide |
| Admin | Opens backup and testing tools |

---

## 🧪 Admin & Testing Tools

The Admin window includes tools for managing game data and testing board layout.

### Backup Tools
- **Export** saves the current game state to a backup file.
- **Import** restores a previously exported backup file.
- **Share** uses device sharing when available or copies backup data to the clipboard.

### Testing Tools
- **Sandbox Mode** helps test game behavior without normal AI flow.
- **Segment Alignment** allows board branch alignment adjustments.
- These tools are intended for development and testing, not normal gameplay.

---

## 📁 Project Structure

| File | Purpose |
|--------|--------|
| `index.html` | Main application page |
| `styles.css` | Game styling and themes |
| `app.js` | Game logic |
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

Game progress is saved locally using `IndexedDB`.

Saved data may be affected by:

- Clearing browser data
- Private/Incognito browsing
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
- Advanced Alignment Presets and Editing Tools

---

## 🛠️ Built With

- HTML
- CSS
- JavaScript
- IndexedDB

No external game framework is required.

---

## 👤 Credits

Created by **Tre Thacker**.

---

## 📌 Version

Current Release: **Version 1.00**		