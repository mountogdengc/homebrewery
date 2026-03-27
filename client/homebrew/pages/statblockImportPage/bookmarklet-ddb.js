// bookmarklet-ddb.js — D&D Beyond 2024 monster page → POST to Homebrewery
// Extracts stat block data from the current D&D Beyond page and sends it
// directly to your Homebrewery instance.
//
// FOR PERSONAL USE ONLY. D&D Beyond content is (c) Wizards of the Coast.
'use strict';

(function () {

  var HB_URL = '{{HB_URL}}';

  var root = document.querySelector('.mon-stat-block-2024');
  if (!root) {
    alert('No 2024 stat block found on this page.\nMake sure you are on a D&D Beyond monster page.');
    return;
  }

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

  var nameEl = root.querySelector('.mon-stat-block-2024__name-link');
  var name = nameEl ? nameEl.textContent.trim() : 'Unknown';

  // ── Meta ─────────────────────────────────────────────────────────────────

  var metaEl = root.querySelector('.mon-stat-block-2024__meta');
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

  root.querySelectorAll('.mon-stat-block-2024__attribute').forEach(function (attr) {
    var lbl = (attr.querySelector('.mon-stat-block-2024__attribute-label') || {}).textContent || '';
    var val = (attr.querySelector('.mon-stat-block-2024__attribute-data-value') || {}).textContent || '';
    var ext =  attr.querySelector('.mon-stat-block-2024__attribute-data-extra');
    lbl = lbl.trim(); val = val.trim();
    if (lbl === 'AC') {
      var m = val.match(/(\d+)\s*(.*)/);
      if (m) { acV = parseInt(m[1]) || 10; acD = m[2].replace(/[()]/g, '').trim(); }
    } else if (lbl === 'HP') {
      hpA = parseInt(val) || 0;
      if (ext) hpF = ext.textContent.replace(/[()]/g, '').replace(/\s+/g, '').trim();
    } else if (lbl === 'Speed') {
      var wm = val.match(/^(\d+)/);           if (wm) speed.walk   = parseInt(wm[1]);
      var fm = val.match(/fly\s+(\d+)/i);     if (fm) speed.fly    = parseInt(fm[1]);
      var sm = val.match(/swim\s+(\d+)/i);    if (sm) speed.swim   = parseInt(sm[1]);
      var bm = val.match(/burrow\s+(\d+)/i);  if (bm) speed.burrow = parseInt(bm[1]);
      var cm = val.match(/climb\s+(\d+)/i);   if (cm) speed.climb  = parseInt(cm[1]);
      speed.hover = /hover/i.test(val);
    }
  });

  // ── Ability scores & saves ──────────────────────────────────────────────

  var AB_MAP = { STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha' };
  var abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  var rawSave   = {};

  root.querySelectorAll('.stat-table tbody tr').forEach(function (row) {
    var abLabel = (row.querySelector('th') || {}).textContent || '';
    var ab = AB_MAP[abLabel.trim()];
    if (!ab) return;
    var tds = row.querySelectorAll('td');
    if (tds.length < 3) return;
    abilities[ab] = parseInt(tds[0].textContent) || 10;
    rawSave[ab]   = parseInt(tds[2].textContent) || 0;
  });

  // ── CR + tidbits ────────────────────────────────────────────────────────

  var cr = '1', skillRaw = '', senses = '', languages = '\u2014';
  var dVuln = '', dRes = '', dImm = '', cImm = '';

  root.querySelectorAll('.mon-stat-block-2024__tidbit').forEach(function (t) {
    var lbl = (t.querySelector('.mon-stat-block-2024__tidbit-label') || {}).textContent || '';
    var dat =  t.querySelector('.mon-stat-block-2024__tidbit-data');
    lbl = lbl.trim();
    var v = cleanText(dat);
    if      (lbl === 'CR')                     { var m = v.match(/^(\d+\/\d+|\d+)/); if (m) cr = m[1]; }
    else if (lbl === 'Skills')                 skillRaw  = v;
    else if (lbl === 'Senses')                 senses    = v;
    else if (lbl === 'Languages')              languages = v || '\u2014';
    else if (lbl === 'Damage Vulnerabilities') dVuln     = v;
    else if (lbl === 'Damage Resistances')     dRes      = v;
    else if (lbl === 'Damage Immunities')      dImm      = v;
    else if (lbl === 'Condition Immunities')   cImm      = v;
  });

  // ── Saving throws ──────────────────────────────────────────────────────

  var PB = getPB(cr);
  var savingThrows = {};
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (ab) {
    var em = abilityMod(abilities[ab]);
    var sv = rawSave[ab] !== undefined ? rawSave[ab] : em;
    var prof = sv !== em;
    var ovr  = (prof && sv !== em + PB) ? sv : null;
    savingThrows[ab] = { proficient: prof, override: ovr };
  });

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
    var fullText = c.textContent.replace(/\s+/g, ' ').trim();
    var strongEl = c.querySelector('strong');
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

  root.querySelectorAll('.mon-stat-block-2024__description-block').forEach(function (block) {
    var hdEl    = block.querySelector('.mon-stat-block-2024__description-block-heading');
    var content = block.querySelector('.mon-stat-block-2024__description-block-content');
    if (!content) return;
    var heading = hdEl ? hdEl.textContent.trim() : '';
    var isLeg  = heading === 'Legendary Actions';
    var isMyth = heading === 'Mythic Actions';
    var isLair = heading === 'Lair Actions';
    var target = SECTION_MAP[heading] || null;
    var lastArr = null;

    content.querySelectorAll('p').forEach(function (p) {
      if (!p.querySelector('strong')) {
        var pt = cleanText(p);
        if (isLeg)  legendary.preamble = pt;
        if (isMyth) mythic.preamble    = pt;
        if (isLair) lair.preamble      = pt;
        return;
      }
      var parsed = parseActionParagraph(p);
      if (!parsed) return;

      if (!parsed.name) {
        if (parsed.appendText && lastArr && lastArr.length > 0) {
          lastArr[lastArr.length - 1].description += '\n' + parsed.appendText;
        }
        return;
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
      }
    });
  });

  // ── Build & POST ──────────────────────────────────────────────────────

  var sb = {
    system: '5e2024',
    name: name, size: size, type: type, subtype: subtype, alignment: alignment,
    isHomebrew: false, source: 'D&D Beyond (2024)', tags: [],
    habitat: '', treasure: '',
    ac: { value: acV, description: acD },
    hp: { average: hpA, formula: hpF },
    initiativeOverride: null, speed: speed,
    abilities: abilities, savingThrows: savingThrows, skills: skills, cr: cr,
    gear: '', damageVulnerabilities: dVuln, damageResistances: dRes,
    damageImmunities: dImm, conditionImmunities: cImm,
    senses: senses, languages: languages,
    traits: traits, actions: actions, bonusActions: bonusActions, reactions: reactions,
    legendary: legendary, mythic: mythic, lair: lair
  };

  // Try POST first, fall back to clipboard
  showBanner('Importing ' + name + '...', '#1565c0');

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
