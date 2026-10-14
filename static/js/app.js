/**
 * ============================================================================
 * DREAM JOURNAL DECODER - CLIENT CONTROLLER & CHART.JS INTEGRATION
 * ============================================================================
 * Manages UI navigation, Chart.js instances (Symbols, Emotions, Timeline),
 * interactive symbol & emotion filtering, CRUD modals, and Flask API calls.
 * ============================================================================
 */

// Application State
const AppState = {
  currentTab: 'dashboard',
  dreams: [],
  analytics: null,
  activeDream: null,
  editingDreamId: null,
  activeFilter: {
    type: null, // 'emotion' | 'symbol' | null
    value: null
  },
  charts: {
    symbols: null,
    emotions: null,
    emotionsLarge: null,
    emotionsTrend: null,
    timeline: null,
  }
};

// Emotion Palette Mapping
const EMOTION_COLORS = {
  Wonder: '#8b5cf6',
  Peace: '#38bdf8',
  Joy: '#10b981',
  Euphoria: '#d946ef',
  Melancholy: '#6366f1',
  Anxiety: '#f59e0b',
  Confusion: '#ec4899',
  Fear: '#ef4444',
  Default: '#a78bfa'
};

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadAllData();
});

function initEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Action Buttons
  document.getElementById('btn-new-dream')?.addEventListener('click', () => openDreamModal());
  document.getElementById('btn-hero-record')?.addEventListener('click', () => openDreamModal());
  document.getElementById('btn-load-sample')?.addEventListener('click', loadSampleData);
  document.getElementById('btn-clear-sample')?.addEventListener('click', clearSampleData);
  document.getElementById('btn-clear-all')?.addEventListener('click', clearAllData);
  document.getElementById('btn-clear-filter')?.addEventListener('click', clearActiveFilter);

  // Dropdown Options Menu Toggle & Click Outside
  const dropdownOptions = document.getElementById('dropdown-options');
  const btnOptionsToggle = document.getElementById('btn-options-toggle');
  if (dropdownOptions && btnOptionsToggle) {
    btnOptionsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = dropdownOptions.classList.toggle('active');
      btnOptionsToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!dropdownOptions.contains(e.target)) {
        dropdownOptions.classList.remove('active');
        btnOptionsToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close when selecting any option inside
    dropdownOptions.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        dropdownOptions.classList.remove('active');
        btnOptionsToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Search & Filter in Journal
  const searchInput = document.getElementById('search-input');
  const emotionFilter = document.getElementById('emotion-filter');
  const sortSelect = document.getElementById('sort-select');

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchDreams(), 250);
    });
  }

  if (emotionFilter) {
    emotionFilter.addEventListener('change', () => {
      AppState.activeFilter.type = emotionFilter.value ? 'emotion' : null;
      AppState.activeFilter.value = emotionFilter.value || null;
      updateFilterBanner();
      fetchDreams();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => fetchDreams());
  }

  // Live Analysis in Editor
  const narrativeInput = document.getElementById('form-narrative');
  if (narrativeInput) {
    let liveTimer;
    narrativeInput.addEventListener('input', () => {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(runLiveAnalysis, 350);
      updateWordCounts();
    });
  }

  // Dream Form Submission
  const dreamForm = document.getElementById('dream-form');
  if (dreamForm) {
    dreamForm.addEventListener('submit', handleDreamFormSubmit);
  }
}

// ---------------------------------------------------------------------------
// TAB NAVIGATION
// ---------------------------------------------------------------------------
function switchTab(tabName) {
  AppState.currentTab = tabName;

  // Update nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Update view sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) {
    activeView.style.display = 'block';
  }

  // If switching to emotions tab, re-render the emotion charts to ensure proper canvas sizing
  if (tabName === 'emotions' && AppState.analytics) {
    renderLargeEmotionCharts(AppState.analytics);
  }
}

// ---------------------------------------------------------------------------
// DATA FETCHING & SYNCHRONIZATION
// ---------------------------------------------------------------------------
async function loadAllData() {
  await Promise.all([
    fetchDreams(),
    fetchAnalytics(),
  ]);
}

