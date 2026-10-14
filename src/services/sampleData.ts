// ==========================================
// SAMPLE DATA GENERATOR - 10 FICTIONAL DREAMS
// Overlapping symbols, varied emotions, and evocative narratives
// ==========================================

import { Dream } from '../types';
import { DreamDecoderService } from './dreamDecoder';

interface RawSampleDream {
  id: string;
  title: string;
  narrative: string;
  dreamDate: string;
  dreamTime: string;
  selectedEmotions: ('Wonder' | 'Anxiety' | 'Joy' | 'Melancholy' | 'Confusion' | 'Fear' | 'Peace' | 'Euphoria' | 'Nostalgia' | 'Frustration' | 'Liberation')[];
  vividness: number;
  tags: string[];
  reflection: string;
}

const RAW_SAMPLES: RawSampleDream[] = [
  {
    id: 'sample-dream-01',
    title: 'The Submerged Clocktower of Murano',
    narrative: 'I was swimming through warm, lapis-blue water inside an ancient sunken cathedral. Enormous stained-glass windows cast cobalt and emerald patterns across marble columns. Deep below, a colossal golden clock ticked softly, its hands moving in reverse. I realized I could breathe underwater without effort. A school of silver fish swirled into the shape of a constellation before dissolving into the blue abyss.',
    dreamDate: '2026-10-12',
    dreamTime: '04:15',
    selectedEmotions: ['Wonder', 'Peace'],
    vividness: 9,
    tags: ['water', 'cathedral', 'time', 'lucid', 'ocean'],
    reflection: 'Felt an extraordinary calm about the passage of time. The reverse clock suggested returning to an unhurried state of mind.',
  },
  {
    id: 'sample-dream-02',
    title: 'Flight Over the Obsidian Archipelago',
    narrative: 'I stood atop a sheer obsidian cliff overlooking a silent, star-filled ocean. With a slight lean forward, gravity released me. I was flying horizontally across dark water, skimming just inches above glowing bioluminescent waves. The wind had the scent of cedar and ozone. I reached down and touched the surface, sending ripples of starlight spreading outward for miles.',
    dreamDate: '2026-10-10',
    dreamTime: '05:30',
    selectedEmotions: ['Euphoria', 'Liberation'],
    vividness: 8,
    tags: ['flight', 'ocean', 'stars', 'freedom'],
    reflection: 'A sense of total autonomy and unencumbered lightness. Flying felt natural, like remembering a long-forgotten skill.',
  },
  {
    id: 'sample-dream-03',
    title: 'The Infinite Attic of Unopened Letters',
    narrative: 'Exploring my childhood home, I discovered a small hidden wooden door behind a wardrobe. Opening it led into a sunlit attic ten times larger than the house itself. Dust motes drifted through amber sunlight. Shelves stretched for miles, holding thousands of wax-sealed letters addressed to me in familiar handwriting. When I tried to open the first letter, the ink faded into vapor.',
    dreamDate: '2026-10-08',
    dreamTime: '03:45',
    selectedEmotions: ['Nostalgia', 'Wonder'],
    vividness: 7,
    tags: ['house', 'secret rooms', 'letters', 'childhood', 'memories'],
    reflection: 'Reflects unexpressed thoughts or conversations with people from the past that I never had the chance to complete.',
  },
  {
    id: 'sample-dream-04',
    title: 'The Train with Shifting Destinations',
    narrative: 'I boarded a midnight commuter train traveling through a misty pine forest. Outside the window, ancient stone arches loomed through the fog. Every time the conductor called a station name, the letters on the departure board rearranged into anagrams. My wristwatch alarm began buzzing frantically, but my hands felt heavy and sluggish. A stranger in a dark coat offered me an antique brass key.',
    dreamDate: '2026-10-06',
    dreamTime: '06:10',
    selectedEmotions: ['Anxiety', 'Confusion'],
    vividness: 6,
    tags: ['train', 'forest', 'key', 'clock', 'travel'],
    reflection: 'Directly echoes waking pressure about upcoming semester project deadlines and making irreversible career choices.',
  },
  {
    id: 'sample-dream-05',
    title: 'The Mirrored Labyrinth of the Winter Garden',
    narrative: 'Walking through a glass conservatory filled with frosted ferns and blooming white roses. Every wall was a floor-to-ceiling mirror. As I navigated the turns, my reflections began moving with independent delays, nodding kindly or turning away to inspect the flowers. In the center of the maze stood a white owl perched on a sundial, watching me with steady amber eyes.',
    dreamDate: '2026-10-04',
    dreamTime: '04:50',
    selectedEmotions: ['Wonder', 'Melancholy'],
    vividness: 8,
    tags: ['mirror', 'maze', 'animal', 'garden', 'reflection'],
    reflection: 'The independent reflections felt like different facets of my personality quietly coexisting. The owl brought reassuring clarity.',
  },
  {
    id: 'sample-dream-06',
    title: 'The Great Tidal Wave at Sunset',
    narrative: 'Standing on a sandy shore under a crimson sunset. On the horizon, a colossal wall of clear green water rose hundreds of feet into the sky. Instead of running in terror like the others, I stood grounded. As the wave crested over the beach, it turned into warm, weightless sea spray that smelled of salt and sweet rain, cleansing the entire coastline.',
    dreamDate: '2026-10-02',
    dreamTime: '05:00',
    selectedEmotions: ['Peace', 'Liberation'],
    vividness: 9,
    tags: ['water', 'storm', 'ocean', 'catharsis'],
    reflection: 'What initially presented as an impending catastrophe transformed into relief. Anticipated obstacles might be less damaging than feared.',
  },
  {
    id: 'sample-dream-07',
    title: 'The Starlit Observatory on the Crest',
    narrative: 'Climbing a winding stone staircase up a steep mountain ridge under an aurora borealis. At the summit sat a celestial observatory with an open dome. Looking through the brass telescope, constellations were physically singing in resonant harmonic tones. When I adjusted the focus wheel, nebulae began rotating in sync with my breathing.',
    dreamDate: '2026-09-29',
    dreamTime: '03:20',
    selectedEmotions: ['Wonder', 'Euphoria'],
    vividness: 10,
    tags: ['stars', 'mountain', 'music', 'observatory', 'cosmos'],
    reflection: 'An overwhelmingly sublime dream. Left me feeling inspired and intellectually energized for days.',
  },
  {
    id: 'sample-dream-08',
    title: 'The Serpent Guarding the Cedar Well',
    narrative: 'Deep in a shadowy cedar grove, I approached a mossy stone well. A large, emerald-scaled serpent was coiled around the wooden bucket. Its eyes were calm and intelligent. It slid aside to let me draw water. Inside the wooden bucket, instead of water, lay a small, glowing ember that radiated warmth without burning my palms.',
    dreamDate: '2026-09-25',
    dreamTime: '04:40',
    selectedEmotions: ['Wonder', 'Peace'],
    vividness: 7,
    tags: ['animal', 'snake', 'forest', 'fire', 'water'],
    reflection: 'A classic transformative motif. Overcoming instinctive fear to receive a gift of inner vitality.',
  },
  {
    id: 'sample-dream-09',
    title: 'The Endless Corridor of Unlocked Doors',
    narrative: 'Walking down a dimly lit hotel corridor that stretched indefinitely into darkness. Every five paces there was a door on either side—some made of glass, some carved oak, some rusted steel. I pushed one door open and saw an alpine meadow at dawn; another revealed a silent library with thousands of books. A ticking grandfather clock echoed softly from the darkness behind me.',
    dreamDate: '2026-09-22',
    dreamTime: '02:50',
    selectedEmotions: ['Confusion', 'Wonder'],
    vividness: 6,
    tags: ['doors', 'house', 'library', 'clock', 'transition'],
    reflection: 'Feeling the weight of multiple open possibilities. The ticking clock prompted a gentle reminder that choices must eventually be made.',
  },
  {
    id: 'sample-dream-10',
    title: 'The Vanishing Bridge Over the Violet Chasm',
    narrative: 'I had to cross a narrow rope bridge suspended over a canyon filled with purple swirling mist. With every step I took, the wooden slats behind me dissolved into shimmering purple sparks. My heart hammered, but when I took a deep breath and looked straight ahead rather than looking down, the remaining steps solidified into firm polished marble.',
    dreamDate: '2026-09-18',
    dreamTime: '06:00',
    selectedEmotions: ['Anxiety', 'Liberation'],
    vividness: 8,
    tags: ['bridge', 'falling', 'canyon', 'courage'],
    reflection: 'Commitment and forward momentum create stability. Looking backward caused unnecessary hesitation.',
  },
];

export function generateSampleDreams(): Dream[] {
  return RAW_SAMPLES.map(raw => {
    const analysis = DreamDecoderService.analyzeDreamText(raw.narrative, raw.title);
    const now = Date.now();

    return {
      id: raw.id,
      title: raw.title,
      narrative: raw.narrative,
      dreamDate: raw.dreamDate,
      dreamTime: raw.dreamTime,
      selectedEmotions: raw.selectedEmotions,
      inferredEmotions: analysis.inferredEmotions,
      vividness: raw.vividness,
      tags: raw.tags,
      reflection: raw.reflection,
      createdAt: new Date(`${raw.dreamDate}T${raw.dreamTime}:00`).getTime(),
      updatedAt: now,
      isSample: true,
      derivedKeywords: analysis.topKeywords.map(k => k.word),
      derivedSymbols: analysis.detectedSymbols,
      wordCount: analysis.wordCount,
      charCount: analysis.charCount,
    };
  });
}
