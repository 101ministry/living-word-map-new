/** 11 prayer-builder sets × 34 slots. Fill YOUTUBE_IDS later ('set-n': 'id'). */

export const SET_META = [
  { id: 1, name: 'You and your bloodline', short: 'You' },
  { id: 2, name: "Spouse's bloodline", short: 'Spouse' },
  { id: 3, name: 'House', short: 'House' },
  { id: 4, name: 'Neighborhood / metro', short: 'Metro' },
  { id: 5, name: 'City / metropolis', short: 'City' },
  { id: 6, name: 'County / parish / province', short: 'County' },
  { id: 7, name: 'State', short: 'State' },
  { id: 8, name: 'Country', short: 'Country' },
  { id: 9, name: 'Time zone, all countries', short: 'TZ world' },
  { id: 10, name: 'Continent', short: 'Continent' },
  { id: 11, name: 'World', short: 'World' },
];

/** Keys like '1-12'. Empty until Unlisted uploads are wired. */
export const YOUTUBE_IDS = {};

export function buildProjectVideoCatalog() {
  return SET_META.map((set) => ({
    id: set.id,
    name: set.name,
    short: set.short,
    videos: Array.from({ length: 34 }, (_, i) => {
      const n = i + 1;
      const isBridge = n === 34 && set.id < 11;
      const youtubeId = YOUTUBE_IDS[`${set.id}-${n}`] || null;
      return {
        n,
        title: isBridge
          ? `Continue to Set ${set.id + 1}`
          : `Set ${set.id} · Video ${String(n).padStart(2, '0')}`,
        role: isBridge ? 'next-set' : 'video',
        nextSet: isBridge ? set.id + 1 : null,
        youtubeId,
      };
    }),
  }));
}
