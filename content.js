// EA FC Evolution Builder - Content Script
// Extracts player stats and evolution data from Futbin.com using DOM parsing

console.log('EA FC Evolution Builder - Content script loaded');

// ═══════════════════════════════════════════════════════════════════════
// PLAYER EXTRACTION
// ═══════════════════════════════════════════════════════════════════════

function extractPlayerData() {
  const playerData = {
    type: 'player',
    name: '',
    rating: '',
    position: '',
    nation: '',
    league: '',
    club: '',
    stats: {},
    playstyles: [],
    roles: [],
    details: {}
  };

  try {
    console.log('=== PLAYER EXTRACTION START ===');

    // --- Name from page title ---
    const titleMatch = document.title.match(/^(.+?)\s+(?:Icon|Team of the Week|Hero|RTTK|TOTW|Flashback|Future Stars|TOTY)?.*?\s+EA FC/i);
    if (titleMatch) {
      playerData.name = titleMatch[1].trim();
    } else {
      const simpleMatch = document.title.match(/^(.+?)\s+\d+/);
      if (simpleMatch) playerData.name = simpleMatch[1].trim();
    }
    console.log('Name:', playerData.name);

    // --- Rating & Position from DOM ---
    const ratingEl = document.querySelector('.playercard-26-rating, .player-rating');
    if (ratingEl) playerData.rating = ratingEl.textContent.trim();

    const positionEl = document.querySelector('.playercard-26-position, .player-position');
    if (positionEl) playerData.position = positionEl.textContent.trim();

    console.log('Rating:', playerData.rating, '| Position:', playerData.position);

    // --- Nation / League / Club from image title attributes ---
    const nationImg = document.querySelector('img.nation[title], img[alt="Nation"][title]');
    if (nationImg) playerData.nation = nationImg.getAttribute('title') || '';

    const leagueImg = document.querySelector('img[alt="League"][title], .playercard-26-league[title]');
    if (leagueImg) playerData.league = leagueImg.getAttribute('title') || '';

    const clubImg = document.querySelector('img[alt="Club"][title]');
    if (clubImg) playerData.club = clubImg.getAttribute('title') || '';

    console.log('Nation:', playerData.nation, '| League:', playerData.league, '| Club:', playerData.club);

    // --- Stats from page text ---
    const pageText = document.body.innerText;
    const statNames = [
      'Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical',
      'Acceleration', 'Sprint Speed',
      'Att. Position', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties',
      'Vision', 'Crossing', 'FK Acc.', 'Short Pass', 'Long Pass', 'Curve',
      'Agility', 'Balance', 'Reactions', 'Ball Control', 'Composure',
      'Interceptions', 'Heading Acc.', 'Def. Aware', 'Stand Tackle', 'Slide Tackle',
      'Jumping', 'Stamina', 'Strength', 'Aggression'
    ];

    statNames.forEach(stat => {
      const escaped = stat.replace('.', '\\.');
      const regex = new RegExp(escaped + '\\s+(\\d+)', 'i');
      const match = pageText.match(regex);
      if (match) playerData.stats[stat] = match[1];
    });
    console.log('Stats extracted:', Object.keys(playerData.stats).length);

    // --- PlayStyles from DOM (scoped to player section only) ---
    const abilitiesSection = document.querySelector('.player-abilities-wrapper:not(.hidden)');
    if (abilitiesSection) {
      abilitiesSection.querySelectorAll('.playStyle-table-icon').forEach(el => {
        const nameEl = el.querySelector('.text-ellipsis, .slim-font');
        if (nameEl) {
          let psName = nameEl.textContent.trim();
          const isPlus = el.classList.contains('psplus') || el.querySelector('.psplus') !== null;
          if (isPlus) psName += '+';
          if (!playerData.playstyles.includes(psName)) {
            playerData.playstyles.push(psName);
          }
        }
      });
    }
    console.log('PlayStyles:', playerData.playstyles);

    // --- Roles from DOM ---
    document.querySelectorAll('.player-roles-wrapper:not(.hidden) .xxs-row').forEach(el => {
      const posEl = el.querySelector('.text-faded');
      const roleLink = el.querySelector('a.slim-font');
      const ratingDiv = el.querySelector('div:last-child');
      if (posEl && roleLink && ratingDiv) {
        playerData.roles.push({
          position: posEl.textContent.trim(),
          role: roleLink.textContent.trim().replace(/\+/g, '').trim(),
          rating: ratingDiv.textContent.trim()
        });
      }
    });
    console.log('Roles:', playerData.roles.length);

    // --- Details ---
    playerData.details = {
      skillMoves: (pageText.match(/Skills\s+(\d+)/) || [])[1] || '',
      weakFoot: (pageText.match(/Weak Foot\s+(\d+)/) || [])[1] || '',
      height: (pageText.match(/Height\s+([^\n]+)/) || [])[1]?.trim() || '',
      foot: (pageText.match(/Foot\s+(\w+)/) || [])[1] || ''
    };

    console.log('=== PLAYER EXTRACTION COMPLETE ===');
  } catch (err) {
    console.error('Player extraction error:', err);
  }

  return playerData;
}

