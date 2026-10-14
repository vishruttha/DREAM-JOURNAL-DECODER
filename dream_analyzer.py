"""
=============================================================================
DREAM ANALYZER - DETERMINISTIC TEXT PROCESSING & SYMBOL MATCHER
=============================================================================
Course Project: Second-Year Computer Science & Engineering Mini-Project
Module: dream_analyzer.py

Handles text normalization, stop-word removal, keyword extraction, and
matching against a configurable dream-symbol taxonomy.
All processing is executed in pure Python.
=============================================================================
"""

import re
import math
from datetime import datetime
from typing import Dict, List, Any, Set, Tuple

# Comprehensive English stop words set
STOP_WORDS: Set[str] = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', "can't", 'cannot', 'could', "couldn't",
    'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during',
    'each', 'few', 'for', 'from', 'further',
    'had', "hadn't", 'has', "hasn't", 'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's",
    'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself',
    'let\'s', 'me', 'more', 'most', "mustn't", 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', "shan't", 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such',
    'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very',
    'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't",
    'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves',
    # Common conversational fillers in dreams
    'like', 'felt', 'seemed', 'saw', 'went', 'looked', 'started', 'then', 'suddenly', 'just', 'somewhere', 'something', 'someone',
}

# Configurable Dream Symbol Dictionary
# Each entry includes reflective, personal inquiries rather than dogmatic interpretations
DREAM_SYMBOLS: List[Dict[str, Any]] = [
    {
        "id": "water",
        "name": "Water & Oceans",
        "category": "Nature",
        "keywords": ["water", "ocean", "sea", "river", "lake", "stream", "waves", "swim", "swimming", "drowning", "rain", "flood", "tide", "shore", "deep"],
        "reflective_meaning": "Often associated with emotional depths, adaptability, or sensations of being immersed or overwhelmed.",
        "inquiry_question": "How was the water behaving? Was it calm and clear, turbulent and dark, or refreshing to the senses?",
        "color": "#38bdf8"
    },
    {
        "id": "flying",
        "name": "Flight & Soaring",
        "category": "Movement",
        "keywords": ["fly", "flying", "soar", "soaring", "levitate", "levitation", "float", "floating", "wings", "glide", "gliding"],
        "reflective_meaning": "Frequently evokes sensations of freedom, transcending daily constraints, seeing the grand picture, or escapism.",
        "inquiry_question": "How effortless was your flight? Were you maintaining altitude easily or fighting gravity?",
        "color": "#a78bfa"
    },
    {
        "id": "falling",
        "name": "Falling & Vertigo",
        "category": "Movement",
        "keywords": ["fall", "falling", "drop", "abyss", "tumble", "slip", "plunge", "vertigo", "plummet"],
        "reflective_meaning": "Commonly reflects feelings of losing control, surrendered expectations, fear of failure, or relaxing into the unknown.",
        "inquiry_question": "Did the descent inspire terror or a strange sense of surrender and weightlessness?",
        "color": "#f87171"
    },
    {
        "id": "forest",
        "name": "Forest & Trees",
        "category": "Nature",
        "keywords": ["forest", "tree", "trees", "woods", "grove", "leaves", "jungle", "branches", "roots", "clearing"],
        "reflective_meaning": "Frequently connected to natural intuition, navigating the unfamiliar, personal growth, or feeling deeply rooted versus lost.",
        "inquiry_question": "Did the forest feel sheltering and alive, or impenetrable and disorienting?",
        "color": "#34d399"
    },
    {
        "id": "fire",
        "name": "Fire & Flame",
        "category": "Nature",
        "keywords": ["fire", "flame", "flames", "blaze", "burning", "burn", "ash", "ashes", "smoke", "candle", "bonfire", "spark"],
        "reflective_meaning": "Commonly linked to passion, sudden transformation, destruction of outdated beliefs, or intense creative drive.",
        "inquiry_question": "Was the flame warming and providing illumination, or consuming and out of control?",
        "color": "#fb923c"
    },
    {
        "id": "house",
        "name": "House & Secret Rooms",
        "category": "Architecture",
        "keywords": ["house", "home", "room", "rooms", "mansion", "basement", "attic", "corridor", "hallway", "chamber", "secret room"],
        "reflective_meaning": "In psychological tradition, a house frequently mirrors the architecture of the self—basements being subconscious, attics intellect.",
        "inquiry_question": "What state was the house in, and did you discover unmapped spaces or hidden corridors?",
        "color": "#c084fc"
    },
    {
        "id": "clock",
        "name": "Clocks & Time",
        "category": "Objects",
        "keywords": ["clock", "watch", "time", "hourglass", "ticking", "sundial", "late", "alarm", "deadline"],
        "reflective_meaning": "Reflects consciousness of mortality, anxiety over missed windows, or the feeling that time operates non-linearly.",
        "inquiry_question": "Was time accelerating frantically, frozen, or flowing backward?",
        "color": "#fbbf24"
    },
    {
        "id": "mirror",
        "name": "Mirrors & Reflections",
        "category": "Objects",
        "keywords": ["mirror", "reflection", "glass", "speculum", "reflections", "shattered mirror", "looking glass"],
        "reflective_meaning": "Frequently connected to self-identity, self-examination, how one wishes to be perceived, or confronting an alternate persona.",
        "inquiry_question": "Did your reflection look true to yourself, or did it carry an unexpected expression?",
        "color": "#67e8f9"
    },
    {
        "id": "stars",
        "name": "Stars & Celestial Skies",
        "category": "Nature",
        "keywords": ["star", "stars", "constellation", "galaxy", "cosmos", "planet", "moon", "eclipse", "nebula", "meteor", "aurora"],
        "reflective_meaning": "Connected to cosmic curiosity, destiny, guidance in the dark, long-term ideals, and philosophical awe.",
        "inquiry_question": "What guiding light or larger philosophical horizon is capturing your imagination lately?",
        "color": "#818cf8"
    },
    {
        "id": "snake",
        "name": "Snakes & Serpents",
        "category": "Archetypes",
        "keywords": ["snake", "serpent", "cobra", "viper", "scales", "slither", "coiled", "shedding"],
        "reflective_meaning": "Ancient cross-cultural symbol of shedding old identities, medical healing, hidden venom, or subterranean knowledge.",
        "inquiry_question": "Was the serpent threatening a strike, or calmly shedding its skin before you?",
        "color": "#4ade80"
    },
    {
        "id": "teeth",
        "name": "Teeth & Body",
        "category": "Archetypes",
        "keywords": ["teeth", "tooth", "loose teeth", "crumbling teeth", "smile", "jaw", "bone"],
        "reflective_meaning": "Historically tied to anxieties regarding aging, loss of personal power, social appearance, or articulation.",
        "inquiry_question": "Did this sensation evoke feelings about aging, nourishment, or speaking your mind?",
        "color": "#f472b6"
    },
    {
        "id": "doors",
        "name": "Doors & Portals",
        "category": "Architecture",
        "keywords": ["door", "doors", "portal", "gate", "gateway", "threshold", "archway", "entrance", "exit", "keyhole"],
        "reflective_meaning": "Symbolizes transitions, opportunities, thresholds between life chapters, or barriers guarding hidden insights.",
        "inquiry_question": "Was the door locked, slightly ajar, or inviting you to step into uncharted territory?",
        "color": "#e879f9"
    },
    {
        "id": "bridge",
        "name": "Bridges & Chasms",
        "category": "Architecture",
        "keywords": ["bridge", "crossing", "chasm", "canyon", "span", "viaduct", "footbridge"],
        "reflective_meaning": "Symbolizes bridging two opposing states, major life transitions, overcoming divides, or reaching reconciliation.",
        "inquiry_question": "Was the bridge sturdy and broad, or narrow and swaying across a deep divide?",
        "color": "#2dd4bf"
    },
    {
        "id": "chase",
        "name": "Chase & Pursuit",
        "category": "Movement",
        "keywords": ["chase", "chased", "pursued", "running", "flee", "fleeing", "escape", "hiding", "stalked"],
        "reflective_meaning": "Often associated with avoiding an unacknowledged truth, stress over deadlines, or confronting an unresolved fear.",
        "inquiry_question": "What was pursuing you? What would happen if you turned around and spoke to it?",
        "color": "#facc15"
    }
]

