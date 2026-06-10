import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  RotateCcw,
  Shuffle,
  Volume2,
  Music2,
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

type MediaControllerProps = {
  spotifyTrack: any;
};

type Track = {
  title: string;
  artist: string;
  file: string;
  cover: string;
};

const tracks: Track[] = [
  {
    title: "Night Vision",
    artist: "The Operators",
    file: "/audio/song1.mp3",
    cover:
      "https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=500&auto=format&fit=crop",
  },
  {
    title: "Digital Drift",
    artist: "Cipher Division",
    file: "/audio/song2.mp3",
    cover:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=500&auto=format&fit=crop",
  },
  {
    title: "After Hours",
    artist: "Ghost Unit",
    file: "/audio/song3.mp3",
    cover:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=500&auto=format&fit=crop",
  },
];

export function MediaController({ spotifyTrack }: MediaControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const currentTrack = tracks[trackIndex];

  const displayTrack = spotifyTrack?.item
    ? {
        title: spotifyTrack.item.name,
        artist:
          spotifyTrack.item.artists
            ?.map((artist: any) => artist.name)
            .join(", ") || "Unknown Artist",
        cover:
          spotifyTrack.item.album?.images?.[0]?.url ||
          currentTrack.cover,
      }
    : currentTrack;

  const progress = duration > 0 ? currentTime / duration : 0;

  const playCurrent = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback failed:", error);
    }
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
  await nextSpotifyTrack();
};

  const previousTrack = () => {
  setTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
};

  const restartTrack = async () => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    setCurrentTime(0);

    if (isPlaying) {
      await playCurrent();
    }
  };

  const seek = (value: number) => {
    if (!audioRef.current || !duration) return;

    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const changeVolume = (value: number) => {
    setVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      setTimeout(() => {
        playCurrent();
      }, 50);
    }
  }, [trackIndex]);

  return (
    <div
      className={`media-controller ${
        expanded ? "expanded" : "collapsed"
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <audio
        ref={audioRef}
        src={currentTrack.file}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration || 0)
        }
        onEnded={nextTrack}
      />

      <div className="orb-section">
        <ProgressRing progress={progress} size={expanded ? 190 : 174}>
          <img
            className="cover-art"
            src={displayTrack.cover}
            alt={displayTrack.title}
          />

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
            <h1>{displayTrack.title}</h1>
            <p>{displayTrack.artist}</p>
          </div>

          <BarChart3 className="visualizer-icon" size={30} />
        </div>

        <div className="time-row">
          <span>{formatTime(currentTime)}</span>

          <input
            className="slider progress-slider"
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={currentTime}
            onChange={(event) =>
              seek(Number(event.target.value))
            }
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

          <button aria-label="Restart" onClick={restartTrack}>
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="volume-row">
          <Volume2 size={20} />

          <input
            className="slider volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) =>
              changeVolume(Number(event.target.value))
            }
          />

          <span>{Math.round(volume * 100)}%</span>
        </div>

        <div className="track-dots">
          {tracks.map((track, index) => (
            <button
              key={track.title}
              className={index === trackIndex ? "active" : ""}
              onClick={() => setTrackIndex(index)}
              aria-label={`Select ${track.title}`}
            />
          ))}
        </div>
      </div>

      {!expanded && <Music2 className="mini-icon" size={18} />}
    </div>
  );
}