// ═══════════════════════════════════════════════════════════════════════
// EVOLUTION EXTRACTION (fully DOM-based)
// ═══════════════════════════════════════════════════════════════════════

function extractEvolutionData() {
  const evolutionData = {
    type: 'evolution',
    name: '',
    requirements: {},
    upgrades: {},
    playstyles: [],
    repeatable: '',
    repeatableCount: 1
  };

  try {
    console.log('=== EVOLUTION EXTRACTION START ===');

    const pageText = document.body.innerText;

    // --- Name from page text ---
    const nameMatch = pageText.match(/^(.+?EA FC 26 Evolution)/m);
    if (nameMatch) evolutionData.name = nameMatch[1].trim();
    console.log('Evolution name:', evolutionData.name);

    // ─────────────────────────────────────────────────────────────────
    // REQUIREMENTS - extracted from .summary-requirements using DOM
    // This section uses .m-row elements (NOT .evo-upgrade-row)
    // ─────────────────────────────────────────────────────────────────
    const reqContainer = document.querySelector('.summary-requirements');
    if (reqContainer) {
      console.log('Found requirements container (DOM)');
      reqContainer.querySelectorAll('.m-row').forEach(row => {
        const labelEl = row.querySelector('.text-faded');
        const valueEl = row.querySelector('.positive-color') || row.querySelector('.text-right');
        if (!labelEl || !valueEl) return;

        const label = labelEl.textContent.trim();
        const value = valueEl.textContent.trim();
        console.log('  Requirement:', label, '→', value);

        if (label === 'Overall') {
          evolutionData.requirements.overall = value.replace(/Max\s*/i, '').trim();
        } else if (label === 'Pace') {
          evolutionData.requirements.pace = value.replace(/Max\s*/i, '').trim();
        } else if (label === 'Passing') {
          evolutionData.requirements.passing = value.replace(/Max\s*/i, '').trim();
        } else if (label === 'Not Position') {
          evolutionData.requirements.notPosition = value;
        } else if (label === 'Position') {
          evolutionData.requirements.position = value;
        } else if (label === 'Not Rarity') {
          evolutionData.requirements.rarity = 'Not Rarity: ' + value;
        } else if (label.includes('PlayStyle') && label.includes('+')) {
          evolutionData.requirements.playstylePlus = value.replace(/Max\s*/i, '').trim();
        } else if (label.includes('PlayStyle') && !label.includes('+')) {
          evolutionData.requirements.playstyles = value.replace(/Max\s*/i, '').trim();
        }
      });
    } else {
      // Fallback: text-based extraction if DOM structure not found
      console.log('Requirements container not found, using text fallback');
      const reqMatch = pageText.match(/Requirements([\s\S]*?)(?:Total Upgrades|Upgrades)/i);
      if (reqMatch) {
        const reqText = reqMatch[1];
        const overallMatch = reqText.match(/Overall\s+Max\s+(\d+)/i);
        if (overallMatch) evolutionData.requirements.overall = overallMatch[1];

        const psMatch = reqText.match(/PlayStyle(?!\+)\s+Max\s+(\d+)/i);
        if (psMatch) evolutionData.requirements.playstyles = psMatch[1];

        const psPlusMatch = reqText.match(/PlayStyle\+\s+Max\s+(\d+)/i);
        if (psPlusMatch) evolutionData.requirements.playstylePlus = psPlusMatch[1];

        const paceMatch = reqText.match(/Pace\s+Max\s+(\d+)/i);
        if (paceMatch) evolutionData.requirements.pace = paceMatch[1];

        const notPosMatch = reqText.match(/Not Position\s+([\w\s]+?)(?=\n|$)/i);
        if (notPosMatch) {
          evolutionData.requirements.notPosition = notPosMatch[1].trim();
        } else {
          const posMatch = reqText.match(/(?:^|\n)\s*Position\s+([^\n]+)/i);
          if (posMatch) evolutionData.requirements.position = posMatch[1].trim();
        }
      }
    }
    console.log('Requirements:', evolutionData.requirements);

    // ─────────────────────────────────────────────────────────────────
    // UPGRADES + PLAYSTYLES - extracted from .evo-upgrade-row elements
    // This is the KEY fix: by iterating .evo-upgrade-row elements,
    // we ONLY look inside the upgrades section, never the requirements.
    // Requirements use .m-row, upgrades use .evo-upgrade-row.
    // ─────────────────────────────────────────────────────────────────
    // Face stats (Overall, Pace, etc.) are NOT filtered - they can be real upgrades
    // e.g. "Overall +40 | 88" means the evo boosts the OVR rating

    const upgradeRows = document.querySelectorAll('.evo-upgrade-row');
    console.log('Found', upgradeRows.length, 'upgrade rows');

    upgradeRows.forEach(row => {
      const labelEl = row.querySelector('.text-faded');
      if (!labelEl) return;

      const label = labelEl.textContent.trim();

      // ── PlayStyles+ row ──
      if (label.includes('PlayStyle') && label.includes('+')) {
        console.log('  → PlayStyles+ row found');
        // Extract cap from .evo-cap-line (e.g., "| 1" means max 1 PlayStyle+ allowed)
        const capEl = row.querySelector('.evo-cap-line span:last-child');
        const psCap = capEl ? capEl.textContent.trim() : '';
        console.log('    Cap:', psCap || 'none');

        // Extract from images (primary)
        const images = row.querySelectorAll('img[alt]');
        if (images.length > 0) {
          images.forEach(img => {
            const name = img.getAttribute('alt');
            if (name && !evolutionData.playstyles.some(p => p.name === name + '+')) {
              evolutionData.playstyles.push({ name: name + '+', cap: psCap });
              console.log('    ✓ PlayStyle+:', name + '+', psCap ? '(cap ' + psCap + ')' : '');
            }
          });
        } else {
          // Fallback: extract from span text
          row.querySelectorAll('span.positive-color').forEach(span => {
            const name = span.textContent.trim();
            if (name && !/^[+\-\d|]/.test(name) && !evolutionData.playstyles.some(p => p.name === name + '+')) {
              evolutionData.playstyles.push({ name: name + '+', cap: psCap });
              console.log('    ✓ PlayStyle+:', name + '+', '(from span)');
            }
          });
        }
        return;
      }

      // ── Regular PlayStyles row ──
      if (label.includes('PlayStyle') && !label.includes('+')) {
        console.log('  → PlayStyles row found');
        // Extract cap from .evo-cap-line (e.g., "| 8" means max 8 PlayStyles allowed)
        const capEl = row.querySelector('.evo-cap-line span:last-child');
        const psCap = capEl ? capEl.textContent.trim() : '';
        console.log('    Cap:', psCap || 'none');

        const images = row.querySelectorAll('img[alt]');
        if (images.length > 0) {
          images.forEach(img => {
            const name = img.getAttribute('alt');
            if (name && !evolutionData.playstyles.some(p => p.name === name) && !evolutionData.playstyles.some(p => p.name === name + '+')) {
              evolutionData.playstyles.push({ name: name, cap: psCap });
              console.log('    ✓ PlayStyle:', name, psCap ? '(cap ' + psCap + ')' : '');
            }
          });
        } else {
          row.querySelectorAll('span.positive-color').forEach(span => {
            const name = span.textContent.trim();
            if (name && !/^[+\-\d|]/.test(name) && !evolutionData.playstyles.some(p => p.name === name) && !evolutionData.playstyles.some(p => p.name === name + '+')) {
              evolutionData.playstyles.push({ name: name, cap: psCap });
              console.log('    ✓ PlayStyle:', name, '(from span)');
            }
          });
        }
        return;
      }

      // ── Regular stat upgrade (including face stats like Overall, Pace, etc.) ──
      const valueEl = row.querySelector('.positive-color');
      if (valueEl) {
        const boostMatch = valueEl.textContent.trim().match(/^([+\-]\d+)/);
        const capEl = row.querySelector('.evo-cap-line span:last-child');

        if (boostMatch) {
          evolutionData.upgrades[label] = {
            boost: boostMatch[1],
            cap: capEl ? capEl.textContent.trim() : ''
          };
        }
      }
    });

    console.log('Upgrades:', Object.keys(evolutionData.upgrades).length, 'stats');
    console.log('PlayStyles:', evolutionData.playstyles);

    // ─────────────────────────────────────────────────────────────────
    // REPEATABILITY
    // ─────────────────────────────────────────────────────────────────
    const repeatMatch = pageText.match(/Repeatable\s*(\d+)?/i);
    if (repeatMatch) {
      const count = repeatMatch[1] ? parseInt(repeatMatch[1]) : 1;
      evolutionData.repeatable = 'Repeatable ' + count;
      evolutionData.repeatableCount = count;
    }

    console.log('Repeatable:', evolutionData.repeatable || 'No');
    console.log('=== EVOLUTION EXTRACTION COMPLETE ===');
  } catch (err) {
    console.error('Evolution extraction error:', err);
  }

  return evolutionData;
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE DETECTION & MESSAGING
// ═══════════════════════════════════════════════════════════════════════

function detectAndExtract() {
  const url = window.location.href;

  if (url.includes('/player/') || url.includes('/26/player/')) {
    return extractPlayerData();
  } else if (url.includes('/evolution/') || url.includes('evolutions')) {
    return extractEvolutionData();
  }

  return null;
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = detectAndExtract();
    sendResponse({ success: true, data: data });
  }
  return true;
});

