'use client';

import { useSyncExternalStore } from 'react';

function subscribeMediaQuery(query: string) {
  return (callback: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => {};
    }
    const media = window.matchMedia(query);
    media.addEventListener('change', callback);
    return () => {
      media.removeEventListener('change', callback);
    };
  };
}

function getSnapshotMediaQuery(query: string) {
  return () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  };
}

const getServerSnapshot = () => false;

const subscribeMobile = subscribeMediaQuery('(max-width: 767px)');
const getSnapshotMobile = getSnapshotMediaQuery('(max-width: 767px)');

const subscribeCoarse = subscribeMediaQuery('(pointer: coarse)');
const getSnapshotCoarse = getSnapshotMediaQuery('(pointer: coarse)');

export function useIsMobile(): { isMobile: boolean; isCoarsePointer: boolean } {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getSnapshotMobile,
    getServerSnapshot
  );

  const isCoarsePointer = useSyncExternalStore(
    subscribeCoarse,
    getSnapshotCoarse,
    getServerSnapshot
  );

  return { isMobile, isCoarsePointer };
}

export default useIsMobile;

