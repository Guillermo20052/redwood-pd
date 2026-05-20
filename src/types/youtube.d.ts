declare namespace YT {
  interface Player {
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    pauseVideo(): void;
    destroy(): void;
  }
  interface PlayerOptions {
    videoId: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (e: PlayerEvent) => void;
      onStateChange?: (e: OnStateChangeEvent) => void;
      onError?: (e: OnErrorEvent) => void;
    };
  }
  interface PlayerEvent {
    target: Player;
  }
  interface OnStateChangeEvent {
    data: number;
    target: Player;
  }
  interface OnErrorEvent {
    data: number;
    target: Player;
  }
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
  interface PlayerConstructor {
    new (el: HTMLElement | string, options: PlayerOptions): Player;
  }
  const Player: PlayerConstructor;
}

interface Window {
  YT: typeof YT & { Player: typeof YT.Player; PlayerState: typeof YT.PlayerState };
  onYouTubeIframeAPIReady?: () => void;
}
