"""
=============================================================================
DREAM JOURNAL DECODER - TEST SUITE
=============================================================================
Tests all CRUD operations, SQLite persistence, Python HashMap frequency
counter, search/filter algorithms, and Flask API endpoints.
=============================================================================
"""

import unittest
import json
import os
import database as db
from dsa_hashmap import symbol_counter
from dream_analyzer import analyze_dream, detect_symbols
from app import app


class TestDreamJournalDecoder(unittest.TestCase):

    def setUp(self):
        """Set up test environment and test client."""
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        # Ensure database is initialized
        db.init_db()

    def test_01_text_analysis_and_symbol_matching(self):
        """Test pure Python text tokenization and symbol detection."""
        text = "I was swimming in deep ocean water beneath aColossal ticking clock tower in a dark forest."
        analysis = analyze_dream("Test Dream", text, "2026-10-14")

        symbols = [s["name"] for s in analysis["detected_symbols"]]
        self.assertIn("Water & Oceans", symbols)
        self.assertIn("Clocks & Time", symbols)
        self.assertIn("Forest & Trees", symbols)
        self.assertGreater(analysis["word_count"], 0)
        self.assertIn("moon_phase", analysis)
        print("[OK] Passed: Text analysis & deterministic symbol matching.")

    def test_02_hashmap_frequency_counter(self):
        """Test DSA HashMap frequency accumulation and O(1) operations."""
        sample_dreams = [
            {
                "id": "t1",
                "title": "Dream 1",
                "derived_symbols": [
                    {"name": "Water & Oceans", "occurrences": 2},
                    {"name": "Flight & Soaring", "occurrences": 1}
                ],
                "selected_emotions": ["Wonder", "Peace"]
            },
            {
                "id": "t2",
                "title": "Dream 2",
                "derived_symbols": [
                    {"name": "Water & Oceans", "occurrences": 3},
                    {"name": "Forest & Trees", "occurrences": 1}
                ],
                "selected_emotions": ["Wonder"]
            }
        ]

        freq_map = symbol_counter.count_symbol_frequencies(sample_dreams)
        self.assertEqual(freq_map["Water & Oceans"], 5)
        self.assertEqual(freq_map["Flight & Soaring"], 1)
        self.assertEqual(freq_map["Forest & Trees"], 1)

        rankings = symbol_counter.get_symbol_ranking()
        self.assertEqual(rankings[0]["symbol"], "Water & Oceans")
        self.assertEqual(rankings[0]["count"], 5)

        emotion_map = symbol_counter.count_emotion_frequencies(sample_dreams)
        self.assertEqual(emotion_map["Wonder"], 2)
        self.assertEqual(emotion_map["Peace"], 1)
        print("[OK] Passed: DSA HashMap symbol & emotion frequency counting.")

    def test_03_sqlite_crud_operations(self):
        """Test database persistence across connections."""
        test_payload = {
            "title": "Persistent Test Dream",
            "narrative": "Flying over an infinite mirrored sea with glowing stars reflecting beneath my feet.",
            "dream_date": "2026-10-14",
            "dream_time": "05:15",
            "selected_emotions": ["Euphoria", "Wonder"],
            "vividness": 9,
            "tags": ["flight", "mirror", "stars"],
            "reflection": "Felt completely liberated."
        }

        # 1. Create
        created = db.create_dream(test_payload, is_sample=0)
        dream_id = created["id"]
        self.assertIsNotNone(dream_id)
        self.assertEqual(created["title"], "Persistent Test Dream")

        # 2. Read
        fetched = db.get_dream_by_id(dream_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["title"], "Persistent Test Dream")
        self.assertEqual(fetched["vividness"], 9)

        # 3. Update
        updated = db.update_dream(dream_id, {
            "title": "Updated Persistent Dream",
            "vividness": 10
        })
        self.assertEqual(updated["title"], "Updated Persistent Dream")
        self.assertEqual(updated["vividness"], 10)

        # 4. Delete
        deleted = db.delete_dream(dream_id)
        self.assertTrue(deleted)
        self.assertIsNone(db.get_dream_by_id(dream_id))
        print("[OK] Passed: SQLite CRUD operations and persistence.")

    def test_04_search_and_filter(self):
        """Test SQL query filtering by keyword, emotion, and sort order."""
        # Seed samples if needed
        db.seed_sample_dreams()

        # Search for "water"
        water_results = db.get_all_dreams(search="water")
        self.assertGreater(len(water_results), 0)

        # Filter by Emotion
        wonder_results = db.get_all_dreams(emotion="Wonder")
        self.assertGreater(len(wonder_results), 0)
        for d in wonder_results:
            self.assertIn("Wonder", d["selected_emotions"])

        # Sort by title
        title_sorted = db.get_all_dreams(sort_by="title")
        titles = [d["title"].lower() for d in title_sorted]
        self.assertEqual(titles, sorted(titles))
        print("[OK] Passed: Search, emotion filtering, and sorting.")

    def test_05_flask_api_endpoints(self):
        """Test Flask REST API routes."""
        # GET /
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)

        # GET /api/dreams
        res = self.client.get("/api/dreams")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("dreams", data)

        # GET /api/analytics
        res = self.client.get("/api/analytics")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertIn("symbol_frequencies", data)
        self.assertIn("timeline", data)

        # POST /api/analyze-live
        res = self.client.post("/api/analyze-live", json={
            "title": "Sky Flight",
            "narrative": "I was flying and soaring through mountain clouds."
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])

        # GET /api/export/pdf
        res = self.client.get("/api/export/pdf")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, "application/pdf")
        self.assertGreater(len(res.data), 1000)

        # GET /api/export/json
        res = self.client.get("/api/export/json")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("dreams", data)
        print("[OK] Passed: All Flask REST API endpoints including PDF export.")


if __name__ == "__main__":
    unittest.main()
