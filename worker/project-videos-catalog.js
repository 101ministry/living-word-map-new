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

function slotCount(setId) {
  return setId === 1 ? 68 : 34;
}

function roundOf(n) {
  if (n >= 1 && n <= 34) return 1;
  if (n >= 35 && n <= 68) return 2;
  if (n >= 69 && n <= 102) return 3;
  return null;
}

/** Keys like '1-12'. Set 1 Round 1 = 1-34, Round 2 = 35-47 (more coming). */
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
  '1-19': 'GiUW3A8roII',
  '1-20': 'mjKW1I0xRhw',
  '1-21': 'TY9aW4hKJF0',
  '1-22': 'yzAIYf6WX5s',
  '1-23': 'Enh_lw0zEUc',
  '1-24': 'SXV-JEfTXbA',
  '1-25': 'ig3wrFFGpzw',
  '1-26': 'HUDihpWJAkE',
  '1-27': 'LG1LNdmXfy4',
  '1-28': 'Uw3L4c8_NE8',
  '1-29': 'PJtVJBLMbFQ',
  '1-30': 'KD2K-5q2QgY',
  '1-31': '1ATfVJLQ9_o',
  '1-32': 'B65mkcnyWG0',
  '1-33': 'wu2HzKyk93o',
  '1-34': 'Mr1oULT7fT0',
  '1-35': 'khHlnPG86ns',
  '1-36': '4qjewE4c9nE',
  '1-37': 'w_p4Jloj1F8',
  '1-38': 'oPS7fIvWBNA',
  '1-39': 'yt4FF0_UMHU',
  '1-40': 'cBEuc34UcTU',
  '1-41': '_Xh6LPTHNbM',
  '1-42': 'tuMBM016eBc',
  '1-43': 'RDxAQCMCAFY',
  '1-44': '3sR7qfu3DOA',
  '1-45': 'PW8ai91oOm0',
  '1-46': 'HzqY_Uf8YVw',
  '1-47': 'ipUYW_M2xUc',
};

export function buildProjectVideoCatalog() {
  return SET_META.map((set) => {
    const slots = slotCount(set.id);
    return {
      id: set.id,
      name: set.name,
      short: set.short,
      videos: Array.from({ length: slots }, (_, i) => {
        const n = i + 1;
        const isBridge = set.id < 11 && n === slots && slots === 34;
        const youtubeId = YOUTUBE_IDS[`${set.id}-${n}`] || null;
        const round = roundOf(n);
        return {
          n,
          round,
          title: isBridge
            ? `Continue to Set ${set.id + 1}`
            : `Set ${set.id} · Round ${round} · Video ${String(n).padStart(2, '0')}`,
          role: isBridge ? 'next-set' : 'video',
          nextSet: isBridge ? set.id + 1 : null,
          youtubeId,
        };
      }),
    };
  });
}
