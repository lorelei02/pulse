import { useEffect, useState } from "react";
import { MediaController } from "./components/PulseWidget";
import {
  loginWithSpotify,
  handleSpotifyCallback,
  getSpotifyToken,
  getCurrentTrack,
  clearSpotifySession,
} from "./spotify";

export default function App() {
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [spotifyError, setSpotifyError] = useState("");
  const [spotifyTrack, setSpotifyTrack] = useState<any>(null);

  useEffect(() => {
    async function setupSpotify() {
      try {
        const token = await handleSpotifyCallback();

        if (token || getSpotifyToken()) {
          setIsSpotifyConnected(true);
          setSpotifyError("");

          const currentTrack = await getCurrentTrack();
          setSpotifyTrack(currentTrack);
        }
      } catch (error) {
        console.error(error);

        clearSpotifySession();
        setSpotifyTrack(null);
        setIsSpotifyConnected(false);
        setSpotifyError("Spotify session expired. Please reconnect.");
      } finally {
        setIsConnecting(false);
      }
    }

    setupSpotify();
  }, []);

  useEffect(() => {
    if (!isSpotifyConnected) return;

    const interval = setInterval(async () => {
      try {
        const currentTrack = await getCurrentTrack();

        setSpotifyTrack(currentTrack);
        setSpotifyError("");
      } catch (error) {
        console.error(error);

        clearSpotifySession();
        setSpotifyTrack(null);
        setIsSpotifyConnected(false);
        setSpotifyError("Spotify session expired. Please reconnect.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSpotifyConnected]);

  const handleConnectSpotify = async () => {
    try {
      clearSpotifySession();
      setSpotifyError("");
      setIsConnecting(true);

      await loginWithSpotify();
    } catch (error) {
      console.error(error);

      setIsConnecting(false);
      setSpotifyError("Failed to connect Spotify.");
    }
  };

  return (
    <main className="app-shell">
      <div className="wallpaper-glow" />
      <div className="wallpaper-grid" />

      {!isSpotifyConnected && (
        <button
          onClick={handleConnectSpotify}
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 20,
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            cursor: "pointer",
          }}
        >
          {isConnecting ? "Connecting..." : "Connect Spotify"}
        </button>
      )}

      {spotifyError && (
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 24,
            zIndex: 20,
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(255,60,60,0.15)",
            border: "1px solid rgba(255,60,60,0.3)",
            color: "#ff8f8f",
          }}
        >
          {spotifyError}
        </div>
      )}

      <section className="demo-stage">
        <MediaController spotifyTrack={spotifyTrack} />
      </section>
    </main>
  );
}