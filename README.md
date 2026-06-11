# Pulse

Pulse is a floating desktop Spotify companion built with React, TypeScript, Electron, and the Spotify Web API.

## Features

* Spotify OAuth login
* Live currently playing track
* Album artwork display
* Dynamic album-color accent glow
* Animated circular progress ring
* Floating always-on-top desktop widget
* Play, pause, next and previous controls
* Track change notifications
* Electron desktop application

## Tech Stack

* React
* TypeScript
* Vite
* Electron
* Spotify Web API

### Demo

![Pulse Demo](screenshots/pulse-gif.gif)

## Screenshots

### Collapsed Widget

![Pulse Collapsed](screenshots/pulse-collapsed.png)

### Expanded Widget

![Pulse Expanded](screenshots/pulse-expanded.png)

## Installation

```bash
npm install
npm run electron
```

## Spotify Setup

Create a Spotify Developer application and add:

```text
http://127.0.0.1:5173/callback
```

as a Redirect URI.

Create a `.env` file:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
```

## Notes

* Spotify Premium is required for playback controls.
* Spotify Developer Mode requires users to be added to the application's allowlist.

## Future Improvements

* System tray integration
* Launch on startup
* Multi-service music support
* Better visualizer effects

## Author

Millan Bell
