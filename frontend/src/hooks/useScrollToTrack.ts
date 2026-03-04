import { useState, useEffect, useRef } from "react";
import type { Track } from "@/types/api";

interface UseScrollToTrackOptions {
  projectId: string;
  tracks: Track[];
  showTracksPanel: boolean;
  isGlobalSearchOpen: boolean;
  onTrackClick: (track: Track) => void;
}

export function useScrollToTrack({
  projectId,
  tracks,
  showTracksPanel,
  isGlobalSearchOpen,
  onTrackClick,
}: UseScrollToTrackOptions) {
  const [pendingScrollToTrack, setPendingScrollToTrack] = useState<
    string | null
  >(null);
  const [pendingAutoplay, setPendingAutoplay] = useState(false);
  const [fadeHighlightedTrackId, setFadeHighlightedTrackId] = useState<
    string | null
  >(null);
  const lastScrolledTrackRef = useRef<string | null>(null);

  useEffect(() => {
    const scrollAndPlayId = sessionStorage.getItem("scrollToTrackAndPlay");
    if (scrollAndPlayId) {
      setPendingScrollToTrack(scrollAndPlayId);
      setPendingAutoplay(true);
      sessionStorage.removeItem("scrollToTrackAndPlay");
    } else {
      const scrollToTrackId = sessionStorage.getItem("scrollToTrack");
      if (scrollToTrackId) {
        setPendingScrollToTrack(scrollToTrackId);
        setPendingAutoplay(false);
        sessionStorage.removeItem("scrollToTrack");
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (!isGlobalSearchOpen) {
      const scrollAndPlayId = sessionStorage.getItem("scrollToTrackAndPlay");
      if (scrollAndPlayId) {
        setPendingScrollToTrack(scrollAndPlayId);
        setPendingAutoplay(true);
        sessionStorage.removeItem("scrollToTrackAndPlay");
      } else {
        const scrollToTrackId = sessionStorage.getItem("scrollToTrack");
        if (scrollToTrackId) {
          setPendingScrollToTrack(scrollToTrackId);
          setPendingAutoplay(false);
          sessionStorage.removeItem("scrollToTrack");
        }
      }
    }
  }, [isGlobalSearchOpen]);

  useEffect(() => {
    lastScrolledTrackRef.current = null;
    setFadeHighlightedTrackId(null);
  }, [projectId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const trackId = (e as CustomEvent).detail?.trackId;
      if (trackId) {
        lastScrolledTrackRef.current = null;
        setPendingScrollToTrack(trackId);
        setPendingAutoplay(false);
      }
    };
    window.addEventListener("scroll-to-track", handler);
    return () => window.removeEventListener("scroll-to-track", handler);
  }, []);

  useEffect(() => {
    if (
      !pendingScrollToTrack ||
      tracks.length === 0 ||
      !showTracksPanel ||
      lastScrolledTrackRef.current === pendingScrollToTrack
    ) {
      return;
    }

    const track = tracks.find((t) => t.public_id === pendingScrollToTrack);
    if (!track) return;

    lastScrolledTrackRef.current = pendingScrollToTrack;
    const trackId = pendingScrollToTrack;
    const shouldAutoplay = pendingAutoplay;

    setPendingScrollToTrack(null);
    setPendingAutoplay(false);

    if (shouldAutoplay) {
      onTrackClick(track);
    }

    setFadeHighlightedTrackId(trackId);
    setTimeout(() => {
      setFadeHighlightedTrackId(null);
    }, 1500);

    // Scroll as a best-effort visual aid after React has painted
    requestAnimationFrame(() => {
      const trackElement = document.querySelector(
        `[data-track-id="${trackId}"]`,
      );
      trackElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [
    pendingScrollToTrack,
    pendingAutoplay,
    tracks,
    showTracksPanel,
    onTrackClick,
  ]);

  return {
    fadeHighlightedTrackId,
    setFadeHighlightedTrackId,
  };
}
