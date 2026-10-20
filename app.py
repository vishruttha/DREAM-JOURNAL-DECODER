"""
=============================================================================
DREAM JOURNAL DECODER - FLASK WEB APPLICATION & REST API
=============================================================================
Backend: Python 3 + Flask + SQLite
Primary Capabilities:
  - Dream Journal CRUD with persistent SQLite storage
  - Deterministic dream symbol matching & keyword extraction
  - Recurring symbol frequency analytics powered by Python dictionary
  - Emotional landscape distribution and longitudinal trends
  - Publication-grade PDF report export with ReportLab
=============================================================================
"""

import os
import json
import time
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file, Response

import database as db
from dsa_hashmap import symbol_counter
from dream_analyzer import analyze_dream, calculate_moon_phase, DREAM_SYMBOLS
from pdf_export import generate_journal_pdf

app = Flask(__name__, static_folder="static", template_folder="templates")

# Initialize SQLite database on startup
db.init_db()

# Auto-seed sample data if database is empty on first run
if db.count_dreams() == 0:
    db.seed_sample_dreams()


# ---------------------------------------------------------------------------
# HTML PAGES
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Serves the celestial SPA dashboard."""
    return render_template("index.html")


# ---------------------------------------------------------------------------
# DREAM CRUD API
# ---------------------------------------------------------------------------
@app.route("/api/dreams", methods=["GET"])
def api_get_dreams():
    """Retrieves all dreams with optional search, emotion filter, and sort order."""
    search = request.args.get("search", "")
    emotion = request.args.get("emotion", "")
    sort_by = request.args.get("sort", "newest")

    dreams = db.get_all_dreams(search=search, emotion=emotion, sort_by=sort_by)
    return jsonify({
        "success": True,
        "count": len(dreams),
        "dreams": dreams
    })


@app.route("/api/dreams/<dream_id>", methods=["GET"])
def api_get_dream(dream_id):
    """Retrieves a single dream record by ID."""
    dream = db.get_dream_by_id(dream_id)
    if not dream:
        return jsonify({"success": False, "error": "Dream not found"}), 404
    return jsonify({"success": True, "dream": dream})


@app.route("/api/dreams", methods=["POST"])
def api_create_dream():
    """Creates and analyzes a new dream record, saving to SQLite."""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    narrative = data.get("narrative", "").strip()

    if not title:
        return jsonify({"success": False, "error": "Dream title is required"}), 400
    if not narrative:
        return jsonify({"success": False, "error": "Dream narrative is required"}), 400

    created = db.create_dream(data, is_sample=0)
    return jsonify({"success": True, "dream": created}), 201


@app.route("/api/dreams/<dream_id>", methods=["PUT"])
def api_update_dream(dream_id):
    """Updates an existing dream record and re-analyzes its text."""
    data = request.get_json() or {}
    updated = db.update_dream(dream_id, data)
    if not updated:
        return jsonify({"success": False, "error": "Dream not found or update failed"}), 404
    return jsonify({"success": True, "dream": updated})


@app.route("/api/dreams/<dream_id>", methods=["DELETE"])
def api_delete_dream(dream_id):
    """Deletes a dream record from SQLite."""
    success = db.delete_dream(dream_id)
    if not success:
        return jsonify({"success": False, "error": "Dream not found"}), 404
    return jsonify({"success": True, "message": "Dream deleted successfully"})


# ---------------------------------------------------------------------------
# ANALYTICS API (SYMBOLS, EMOTIONS & TIMELINES)
# ---------------------------------------------------------------------------
@app.route("/api/analytics", methods=["GET"])
def api_get_analytics():
    """
    Computes all dream analytics: symbol frequencies, emotion landscape,
    longitudinal emotion trends, and activity timelines.
    """
    dreams = db.get_all_dreams(sort_by="newest")

    # 1. Symbol frequencies & rankings
    symbol_freq_map = symbol_counter.count_symbol_frequencies(dreams)
    symbol_rankings = symbol_counter.get_symbol_ranking()

    # 2. Emotion frequencies, rankings & timeline trends
    emotion_freq_map = symbol_counter.count_emotion_frequencies(dreams)
    emotion_rankings = symbol_counter.get_emotion_ranking()
    emotion_timeline = symbol_counter.get_emotion_timeline(dreams)

    # 3. Top keywords
    top_keywords = symbol_counter.count_keyword_frequencies(dreams, top_n=12)

    # 4. Activity timeline & streak calculation
    timeline_map = {}
    for d in dreams:
        date_key = d.get("dream_date", "")
        if date_key:
            timeline_map[date_key] = timeline_map.get(date_key, 0) + 1

    sorted_dates = sorted(timeline_map.keys(), reverse=True)
    streak = 0
    if sorted_dates:
        today_date = datetime.now().date()
        try:
            latest_date = datetime.strptime(sorted_dates[0], "%Y-%m-%d").date()
            diff = (today_date - latest_date).days
            if diff <= 1:
                streak = 1
                curr_date = latest_date
                for prev_str in sorted_dates[1:]:
                    prev_date = datetime.strptime(prev_str, "%Y-%m-%d").date()
                    if (curr_date - prev_date).days == 1:
                        streak += 1
                        curr_date = prev_date
                    else:
                        break
        except Exception:
            streak = 1

    # 5. Average Vividness
    avg_vividness = 0.0
    if dreams:
        avg_vividness = round(sum(d.get("vividness", 5) for d in dreams) / len(dreams), 1)

    # 6. Natural, Reflective Emerging Patterns (No academic jargon)
    emerging_patterns = []
    if symbol_rankings:
        top_sym = symbol_rankings[0]
        distinct_d = top_sym.get("distinct_dreams_count", 1)
        emerging_patterns.append(
            f"'{top_sym['symbol']}' is your most prominent recurring motif, appearing in {distinct_d} dream{'s' if distinct_d != 1 else ''} ({top_sym['count']} total occurrences)."
        )

    if emotion_rankings:
        top_emo = emotion_rankings[0]
        emerging_patterns.append(
            f"'{top_emo['emotion']}' is your dominant emotional current, felt in {top_emo['percentage']}% of your recorded entries."
        )

    water_dreams = [d for d in dreams if any(s.get("symbol_id") == "water" for s in d.get("derived_symbols", []))]
    if len(water_dreams) >= 2:
        emerging_patterns.append(
            f"Water and ocean motifs appear in {len(water_dreams)} dreams, highlighting themes of emotional depth, adaptability, and intuitive immersion."
        )

    if avg_vividness >= 7.5:
        emerging_patterns.append(
            f"High clarity index: your average dream vividness is {avg_vividness}/10, reflecting strong sensory recall and lucidity."
        )

    if len(emerging_patterns) < 3 and dreams:
        emerging_patterns.append(
            f"Your personal journal holds {len(dreams)} reflective dream entries safely archived."
        )

    top_sym_name = symbol_rankings[0]["symbol"] if symbol_rankings else "None"
    top_sym_count = symbol_rankings[0]["count"] if symbol_rankings else 0
    top_sym_dreams = symbol_rankings[0].get("distinct_dreams_count", 0) if symbol_rankings else 0

    top_emo_name = emotion_rankings[0]["emotion"] if emotion_rankings else "None"
    top_emo_count = emotion_rankings[0]["count"] if emotion_rankings else 0

    return jsonify({
        "success": True,
        "metrics": {
            "total_dreams": len(dreams),
            "journaling_streak": streak,
            "average_vividness": avg_vividness,
            "top_symbol": top_sym_name,
            "top_symbol_count": top_sym_count,
            "top_symbol_dreams": top_sym_dreams,
            "top_emotion": top_emo_name,
            "top_emotion_count": top_emo_count
        },
        "symbol_frequencies": symbol_freq_map,
        "symbol_rankings": symbol_rankings,
        "emotion_frequencies": emotion_freq_map,
        "emotion_rankings": emotion_rankings,
        "emotion_timeline": emotion_timeline,
        "top_keywords": top_keywords,
        "timeline": [{"date": k, "count": timeline_map[k]} for k in sorted(timeline_map.keys())],
        "emerging_patterns": emerging_patterns
    })


@app.route("/api/analyze-live", methods=["POST"])
def api_analyze_live():
    """Live deterministic analysis endpoint for real-time editor feedback."""
    data = request.get_json() or {}
    title = data.get("title", "")
    narrative = data.get("narrative", "")
    date_str = data.get("dream_date", "")

    analysis = analyze_dream(title, narrative, date_str)
    return jsonify({"success": True, "analysis": analysis})


# ---------------------------------------------------------------------------
# EXPORT API (PDF & JSON BACKUP)
# ---------------------------------------------------------------------------
@app.route("/api/export/pdf", methods=["GET"])
def api_export_pdf():
    """
    Generates and downloads an elegant, publication-quality PDF report
    containing all dream narratives, recurring symbols, and overview analytics.
    Supports both direct download (as_attachment) and inline browser preview (?view=1).
    """
    dreams = db.get_all_dreams(sort_by="oldest")
    symbol_counter.count_symbol_frequencies(dreams)
    symbol_rankings = symbol_counter.get_symbol_ranking()

    pdf_buffer = generate_journal_pdf(dreams, symbol_rankings)
    today_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"Dream_Journal_Report_{today_str}.pdf"

    inline = request.args.get("view", "0").lower() in ("1", "true", "yes", "inline")
    response = send_file(
        pdf_buffer,
        as_attachment=not inline,
        download_name=filename,
        mimetype="application/pdf"
    )
    disp = "inline" if inline else "attachment"
    response.headers["Content-Disposition"] = f'{disp}; filename="{filename}"'
    return response


@app.route("/api/export/json", methods=["GET"])
def api_export_json():
    """Secondary action: exports raw SQLite records as JSON backup."""
    dreams = db.get_all_dreams(sort_by="newest")
    payload = {
        "project": "Dream Journal Decoder",
        "exported_at": datetime.now().isoformat(),
        "total_dreams": len(dreams),
        "dreams": dreams
    }
    today_str = datetime.now().strftime("%Y-%m-%d")
    return Response(
        json.dumps(payload, indent=2),
        mimetype="application/json",
        headers={"Content-Disposition": f"attachment;filename=dream_journal_backup_{today_str}.json"}
    )


# ---------------------------------------------------------------------------
# SAMPLE DATA & DATABASE MANAGEMENT API
# ---------------------------------------------------------------------------
@app.route("/api/sample/load", methods=["POST"])
def api_load_sample_data():
    """Loads 10 sample dreams into SQLite."""
    count = db.seed_sample_dreams()
    return jsonify({"success": True, "message": f"Loaded {count} sample dreams into SQLite"})


@app.route("/api/sample/clear", methods=["POST"])
def api_clear_sample_data():
    """Clears sample dreams, keeping user dreams intact."""
    count = db.clear_sample_dreams()
    return jsonify({"success": True, "message": f"Cleared {count} sample dreams from SQLite"})


@app.route("/api/dreams/clear-all", methods=["POST"])
def api_clear_all_data():
    """Clears all dreams from SQLite."""
    count = db.clear_all_dreams()
    return jsonify({"success": True, "message": f"Cleared all {count} dreams from SQLite"})


if __name__ == "__main__":
    print(">> Starting Dream Journal Decoder on http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=False)