// ═══════════════════════════════════════════════════════════════════════
// FLOATING EXTRACT BUTTON
// ═══════════════════════════════════════════════════════════════════════

function createExtractButton() {
  // Remove existing button if present (prevents duplicates on SPA navigation)
  const existing = document.getElementById('evo-builder-extract-btn');
  if (existing) existing.remove();

  // Inject styles
  if (!document.getElementById('evo-builder-styles')) {
    const style = document.createElement('style');
    style.id = 'evo-builder-styles';
    style.textContent = `
      #evo-builder-extract-btn {
        position: fixed;
        top: 90px;
        right: 16px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: linear-gradient(135deg, #6c63ff 0%, #4f46e5 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(108,99,255,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
        white-space: pre-line;
        line-height: 1.3;
        letter-spacing: -0.2px;
      }
      #evo-builder-extract-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(108,99,255,0.45), 0 0 0 1px rgba(255,255,255,0.12) inset;
      }
      #evo-builder-extract-btn:active {
        transform: translateY(0);
      }
      #evo-builder-extract-btn .btn-icon {
        font-size: 16px;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
      }
    `;
    document.head.appendChild(style);
  }

  const button = document.createElement('button');
  button.id = 'evo-builder-extract-btn';
  button.innerHTML = '<span class="btn-icon">⚽</span> Add to Evo Builder';

  button.addEventListener('click', () => {
    const data = detectAndExtract();
    if (!data) {
      showButtonFeedback(button, '❌', 'No data found', '#ef4444');
      return;
    }

    let icon = '✓';
    let summary = '';
    if (data.type === 'player') {
      summary = `${data.name} (${data.rating} ${data.position})`;
    } else if (data.type === 'evolution') {
      const psCount = data.playstyles.length;
      const upgradeCount = Object.keys(data.upgrades).length;
      summary = `${data.name || 'Evolution'}\n${upgradeCount} upgrades · ${psCount} PlayStyles`;
    }

    try {
      chrome.runtime.sendMessage({ action: 'addData', data: data }, (response) => {
        if (chrome.runtime.lastError) {
          showButtonFeedback(button, '🔄', 'Reload extension!', '#f97316');
          return;
        }
        if (response && response.success) {
          if (response.duplicate) {
            showButtonFeedback(button, '⚠️', 'Already added!', '#f97316');
          } else {
            showButtonFeedback(button, '✓', summary, '#059669');
          }
        }
      });
    } catch (error) {
      showButtonFeedback(button, '🔄', 'Reload extension!', '#f97316');
    }
  });

  document.body.appendChild(button);
}

function showButtonFeedback(button, icon, message, color) {
  const originalHTML = button.innerHTML;

  button.innerHTML = `<span class="btn-icon">${icon}</span> ${message}`;
  button.style.background = color;

  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.style.background = '';
  }, 2500);
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createExtractButton);
} else {
  createExtractButton();
}
