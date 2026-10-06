import type { SyntheticEvent } from "react";

export const getSafeRecordingUrl = (url?: string): string => {
  if (!url) return "";

  if (url.includes("stringee.com")) {
    const backendApi = import.meta.env.VITE_API_URL;
    return `${backendApi}/dialer/recording-proxy?recordingUrl=${encodeURIComponent(url)}`;
  }

  return url;
};

// Only one recording plays at a time: pause every other <audio> on the page
export const pauseOtherAudio = (e: SyntheticEvent<HTMLAudioElement>) => {
  document.querySelectorAll("audio").forEach((audio) => {
    if (audio !== e.currentTarget && !audio.paused) audio.pause();
  });
};