# Emotion lexicon for auxiliary keyword matching
EMOTION_LEXICON: Dict[str, List[str]] = {
    "Wonder": ["wonder", "awe", "marvel", "astonished", "celestial", "magical", "curious", "infinite", "beauty", "starlight"],
    "Anxiety": ["anxious", "stress", "hurry", "late", "panic", "nervous", "urgent", "pressured", "dread", "tense"],
    "Joy": ["joy", "happy", "laugh", "delight", "smile", "rejoice", "glad", "radiant", "celebrate", "warmth"],
    "Peace": ["peace", "calm", "serene", "tranquil", "quiet", "restful", "still", "gentle", "harmony", "relax"],
    "Euphoria": ["soaring", "ecstasy", "weightless", "invincible", "triumphant", "flying", "bliss", "transcendent"],
    "Melancholy": ["sad", "lonely", "sorrow", "grief", "tear", "crying", "wept", "fading", "gloomy", "bittersweet"],
    "Confusion": ["confused", "weird", "strange", "bizarre", "lost", "perplexed", "puzzle", "maze", "disoriented"],
    "Fear": ["fear", "terror", "terrified", "scared", "horror", "monster", "darkness", "threat", "nightmare"]
}


def normalize_and_tokenize(text: str) -> List[str]:
    """
    Normalizes text (lowercasing, punctuation stripping) and tokenizes into words.
    Time Complexity: O(L) where L is character length of text.
    """
    clean_text = text.lower()
    # Replace non-alphanumeric characters with spaces
    clean_text = re.sub(r"[^a-z0-9'\s-]", " ", clean_text)
    tokens = clean_text.split()
    # Strip leading/trailing apostrophes or hyphens
    tokens = [t.strip("'-") for t in tokens if len(t.strip("'-")) > 1]
    return tokens