async function fetchDreams() {
  try {
    const search = document.getElementById('search-input')?.value || '';
    const emotion = AppState.activeFilter.type === 'emotion' ? AppState.activeFilter.value : (document.getElementById('emotion-filter')?.value || '');
    const sort = document.getElementById('sort-select')?.value || 'newest';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (emotion) params.append('emotion', emotion);
    if (sort) params.append('sort', sort);

    const res = await fetch(`/api/dreams?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      AppState.dreams = data.dreams;
      renderDreamsList(data.dreams);
      renderRecentDreams(data.dreams.slice(0, 4));
    }
  } catch (err) {
    console.error('Error fetching dreams:', err);
  }
}

async function fetchAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();

    if (data.success) {
      AppState.analytics = data;
      renderDashboardMetrics(data.metrics, data.emerging_patterns);
      renderDashboardSymbolPatterns(data.symbol_rankings);
      renderCharts(data);
      renderSymbolsList(data.symbol_rankings);
      renderEmotionPills(data.emotion_rankings);
    }
  } catch (err) {
    console.error('Error fetching analytics:', err);
  }
}

// ---------------------------------------------------------------------------
// DASHBOARD RENDERING
// ---------------------------------------------------------------------------
function renderDashboardMetrics(metrics, patterns) {
  if (!metrics) return;

  document.getElementById('metric-total').textContent = metrics.total_dreams;
  document.getElementById('metric-streak').textContent = `${metrics.journaling_streak} d`;

  // Top Symbol with friendly language
  const topSymEl = document.getElementById('metric-top-symbol');
  const topSymCountEl = document.getElementById('metric-symbol-count');
  if (topSymEl) topSymEl.textContent = metrics.top_symbol;
  if (topSymCountEl) {
    if (metrics.top_symbol !== 'None') {
      const distinctText = metrics.top_symbol_dreams ? `Appeared in ${metrics.top_symbol_dreams} dream${metrics.top_symbol_dreams !== 1 ? 's' : ''}` : `${metrics.top_symbol_count} occurrences`;
      topSymCountEl.textContent = distinctText;
    } else {
      topSymCountEl.textContent = 'No motifs recorded yet';
    }
  }

  // Dominant Emotion
  const topEmoEl = document.getElementById('metric-top-emotion');
  const topEmoCountEl = document.getElementById('metric-emotion-count');
  if (topEmoEl) topEmoEl.textContent = metrics.top_emotion;
  if (topEmoCountEl) {
    if (metrics.top_emotion !== 'None') {
      topEmoCountEl.textContent = `Felt in ${metrics.top_emotion_count} recorded dream${metrics.top_emotion_count !== 1 ? 's' : ''}`;
    } else {
      topEmoCountEl.textContent = 'No emotions selected yet';
    }
  }

  // Average Vividness
  document.getElementById('metric-vividness').textContent = `${metrics.average_vividness} / 10`;

  // Emerging patterns list
  const container = document.getElementById('patterns-list');
  if (container && patterns) {
    if (patterns.length === 0) {
      container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-dim);">Record dreams to generate reflective subconscious observations.</p>';
    } else {
      container.innerHTML = patterns.map(p => `
        <div style="padding: 0.85rem; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 10px; font-size: 0.82rem; color: #e2e8f0; margin-bottom: 0.6rem; display: flex; gap: 0.6rem; align-items: flex-start;">
          <span style="color: #a78bfa;">✦</span>
          <span>${escapeHtml(p)}</span>
        </div>
      `).join('');
    }
  }
}

// ---------------------------------------------------------------------------
// PATTERNS IN YOUR DREAMS (RECURRING SYMBOLS ON DASHBOARD)
// ---------------------------------------------------------------------------
function renderDashboardSymbolPatterns(rankings) {
  const container = document.getElementById('dashboard-symbols-pattern-grid');
  if (!container) return;

  if (!rankings || rankings.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1;" class="celestial-empty-state">
        <div class="empty-state-icon">🔮</div>
        <div class="empty-state-title">No Recurring Motifs Identified Yet</div>
        <p class="empty-state-text">
          As you record dreams containing motifs like water, flying, clocks, or forests, recurring patterns will automatically emerge here.
        </p>
        <button class="btn-primary" onclick="openDreamModal()">
          <span>+</span> Record Your First Dream
        </button>
      </div>
    `;
    return;
  }

  const topItems = rankings.slice(0, 4);
  const maxCount = topItems[0]?.count || 1;

  container.innerHTML = topItems.map(item => {
    const distinct = item.distinct_dreams_count || 1;
    const pct = Math.round((item.count / maxCount) * 100);

    return `
      <div class="symbol-pattern-card" onclick="filterJournalBySymbol('${escapeHtml(item.symbol)}')">
        <div>
          <div class="symbol-card-header">
            <span class="symbol-card-title">✨ ${escapeHtml(item.symbol)}</span>
            <span class="symbol-card-stat">${item.count} total</span>
          </div>
          <p class="symbol-card-desc">
            Appeared across <strong>${distinct}</strong> dream${distinct !== 1 ? 's' : ''} (${item.percentage}% share)
          </p>
        </div>
        <div>
          <div class="symbol-progress-bar">
            <div class="symbol-progress-fill" style="width: ${pct}%;"></div>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; font-size: 0.72rem; color: var(--accent-lavender);">
            Explore dreams &rarr;
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentDreams(recent) {
  const container = document.getElementById('recent-dreams-grid');
  if (!container) return;

  if (recent.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem 1rem; color: var(--text-dim); font-size: 0.85rem;">
        No dreams recorded yet. Click "Record a Dream" to begin your celestial journal.
      </div>
    `;
    return;
  }

  container.innerHTML = recent.map(d => `
    <div class="dream-card" onclick="openDreamDetailModal('${d.id}')">
      <div>
        <div class="dream-meta">
          <span>📅 ${d.dream_date}</span>
          <span style="color: #c4b5fd;">Vividness: ${d.vividness}/10</span>
        </div>
        <h4 class="dream-title">${escapeHtml(d.title)}</h4>
        <p class="dream-snippet">${escapeHtml(d.narrative)}</p>
      </div>
      <div>
        <div class="dream-tags">
          ${(d.derived_symbols || []).slice(0, 2).map(s => `
            <span class="symbol-badge">✨ ${escapeHtml(s.name)}</span>
          `).join('')}
          ${(d.selected_emotions || []).slice(0, 2).map(e => `
            <span class="tag-pill" style="border-color: rgba(251, 191, 36, 0.3); color: #fde047;">${escapeHtml(e)}</span>
          `).join('')}
        </div>
        <div style="font-size: 0.75rem; color: var(--accent-lavender); display: flex; justify-content: flex-end;">
          Read Full Narrative &rarr;
        </div>
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// DREAM LIBRARY RENDERING
// ---------------------------------------------------------------------------
function renderDreamsList(dreams) {
  const container = document.getElementById('all-dreams-grid');
  const countEl = document.getElementById('journal-count');
  if (countEl) countEl.textContent = `${dreams.length} recorded`;

  if (!container) return;

  if (dreams.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1;" class="celestial-empty-state">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">No Matching Dreams Found</div>
        <p class="empty-state-text">
          No entries matched your current search and filter criteria. Try clearing filters or recording a new dream.
        </p>
        <button class="btn-primary" onclick="clearActiveFilter()">
          Clear Active Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = dreams.map(d => `
    <div class="dream-card">
      <div onclick="openDreamDetailModal('${d.id}')">
        <div class="dream-meta">
          <span>📅 ${d.dream_date} ${d.dream_time ? '&bull; ' + d.dream_time : ''}</span>
          <span style="color: var(--accent-lavender);">Vividness ${d.vividness}/10</span>
        </div>
        <h4 class="dream-title">${escapeHtml(d.title)}</h4>
        <p class="dream-snippet">${escapeHtml(d.narrative)}</p>
        
        <div class="dream-tags">
          ${(d.derived_symbols || []).map(s => `
            <span class="symbol-badge" onclick="event.stopPropagation(); filterJournalBySymbol('${escapeHtml(s.name)}')">✨ ${escapeHtml(s.name)} (${s.occurrences})</span>
          `).join('')}
          ${(d.selected_emotions || []).map(e => `
            <span class="tag-pill" style="border-color: rgba(251, 191, 36, 0.4); color: #fde047;" onclick="event.stopPropagation(); filterJournalByEmotion('${escapeHtml(e)}')">🎭 ${escapeHtml(e)}</span>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-top: 0.5rem;">
        <span style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">${d.word_count || 0} words</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;" onclick="openDreamModal('${d.id}')">Edit</button>
          <button class="btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.75rem; color: #f87171;" onclick="deleteDream('${d.id}', '${escapeHtml(d.title)}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// SYMBOLS EXPLORER VIEW RENDERING
// ---------------------------------------------------------------------------
function renderSymbolsList(rankings) {
  const container = document.getElementById('symbols-table-body');
  if (!container || !rankings) return;

  if (rankings.length === 0) {
    container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2.5rem;">No dream symbols detected yet. Record entries with narratives to populate motifs.</td></tr>`;
    return;
  }

  container.innerHTML = rankings.map((r, idx) => {
    const distinct = r.distinct_dreams_count || 1;
    return `
      <tr>
        <td style="font-family: var(--font-mono); color: var(--accent-lavender);">${idx + 1}</td>
        <td style="font-weight: 600; color: #ffffff;">✨ ${escapeHtml(r.symbol)}</td>
        <td style="font-family: var(--font-mono);">${r.count} total</td>
        <td style="color: #cbd5e1;">Appeared in ${distinct} dream${distinct !== 1 ? 's' : ''}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
              <div style="width: ${r.percentage}%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #38bdf8);"></div>
            </div>
            <span style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted);">${r.percentage}%</span>
          </div>
        </td>
        <td style="text-align: right;">
          <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.72rem;" onclick="filterJournalBySymbol('${escapeHtml(r.symbol)}')">
            Filter Dreams &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// EMOTION PILLS & FILTERING
// ---------------------------------------------------------------------------
function renderEmotionPills(emotionRankings) {
  const dashboardPills = document.getElementById('dashboard-emotion-pills');
  const emotionsPills = document.getElementById('emotions-interactive-pills');

  if (!emotionRankings || emotionRankings.length === 0) {
    if (dashboardPills) dashboardPills.innerHTML = '';
    if (emotionsPills) emotionsPills.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim);">No emotions logged yet.</span>';
    return;
  }

  const html = emotionRankings.map(r => {
    const color = EMOTION_COLORS[r.emotion] || EMOTION_COLORS.Default;
    return `
      <button class="emotion-interactive-pill" onclick="filterJournalByEmotion('${escapeHtml(r.emotion)}')">
        <span class="emotion-dot" style="background-color: ${color};"></span>
        <span>${escapeHtml(r.emotion)}</span>
        <span style="font-family: var(--font-mono); font-size: 0.7rem; opacity: 0.7;">(${r.count})</span>
      </button>
    `;
  }).join('');

  if (dashboardPills) dashboardPills.innerHTML = html;
  if (emotionsPills) emotionsPills.innerHTML = html;
}

function filterJournalByEmotion(emotionName) {
  AppState.activeFilter.type = 'emotion';
  AppState.activeFilter.value = emotionName;

  const emotionFilter = document.getElementById('emotion-filter');
  if (emotionFilter) emotionFilter.value = emotionName;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  updateFilterBanner();
  switchTab('journal');
  fetchDreams();
}

function filterJournalBySymbol(symbolName) {
  AppState.activeFilter.type = 'symbol';
  AppState.activeFilter.value = symbolName;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = symbolName;

  const emotionFilter = document.getElementById('emotion-filter');
  if (emotionFilter) emotionFilter.value = '';

  updateFilterBanner();
  switchTab('journal');
  fetchDreams();
}

function updateFilterBanner() {
  const banner = document.getElementById('journal-active-filter-bar');
  const badge = document.getElementById('journal-filter-badge');

  if (AppState.activeFilter.type && AppState.activeFilter.value) {
    if (banner && badge) {
      banner.style.display = 'flex';
      badge.textContent = `${AppState.activeFilter.type.toUpperCase()}: ${AppState.activeFilter.value}`;
    }
  } else {
    if (banner) banner.style.display = 'none';
  }
}

function clearActiveFilter() {
  AppState.activeFilter.type = null;
  AppState.activeFilter.value = null;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const emotionFilter = document.getElementById('emotion-filter');
  if (emotionFilter) emotionFilter.value = '';

  updateFilterBanner();
  fetchDreams();
}

// ---------------------------------------------------------------------------
// CHART.JS VISUALIZATIONS (DASHBOARD & EMOTIONS VIEW)
// ---------------------------------------------------------------------------
function renderCharts(analytics) {
  // 1. Symbol Frequency Bar Chart
  const symCtx = document.getElementById('chart-symbols')?.getContext('2d');
  if (symCtx) {
    if (AppState.charts.symbols) AppState.charts.symbols.destroy();

    const rankings = (analytics.symbol_rankings || []).slice(0, 7);
    AppState.charts.symbols = new Chart(symCtx, {
      type: 'bar',
      data: {
        labels: rankings.map(r => r.symbol),
        datasets: [{
          label: 'Total Occurrences',
          data: rankings.map(r => r.count),
          backgroundColor: 'rgba(139, 92, 246, 0.65)',
          borderColor: '#8b5cf6',
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#070a16',
            borderColor: 'rgba(139, 92, 246, 0.4)',
            borderWidth: 1,
            bodyFont: { family: 'Plus Jakarta Sans' },
            callbacks: {
              afterLabel: function(ctx) {
                const item = rankings[ctx.dataIndex];
                return item ? `Present in ${item.distinct_dreams_count || 1} distinct dreams` : '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // 2. Dashboard Emotion Doughnut Chart (with robust empty state handling)
  const emoContainer = document.getElementById('dashboard-emotions-chart-container');
  const emoEmptyState = document.getElementById('dashboard-emotions-empty-state');
  const emoCtx = document.getElementById('chart-emotions')?.getContext('2d');

  const emotionsMap = analytics.emotion_frequencies || {};
  const emotionKeys = Object.keys(emotionsMap);

  if (emotionKeys.length === 0) {
    if (emoContainer) emoContainer.style.display = 'none';
    if (emoEmptyState) emoEmptyState.style.display = 'block';
  } else {
    if (emoContainer) emoContainer.style.display = 'block';
    if (emoEmptyState) emoEmptyState.style.display = 'none';

    if (emoCtx) {
      if (AppState.charts.emotions) AppState.charts.emotions.destroy();

      const labels = emotionKeys;
      const dataVals = Object.values(emotionsMap);
      const bgColors = labels.map(e => EMOTION_COLORS[e] || EMOTION_COLORS.Default);

      AppState.charts.emotions = new Chart(emoCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: dataVals,
            backgroundColor: bgColors,
            borderColor: '#04060d',
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 12 }
            },
            tooltip: {
              backgroundColor: '#070a16',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              borderWidth: 1,
              callbacks: {
                label: function(ctx) {
                  const val = ctx.raw || 0;
                  const total = dataVals.reduce((a, b) => a + b, 0);
                  const pct = Math.round((val / total) * 100);
                  return ` ${ctx.label}: ${val} dreams (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  // 3. Dream Activity Timeline
  const timeCtx = document.getElementById('chart-timeline')?.getContext('2d');
  if (timeCtx) {
    if (AppState.charts.timeline) AppState.charts.timeline.destroy();

    const timeline = analytics.timeline || [];
    AppState.charts.timeline = new Chart(timeCtx, {
      type: 'line',
      data: {
        labels: timeline.map(t => t.date),
        datasets: [{
          label: 'Dreams Logged',
          data: timeline.map(t => t.count),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#38bdf8',
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#070a16',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: '#94a3b8', font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // Also render the dedicated Emotional Landscape view charts
  renderLargeEmotionCharts(analytics);
}

function renderLargeEmotionCharts(analytics) {
  const emotionsMap = analytics.emotion_frequencies || {};
  const emotionKeys = Object.keys(emotionsMap);

  const containerLarge = document.getElementById('emotions-large-chart-container');
  const emptyLarge = document.getElementById('emotions-large-empty-state');
  const dominantBadge = document.getElementById('emotions-dominant-badge');

  if (emotionKeys.length === 0) {
    if (containerLarge) containerLarge.style.display = 'none';
    if (emptyLarge) emptyLarge.style.display = 'block';
    if (dominantBadge) dominantBadge.style.display = 'none';
  } else {
    if (containerLarge) containerLarge.style.display = 'block';
    if (emptyLarge) emptyLarge.style.display = 'none';

    if (dominantBadge && analytics.metrics?.top_emotion && analytics.metrics.top_emotion !== 'None') {
      dominantBadge.style.display = 'inline-block';
      dominantBadge.textContent = `Dominant Tone: ${analytics.metrics.top_emotion}`;
    }

    const largeCtx = document.getElementById('chart-emotions-large')?.getContext('2d');
    if (largeCtx) {
      if (AppState.charts.emotionsLarge) AppState.charts.emotionsLarge.destroy();

      const labels = emotionKeys;
      const dataVals = Object.values(emotionsMap);
      const bgColors = labels.map(e => EMOTION_COLORS[e] || EMOTION_COLORS.Default);

      AppState.charts.emotionsLarge = new Chart(largeCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: dataVals,
            backgroundColor: bgColors,
            borderColor: '#04060d',
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#e2e8f0', font: { family: 'Plus Jakarta Sans', size: 12 }, boxWidth: 14 }
            },
            tooltip: {
              backgroundColor: '#070a16',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              borderWidth: 1,
              callbacks: {
                label: function(ctx) {
                  const val = ctx.raw || 0;
                  const total = dataVals.reduce((a, b) => a + b, 0);
                  const pct = Math.round((val / total) * 100);
                  return ` ${ctx.label}: ${val} dreams (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  // Emotion Trends Timeline Chart
  const trendContainer = document.getElementById('emotions-trends-chart-container');
  const trendEmpty = document.getElementById('emotions-trends-empty-state');
  const trendTimeline = analytics.emotion_timeline || [];

  if (trendTimeline.length === 0 || emotionKeys.length === 0) {
    if (trendContainer) trendContainer.style.display = 'none';
    if (trendEmpty) trendEmpty.style.display = 'block';
  } else {
    if (trendContainer) trendContainer.style.display = 'block';
    if (trendEmpty) trendEmpty.style.display = 'none';

    const trendCtx = document.getElementById('chart-emotions-trend')?.getContext('2d');
    if (trendCtx) {
      if (AppState.charts.emotionsTrend) AppState.charts.emotionsTrend.destroy();

      // Top 4 emotions for clean multi-line trend readability
      const top4Emos = (analytics.emotion_rankings || []).slice(0, 4).map(r => r.emotion);
      const dates = trendTimeline.map(t => t.date);

      const datasets = top4Emos.map(emo => {
        const color = EMOTION_COLORS[emo] || EMOTION_COLORS.Default;
        const counts = trendTimeline.map(t => (t.emotions && t.emotions[emo]) ? t.emotions[emo] : 0);
        return {
          label: emo,
          data: counts,
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          pointRadius: 3,
        };
      });

      AppState.charts.emotionsTrend = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 10 }
            },
            tooltip: {
              backgroundColor: '#070a16',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#94a3b8' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
              ticks: { color: '#94a3b8', font: { size: 10 } },
              grid: { display: false }
            }
          }
        }
      });
    }
  }
}

// ---------------------------------------------------------------------------
// CRUD OPERATIONS & MODALS
// ---------------------------------------------------------------------------
function openDreamModal(dreamId = null) {
  AppState.editingDreamId = dreamId;
  const modal = document.getElementById('modal-dream-editor');
  const modalTitle = document.getElementById('modal-editor-title');
  const form = document.getElementById('dream-form');

  form.reset();
  document.getElementById('live-analysis-box').innerHTML = '<p style="color: var(--text-dim); font-size: 0.78rem;">Start writing your dream narrative to see live symbol detection.</p>';

  if (dreamId) {
    modalTitle.textContent = 'Edit Dream Record';
    const dream = AppState.dreams.find(d => d.id === dreamId);
    if (dream) {
      document.getElementById('form-title').value = dream.title || '';
      document.getElementById('form-narrative').value = dream.narrative || '';
      document.getElementById('form-date').value = dream.dream_date || '';
      document.getElementById('form-time').value = dream.dream_time || '';
      document.getElementById('form-vividness').value = dream.vividness || 7;
      document.getElementById('form-tags').value = (dream.tags || []).join(', ');
      document.getElementById('form-reflection').value = dream.reflection || '';

      // Check emotions checkboxes
      const emotions = dream.selected_emotions || dream.emotions || [];
      document.querySelectorAll('input[name="emotions"]').forEach(cb => {
        cb.checked = emotions.includes(cb.value);
      });

      runLiveAnalysis();
      updateWordCounts();
    }
  } else {
    modalTitle.textContent = 'Record a Dream Entry';
    document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('form-time').value = new Date().toTimeString().slice(0, 5);
    updateWordCounts();
  }

  modal.classList.add('active');
}

function closeDreamModal() {
  document.getElementById('modal-dream-editor')?.classList.remove('active');
  AppState.editingDreamId = null;
}

async function handleDreamFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('form-title').value.trim();
  const narrative = document.getElementById('form-narrative').value.trim();
  const dream_date = document.getElementById('form-date').value;
  const dream_time = document.getElementById('form-time').value;
  const vividness = parseInt(document.getElementById('form-vividness').value, 10);
  const tagsStr = document.getElementById('form-tags').value;
  const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const reflection = document.getElementById('form-reflection').value.trim();

  const emotions = [];
  document.querySelectorAll('input[name="emotions"]:checked').forEach(cb => {
    emotions.push(cb.value);
  });

  if (!title || !narrative) {
    alert('Please provide both a title and narrative for your dream entry.');
    return;
  }

  const payload = {
    title,
    narrative,
    dream_date,
    dream_time,
    vividness,
    tags,
    reflection,
    selected_emotions: emotions
  };

  try {
    let res;
    if (AppState.editingDreamId) {
      res = await fetch(`/api/dreams/${AppState.editingDreamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (data.success) {
      closeDreamModal();
      await loadAllData();
    } else {
      alert(`Error saving dream: ${data.error}`);
    }
  } catch (err) {
    console.error('Error saving dream:', err);
    alert('Failed to connect to the server.');
  }
}

async function deleteDream(dreamId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/dreams/${dreamId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      closeDreamDetailModal();
      await loadAllData();
    }
  } catch (err) {
    console.error('Error deleting dream:', err);
  }
}

function openDreamDetailModal(dreamId) {
  const dream = AppState.dreams.find(d => d.id === dreamId);
  if (!dream) return;

  AppState.activeDream = dream;
  const modal = document.getElementById('modal-dream-detail');

  document.getElementById('detail-title').textContent = dream.title;
  document.getElementById('detail-date').textContent = `Recorded: ${dream.dream_date} ${dream.dream_time ? 'at ' + dream.dream_time : ''}`;
  document.getElementById('detail-vividness').textContent = `Vividness: ${dream.vividness}/10`;
  document.getElementById('detail-narrative').textContent = dream.narrative;

  // Emotions row
  const emotionsRow = document.getElementById('detail-emotions-row');
  const emotions = dream.selected_emotions || dream.emotions || [];
  if (emotionsRow) {
    emotionsRow.innerHTML = emotions.map(e => `
      <span class="tag-pill" style="border-color: rgba(251, 191, 36, 0.4); color: #fde047; cursor: pointer;" onclick="closeDreamDetailModal(); filterJournalByEmotion('${escapeHtml(e)}')">
        🎭 ${escapeHtml(e)}
      </span>
    `).join('') + (dream.tags || []).map(t => `
      <span class="tag-pill">#${escapeHtml(t)}</span>
    `).join('');
  }

  // Personal reflection
  const reflEl = document.getElementById('detail-reflection');
  if (reflEl) {
    reflEl.textContent = dream.reflection ? `"${dream.reflection}"` : 'No personal reflection noted for this entry.';
  }

  // Detected Symbols with Socratic Questions
  const symbolsBox = document.getElementById('detail-symbols-box');
  const symbols = dream.derived_symbols || [];
  if (symbolsBox) {
    if (symbols.length === 0) {
      symbolsBox.innerHTML = '<p style="color: var(--text-dim); font-size: 0.82rem;">No specific standard motifs identified in this narrative.</p>';
    } else {
      symbolsBox.innerHTML = symbols.map(s => `
        <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 10px; padding: 0.85rem; margin-bottom: 0.65rem;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.85rem; color: #c4b5fd;">
            <span>✨ ${escapeHtml(s.name)}</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem;">${s.occurrences} matches</span>
          </div>
          <p style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.35rem; line-height: 1.4;">${escapeHtml(s.reflective_meaning)}</p>
          <div style="margin-top: 0.5rem; font-size: 0.78rem; font-style: italic; color: #fde047;">
            "${escapeHtml(s.inquiry_question)}"
          </div>
        </div>
      `).join('');
    }
  }

  // Hook up edit/delete buttons inside detail modal
  const btnEdit = document.getElementById('btn-detail-edit');
  const btnDel = document.getElementById('btn-detail-delete');

  if (btnEdit) {
    btnEdit.onclick = () => {
      closeDreamDetailModal();
      openDreamModal(dream.id);
    };
  }

  if (btnDel) {
    btnDel.onclick = () => deleteDream(dream.id, dream.title);
  }

  modal.classList.add('active');
}

function closeDreamDetailModal() {
  document.getElementById('modal-dream-detail')?.classList.remove('active');
  AppState.activeDream = null;
}

// ---------------------------------------------------------------------------
// LIVE TEXT ANALYSIS (PYTHON BACKEND CALL)
// ---------------------------------------------------------------------------
async function runLiveAnalysis() {
  const title = document.getElementById('form-title')?.value || '';
  const narrative = document.getElementById('form-narrative')?.value || '';
  const dateStr = document.getElementById('form-date')?.value || '';

  if (narrative.length < 15) return;

  try {
    const res = await fetch('/api/analyze-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, narrative, dream_date: dateStr })
    });
    const data = await res.json();

    if (data.success) {
      const box = document.getElementById('live-analysis-box');
      const symbols = data.analysis.detected_symbols || [];

      if (symbols.length === 0) {
        box.innerHTML = '<p style="color: var(--text-dim); font-size: 0.78rem;">No dictionary symbols detected yet.</p>';
      } else {
        box.innerHTML = `
          <div style="font-size: 0.75rem; color: var(--accent-lavender); font-weight: 600; margin-bottom: 0.4rem;">
            Identified Motifs (${symbols.length}):
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
            ${symbols.map(s => `
              <span class="symbol-badge">✨ ${escapeHtml(s.name)} (${s.occurrences})</span>
            `).join('')}
          </div>
        `;
      }
    }
  } catch (err) {
    console.error('Error during live analysis:', err);
  }
}

function updateWordCounts() {
  const narrative = document.getElementById('form-narrative')?.value || '';
  const words = narrative.trim().split(/\s+/).filter(Boolean).length;
  const chars = narrative.length;

  const countEl = document.getElementById('editor-word-count');
  if (countEl) {
    countEl.textContent = `${words} words | ${chars} characters`;
  }
}

// ---------------------------------------------------------------------------
// SAMPLE DATA & DATABASE ACTIONS
// ---------------------------------------------------------------------------
async function loadSampleData() {
  try {
    const res = await fetch('/api/sample/load', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await loadAllData();
      alert('10 demonstration dreams have been loaded into your journal.');
    }
  } catch (err) {
    console.error(err);
  }
}

async function clearSampleData() {
  if (!confirm('Remove sample demonstration dreams? Your custom dream entries will remain preserved.')) {
    return;
  }
  try {
    const res = await fetch('/api/sample/clear', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await loadAllData();
      alert('Sample dreams removed.');
    }
  } catch (err) {
    console.error(err);
  }
}

async function clearAllData() {
  if (!confirm('⚠️ Are you sure you want to clear your ENTIRE dream journal? All entries will be deleted.')) {
    return;
  }
  try {
    const res = await fetch('/api/dreams/clear-all', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await loadAllData();
      alert('All dream records have been cleared.');
    }
  } catch (err) {
    console.error(err);
  }
}

// Utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
