// EA FC Evolution Builder – Popup Script

let currentData = { player: null, evolutions: [] };

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupTabs();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('generatePrompt').addEventListener('click', generatePrompt);
  document.getElementById('copyOutput').addEventListener('click', copyToClipboard);
  document.getElementById('clearPlayer').addEventListener('click', clearPlayer);
  document.getElementById('clearEvolutions').addEventListener('click', clearEvolutions);
  document.getElementById('clearAll').addEventListener('click', clearAllData);
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

function loadData() {
  chrome.runtime.sendMessage({ action: 'getData' }, (response) => {
    if (response && response.success) {
      currentData = response.data;
      updateUI();
    }
  });
}

function updateUI() {
  renderPlayer();
  renderEvolutions();
  updateGenerateButton();
  // Show/hide clear all
  document.getElementById('clearAll').style.display =
    (currentData.player || currentData.evolutions.length > 0) ? 'flex' : 'none';
}

function updateGenerateButton() {
  document.getElementById('generatePrompt').disabled =
    !(currentData.player && currentData.evolutions.length > 0);
}

// ═══════════════════════════════════════════════════════════
// RENDER – Player
// ═══════════════════════════════════════════════════════════

function renderPlayer() {
  const container = document.getElementById('playerDisplay');
  const clearBtn = document.getElementById('clearPlayer');
  const player = currentData.player;

  if (!player) {
    clearBtn.style.display = 'none';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <p>No player selected</p>
        <span>Visit a Futbin player page and click<br><strong>"⚽ Add to Evo Builder"</strong></span>
      </div>`;
    return;
  }

  clearBtn.style.display = 'flex';

  const mainStats = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];
  const faceStatsHTML = mainStats.map(s => {
    const v = player.stats[s] || '—';
    const short = s === 'Shooting' ? 'SHO' : s === 'Passing' ? 'PAS' :
      s === 'Dribbling' ? 'DRI' : s === 'Defending' ? 'DEF' :
      s === 'Physical' ? 'PHY' : 'PAC';
    return `<div class="face-stat"><div class="face-stat-val">${v}</div><div class="face-stat-label">${short}</div></div>`;
  }).join('');

  const psHTML = (player.playstyles || []).map(ps => {
    const isPlus = ps.endsWith('+');
    return `<span class="ps-chip ${isPlus ? 'gold' : ''}"><span class="ps-dot"></span>${ps}</span>`;
  }).join('');

  container.innerHTML = `
    <div class="player-info">
      <div class="player-rating-box">
        <div class="player-rating-num">${player.rating || '—'}</div>
        <div class="player-rating-pos">${player.position || '—'}</div>
      </div>
      <div class="player-meta">
        <div class="player-name-line">${player.name || 'Unknown'}</div>
        <div class="player-tags">
          ${player.nation ? `<span class="player-tag"><span class="tag-emoji">🌍</span>${player.nation}</span>` : ''}
          ${player.league ? `<span class="player-tag"><span class="tag-emoji">🏆</span>${player.league}</span>` : ''}
          ${player.club ? `<span class="player-tag"><span class="tag-emoji">⚽</span>${player.club}</span>` : ''}
        </div>
        <div class="face-stats">${faceStatsHTML}</div>
        ${psHTML ? `<div class="player-ps-row">${psHTML}</div>` : ''}
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// RENDER – Evolutions
// ═══════════════════════════════════════════════════════════

function renderEvolutions() {
  const container = document.getElementById('evolutionsDisplay');
  const clearBtn = document.getElementById('clearEvolutions');
  const countBadge = document.getElementById('evoCount');

  if (!currentData.evolutions || currentData.evolutions.length === 0) {
    clearBtn.style.display = 'none';
    countBadge.style.display = 'none';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No evolutions added</p>
        <span>Visit Futbin evolution pages to add them</span>
      </div>`;
    return;
  }

  clearBtn.style.display = 'flex';
  countBadge.style.display = 'inline';
  countBadge.textContent = currentData.evolutions.length;

  container.innerHTML = currentData.evolutions.map((evo, i) => {
    // Requirements pills
    const reqs = [];
    if (evo.requirements.overall) reqs.push({ text: `OVR ≤ ${evo.requirements.overall}`, cls: '' });
    if (evo.requirements.playstyles) reqs.push({ text: `PS ≤ ${evo.requirements.playstyles}`, cls: '' });
    if (evo.requirements.playstylePlus) reqs.push({ text: `PS+ ≤ ${evo.requirements.playstylePlus}`, cls: '' });
    if (evo.requirements.pace) reqs.push({ text: `Pace ≤ ${evo.requirements.pace}`, cls: '' });
    if (evo.requirements.passing) reqs.push({ text: `Pass ≤ ${evo.requirements.passing}`, cls: '' });
    if (evo.requirements.position) reqs.push({ text: evo.requirements.position, cls: 'position' });
    if (evo.requirements.notPosition) reqs.push({ text: `Not ${evo.requirements.notPosition}`, cls: 'negative' });
    if (evo.requirements.rarity) reqs.push({ text: evo.requirements.rarity, cls: 'negative' });

    const reqsHTML = reqs.map(r => `<span class="req-pill ${r.cls}">${r.text}</span>`).join('');

    // Upgrades
    const faceStatNames = ['Overall', 'Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];
    const upgradesHTML = Object.entries(evo.upgrades).map(([stat, data]) => {
      const boost = typeof data === 'object' ? data.boost : data;
      const cap = typeof data === 'object' && data.cap ? `<span class="cap">→${data.cap}</span>` : '';
      const isFace = faceStatNames.includes(stat);
      return `<span class="upgrade-chip ${isFace ? 'face-stat-upgrade' : ''}">${stat} ${boost} ${cap}</span>`;
    }).join('');

    // PlayStyles
    const normalized = (evo.playstyles || []).map(ps =>
      typeof ps === 'string' ? { name: ps, cap: '' } : ps
    );
    const psHTML = normalized.map(ps => {
      const isPlus = ps.name.endsWith('+');
      const capInfo = ps.cap ? `<span class="cap-info">≤${ps.cap}</span>` : '';
      return `<span class="evo-ps-badge ${isPlus ? 'plus' : 'regular'}">${ps.name} ${capInfo}</span>`;
    }).join('');

    // Repeat
    const maxRepeat = evo.repeatableCount || 1;
    const repeatHTML = evo.repeatable
      ? `<div class="evo-meta">
           <span class="repeat-badge">🔄 ×<input type="number" min="0" max="${maxRepeat}" value="${maxRepeat}" class="repeat-input" data-index="${i}"> / ${maxRepeat}</span>
         </div>`
      : '';

    return `
      <div class="evo-card">
        <div class="evo-card-header">
          <div class="evo-name">${evo.name || 'Unknown Evolution'}</div>
          <button class="evo-remove" data-index="${i}" title="Remove">✕</button>
        </div>
        ${reqsHTML ? `<div class="evo-reqs">${reqsHTML}</div>` : ''}
        ${upgradesHTML ? `<div class="evo-upgrades">${upgradesHTML}</div>` : ''}
        ${psHTML ? `<div class="evo-ps">${psHTML}</div>` : ''}
        ${repeatHTML}
      </div>`;
  }).join('');

  // Event listeners
  container.querySelectorAll('.evo-remove').forEach(btn =>
    btn.addEventListener('click', e => {
      removeEvolution(parseInt(e.currentTarget.dataset.index));
    })
  );

  container.querySelectorAll('.repeat-input').forEach(input =>
    input.addEventListener('change', e => {
      updateRepeatCount(parseInt(e.target.dataset.index), parseInt(e.target.value));
    })
  );
}

// ═══════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════

function removeEvolution(index) {
  chrome.runtime.sendMessage({ action: 'removeEvolution', index }, (res) => {
    if (res && res.success) loadData();
  });
}

function updateRepeatCount(index, count) {
  currentData.evolutions[index].repeatableCount = count;
  chrome.runtime.sendMessage({
    action: 'updateEvolution',
    index,
    evolution: currentData.evolutions[index]
  });
}

function clearPlayer() {
  chrome.runtime.sendMessage({ action: 'clearPlayer' }, (res) => {
    if (res && res.success) loadData();
  });
}

function clearEvolutions() {
  chrome.runtime.sendMessage({ action: 'clearData' }, () => loadData());
}

function clearAllData() {
  chrome.runtime.sendMessage({ action: 'clearAll' }, (res) => {
    if (res && res.success) loadData();
  });
}

// ═══════════════════════════════════════════════════════════
// GENERATE PROMPT
// ═══════════════════════════════════════════════════════════

function generatePrompt() {
  const output = generateTextOutput();

  // Switch to output tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="output"]').classList.add('active');
  document.getElementById('tab-output').classList.add('active');

  const textArea = document.getElementById('outputText');
  const empty = document.getElementById('outputEmpty');
  textArea.value = output;
  textArea.style.display = 'block';
  empty.style.display = 'none';

  showToast('✓ Prompt generated!', 'success');
}

function generateTextOutput() {
  const player = currentData.player;
  const stats = player.stats || {};
  let o = '';

  // ── Count current PlayStyles ──
  const allPS = player.playstyles || [];
  const psPlus = allPS.filter(ps => ps.endsWith('+'));
  const psRegular = allPS.filter(ps => !ps.endsWith('+'));
  const totalPS = allPS.length;
  const totalPSPlus = psPlus.length;
  // Regular count excludes PS+ since in-game they're tracked separately
  const totalPSRegularOnly = psRegular.length;

  // ════════════════════════════════════════════════════════════════
  // HEADER + RULES
  // ════════════════════════════════════════════════════════════════

  o += `I need you to find the optimal evolution chain for my EA FC player. Read the rules below carefully before analyzing.\n\n`;

  o += `${'━'.repeat(80)}\n`;
  o += `⚠️  CRITICAL RULES — HOW EVOLUTIONS WORK IN EA FC\n`;
  o += `${'━'.repeat(80)}\n\n`;

  o += `1. CAPS NEVER REDUCE STATS. A cap is the maximum value a stat can be RAISED to.\n`;
  o += `   Formula: new_value = min(current_value + boost, cap).\n`;
  o += `   If current_value ≥ cap → stat is UNCHANGED (not reduced, not capped down).\n`;
  o += `   Example: Sprint Speed 91, evo gives +50 (cap 86) → stays 91. NOT reduced to 86.\n`;
  o += `   Example: Def. Aware 82, evo gives +40 (cap 89) → min(82+40, 89) = 89.\n`;
  o += `   ⚠️ CRITICAL: Always use the CURRENT value at time of application, NOT base values.\n`;
  o += `   The pre-calculated results below assume base stats. If a prior evo changed a stat,\n`;
  o += `   you MUST recalculate: e.g. if base OVR is 85 and evo says "+40 (cap 88) → at base: 88",\n`;
  o += `   but a prior evo raised OVR to 87, then min(87+40, 88) = 88 (only +1, NOT +3).\n\n`;

  o += `2. FACE STATS vs SUB-STATS are independent. The 6 face stats (Pace, Shooting, Passing,\n`;
  o += `   Dribbling, Defending, Physical) and Overall are SEPARATE from sub-stats.\n`;
  o += `   "Defending +5" only changes the face stat, NOT Interceptions/Stand Tackle/etc.\n`;
  o += `   "Interceptions +40" only changes that sub-stat, NOT the Defending face stat.\n\n`;

  o += `3. OVERALL RATING changes affect eligibility. If an evo boosts Overall from 87→88,\n`;
  o += `   the player can NO LONGER use evos that require "Overall ≤ 87". ORDER MATTERS.\n\n`;

  o += `4. PLAYSTYLE REQUIREMENTS AND CAPS:\n`;
  o += `   - EVO ENTRY requirements ("PlayStyles ≤ N") = player must have ≤N to START the evo.\n`;
  o += `   - PLAYSTYLE GRANT caps ("granted only if ≤N") = checked AT EACH LEVEL independently.\n`;
  o += `   - Evos have multiple levels (e.g., Level 1, 2, 3). Each level may grant different PlayStyles.\n`;
  o += `   - The cap for each PlayStyle is checked when that level is applied, NOT at evo start.\n`;
  o += `   - Example: Level 1 gives "Technical (≤8 PS)", Level 2 gives "Technical+ (≤1 PS+)".\n`;
  o += `   - If player already has a PlayStyle being granted, it's NOT added again.\n`;
  o += `   - After applying levels, totals may exceed initial caps — that's fine.\n\n`;

  o += `5. PLAYSTYLE+ REPLACES THE REGULAR VERSION. If a player has "Intercept" (regular)\n`;
  o += `   and gains "Intercept+", the regular is REMOVED and replaced by the + version.\n`;
  o += `   Result: regular PS count -1, PS+ count +1, TOTAL stays the same.\n`;
  o += `   This is critical for "PlayStyles ≤ 10" checks — the total does NOT increase.\n\n`;

  o += `6. REPEATABLE evos can be applied multiple times (e.g., "Repeatable 2" = up to 2 uses).\n`;
  o += `   Each repeat must STILL pass ALL requirements at the time of application.\n`;
  o += `   Stats that already hit their cap get no further benefit from repeats.\n\n`;

  // ════════════════════════════════════════════════════════════════
  // BASE PLAYER
  // ════════════════════════════════════════════════════════════════

  o += `${'━'.repeat(80)}\n`;
  o += `📋 BASE PLAYER\n`;
  o += `${'━'.repeat(80)}\n\n`;

  o += `Name: ${player.name}\n`;
  o += `Overall: ${player.rating}\n`;
  o += `Position: ${player.position}\n`;
  if (player.nation) o += `Nation: ${player.nation}\n`;
  if (player.league) o += `League: ${player.league}\n`;
  if (player.club) o += `Club: ${player.club}\n`;
  o += `\n`;
  o += `NOTE: These are the player's CURRENT stats (previous evolutions may already be applied).\n`;
  o += `The evolutions listed below are ADDITIONAL evolutions still available to apply.\n\n`;

  // ════════════════════════════════════════════════════════════════
  // STATS (compact table format)
  // ════════════════════════════════════════════════════════════════

  o += `${'━'.repeat(80)}\n`;
  o += `📊 BASE STATS\n`;
  o += `${'━'.repeat(80)}\n\n`;

  const cats = {
    'Pace': ['Acceleration', 'Sprint Speed'],
    'Shooting': ['Att. Position', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
    'Passing': ['Vision', 'Crossing', 'FK Acc.', 'Short Pass', 'Long Pass', 'Curve'],
    'Dribbling': ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
    'Defending': ['Interceptions', 'Heading Acc.', 'Def. Aware', 'Stand Tackle', 'Slide Tackle'],
    'Physical': ['Jumping', 'Stamina', 'Strength', 'Aggression']
  };

  for (const [cat, subs] of Object.entries(cats)) {
    const faceVal = stats[cat] || '?';
    o += `[${cat}: ${faceVal}]\n`;
    subs.forEach(s => {
      if (stats[s]) o += `  ${s}: ${stats[s]}\n`;
    });
    o += `\n`;
  }

  // ════════════════════════════════════════════════════════════════
  // PLAYSTYLES (with counts)
  // ════════════════════════════════════════════════════════════════

  o += `${'━'.repeat(80)}\n`;
  o += `⚡ PLAYSTYLES (${totalPSPlus} PlayStyle+, ${totalPSRegularOnly} regular = ${totalPS} total)\n`;
  o += `${'━'.repeat(80)}\n\n`;

  if (psPlus.length > 0) {
    o += `PlayStyles+: ${psPlus.join(', ')}\n`;
  }
  if (psRegular.length > 0) {
    o += `PlayStyles: ${psRegular.join(', ')}\n`;
  }
  o += `\n`;

  // ════════════════════════════════════════════════════════════════
  // ROLES
  // ════════════════════════════════════════════════════════════════

  if (player.roles && player.roles.length > 0) {
    o += `${'━'.repeat(80)}\n`;
    o += `🎯 ROLES\n`;
    o += `${'━'.repeat(80)}\n\n`;
    player.roles.forEach(r => o += `${r.position} ${r.role} ${r.rating}\n`);
    o += `\n`;
  }

  // ════════════════════════════════════════════════════════════════
  // EVOLUTIONS
  // ════════════════════════════════════════════════════════════════

  o += `${'━'.repeat(80)}\n`;
  o += `🔄 AVAILABLE EVOLUTIONS\n`;
  o += `${'━'.repeat(80)}\n\n`;
  o += `NOTE: The "→ X becomes Y" calculations below assume BASE stats. If a previous\n`;
  o += `evo already changed a stat, you must recalculate using the CURRENT value.\n\n`;

  currentData.evolutions.forEach(evo => {
    o += `▼ ${evo.name}\n${'─'.repeat(80)}\n\n`;
    
    o += `⚠️  NOTE: Many evolutions have multiple LEVELS (e.g., Level 1, 2, 3).\n`;
    o += `   Each level grants different upgrades and PlayStyles.\n`;
    o += `   PlayStyle caps (e.g., "≤8 PlayStyles") are checked AT EACH LEVEL, not just at evo start.\n`;
    o += `   The stats/PlayStyles shown below are TOTALS across all levels.\n\n`;

    // -- Requirements --
    o += `Requirements:\n`;
    const reqs = evo.requirements;
    if (reqs.overall) o += `  • Overall ≤ ${reqs.overall}\n`;
    if (reqs.playstyles) o += `  • PlayStyles ≤ ${reqs.playstyles}\n`;
    if (reqs.playstylePlus) o += `  • PlayStyle+ ≤ ${reqs.playstylePlus}\n`;
    if (reqs.pace) o += `  • Pace ≤ ${reqs.pace}\n`;
    if (reqs.passing) o += `  • Passing ≤ ${reqs.passing}\n`;
    if (reqs.shooting) o += `  • Shooting ≤ ${reqs.shooting}\n`;
    if (reqs.dribbling) o += `  • Dribbling ≤ ${reqs.dribbling}\n`;
    if (reqs.defending) o += `  • Defending ≤ ${reqs.defending}\n`;
    if (reqs.physical) o += `  • Physical ≤ ${reqs.physical}\n`;
    if (reqs.position) o += `  • Position: ${reqs.position}\n`;
    if (reqs.notPosition) o += `  • Not Position: ${reqs.notPosition}\n`;
    if (reqs.rarity) o += `  • ${reqs.rarity}\n`;

    // -- Stat Upgrades (with current values for context) --
    // Alias map: evolution pages sometimes use different names than the player stats page
    const statAliases = {
      'Short Passing': 'Short Pass',
      'Long Passing': 'Long Pass',
      'Positioning': 'Att. Position',
      'Ball control': 'Ball Control',
      'Defensive Awareness': 'Def. Aware',
      'Standing Tackle': 'Stand Tackle',
      'Sliding Tackle': 'Slide Tackle',
      'Heading Accuracy': 'Heading Acc.',
      'FK Accuracy': 'FK Acc.',
      'Att Positioning': 'Att. Position',
      'FK. Acc': 'FK Acc.',
    };
    function getStatValue(statName) {
      if (statName === 'Overall') return player.rating;
      if (stats[statName]) return stats[statName];
      const alias = statAliases[statName];
      if (alias && stats[alias]) return stats[alias];
      // Case-insensitive fallback
      const lower = statName.toLowerCase();
      for (const [k, v] of Object.entries(stats)) {
        if (k.toLowerCase() === lower) return v;
      }
      return null;
    }

    // Stats that affect eligibility — AI must recalculate if these changed from prior evos
    const eligibilityStats = ['Overall', 'Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];

    const upgradeEntries = Object.entries(evo.upgrades);
    if (upgradeEntries.length > 0) {
      o += `\nStat Upgrades:\n`;
      upgradeEntries.forEach(([stat, data]) => {
        const boost = typeof data === 'object' ? data.boost : data;
        const cap = typeof data === 'object' ? data.cap : '';
        const currentVal = getStatValue(stat);
        const isEligibilityStat = eligibilityStats.includes(stat);

        if (currentVal && cap) {
          const numCurrent = parseInt(currentVal);
          const numBoost = parseInt(boost);
          const numCap = parseInt(cap);
          if (!isNaN(numCurrent) && !isNaN(numBoost) && !isNaN(numCap)) {
            const result = numCurrent >= numCap
              ? numCurrent
              : Math.min(numCurrent + numBoost, numCap);
            const change = result - numCurrent;
            if (change === 0) {
              o += `  • ${stat}: ${boost} (cap ${cap}) → ALREADY ${numCurrent}, no change\n`;
            } else if (isEligibilityStat) {
              // For eligibility stats, show formula so AI recalculates from current value
              o += `  • ${stat}: ${boost} (cap ${cap}) → formula: min(current${boost}, ${cap}). At base ${numCurrent}: becomes ${result}.\n`;
            } else {
              o += `  • ${stat}: ${boost} (cap ${cap}) → ${numCurrent} becomes ${result} (+${change})\n`;
            }
          } else {
            o += `  • ${stat}: ${boost}${cap ? ` (cap ${cap})` : ''}\n`;
          }
        } else if (cap) {
          o += `  • ${stat}: ${boost} (cap ${cap})\n`;
        } else if (currentVal) {
          const numCurrent = parseInt(currentVal);
          const numBoost = parseInt(boost);
          if (!isNaN(numCurrent) && !isNaN(numBoost)) {
            if (isEligibilityStat) {
              o += `  • ${stat}: ${boost} (no cap) → adds ${numBoost} to current value. At base ${numCurrent}: becomes ${numCurrent + numBoost}.\n`;
            } else {
              const result = numCurrent + numBoost;
              o += `  • ${stat}: ${boost} → ${numCurrent} becomes ${result} (+${numBoost})\n`;
            }
          } else {
            o += `  • ${stat}: ${boost}\n`;
          }
        } else {
          o += `  • ${stat}: ${boost}\n`;
        }
      });
    }

    // -- PlayStyles --
    if (evo.playstyles && evo.playstyles.length > 0) {
      const norm = evo.playstyles.map(ps =>
        typeof ps === 'string' ? { name: ps, cap: '' } : ps
      );
      const plus = norm.filter(p => p.name.endsWith('+'));
      const reg = norm.filter(p => !p.name.endsWith('+'));

      if (plus.length > 0) {
        o += `\nPlayStyles+ Added:\n`;
        plus.forEach(ps => {
          const alreadyHasPlus = allPS.includes(ps.name);
          // Check if player has the regular version (e.g. "Intercept" when gaining "Intercept+")
          const baseName = ps.name.replace(/\+$/, '');
          const hasRegularVersion = psRegular.includes(baseName);
          o += `  • ${ps.name}`;
          if (ps.cap) o += ` (granted only if ≤${ps.cap} PS+ at this level)`;
          if (alreadyHasPlus) {
            o += ` [ALREADY OWNED]`;
          } else if (ps.cap && totalPSPlus > parseInt(ps.cap)) {
            o += ` [MAY BE BLOCKED — currently ${totalPSPlus} PS+, but cap is checked PER LEVEL]`;
          } else if (hasRegularVersion) {
            o += ` [UPGRADES existing ${baseName} → ${ps.name}, regular PS count -1, PS+ count +1]`;
          }
          o += `\n`;
        });
      }
      if (reg.length > 0) {
        o += `\nPlayStyles Added:\n`;
        reg.forEach(ps => {
          const alreadyHas = allPS.includes(ps.name);
          o += `  • ${ps.name}`;
          if (ps.cap) o += ` (granted only if ≤${ps.cap} PlayStyles at this level)`;
          if (alreadyHas) {
            o += ` [ALREADY OWNED — not added again]`;
          } else if (ps.cap && totalPSRegularOnly > parseInt(ps.cap)) {
            o += ` [MAY BE BLOCKED — currently ${totalPSRegularOnly} PS, but cap is checked PER LEVEL]`;
          }
          o += `\n`;
        });
      }
    }

    // -- Repeatable --
    if (evo.repeatable) {
      const match = evo.repeatable.match(/(\d+)/);
      const count = match ? match[1] : '?';
      o += `\nRepeatable: up to ${count} times\n`;
    }

    o += `\n`;
  });

  // ════════════════════════════════════════════════════════════════
  // STARTING ELIGIBILITY TABLE
  // ════════════════════════════════════════════════════════════════

  o += `${'━'.repeat(80)}\n`;
  o += `✅ STARTING ELIGIBILITY CHECK (at base ${player.rating} OVR, ${totalPSRegularOnly} PS, ${totalPSPlus} PS+)\n`;
  o += `${'━'.repeat(80)}\n\n`;

  currentData.evolutions.forEach(evo => {
    const reqs = evo.requirements;
    const checks = [];
    let eligible = true;

    if (reqs.overall) {
      const pass = parseInt(player.rating) <= parseInt(reqs.overall);
      checks.push(`OVR ${player.rating}≤${reqs.overall}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.playstyles) {
      const pass = totalPSRegularOnly <= parseInt(reqs.playstyles);
      checks.push(`PS ${totalPSRegularOnly}≤${reqs.playstyles}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.playstylePlus) {
      const pass = totalPSPlus <= parseInt(reqs.playstylePlus);
      checks.push(`PS+ ${totalPSPlus}≤${reqs.playstylePlus}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.pace) {
      const paceVal = parseInt(stats['Pace'] || 0);
      const pass = paceVal <= parseInt(reqs.pace);
      checks.push(`Pace ${paceVal}≤${reqs.pace}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.passing) {
      const passVal = parseInt(stats['Passing'] || 0);
      const pass = passVal <= parseInt(reqs.passing);
      checks.push(`Pass ${passVal}≤${reqs.passing}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.shooting) {
      const val = parseInt(stats['Shooting'] || 0);
      const pass = val <= parseInt(reqs.shooting);
      checks.push(`Sho ${val}≤${reqs.shooting}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.dribbling) {
      const val = parseInt(stats['Dribbling'] || 0);
      const pass = val <= parseInt(reqs.dribbling);
      checks.push(`Dri ${val}≤${reqs.dribbling}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.defending) {
      const val = parseInt(stats['Defending'] || 0);
      const pass = val <= parseInt(reqs.defending);
      checks.push(`Def ${val}≤${reqs.defending}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }
    if (reqs.physical) {
      const val = parseInt(stats['Physical'] || 0);
      const pass = val <= parseInt(reqs.physical);
      checks.push(`Phy ${val}≤${reqs.physical}: ${pass ? '✓' : '✗'}`);
      if (!pass) eligible = false;
    }

    const shortName = (evo.name || 'Unknown').replace(/\s*EA FC 26 Evolution/gi, '');
    o += `${eligible ? '✅' : '❌'} ${shortName}: ${checks.join(' | ')}\n`;
  });

  o += `\n⚠️  This table shows eligibility at BASE stats only. After each evo, you MUST\n`;
  o += `recheck eligibility because Overall, PlayStyle counts, and face stats change.\n\n`;

  // ════════════════════════════════════════════════════════════════
  // ORDER SENSITIVITY ANALYSIS
  // ════════════════════════════════════════════════════════════════

  o += `${'━'.repeat(80)}\n`;
  o += `🔀 ORDER SENSITIVITY ANALYSIS\n`;
  o += `${'━'.repeat(80)}\n\n`;

  o += `Since most evos boost Overall by +1 or more, and Overall ONLY goes UP, evos with\n`;
  o += `the TIGHTEST Overall cap must generally be applied EARLIEST or they become locked out.\n`;
  o += `Similarly, evos that grant new PlayStyles tighten future PS-capped evos.\n\n`;

  // Build sorted list by OVR headroom
  const playerOVR = parseInt(player.rating) || 0;
  const sensitivity = [];
  currentData.evolutions.forEach(evo => {
    const reqs = evo.requirements;
    const shortName = (evo.name || 'Unknown').replace(/\s*EA FC 26 Evolution/gi, '');
    const ovrCap = reqs.overall ? parseInt(reqs.overall) : null;
    const ovrHeadroom = ovrCap !== null ? ovrCap - playerOVR : null;

    // Calculate OVR boost info - show formula for capped boosts
    let ovrBoostLabel = '';
    const ovrUpgrade = evo.upgrades['Overall'];
    if (ovrUpgrade) {
      const boost = typeof ovrUpgrade === 'object' ? ovrUpgrade.boost : ovrUpgrade;
      const cap = typeof ovrUpgrade === 'object' ? ovrUpgrade.cap : '';
      const numBoost = parseInt(boost) || 0;
      if (cap) {
        const numCap = parseInt(cap);
        ovrBoostLabel = `, OVR→${numCap} max`;
      } else {
        ovrBoostLabel = `, OVR +${numBoost}`;
      }
    }

    // Count new PS this evo adds
    let psAdded = 0;
    if (evo.playstyles) {
      const norm = evo.playstyles.map(ps => typeof ps === 'string' ? { name: ps, cap: '' } : ps);
      norm.forEach(ps => {
        if (!ps.name.endsWith('+') && !allPS.includes(ps.name)) {
          const psCap = ps.cap ? parseInt(ps.cap) : 999;
          if (totalPSRegularOnly <= psCap) psAdded++;
        }
      });
    }

    const psPlusReq = reqs.playstylePlus ? parseInt(reqs.playstylePlus) : null;

    sensitivity.push({ shortName, ovrCap, ovrHeadroom, ovrBoostLabel, psAdded, psPlusReq });
  });

  // Sort by OVR headroom (tightest first)
  sensitivity.sort((a, b) => {
    const ha = a.ovrHeadroom !== null ? a.ovrHeadroom : 999;
    const hb = b.ovrHeadroom !== null ? b.ovrHeadroom : 999;
    return ha - hb;
  });

  o += `Sorted by OVR headroom (tightest constraint first):\n`;
  sensitivity.forEach(s => {
    const headroom = s.ovrHeadroom !== null ? `${s.ovrHeadroom} headroom` : 'no OVR cap';
    const boost = s.ovrBoostLabel || '';
    const ps = s.psAdded > 0 ? `, adds ${s.psAdded} PS` : '';
    const psPlus = s.psPlusReq !== null ? `, needs PS+≤${s.psPlusReq}` : '';
    o += `  ${s.ovrHeadroom !== null && s.ovrHeadroom <= 1 ? '🔴' : s.ovrHeadroom !== null && s.ovrHeadroom <= 2 ? '🟡' : '🟢'} ${s.shortName}: OVR≤${s.ovrCap !== null ? s.ovrCap : '∞'} (${headroom}${boost}${ps}${psPlus})\n`;
  });

  o += `\n`;
  o += `KEY INSIGHT: If an evo has 🔴 (0-1 headroom), applying ANY other OVR-boosting evo\n`;
  o += `first may permanently lock it out. Plan the tightest-constraint evos FIRST.\n`;
  o += `Also consider: a PS+ upgrade (rule 5) REDUCES regular PS count by 1, which can\n`;
  o += `unlock PlayStyle caps that are currently blocked.\n\n`;

  // ════════════════════════════════════════════════════════════════
  // OBJECTIVE
  // ════════════════════════════════════════════════════════════════

  o += `${'═'.repeat(80)}\n`;
  o += `📌 OBJECTIVE\n`;
  o += `${'═'.repeat(80)}\n\n`;

  o += `Find the optimal evolution ORDER for ${player.name} (${player.rating} OVR ${player.position}) `;
  o += `that maximizes in-game performance at ${player.position}.\n\n`;

  o += `Your answer must:\n`;
  o += `1. List evolutions in the exact order they should be applied.\n`;
  o += `2. After each step, show the UPDATED Overall, PlayStyle count, PS+ count, and any changed stats.\n`;
  o += `3. Verify eligibility BEFORE each evo using the CURRENT (post-previous-evo) values.\n`;
  o += `4. Remember: caps NEVER reduce stats. If a stat already exceeds the cap, it stays.\n`;
  o += `5. Track PlayStyle counts carefully — PS+ upgrades REPLACE regular versions (total unchanged).\n`;
  o += `6. Show the final card with all stats, PlayStyles, and PlayStyles+ after all evos.\n\n`;
  o += `STRATEGY — FOLLOW THIS PROCEDURE:\n\n`;
  o += `GOAL: Maximize the TOTAL number of evos applied (more evos = better card).\n\n`;
  o += `Step A — Identify the "big OVR evo" (the one with the highest OVR cap, e.g., OVR→88 max).\n`;
  o += `         This evo has a FORMULA cap, so it won't overshoot — it raises OVR TO its cap at most.\n`;
  o += `         All small +1 OVR evos are "fillers" you want to pack around it.\n\n`;
  o += `Step B — BEFORE the big evo: fit as many +1 OVR evos as possible, starting with the\n`;
  o += `         tightest cap. Each +1 uses one headroom point. Stop when the next +1 would\n`;
  o += `         push OVR above the big evo's ELIGIBILITY cap (not its boost cap).\n\n`;
  o += `Step C — Apply the big OVR evo. Thanks to the formula cap, OVR lands at exactly its cap,\n`;
  o += `         NOT higher (e.g., min(87+40,88) = 88, not 90).\n\n`;
  o += `Step D — AFTER the big evo: check which remaining evos are still eligible at the new OVR.\n`;
  o += `         Insert any NO-OVR-BOOST evos (PlayStyle-only) first — they keep OVR unchanged,\n`;
  o += `         preserving headroom for one more +1 evo after them.\n`;
  o += `         Then apply remaining +1 OVR evos whose cap still accommodates the current OVR.\n\n`;
  o += `Step E — VERIFY: count total evos. Then ask: "Can I reorder to fit one more?" Try moving\n`;
  o += `         any evo that's currently excluded — maybe it fits if placed differently.\n\n`;
  o += `IMPORTANT RULES:\n`;
  o += `- A PS+ upgrade REPLACES a regular PS (count stays same, PS drops by 1, PS+ rises by 1).\n`;
  o += `  This can UNBLOCK PlayStyle caps that are currently blocked.\n`;
  o += `- Repeatable evos can be used multiple times — consider this.\n`;
  o += `- Don't forget ANY evo exists. After finding a chain, go through the evo list and confirm\n`;
  o += `  each one was either used or is truly ineligible at every possible insertion point.\n`;

  return o;
}

// ═══════════════════════════════════════════════════════════
// CLIPBOARD
// ═══════════════════════════════════════════════════════════

function copyToClipboard() {
  const textArea = document.getElementById('outputText');
  navigator.clipboard.writeText(textArea.value).then(() => {
    const btn = document.getElementById('copyOutput');
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
    }, 2000);
  });
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

function showToast(message, type = '') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  });
}
