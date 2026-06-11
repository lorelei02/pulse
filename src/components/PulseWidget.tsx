import { useEffect, useState, useRef } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Shuffle,
  BarChart3,
} from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import {
  playSpotify,
  pauseSpotify,
  nextSpotifyTrack,
  previousSpotifyTrack,
} from "../spotify";
import { formatTime } from "../utils/formatTime";
import PulseLogo from "./PulseLogo";

type MediaControllerProps = {
  spotifyTrack: any;
};

function extractAccentColor(
  imageUrl: string,
  callback: (color: string) => void
) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = 40;
    canvas.height = 40;

    ctx.drawImage(img, 0, 0, 40, 40);

    const data = ctx.getImageData(0, 0, 40, 40).data;

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    callback(`rgb(${r}, ${g}, ${b})`);
  };
}

export function MediaController({ spotifyTrack }: MediaControllerProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [accentColor, setAccentColor] = useState("#9b5cff");
  const [liveProgress, setLiveProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  const previousTrackId = useRef<string | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = spotifyTrack?.item?.name || "No track playing";

  const artist =
    spotifyTrack?.item?.artists
      ?.map((artist: any) => artist.name)
      .join(", ") || "Connect Spotify";

  const cover =
    spotifyTrack?.item?.album?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=500&auto=format&fit=crop";

  const currentTime = spotifyTrack?.progress_ms
    ? spotifyTrack.progress_ms / 1000
    : 0;

  const duration = spotifyTrack?.item?.duration_ms
    ? spotifyTrack.item.duration_ms / 1000
    : 0;

  const progress = duration > 0 ? liveProgress / duration : 0;

  useEffect(() => {
    setIsPlaying(Boolean(spotifyTrack?.is_playing));
  }, [spotifyTrack?.is_playing]);

  useEffect(() => {
    if (!cover) return;

    try {
      extractAccentColor(cover, setAccentColor);
    } catch {
      setAccentColor("#9b5cff");
    }
  }, [cover]);

  useEffect(() => {
    setLiveProgress(currentTime);

    const interval = setInterval(() => {
      setLiveProgress((prev) => {
        if (!isPlaying) return prev;
        return Math.min(prev + 0.1, duration);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentTime, duration, isPlaying]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F8") {
        setExpanded((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => {
    const currentTrackId = spotifyTrack?.item?.id;

    if (!currentTrackId) return;

    if (
      previousTrackId.current &&
      previousTrackId.current !== currentTrackId
    ) {
      setShowNotification(true);

      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }

      notificationTimer.current = setTimeout(() => {
        setShowNotification(false);
      }, 3500);
    }

    previousTrackId.current = currentTrackId;
  }, [spotifyTrack?.item?.id]);

  useEffect(() => {
    return () => {
      if (collapseTimer.current) {
        clearTimeout(collapseTimer.current);
      }

      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }
    };
  }, []);

  const startCollapseTimer = () => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
    }

    collapseTimer.current = setTimeout(() => {
      setExpanded(false);
    }, 1000);
  };

  const handleMouseEnter = () => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
    }

    setExpanded(true);
  };

  const handleMouseLeave = () => {
    startCollapseTimer();
  };

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        await pauseSpotify();
        setIsPlaying(false);
      } else {
        await playSpotify();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const nextTrack = async () => {
    try {
      await nextSpotifyTrack();
    } catch (error) {
      console.error(error);
    }
  };

  const previousTrack = async () => {
    try {
      await previousSpotifyTrack();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`media-controller ${expanded ? "expanded" : "collapsed"}`}
      style={{ "--accent-color": accentColor } as React.CSSProperties}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="orb-section">
        <ProgressRing progress={progress} size={expanded ? 205 : 185}>
          {spotifyTrack?.item ? (
            <img className="cover-art" src={cover} alt={title} />
          ) : (
            <PulseLogo size={180} />
          )}

          {!expanded && (
            <button
              className="collapsed-play-badge"
              onClick={togglePlay}
              aria-label="Play or pause"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          )}
        </ProgressRing>
      </div>

      <div className="expanded-panel">
        <div className="top-row">
          <div className="track-copy">
            <h1>{title}</h1>
            <p>{artist}</p>
          </div>

          <BarChart3 className="visualizer-icon" size={30} />
        </div>

        <div className="time-row">
          <span>{formatTime(liveProgress)}</span>

          <input
            className="slider progress-slider"
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={liveProgress}
            readOnly
          />

          <span>{formatTime(duration)}</span>
        </div>

        <div className="controls-row">
          <button aria-label="Shuffle">
            <Shuffle size={20} />
          </button>

          <button aria-label="Previous" onClick={previousTrack}>
            <SkipBack size={24} />
          </button>

          <button
            className="main-button"
            aria-label="Play or pause"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>

          <button aria-label="Next" onClick={nextTrack}>
            <SkipForward size={24} />
          </button>
        </div>
      </div>

      {showNotification && (
        <div className="now-playing-toast">
          <img src={cover} alt={title} className="toast-cover" />

          <div>
            <div className="toast-label">Now Playing</div>
            <div className="toast-title">{title}</div>
            <div className="toast-artist">{artist}</div>
          </div>
        </div>
      )}
    </div>
  );
}