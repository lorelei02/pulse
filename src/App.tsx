import { useEffect, useState } from "react";
import { MediaController } from "./components/MediaController";
import {
  loginWithSpotify,
  handleSpotifyCallback,
  getSpotifyToken,
  getCurrentTrack,
} from "./spotify";

export default function App() {
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState<any>(null);

  useEffect(() => {
    async function connectSpotify() {
      try {
        const token = await handleSpotifyCallback();

        if (token || getSpotifyToken()) {
          setIsSpotifyConnected(true);
          console.log("Spotify connected!");

          const currentTrack = await getCurrentTrack();
          console.log(currentTrack);

          setSpotifyTrack(currentTrack);
        }
      } catch (error) {
        console.error(error);
      }
    }

    connectSpotify();
  }, []);

  return (
    <main className="app-shell">
      <div className="wallpaper-glow" />
      <div className="wallpaper-grid" />

      <button
        onClick={loginWithSpotify}
        disabled={isSpotifyConnected}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 20,
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.2)",
          background: isSpotifyConnected ? "#1DB954" : "rgba(255,255,255,0.1)",
          color: "white",
          cursor: isSpotifyConnected ? "default" : "pointer",
        }}
      >
        {isSpotifyConnected ? "Spotify Connected" : "Connect Spotify"}
      </button>

      {spotifyTrack?.item && (
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 24,
            zIndex: 20,
            color: "white",
            textAlign: "right",
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          <strong>{spotifyTrack.item.name}</strong>
          <br />
          {spotifyTrack.item.artists?.[0]?.name}
        </div>
      )}

      <section className="demo-stage">
        <MediaController spotifyTrack={spotifyTrack} />
      </section>
    </main>
  );
}