def extract_keywords(tokens: List[str], top_n: int = 8) -> List[str]:
    """
    Extracts top non-stopword keywords from token list using a Python dictionary.
    Time Complexity: O(T) where T is tokens count, plus O(K log K) sort where K is unique words.
    """
    freq_map: Dict[str, int] = {}
    for token in tokens:
        if token not in STOP_WORDS and len(token) > 2:
            freq_map[token] = freq_map.get(token, 0) + 1

    sorted_keywords = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)
    return [k for k, _ in sorted_keywords[:top_n]]


def detect_symbols(text: str) -> List[Dict[str, Any]]:
    """
    Matches text against the DREAM_SYMBOLS dictionary.
    Returns list of matched symbols with occurrence counts and reflective inquiries.
    """
    lower_text = text.lower()
    detected = []

    for sym in DREAM_SYMBOLS:
        match_count = 0
        matched_words = []

        for kw in sym["keywords"]:
            # Use regex word boundaries to prevent substring false-positives
            matches = re.findall(rf"\b{re.escape(kw)}\b", lower_text)
            if matches:
                match_count += len(matches)
                matched_words.append(kw)

        if match_count > 0:
            detected.append({
                "symbol_id": sym["id"],
                "name": sym["name"],
                "category": sym["category"],
                "occurrences": match_count,
                "matched_keywords": list(set(matched_words)),
                "reflective_meaning": sym["reflective_meaning"],
                "inquiry_question": sym["inquiry_question"],
                "color": sym.get("color", "#8b5cf6")
            })

    # Sort detected symbols by occurrences descending
    detected.sort(key=lambda s: s["occurrences"], reverse=True)
    return detected


def calculate_moon_phase(date_str: str) -> Dict[str, Any]:
    """
    Calculates astronomical moon phase approximation for a given YYYY-MM-DD date string.
    """
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        year, month, day = dt.year, dt.month, dt.day

        if month < 3:
            c = year - 1
            e = month + 12
        else:
            c = year
            e = month

        b = (c // 400) - (c // 100) + (c // 4)
        jd = 365.25 * c + 30.6 * (e + 1) + day - 694039.09
        jd /= 29.5305882  # lunar synodic period
        cycle = jd - int(jd)
        phase_idx = round(cycle * 8) % 8

        phases = [
            {"phase": "New Moon", "illumination": 0, "icon": "🌑"},
            {"phase": "Waxing Crescent", "illumination": 25, "icon": "🌒"},
            {"phase": "First Quarter", "illumination": 50, "icon": "🌓"},
            {"phase": "Waxing Gibbous", "illumination": 75, "icon": "🌔"},
            {"phase": "Full Moon", "illumination": 100, "icon": "🌕"},
            {"phase": "Waning Gibbous", "illumination": 75, "icon": "🌖"},
            {"phase": "Last Quarter", "illumination": 50, "icon": "🌗"},
            {"phase": "Waning Crescent", "illumination": 25, "icon": "🌘"},
        ]
        return phases[phase_idx]
    except Exception:
        return {"phase": "Waxing Crescent", "illumination": 35, "icon": "🌒"}


def analyze_dream(title: str, narrative: str, date_str: str = "") -> Dict[str, Any]:
    """
    Full text processing pipeline for a single dream entry.
    """
    full_text = f"{title} {narrative}"
    tokens = normalize_and_tokenize(full_text)
    keywords = extract_keywords(tokens)
    detected_symbols = detect_symbols(full_text)

    # Inferred emotion hints
    inferred_emotions = []
    lower_full = full_text.lower()
    for emo, words in EMOTION_LEXICON.items():
        if any(re.search(rf"\b{re.escape(w)}\b", lower_full) for w in words):
            inferred_emotions.append(emo)

    word_count = len(narrative.split())
    char_count = len(narrative)
    moon = calculate_moon_phase(date_str) if date_str else calculate_moon_phase(datetime.now().strftime("%Y-%m-%d"))

    return {
        "word_count": word_count,
        "char_count": char_count,
        "keywords": keywords,
        "detected_symbols": detected_symbols,
        "inferred_emotions": inferred_emotions[:3],
        "moon_phase": moon
    }
