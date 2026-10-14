"""
=============================================================================
DREAM JOURNAL DECODER - DSA MODULE: HASHMAP FREQUENCY COUNTER
=============================================================================
Course Project: Second-Year Computer Science & Engineering Mini-Project
Core DSA Concept: Hash Table / Hash Map (Python Dictionary)
Module: dsa_hashmap.py

CONCEPT OVERVIEW:
-----------------
A Hash Map (implemented as Python's built-in `dict`) is an associative data
structure that maps keys to values using a mathematical hash function.
In this project, the Hash Map is employed as the primary engine to aggregate
and count the frequencies of recurring symbols, keywords, and emotional
associations across all user-recorded dream entries.

HOW IT WORKS INTERNALLY (CPYTHON):
----------------------------------
1. Hashing:
   The key (e.g., symbol name "Water") is passed through a deterministic hash
   function (SipHash-1-3 in CPython) to produce an integer hash code:
   `hash_code = hash("Water")`

2. Bucket Indexing:
   The hash code is mapped to an internal array index via modulo masking:
   `bucket_index = hash_code & (capacity - 1)`

3. Collision Resolution:
   If two keys hash to the same bucket index, Python resolves the collision
   using open addressing with perturbational probing:
   `i = (5 * i + 1 + perturb) & mask`

4. Insertion / Increment:
   If the key does not exist in the dictionary, it is inserted with value 1.
   If the key already exists, its count is incremented:
   `freq_map[symbol] = freq_map.get(symbol, 0) + count`

TIME & SPACE COMPLEXITY ANALYSIS:
---------------------------------
Operation             Average Case    Worst Case*     Space Complexity
-------------------------------------------------------------------------
Key Insertion         O(1)            O(N)            O(1)
Key Lookup            O(1)            O(N)            O(1)
Key Deletion          O(1)            O(N)            O(1)
Full Aggregation      O(M)            O(M * N)        O(U)

Where:
- M = Total number of symbol/keyword instances encountered across dreams.
- U = Number of distinct/unique symbols or keywords stored.
- N = Current number of elements in the table.
* Note: Worst-case O(N) occurs only if catastrophic hash collisions occur,
  which is practically eliminated by CPython's randomized SipHash salt.

WHY HASHMAP WAS CHOSEN OVER ALTERNATIVES:
-----------------------------------------
- Over Array/List: A linear scan of an unsorted list takes O(U) per symbol,
  yielding an overall O(M * U) aggregation time. HashMap achieves O(M).
- Over Binary Search Tree: An AVL or Red-Black tree takes O(log U) per lookup,
  yielding O(M log U). HashMap delivers direct O(1) average access.
=============================================================================
"""

from typing import Dict, List, Any, Tuple


