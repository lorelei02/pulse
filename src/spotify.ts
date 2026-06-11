// ==============================
// Config
// ==============================

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = "http://127.0.0.1:5173/callback";

const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

// ==============================
// Auth helpers
// ==============================

function generateRandomString(length: number) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const values = crypto.getRandomValues(new Uint8Array(length));

  return values.reduce((acc, x) => {
    return acc + possible[x % possible.length];
  }, "");
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);

  return await crypto.subtle.digest("SHA-256", data);
}

function base64encode(input: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// ==============================
// Login
// ==============================

export async function loginWithSpotify() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  localStorage.setItem("spotify_code_verifier", codeVerifier);

  const authUrl = new URL("https://accounts.spotify.com/authorize");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("show_dialog", "true");

  window.location.href = authUrl.toString();
}

// ==============================
// Callback handler
// ==============================

export async function handleSpotifyCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (!code) return null;

  const codeVerifier = localStorage.getItem("spotify_code_verifier");

  if (!codeVerifier) {
    throw new Error("Missing Spotify code verifier");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();

  localStorage.setItem("spotify_access_token", data.access_token);

  if (data.refresh_token) {
    localStorage.setItem("spotify_refresh_token", data.refresh_token);
  }

  localStorage.setItem(
    "spotify_expires_at",
    String(Date.now() + data.expires_in * 1000)
  );

  window.history.replaceState({}, document.title, "/");

  return data.access_token;
}

// ==============================
// Token helpers
// ==============================

export function getSpotifyToken() {
  return localStorage.getItem("spotify_access_token");
}

export async function refreshSpotifyToken() {
  const refreshToken = localStorage.getItem("spotify_refresh_token");

  if (!refreshToken) {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_expires_at");
    throw new Error("No Spotify refresh token found. Please reconnect Spotify.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Spotify token");
  }

  const data = await response.json();

  localStorage.setItem("spotify_access_token", data.access_token);

  if (data.refresh_token) {
    localStorage.setItem("spotify_refresh_token", data.refresh_token);
  }

  localStorage.setItem(
    "spotify_expires_at",
    String(Date.now() + data.expires_in * 1000)
  );

  return data.access_token;
}

async function getValidSpotifyToken() {
  const token = getSpotifyToken();
  const expiresAt = Number(localStorage.getItem("spotify_expires_at"));

  if (!token) {
    throw new Error("No Spotify access token found");
  }

  if (!expiresAt || Date.now() > expiresAt - 60_000) {
    return await refreshSpotifyToken();
  }

  return token;
}

// ==============================
// Track getter
// ==============================

export async function getCurrentTrack() {
  const token = await getValidSpotifyToken();

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    console.error("Current track failed:", response.status, await response.text());
    return null;
  }

  return await response.json();
}

// ==============================
// Playback controls
// ==============================

export async function playSpotify() {
  const token = await getValidSpotifyToken();

  const response = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Play failed:", response.status, await response.text());
  }
}

export function clearSpotifySession() {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  localStorage.removeItem("spotify_expires_at");
  localStorage.removeItem("spotify_code_verifier");
}

export async function pauseSpotify() {
  const token = await getValidSpotifyToken();

  const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Pause failed:", response.status, await response.text());
  }
}

export async function nextSpotifyTrack() {
  const token = await getValidSpotifyToken();

  const response = await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Next failed:", response.status, await response.text());
  }
}

export async function previousSpotifyTrack() {
  const token = await getValidSpotifyToken();

  const response = await fetch("https://api.spotify.com/v1/me/player/previous", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Previous failed:", response.status, await response.text());
  }

  
}