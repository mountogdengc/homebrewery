// bookmarklet-ddb.js — D&D Beyond monster page → Homebrewery import
// Supports both 2024 and legacy (2014) stat block formats.
// Extracts data via DOM scraping and either POSTs to Homebrewery or copies to clipboard.
//
// FOR PERSONAL USE ONLY. D&D Beyond content is (c) Wizards of the Coast.
'use strict';

(function () {

  var HB_URL = '{{HB_URL}}';

  // Detect format: try 2024 first, then legacy
  var is2024 = true;
  var root = document.querySelector('.mon-stat-block-2024');
  if (!root) {
    is2024 = false;
    root = document.querySelector('.mon-stat-block');
  }
  if (!root) {
    alert('No stat block found on this page.\nMake sure you are on a D&D Beyond monster page.');
    return;
  }

  // CSS class prefix differs by format
  var P = is2024 ? 'mon-stat-block-2024__' : 'mon-stat-block__';

  function cleanText(el) {
    if (!el) return '';
    var c = el.cloneNode(true);
    c.querySelectorAll('img, .ct-beyond20-roll, .ct-beyond20-custom-roll-button').forEach(function (e) { e.remove(); });
    c.querySelectorAll('u.ct-beyond20-custom-roll').forEach(function (u) {
      var s = u.querySelector('strong');
      u.parentNode.replaceChild(document.createTextNode(s ? s.textContent : ''), u);
    });
    c.querySelectorAll('a, [data-dicenotation]').forEach(function (n) {
      n.parentNode.replaceChild(document.createTextNode(n.textContent), n);
    });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  function abilityMod(score) { return Math.floor((score - 10) / 2); }

  function getPB(cr) {
    var n = cr === '1/8' ? 0.125 : cr === '1/4' ? 0.25 : cr === '1/2' ? 0.5 : Number(cr);
    return n <= 4 ? 2 : n <= 8 ? 3 : n <= 12 ? 4 : n <= 16 ? 5 : n <= 20 ? 6 : n <= 24 ? 7 : n <= 28 ? 8 : 9;
  }

  function showBanner(msg, color) {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + (color || '#2e7d32') + ';color:#fff;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:15px;font-weight:bold;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,.4)';
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 4000);
  }

  // ── Name ─────────────────────────────────────────────────────────────────

  var nameEl = root.querySelector('.' + P + 'name-link') || root.querySelector('.' + P + 'name');
  var name = nameEl ? nameEl.textContent.trim() : 'Unknown';

  // ── Meta ─────────────────────────────────────────────────────────────────

  var metaEl = root.querySelector('.' + P + 'meta');
  var metaText = metaEl ? metaEl.textContent.trim() : '';
  var metaParts = metaText.split(',').map(function (s) { return s.trim(); });
  var tm = metaParts[0].match(/^(\w+)\s+(\w+)(?:\s+\(([^)]+)\))?/) || [];
  var size      = tm[1] || 'Medium';
  var type      = tm[2] || 'Humanoid';
  var subtype   = tm[3] || '';
  var alignment = metaParts.slice(1).join(', ').trim();

  // ── AC / HP / Speed ─────────────────────────────────────────────────────

  var acV = 10, acD = '', hpA = 0, hpF = '';
  var speed = { walk: 0, fly: 0, swim: 0, burrow: 0, climb: 0, hover: false };

  root.querySelectorAll('.' + P + 'attribute').forEach(function (attr) {
    var lbl = (attr.querySelector('.' + P + 'attribute-label') || {}).textContent || '';
    var val = (attr.querySelector('.' + P + 'attribute-data-value') || {}).textContent || '';
    var ext =  attr.querySelector('.' + P + 'attribute-data-extra');
    lbl = lbl.trim(); val = val.trim();
    if (/^a(rmor\s*)?c(lass)?$/i.test(lbl) || lbl === 'AC') {
      var m = val.match(/(\d+)\s*(.*)/);
      if (m) { acV = parseInt(m[1]) || 10; acD = m[2].replace(/[()]/g, '').trim(); }
    } else if (/^h(it\s*)?p(oints)?$/i.test(lbl) || lbl === 'HP') {
      hpA = parseInt(val) || 0;
      if (ext) hpF = ext.textContent.replace(/[()]/g, '').replace(/\s+/g, '').trim();
    } else if (/^speed$/i.test(lbl)) {
      var wm = val.match(/^(\d+)/);           if (wm) speed.walk   = parseInt(wm[1]);
      var fm = val.match(/fly\s+(\d+)/i);     if (fm) speed.fly    = parseInt(fm[1]);
      var sm = val.match(/swim\s+(\d+)/i);    if (sm) speed.swim   = parseInt(sm[1]);
      var bm = val.match(/burrow\s+(\d+)/i);  if (bm) speed.burrow = parseInt(bm[1]);
      var cm = val.match(/climb\s+(\d+)/i);   if (cm) speed.climb  = parseInt(cm[1]);
      speed.hover = /hover/i.test(val);
    }
  });

  // ── Ability scores ──────────────────────────────────────────────────────

  var AB_MAP = { STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha' };
  var abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  var rawSave   = {};

  if (is2024) {
    // 2024 format: table with score, mod, save columns
    root.querySelectorAll('.stat-table tbody tr').forEach(function (row) {
      var abLabel = (row.querySelector('th') || {}).textContent || '';
      var ab = AB_MAP[abLabel.trim()];
      if (!ab) return;
      var tds = row.querySelectorAll('td');
      if (tds.length < 3) return;
      abilities[ab] = parseInt(tds[0].textContent) || 10;
      rawSave[ab]   = parseInt(tds[2].textContent) || 0;
    });
  } else {
    // Legacy format: individual ability blocks
    root.querySelectorAll('.ability-block__stat').forEach(function (stat) {
      var heading = (stat.querySelector('.ability-block__heading') || {}).textContent || '';
      var ab = AB_MAP[heading.trim()];
      if (!ab) return;
      var scoreEl = stat.querySelector('.ability-block__score');
      if (scoreEl) abilities[ab] = parseInt(scoreEl.textContent) || 10;
    });
    // Try alternate legacy layout
    if (abilities.str === 10 && abilities.dex === 10) {
      root.querySelectorAll('.' + P + 'ability-scores-stat, .stat-block-ability-scores-stat').forEach(function (stat) {
        var heading = (stat.querySelector('.' + P + 'ability-scores-heading, .stat-block-ability-scores-heading') || {}).textContent || '';
        var ab = AB_MAP[heading.trim()];
        if (!ab) return;
        var scoreEl = stat.querySelector('.' + P + 'ability-scores-score, .stat-block-ability-scores-score');
        if (scoreEl) abilities[ab] = parseInt(scoreEl.textContent) || 10;
      });
    }
  }

  // ── CR + tidbits ────────────────────────────────────────────────────────

  var cr = '1', skillRaw = '', senses = '', languages = '\u2014';
  var dVuln = '', dRes = '', dImm = '', cImm = '';
  var gearRaw = '';
  var savesRaw = '';

  root.querySelectorAll('.' + P + 'tidbit, .' + P + 'tidbits .mon-stat-block__tidbit').forEach(function (t) {
    var lbl = (t.querySelector('.' + P + 'tidbit-label') || {}).textContent || '';
    var dat =  t.querySelector('.' + P + 'tidbit-data');
    lbl = lbl.trim();
    var v = cleanText(dat);
    if      (/^c(hallenge)?r?(ating)?$/i.test(lbl) || lbl === 'CR')  { var m = v.match(/^(\d+\/\d+|\d+)/); if (m) cr = m[1]; }
    else if (/^skill/i.test(lbl))                    skillRaw  = v;
    else if (/^sense/i.test(lbl))                    senses    = v;
    else if (/^language/i.test(lbl))                 languages = v || '\u2014';
    else if (/^saving\s*throw/i.test(lbl))           savesRaw  = v;
    else if (/^damage\s*vuln/i.test(lbl))            dVuln     = v;
    else if (/^damage\s*res/i.test(lbl))             dRes      = v;
    else if (/^damage\s*imm/i.test(lbl))             dImm      = v;
    else if (/^condition\s*imm/i.test(lbl))          cImm      = v;
    else if (/^gear$/i.test(lbl))                    gearRaw   = v;
  });

  // ── Saving throws ──────────────────────────────────────────────────────

  var PB = getPB(cr);
  var savingThrows = {};

  if (is2024) {
    // 2024: saves parsed from ability table above
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (ab) {
      var em = abilityMod(abilities[ab]);
      var sv = rawSave[ab] !== undefined ? rawSave[ab] : em;
      var prof = sv !== em;
      var ovr  = (prof && sv !== em + PB) ? sv : null;
      savingThrows[ab] = { proficient: prof, override: ovr };
    });
  } else {
    // Legacy: saves from tidbit line like "Str +7, Con +6"
    var SAVE_MAP = { Str: 'str', Dex: 'dex', Con: 'con', Int: 'int', Wis: 'wis', Cha: 'cha' };
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (ab) {
      savingThrows[ab] = { proficient: false, override: null };
    });
    if (savesRaw) {
      savesRaw.split(',').map(function (s) { return s.trim(); }).forEach(function (part) {
        var m = part.match(/^(\w+)\s+([+-]\d+)$/);
        if (!m) return;
        var ab = SAVE_MAP[m[1].trim()];
        if (!ab) return;
        var bonus = parseInt(m[2]);
        var em = abilityMod(abilities[ab]);
        savingThrows[ab].proficient = true;
        if (bonus !== em + PB) savingThrows[ab].override = bonus;
      });
    }
  }

  // ── Skills ─────────────────────────────────────────────────────────────

  var SKN = { 'Acrobatics': 'acrobatics', 'Animal Handling': 'animalHandling', 'Arcana': 'arcana', 'Athletics': 'athletics', 'Deception': 'deception', 'History': 'history', 'Insight': 'insight', 'Intimidation': 'intimidation', 'Investigation': 'investigation', 'Medicine': 'medicine', 'Nature': 'nature', 'Perception': 'perception', 'Performance': 'performance', 'Persuasion': 'persuasion', 'Religion': 'religion', 'Sleight of Hand': 'sleightOfHand', 'Stealth': 'stealth', 'Survival': 'survival' };
  var SKA = { acrobatics: 'dex', animalHandling: 'wis', arcana: 'int', athletics: 'str', deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha', investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis', performance: 'cha', persuasion: 'cha', religion: 'int', sleightOfHand: 'dex', stealth: 'dex', survival: 'wis' };

  var skills = {};
  Object.values(SKN).forEach(function (k) { skills[k] = { proficient: false, expertise: false, override: null }; });

  if (skillRaw) {
    skillRaw.split(',').map(function (s) { return s.trim(); }).forEach(function (part) {
      var m = part.match(/^(.+?)\s+([+-]\d+)$/);
      if (!m) return;
      var k = SKN[m[1].trim()];
      if (!k) return;
      var bonus = parseInt(m[2]);
      var em    = abilityMod(abilities[SKA[k]]);
      skills[k].proficient = true;
      if      (bonus === em + PB * 2) skills[k].expertise = true;
      else if (bonus !== em + PB)     skills[k].override  = bonus;
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────

  var USAGE_PATTERNS = [
    { re: /Recharge\s+(\d[\u2013\-6]\d)/i,       fn: function (m) { return 'Recharge ' + m[1]; } },
    { re: /Recharge after a Short or Long Rest/i, fn: function ()  { return 'Recharge after a Short or Long Rest'; } },
    { re: /(\d+)\/Day/i,                          fn: function (m) { return m[1] + '/Day'; } },
    { re: /(\d+)\/Turn/i,                         fn: function (m) { return m[1] + '/Turn'; } }
  ];

  var SPELL_FREQ_RE = /^(at will|cantrips?|\d+\/day( each)?|\d+(st|nd|rd|th)[- ]level[^)]*|\d+\/short|innate)\s*:?$/i;

  function parseActionParagraph(p) {
    var c = p.cloneNode(true);
    c.querySelectorAll('img').forEach(function (e) { e.remove(); });
    c.querySelectorAll('u.ct-beyond20-custom-roll').forEach(function (u) {
      var s = u.querySelector('strong');
      u.parentNode.replaceChild(document.createTextNode(s ? s.textContent : ''), u);
    });
    c.querySelectorAll('a, [data-dicenotation]').forEach(function (n) {
      n.parentNode.replaceChild(document.createTextNode(n.textContent), n);
    });
    // Preserve <br> as newlines before extracting text
    c.querySelectorAll('br').forEach(function (br) {
      br.parentNode.replaceChild(document.createTextNode('\n'), br);
    });
    var fullText = c.textContent.replace(/[ \t]+/g, ' ').trim();
    var strongEl = c.querySelector('strong, b, em strong, strong em, i strong, strong i, i b, b i');
    if (!strongEl) return null;
    var nameRaw = strongEl.textContent.replace(/\s+/g, ' ').trim().replace(/\.$/, '');

    var nameCheck = nameRaw.replace(/:$/, '').trim();
    if (SPELL_FREQ_RE.test(nameCheck)) {
      return { name: null, appendText: fullText };
    }

    var actionName = nameRaw, usage = '';
    var um = nameRaw.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (um) {
      actionName = um[1].trim();
      var ur = um[2].trim();
      for (var i = 0; i < USAGE_PATTERNS.length; i++) {
        var mm = ur.match(USAGE_PATTERNS[i].re);
        if (mm) { usage = USAGE_PATTERNS[i].fn(mm); break; }
      }
      if (!usage) usage = ur;
    }
    var idx = fullText.indexOf(nameRaw + '.');
    var desc = idx >= 0 ? fullText.slice(idx + nameRaw.length + 1).replace(/^\s+/, '') : fullText;
    return { name: actionName, description: desc, usage: usage };
  }

  var traits = [], actions = [], bonusActions = [], reactions = [];
  var legendary = { count: 3, preamble: '', actions: [] };
  var mythic    = { enabled: false, preamble: '', actions: [] };
  var lair      = { enabled: false, preamble: '', actions: [] };
  var SECTION_MAP = { 'Traits': traits, 'Actions': actions, 'Bonus Actions': bonusActions, 'Reactions': reactions };

  root.querySelectorAll('.' + P + 'description-block').forEach(function (block) {
    var hdEl    = block.querySelector('.' + P + 'description-block-heading');
    var content = block.querySelector('.' + P + 'description-block-content');
    if (!content) return;
    var heading = hdEl ? hdEl.textContent.trim() : '';
    var isLeg  = /^legendary/i.test(heading);
    var isMyth = /^mythic/i.test(heading);
    var isLair = /^lair/i.test(heading);
    var target = null;
    for (var key in SECTION_MAP) {
      if (heading.toLowerCase() === key.toLowerCase()) { target = SECTION_MAP[key]; break; }
    }
    var lastArr = null;

    // Process all child elements, not just <p> — handles <ol>, <ul>, <li> too
    var children = content.children;
    for (var ci = 0; ci < children.length; ci++) {
      var child = children[ci];
      var tag = child.tagName;

      // Lists (ol, ul) — append all items to the previous action's description
      if (tag === 'OL' || tag === 'UL') {
        if (lastArr && lastArr.length > 0) {
          var items = child.querySelectorAll('li');
          items.forEach(function (li) {
            var liText = cleanText(li);
            if (liText) lastArr[lastArr.length - 1].description += '\n' + liText;
          });
        }
        continue;
      }

      // Non-paragraph elements — append text to previous action
      if (tag !== 'P') {
        var txt = cleanText(child);
        if (txt && lastArr && lastArr.length > 0) {
          lastArr[lastArr.length - 1].description += '\n' + txt;
        }
        continue;
      }

      // Paragraphs without bold — preamble text
      if (!child.querySelector('strong, b')) {
        var pt = cleanText(child);
        if (isLeg)  legendary.preamble = pt;
        else if (isMyth) mythic.preamble = pt;
        else if (isLair) lair.preamble = pt;
        else if (lastArr && lastArr.length > 0) {
          // Plain paragraph after an action — append as continuation
          lastArr[lastArr.length - 1].description += '\n\n' + pt;
        }
        continue;
      }

      var parsed = parseActionParagraph(child);
      if (!parsed) continue;

      if (!parsed.name) {
        if (parsed.appendText && lastArr && lastArr.length > 0) {
          lastArr[lastArr.length - 1].description += '\n' + parsed.appendText;
        }
        continue;
      }

      var entry;
      if (isLeg) {
        entry = { name: parsed.name, description: parsed.description, cost: 1, usage: parsed.usage };
        legendary.actions.push(entry); lastArr = legendary.actions;
      } else if (isMyth) {
        mythic.enabled = true;
        entry = { name: parsed.name, description: parsed.description, cost: 1, usage: parsed.usage };
        mythic.actions.push(entry); lastArr = mythic.actions;
      } else if (isLair) {
        lair.enabled = true;
        entry = { name: parsed.name, description: parsed.description, usage: parsed.usage };
        lair.actions.push(entry); lastArr = lair.actions;
      } else if (target) {
        entry = { name: parsed.name, description: parsed.description, usage: parsed.usage };
        target.push(entry); lastArr = target;
      } else {
        entry = { name: parsed.name, description: parsed.description, usage: parsed.usage };
        traits.push(entry); lastArr = traits;
      }
    }
  });

  // ── Legendary action count from preamble ──────────────────────────────

  if (legendary.preamble) {
    var lcm = legendary.preamble.match(/can take (\d+) legendary/i);
    if (lcm) legendary.count = parseInt(lcm[1]);
  }

  // ── Build statblock ──────────────────────────────────────────────────────

  var sb = {
    system: '5e2024',
    name: name, size: size, type: type, subtype: subtype, alignment: alignment,
    isHomebrew: false, source: is2024 ? 'D&D Beyond (2024)' : 'D&D Beyond (Legacy)', tags: [],
    habitat: '', treasure: '',
    ac: { value: acV, description: acD },
    hp: { average: hpA, formula: hpF },
    initiativeOverride: null, speed: speed,
    abilities: abilities, savingThrows: savingThrows, skills: skills, cr: cr,
    gear: gearRaw, damageVulnerabilities: dVuln, damageResistances: dRes,
    damageImmunities: dImm, conditionImmunities: cImm,
    senses: senses, languages: languages,
    traits: traits, actions: actions, bonusActions: bonusActions, reactions: reactions,
    legendary: legendary, mythic: mythic, lair: lair
  };

  // Try POST first, fall back to clipboard
  showBanner('Importing ' + name + (is2024 ? '' : ' (legacy)') + '...', '#1565c0');

  fetch(HB_URL + '/api/statblock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(sb)
  }).then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (saved) {
    showBanner('\u2713 ' + name + ' imported! Open your Homebrewery library to see it.');
  }).catch(function () {
    // POST failed (CORS, not logged in, etc.) — fall back to clipboard
    var json = JSON.stringify(sb, null, 2);
    navigator.clipboard.writeText(json).then(function () {
      showBanner('\u2713 ' + name + ' copied to clipboard. Go to Library \u2192 Paste Import.', '#f57c00');
    }).catch(function () {
      prompt('Copy this JSON and paste it into Homebrewery:', json);
    });
  });

})();
