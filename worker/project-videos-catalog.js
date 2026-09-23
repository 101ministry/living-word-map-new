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

/** Keys like '1-12'. Set 1 Round 1 videos 1-18. */
export const YOUTUBE_IDS = {
  '1-1': 'v4wEVDFUqD4',
  '1-2': 'MiCbASoOMjE',
  '1-3': '_rBrRF3sexg',
  '1-4': 'W1LEVjlKo08',
  '1-5': 'mgw-W3harTI',
  '1-6': '6ZWSKaOfxjk',
  '1-7': 'M8EKE2MUbkc',
  '1-8': 'KSqcJEYjGvc',
  '1-9': 'vV1b8xfFPqg',
  '1-10': 'GgyzJiULZP8',
  '1-11': '5jOEOVpsKn0',
  '1-12': 'Sj9tzlt2MKQ',
  '1-13': 'MocVZ4nufmM',
  '1-14': 'AEOXKvUj8yo',
  '1-15': 'GNKGbUyUbjo',
  '1-16': 'PiMwpcBgP_E',
  '1-17': 'L5u8JRXbOvY',
  '1-18': '5ncAiLk9fdQ',
};

export function buildProjectVideoCatalog() {
  return SET_META.map((set) => ({
    id: set.id,
    name: set.name,
    short: set.short,
    videos: Array.from({ length: 34 }, (_, i) => {
      const n = i + 1;
      const isBridge = n === 34 && set.id < 11;
      const youtubeId = YOUTUBE_IDS[`${set.id}-${n}`] || null;
      const round = set.id === 1 && n >= 1 && n <= 18 ? 1 : null;
      return {
        n,
        round,
        title: isBridge
          ? `Continue to Set ${set.id + 1}`
          : round
            ? `Set ${set.id} · Round ${round} · Video ${String(n).padStart(2, '0')}`
            : `Set ${set.id} · Video ${String(n).padStart(2, '0')}`,
        role: isBridge ? 'next-set' : 'video',
        nextSet: isBridge ? set.id + 1 : null,
        youtubeId,
      };
    }),
  }));
}