class SymbolFrequencyCounter:
    """
    DSA Controller that demonstrates HashMap operations for dream analytics.
    Maintains frequency tables, tracks step-by-step operations for educational
    demonstration, and performs motif correlation analysis.
    """

    def __init__(self):
        # Primary HashMaps
        self.symbol_frequencies: Dict[str, int] = {}
        self.keyword_frequencies: Dict[str, int] = {}
        self.emotion_frequencies: Dict[str, int] = {}
        self.symbol_to_dreams_map: Dict[str, List[str]] = {}

    def count_symbol_frequencies(self, dreams: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Populates the symbol frequency HashMap from a list of dream dictionaries.
        
        Algorithm:
        ----------
        1. Initialize empty hash map `freq_map = {}`
        2. For each dream record in dreams:
           For each detected symbol in dream['derived_symbols']:
             key = symbol['name']
             freq_map[key] = freq_map.get(key, 0) + symbol['occurrences']
        3. Return freq_map

        Complexity:
        -----------
        Time: O(D * S) where D is number of dreams, S is average symbols per dream.
              Since each dictionary insertion/update is O(1) average time,
              the total execution time is strictly linear with respect to input.
        Space: O(U) where U is unique symbols encountered.
        """
        self.symbol_frequencies.clear()
        self.symbol_to_dreams_map.clear()

        for dream in dreams:
            dream_id = str(dream.get("id", ""))
            dream_title = str(dream.get("title", "Untitled"))
            symbols = dream.get("derived_symbols", [])

            for sym in symbols:
                name = sym.get("name")
                if not name:
                    continue

                occurrences = sym.get("occurrences", 1)

                # HashMap update: O(1) average time
                self.symbol_frequencies[name] = self.symbol_frequencies.get(name, 0) + occurrences

                # Track dream reference for reverse lookup
                if name not in self.symbol_to_dreams_map:
                    self.symbol_to_dreams_map[name] = []
                self.symbol_to_dreams_map[name].append({
                    "id": dream_id,
                    "title": dream_title,
                    "date": dream.get("dream_date", "")
                })

        return self.symbol_frequencies

    def count_keyword_frequencies(self, dreams: List[Dict[str, Any]], top_n: int = 15) -> List[Tuple[str, int]]:
        """
        Counts keyword occurrences across all dream texts using a HashMap.
        Returns top N keywords sorted by frequency descending.
        """
        self.keyword_frequencies.clear()

        for dream in dreams:
            keywords = dream.get("derived_keywords", [])
            for kw in keywords:
                clean_kw = kw.strip().lower()
                if clean_kw:
                    # HashMap O(1) update
                    self.keyword_frequencies[clean_kw] = self.keyword_frequencies.get(clean_kw, 0) + 1

        # Sort the HashMap entries: O(U log U)
        sorted_keywords = sorted(
            self.keyword_frequencies.items(),
            key=lambda item: item[1],
            reverse=True
        )
        return sorted_keywords[:top_n]

    def count_emotion_frequencies(self, dreams: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Counts emotion frequencies across dreams using a HashMap.
        """
        self.emotion_frequencies.clear()

        for dream in dreams:
            emotions = dream.get("selected_emotions", [])
            for emotion in emotions:
                if emotion:
                    self.emotion_frequencies[emotion] = self.emotion_frequencies.get(emotion, 0) + 1

        return self.emotion_frequencies

    def get_symbol_ranking(self) -> List[Dict[str, Any]]:
        """
        Converts the symbol frequency HashMap into a sorted list with percentage shares
        and distinct dreams count.
        """
        if not self.symbol_frequencies:
            return []

        total_occurrences = sum(self.symbol_frequencies.values())
        ranked = []

        # Sort hash map items by value (count) descending: O(U log U)
        for symbol, count in sorted(self.symbol_frequencies.items(), key=lambda x: x[1], reverse=True):
            pct = round((count / total_occurrences) * 100, 1) if total_occurrences > 0 else 0
            associated = self.symbol_to_dreams_map.get(symbol, [])
            # Deduplicate by dream ID for distinct dream count
            seen_ids = set()
            unique_dreams = []
            for d in associated:
                if d["id"] not in seen_ids:
                    seen_ids.add(d["id"])
                    unique_dreams.append(d)

            ranked.append({
                "symbol": symbol,
                "count": count,
                "distinct_dreams_count": len(unique_dreams),
                "percentage": pct,
                "associated_dreams": unique_dreams
            })

        return ranked

    def get_emotion_ranking(self) -> List[Dict[str, Any]]:
        """
        Returns ranked emotions with occurrence counts and percentage shares.
        """
        if not self.emotion_frequencies:
            return []

        total = sum(self.emotion_frequencies.values())
        ranked = []
        for emotion, count in sorted(self.emotion_frequencies.items(), key=lambda x: x[1], reverse=True):
            pct = round((count / total) * 100, 1) if total > 0 else 0
            ranked.append({
                "emotion": emotion,
                "count": count,
                "percentage": pct
            })
        return ranked

    def get_emotion_timeline(self, dreams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups recorded emotions chronologically by dream date for trend visualization.
        """
        date_map: Dict[str, Dict[str, int]] = {}
        for d in dreams:
            dt = d.get("dream_date", "")
            if not dt:
                continue
            if dt not in date_map:
                date_map[dt] = {}
            for emo in d.get("selected_emotions", []):
                date_map[dt][emo] = date_map[dt].get(emo, 0) + 1

        return [{"date": dt, "emotions": date_map[dt]} for dt in sorted(date_map.keys())]

    def simulate_hashmap_execution(self, sample_symbols: List[str]) -> Dict[str, Any]:
        """
        Pedagogical step-by-step tracer for the DSA Laboratory view.
        Simulates how Python processes each key in the dictionary,
        including hash codes, bucket positions, and state progression.
        """
        trace_steps = []
        state_dict = {}
        capacity = 8  # Demonstration bucket array size

        for index, sym in enumerate(sample_symbols):
            # Compute deterministic simulated hash for academic display
            raw_hash = sum(ord(c) * (31 ** i) for i, c in enumerate(sym)) & 0xFFFFFFFF
            bucket_index = raw_hash % capacity

            is_collision = False
            action = "INSERT"

            if sym in state_dict:
                state_dict[sym] += 1
                action = "INCREMENT"
                explanation = f"Key '{sym}' already exists in HashMap. Looked up in O(1) time and incremented frequency to {state_dict[sym]}."
            else:
                state_dict[sym] = 1
                action = "INSERT"
                explanation = f"Key '{sym}' not found. Created new entry in bucket #{bucket_index} with initial count 1."

            trace_steps.append({
                "step": index + 1,
                "key": sym,
                "hash_code": raw_hash,
                "bucket_index": bucket_index,
                "action": action,
                "explanation": explanation,
                "current_dict": dict(state_dict)
            })

        return {
            "steps": trace_steps,
            "final_map": state_dict,
            "total_keys": len(state_dict),
            "total_items_processed": len(sample_symbols)
        }

    def get_academic_summary(self) -> Dict[str, Any]:
        """
        Returns formal academic documentation regarding the HashMap data structure
        for viva voce preparation and presentation.
        """
        return {
            "data_structure": "Hash Map (Python dict)",
            "underlying_mechanism": "Open addressing with perturbational collision probing over a dynamic sparse array",
            "time_complexity": {
                "lookup_average": "O(1)",
                "lookup_worst": "O(N)",
                "insert_average": "O(1)",
                "insert_worst": "O(N)",
                "frequency_aggregation": "O(M) where M is total symbol occurrences"
            },
            "space_complexity": "O(U) where U is number of unique keys",
            "practical_benefit": "Enables instantaneous O(1) frequency updates as users journal dreams, supporting real-time chart synchronization without linear scanning overhead."
        }


# Global instance for app-wide use
symbol_counter = SymbolFrequencyCounter()
