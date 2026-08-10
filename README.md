# ogba

A full-stack, browser-based **Game Boy Advance emulator** with cloud save states. Load any `.gba` ROM and pick up where you left off from any device — no installation required.

![ogba screenshot](./src/assets/hero.png)

---

## Features

- **Drag-and-drop ROM loading** — drop any `.gba` file onto the loader; the ROM title and game code are parsed directly from the binary header (offsets `0xA0`–`0xB0`)
- **Cloud save states** — 3 save slots per game, persisted to PostgreSQL and synced across devices
- **Google sign-in** — OAuth2 authentication via a custom serverless JWT flow; no third-party session management
- **Full keyboard controls** — arrows, Z/X (B/A), Enter (Start), Backspace (Select), Q/E (L/R)
- **Mobile touch controls** — D-pad, A/B, Select/Start, and L/R shoulder buttons built with the Pointer Events API (`setPointerCapture` for reliable input even when fingers drift)
- **Pause / resume** — pause overlay directly on the game canvas
- **Volume control** — mute toggle and slider, persisted across sessions
- **Responsive layout** — sidebar on desktop; slide-up save drawer + FAB on mobile

---
