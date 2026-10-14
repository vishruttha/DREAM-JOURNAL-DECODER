# Dream Journal Decoder 
### Second-Year Computer Science & Engineering (CSE) Mini-Project
**Core DSA Focus:** Hash Table / Hash Map (Python Dictionary) for Subconscious Motif & Frequency Analytics  
**Tech Stack:** Python 3.11 &bull; Flask &bull; SQLite3 &bull; ReportLab &bull; Vanilla JavaScript &bull; CSS3 &bull; Chart.js

---

## 1. Project Overview & Problem Statement

### 1.1 Problem Statement
Personal journaling often produces extensive, unstructured textual reflections that are difficult to analyze over time. While people intuitively notice recurring themes (such as water, flying, or ticking clocks), manual tracking of recurring motifs and emotional currents across weeks or months is inefficient and error-prone. 

In computer science, frequency counting across unstructured text collections requires an efficient associative data structure. A naive implementation using linear arrays suffers from $O(U)$ search times per token, resulting in $O(M \times U)$ quadratic performance degradation as journal entries grow.

### 1.2 Objective & Scope
The **Dream Journal Decoder** is an interactive, celestial-themed web application designed to solve this problem. It allows users to:
1. Record and organize dream narratives with dates, times, vividness ratings (1–10), and emotional tags.
2. Persist entries reliably across server restarts using an ACID-compliant embedded **SQLite** database (`dreams.db`).
3. Deterministically extract keywords and identify dream motifs against a configurable symbol dictionary.
4. Count and rank recurring subconscious motifs in **average $O(1)$ time per operation** using an internal **Python Hash Map** (`dsa_hashmap.py`).
5. Visualize motif frequencies, emotion distributions, and activity timelines using interactive **Chart.js** charts.
6. Generate and download publication-quality **PDF reports** dynamically using ReportLab (`pdf_export.py`).

> **Ethical Note:** Dream interpretations in this application are strictly framed as subjective personal associations and Socratic self-reflective inquiries. The application makes no claim to scientific diagnostics or prophetic predictions.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------+
|                                CLIENT BROWSER                               |
|  +-----------------------------------------------------------------------+  |
|  |             Celestial Responsive UI (HTML5 / Vanilla CSS3)            |  |
|  |   - Universe Dashboard       - Journal Library (Search & Filter)     |  |
|  |   - Recurring Symbols View   - Emotional Landscape (Dual Charts)      |  |
|  |   - Dream Record & Edit      - Detail Modals & Inquiries             |  |
|  +-----------------------------------------------------------------------+  |
|  |             Interactive Visualizations & Dynamics (JS)               |  |
|  |   - Chart.js (Bar Charts, Doughnut Charts, Longitudinal Trends)       |  |
|  |   - HTML5 Canvas Starfield & Twinkling Constellation Animation        |  |
|  +-----------------------------------------------------------------------+  |
+--------------------------------------▲--------------------------------------+
                                       | REST API (JSON / HTTP)
+--------------------------------------▼--------------------------------------+
|                         FLASK APPLICATION SERVER (Python)                   |
|  +-----------------------------------------------------------------------+  |
|  | app.py: Routes, Controllers, JSON Serialization, Static Serving       |  |
|  +-----------------------------------------------------------------------+  |
|  | pdf_export.py: Dynamic Multi-Page PDF Generation (ReportLab)          |  |
|  +-----------------------------------------------------------------------+  |
|  | dream_analyzer.py: Tokenization, Stop-Word Removal, Symbol Lexicon    |  |
|  +-----------------------------------------------------------------------+  |
|  | dsa_hashmap.py: SymbolFrequencyCounter (Core Python dict / HashMap)   |  |
|  |                 - O(1) Key Hashing & Lookup                           |  |
|  |                 - Frequency Aggregation & Longitudinal Trends         |  |
|  +-----------------------------------------------------------------------+  |
|  | database.py: SQLite Storage Layer (CRUD, Table Indexing, Sample Seed) |  |
|  +-----------------------------------------------------------------------+  |
+--------------------------------------▲--------------------------------------+
                                       | SQL Queries / Transactions
+--------------------------------------▼--------------------------------------+
|                        PERSISTENT STORAGE (SQLite3)                         |
|                     dreams.db [Indexed by Date & Timestamp]                 |
+-----------------------------------------------------------------------------+
```
|  |   - HTML5 Canvas Starfield & Twinkling Constellation Animation        |  |
|  +-----------------------------------------------------------------------+  |
+--------------------------------------▲--------------------------------------+
                                       | REST API (JSON / HTTP)
+--------------------------------------▼--------------------------------------+
|                         FLASK APPLICATION SERVER (Python)                   |
|  +-----------------------------------------------------------------------+  |
|  | app.py: Routes, Controllers, JSON Serialization, Static Serving       |  |
|  +-----------------------------------------------------------------------+  |
|  | dream_analyzer.py: Tokenization, Stop-Word Removal, Symbol Lexicon    |  |
|  +-----------------------------------------------------------------------+  |
|  | dsa_hashmap.py: SymbolFrequencyCounter (Core Python dict / HashMap)   |  |
|  |                 - O(1) Key Hashing & Lookup                           |  |
|  |                 - Frequency Aggregation & Percentages                 |  |
|  |                 - Step-by-Step Educational Execution Tracer           |  |
|  +-----------------------------------------------------------------------+  |
|  | database.py: SQLite Storage Layer (CRUD, Table Indexing, Sample Seed) |  |
|  +-----------------------------------------------------------------------+  |
+--------------------------------------▲--------------------------------------+
                                       | SQL Queries / Transactions
+--------------------------------------▼--------------------------------------+
|                        PERSISTENT STORAGE (SQLite3)                         |
|                     dreams.db [Indexed by Date & Timestamp]                 |
+-----------------------------------------------------------------------------+
```

---

## 3. Project Structure

```
d:\dream journel decoder\
├── app.py                     # Flask web server, REST endpoints, and controllers
├── dsa_hashmap.py             # Core DSA Module: HashMap frequency counter & tracer
├── database.py                # SQLite database manager (CRUD, indexing, persistence)
├── dream_analyzer.py          # Pure Python tokenization, stop-words, and symbol matching
├── sample_data.py             # 10 rich demonstration dream narratives
├── test_app.py                # Automated test suite (CRUD, DSA, search, API)
├── requirements.txt           # Python dependencies (Flask>=3.0.0)
├── README.md                  # Comprehensive academic report & viva guide
├── static/
│   ├── css/
│   │   └── style.css          # Celestial theme (navy, violet, lavender, gold, glassmorphism)
│   └── js/
│       ├── stars.js           # Animated celestial canvas background
│       └── app.js             # Client controller, Chart.js integrations, modal managers
└── templates/
    └── index.html             # Single-page application template
```

---

## 4. Core DSA Concept: Hash Map / Python Dictionary

### 4.1 Underlying Implementation in CPython
In Python, dictionaries (`dict`) are implemented as high-performance hash tables utilizing:
1. **Hash Function:** CPython uses **SipHash-1-3** with per-process randomized keys to prevent hash collision denial-of-service attacks.
2. **Bucket Mapping:** The raw 64-bit hash code is mapped to an internal sparse array index via bitwise masking:
   $$\text{bucket\_index} = \text{hash\_code} \ \& \ (\text{capacity} - 1)$$
3. **Collision Resolution:** When two keys hash to the same bucket index, CPython resolves collisions using **open addressing with perturbational probing**:
   $$i = (5 \times i + 1 + \text{perturb}) \ \& \ \text{mask}$$
   This avoids linear clustering while retaining spatial cache locality.
4. **Memory Layout:** CPython 3.6+ separates dictionary entries into a compact dense array of tuples `(hash, key, value)` and a sparse hash-indexing table, reducing memory consumption by over 30%.

### 4.2 Application in Dream Journal Decoder
In `dsa_hashmap.py`, the `SymbolFrequencyCounter` processes all recorded dream entries to accumulate occurrences:

```python
def count_symbol_frequencies(self, dreams: List[Dict[str, Any]]) -> Dict[str, int]:
    self.symbol_frequencies.clear()
    for dream in dreams:
        for sym in dream.get("derived_symbols", []):
            name = sym.get("name")
            occurrences = sym.get("occurrences", 1)
            # Amortized O(1) hash lookup and increment
            self.symbol_frequencies[name] = self.symbol_frequencies.get(name, 0) + occurrences
    return self.symbol_frequencies
```

### 4.3 Time & Space Complexity Analysis

| Data Structure / Approach | Lookup / Insert Time | Full Aggregation Time ($M$ tokens) | Space Complexity |
| :--- | :--- | :--- | :--- |
| **Unsorted Linear Array** | $O(U)$ | $O(M \times U)$ | $O(U)$ |
| **Sorted Array + Binary Search** | $O(\log U)$ lookup, $O(U)$ insert | $O(M \times U)$ | $O(U)$ |
| **Self-Balancing BST (AVL/Red-Black)** | $O(\log U)$ | $O(M \log U)$ | $O(U)$ |
| **Hash Map / Python Dict (This Project)** | **$O(1)$ Average** | **$O(M)$ Linear** | **$O(U)$** |

Where:
- $M$ = Total number of symbol instances across all dreams.
- $U$ = Number of unique symbols stored (cardinality of the dictionary).
- In the worst case, hash collisions can degrade individual operations to $O(U)$, but randomized hashing makes this statistically negligible in practice.

---

## 5. Setup & Running the Application

### 5.1 Prerequisites
- Python 3.10+ (Tested on Python 3.11.4)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 5.2 Installation Steps

1. **Clone or navigate to the project directory:**
   ```powershell
   cd "d:\dream journel decoder"
   ```

2. **Install required dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Run the automated test suite:**
   ```powershell
   python test_app.py
   ```
   *Expected output: All 5 test suites pass with `OK`.*

4. **Launch the Flask application:**
   ```powershell
   python app.py
   ```

5. **Open in your browser:**
   ```
   http://127.0.0.1:5000
   ```

---

## 6. Verification & Test Cases

The project includes an automated test suite in `test_app.py` covering:

| Test ID | Test Name | Description | Status |
| :--- | :--- | :--- | :--- |
| `TC-01` | Text Analysis & Tokenization | Verifies normalization, stop-word removal, and symbol detection. | Passed |
| `TC-02` | HashMap Frequency Counter | Verifies $O(1)$ count accumulation and symbol ranking percentages. | Passed |
| `TC-03` | SQLite CRUD Operations | Verifies dream creation, retrieval, updates, and deletion in `dreams.db`. | Passed |
| `TC-04` | Search & Multi-factor Filter | Verifies SQL `LIKE` keyword search, emotion filtering, and sorting. | Passed |
| `TC-05` | Flask REST API Endpoints | Verifies `/`, `/api/dreams`, `/api/analytics`, `/api/analyze-live`, `/api/dsa/simulation`. | Passed |

---

## 7. Viva Voce Examination Questions & Answers (CSE Mini-Project)

### Q1: What is the primary data structure utilized in this project?
**Answer:** The primary data structure is a **Hash Map**, implemented as Python's built-in `dict`. It is used in `dsa_hashmap.py` to aggregate symbol and keyword frequencies across all recorded dreams in average $O(1)$ time per operation.

### Q2: What is a Hash Table, and how does it achieve constant-time lookup?
**Answer:** A Hash Table is an associative data structure that stores key-value pairs. It computes a numerical hash code from the key using a hash function, maps that hash code to an array index via modulo masking, and directly accesses the corresponding bucket. Because array indexing by memory offset is $O(1)$, key lookups, insertions, and updates achieve constant-time performance on average.

### Q3: What is the time complexity of counting symbol frequencies across $N$ dreams?
**Answer:** Let $M$ be the total number of symbol occurrences across all $N$ dreams, and $U$ be the number of unique symbols. Since each dictionary lookup and update takes $O(1)$ amortized time, the entire aggregation process runs in **$O(M)$ linear time**. Sorting the top symbols for display takes $O(U \log U)$ time, which is negligible since $U$ is small ($\le 50$).

### Q4: How does CPython resolve hash collisions in dictionaries?
**Answer:** CPython uses **open addressing with perturbational probing**. Unlike separate chaining (which uses linked lists for each bucket), open addressing stores all entries directly in a contiguous array. When a collision occurs, a deterministic recurrence formula incorporating the upper bits of the hash code (the perturb value) calculates the sequence of candidate bucket indices until an empty slot is located.

### Q5: Why is a Hash Map superior to an unsorted array or a binary search tree for this application?
**Answer:**
- **Versus an Unsorted Array:** To increment a count in an array, you must perform a linear scan ($O(U)$) to check if the symbol already exists. For $M$ occurrences, this results in $O(M \times U)$ quadratic time.
- **Versus a Balanced BST:** A balanced tree (e.g., Red-Black or AVL) requires $O(\log U)$ comparisons per lookup, resulting in $O(M \log U)$ time.
- **Hash Map:** Provides direct $O(1)$ average access, giving the fastest theoretical and practical performance ($O(M)$).

### Q6: How does the application ensure persistence across page refreshes and server restarts?
**Answer:** Entries are persisted in an embedded **SQLite3** database (`dreams.db`). The database schema includes typed columns for title, narrative, date, vividness, and reflection, while JSON text fields store dynamic lists (emotions, tags, detected symbols). B-tree indexes on `dream_date` and `created_at` ensure rapid queries and sorting.

### Q7: What is the role of `dream_analyzer.py`?
**Answer:** `dream_analyzer.py` handles deterministic text processing:
1. Normalizes text by lowercasing and stripping punctuation.
2. Tokenizes sentences into clean words.
3. Removes over 150 English stop-words.
4. Matches tokens and phrases against a curated 50+ symbol dictionary using regex word boundaries.
5. Calculates astronomical moon phases based on the dream date.

### Q8: What prevents false-positive symbol matches (e.g., matching "water" inside "watermelon")?
**Answer:** The analyzer uses regular expression word boundaries (`\bkeyword\b`). This ensures that only standalone words or exact lexical tokens trigger a match, preventing substring collisions.

### Q9: What happens if two dreams share the same symbol?
**Answer:** The `SymbolFrequencyCounter` checks whether the symbol key exists in the dictionary. If it exists, it increments the count: `freq[symbol] = freq.get(symbol, 0) + occurrences`. It also appends the dream's ID and title to an inverted index dictionary `symbol_to_dreams_map[symbol]`, enabling reverse lookups.

### Q10: How are client-side charts rendered?
**Answer:** The frontend fetches the processed frequency dictionary from the `/api/analytics` Flask endpoint and renders interactive canvas visualizations using **Chart.js** (bar charts for symbol frequencies, doughnut charts for emotions, and line charts for activity timelines).

---

## 8. Future Enhancements

1. **TF-IDF & N-gram Analysis:** Implement Term Frequency-Inverse Document Frequency weighting to highlight symbols that are uniquely significant to an individual dreamer compared to the general baseline.
2. **Audio Dictation:** Integrate the Web Speech API so users waking up in the middle of the night can speak their dreams aloud for automatic transcription.
3. **Encrypted Journal Vault:** Add client-side AES-256 encryption before writing records to SQLite, ensuring total privacy for sensitive dreams.

---

## 9. Conclusion
The **Dream Journal Decoder** successfully demonstrates how core computer science concepts—specifically the **Hash Map** data structure and **SQLite relational persistence**—can be applied to text analytics and self-reflective journaling. By combining rigorous backend algorithmic design in Python with a cinematic celestial user interface, the project fulfills all academic criteria for a second-year CSE mini-project evaluation.
