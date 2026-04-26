import { useState, useEffect } from "react";
import ImageLightbox from "./ImageLightbox.jsx";

const SHIP_TYPES = ["Random","Fighter","Smuggler Courier","Freighter","Corvette","Research Vessel","Mining Ship","Salvage Ship","Transport","Experimental / Prototype"];
const SHIP_SIZES = ["Random","Small (1–2 Decks)","Medium (2–3 Decks)","Large (3–5 Decks)"];
const FACTIONS = ["Random","Corporate","Military","Pirates","Smugglers","Research Org","Criminal Syndicate","AI-Controlled","Unknown / Alien"];
const MISSIONS = ["Random","Escort","Intercept / Capture","Salvage","Rescue","Investigation","Boarding Raid","Exploration","Containment"];
const TONES = ["Random","Gritty / Industrial","Military Tactical","Mystery / Noir","Cosmic Horror","Pulp Action"];

const LOADING_MSGS = [
  "INITIATING MISSION PARAMETERS...",
  "CROSS-REFERENCING SECTOR INTELLIGENCE...",
  "COMPILING DECK SCHEMATICS...",
  "ANALYZING THREAT VECTORS...",
  "GENERATING CLASSIFIED DOSSIER...",
  "ENCRYPTING MISSION BRIEF...",
  "TRANSMISSION INCOMING...",
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#030810;color:#a8c8d8;font-family:'Share Tech Mono',monospace;min-height:100vh;}
.scanlines{position:fixed;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px);pointer-events:none;z-index:200;}
.app{max-width:880px;margin:0 auto;padding:2rem 1.5rem 4rem;}

/* Header */
.hdr{text-align:center;margin-bottom:2.5rem;padding-top:0.5rem;}
.hdr-eyebrow{font-size:0.62rem;letter-spacing:0.35em;color:#00d4ff;text-transform:uppercase;margin-bottom:0.6rem;opacity:0.65;}
.hdr-title{font-family:'Orbitron',monospace;font-size:clamp(1.3rem,4vw,2rem);font-weight:900;color:#e8f4f8;letter-spacing:0.07em;text-transform:uppercase;line-height:1.1;}
.hdr-title span{color:#00d4ff;text-shadow:0 0 24px rgba(0,212,255,0.45);}
.hdr-sub{margin-top:0.7rem;font-size:0.7rem;color:#2a5070;letter-spacing:0.12em;}

/* Panel */
.panel{background:rgba(0,18,32,0.85);border:1px solid #0a2e48;padding:1.5rem;margin-bottom:1.5rem;position:relative;}
.panel-label{position:absolute;top:-0.55rem;left:1rem;background:#030810;padding:0 0.5rem;font-size:0.58rem;letter-spacing:0.28em;color:#00d4ff;font-family:'Orbitron',monospace;text-transform:uppercase;}
.panel-top{border-top:2px solid #00d4ff;}
.panel-amber{border-top:2px solid #ff8c00;}
.panel-amber .panel-label{color:#ff8c00;}

/* Grid */
.selectors{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:1rem;}
.sel-group{display:flex;flex-direction:column;gap:0.35rem;}
.sel-label{font-size:0.58rem;letter-spacing:0.22em;text-transform:uppercase;color:#2a6080;}
.sel-group select{background:rgba(0,12,22,0.95);border:1px solid #0a2e48;color:#a8c8d8;font-family:'Share Tech Mono',monospace;font-size:0.78rem;padding:0.48rem 2rem 0.48rem 0.65rem;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300d4ff'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.7rem center;transition:border-color 0.2s,box-shadow 0.2s;}
.sel-group select:hover,.sel-group select:focus{border-color:#00d4ff;outline:none;box-shadow:0 0 10px rgba(0,212,255,0.18);}
.sel-group select option{background:#040d18;}

/* Button */
.launch-wrap{display:flex;flex-direction:column;align-items:center;gap:0.75rem;margin:2rem 0 1.5rem;}
.launch-btn{font-family:'Orbitron',monospace;font-weight:900;font-size:1rem;letter-spacing:0.22em;text-transform:uppercase;color:#030810;background:#ff8c00;border:none;padding:1rem 3.5rem;cursor:pointer;clip-path:polygon(14px 0%,100% 0%,calc(100% - 14px) 100%,0% 100%);transition:all 0.2s;position:relative;}
.launch-btn:hover:not(:disabled){background:#ffaa33;box-shadow:0 0 35px rgba(255,140,0,0.6),0 0 70px rgba(255,140,0,0.15);transform:scale(1.04);}
.launch-btn:disabled{opacity:0.45;cursor:not-allowed;}
.launch-btn.loading-state{background:#0a2e48;color:#00d4ff;animation:blink 1.4s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.55;}}
.status-line{font-size:0.65rem;letter-spacing:0.2em;color:#00d4ff;height:1rem;text-align:center;opacity:0.75;min-height:1rem;}

/* Adventure output */
.adv-actions{display:flex;justify-content:flex-end;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid #0a2e48;}
.dl-btn{font-family:'Orbitron',monospace;font-size:0.62rem;letter-spacing:0.15em;text-transform:uppercase;color:#00d4ff;background:transparent;border:1px solid #00d4ff;padding:0.5rem 1.25rem;cursor:pointer;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);transition:all 0.2s;}
.dl-btn:hover{background:rgba(0,212,255,0.08);box-shadow:0 0 16px rgba(0,212,255,0.25);}

/* Markdown styles */
.md-h1{font-family:'Orbitron',monospace;font-size:1.35rem;font-weight:900;color:#e8f4f8;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:0.2rem;}
.md-h2{font-family:'Orbitron',monospace;font-size:0.8rem;font-weight:600;color:#00d4ff;letter-spacing:0.22em;text-transform:uppercase;margin-top:1.8rem;margin-bottom:0.6rem;padding-bottom:0.3rem;border-bottom:1px solid #0a2e48;}
.md-h3{font-family:'Orbitron',monospace;font-size:0.72rem;color:#ff8c00;letter-spacing:0.15em;text-transform:uppercase;margin-top:1.4rem;margin-bottom:0.45rem;}
.md-p{margin-bottom:0.65rem;font-size:0.8rem;color:#a8c8d8;line-height:1.7;}
.md-em{font-style:italic;color:#5a8099;font-size:0.78rem;display:block;margin-bottom:1.2rem;line-height:1.6;}
.md-hr{border:none;border-top:1px solid #0a2e48;margin:1.2rem 0;}
.md-li{font-size:0.8rem;color:#a8c8d8;margin-bottom:0.28rem;padding-left:1rem;line-height:1.6;}
.md-li::before{content:'▸ ';color:#00d4ff;}
.md-code{background:rgba(0,212,255,0.05);border:1px solid #0a2e48;border-left:3px solid #00d4ff;padding:0.7rem 1rem;font-size:0.74rem;color:#88c0cc;white-space:pre-wrap;word-break:break-word;margin:0.65rem 0;font-family:'Share Tech Mono',monospace;line-height:1.6;}
.md-table{width:100%;border-collapse:collapse;margin:0.8rem 0;font-size:0.74rem;}
.md-table th{background:rgba(0,212,255,0.08);color:#00d4ff;text-align:left;padding:0.38rem 0.7rem;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;border-bottom:1px solid #0a2e48;}
.md-table td{padding:0.38rem 0.7rem;border-bottom:1px solid #061520;color:#a8c8d8;vertical-align:top;line-height:1.5;}
.md-table tr:hover td{background:rgba(0,212,255,0.03);}
.md-bold{color:#e8f4f8;font-weight:bold;}
.md-gap{height:0.35rem;}

/* Error */
.err{text-align:center;color:#ff5555;font-size:0.78rem;padding:1rem;border:1px solid #441111;background:rgba(80,0,0,0.2);}

/* Image prompt button on code blocks */
.img-prompt-wrap{position:relative;}
.img-prompt-btn{position:absolute;top:0.4rem;right:0.4rem;font-family:'Orbitron',monospace;font-size:0.52rem;letter-spacing:0.12em;text-transform:uppercase;color:#ff8c00;background:rgba(0,12,22,0.9);border:1px solid #ff8c00;padding:0.32rem 0.8rem;cursor:pointer;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:all 0.2s;z-index:10;}
.img-prompt-btn:hover{background:rgba(255,140,0,0.15);box-shadow:0 0 12px rgba(255,140,0,0.35);}

/* Lightbox overlay */
.lb-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(2,6,12,0.92);z-index:300;display:flex;align-items:center;justify-content:center;}
.lb-box{background:#060e18;border:1px solid #0a2e48;border-top:2px solid #ff8c00;width:90vw;max-width:800px;max-height:90vh;display:flex;flex-direction:column;position:relative;}

/* Lightbox header */
.lb-hdr{display:flex;justify-content:space-between;align-items:center;padding:0.8rem 1.2rem;border-bottom:1px solid #0a2e48;}
.lb-title{font-family:'Orbitron',monospace;font-size:0.68rem;font-weight:600;color:#ff8c00;letter-spacing:0.15em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
.lb-close{background:none;border:none;color:#2a5070;font-size:1.2rem;cursor:pointer;padding:0 0.3rem;transition:color 0.2s;}
.lb-close:hover{color:#ff5555;}

/* Lightbox image area */
.lb-img-area{flex:1;display:flex;align-items:center;justify-content:center;position:relative;min-height:300px;overflow:hidden;padding:1rem;}
.lb-img-area img{max-width:100%;max-height:60vh;object-fit:contain;border:1px solid #0a2e48;}
.lb-placeholder{color:#2a5070;font-size:0.72rem;letter-spacing:0.15em;text-align:center;}
.lb-spinner{color:#00d4ff;font-size:0.72rem;letter-spacing:0.18em;animation:blink 1.4s infinite;}

/* Nav arrows */
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,12,22,0.85);border:1px solid #0a2e48;color:#00d4ff;font-size:1.2rem;padding:0.6rem 0.5rem;cursor:pointer;transition:all 0.2s;z-index:5;}
.lb-nav:hover{background:rgba(0,212,255,0.1);border-color:#00d4ff;}
.lb-nav-left{left:0.5rem;}
.lb-nav-right{right:0.5rem;}
.lb-counter{position:absolute;bottom:0.5rem;left:50%;transform:translateX(-50%);font-size:0.58rem;color:#2a5070;letter-spacing:0.15em;}

/* Lightbox controls */
.lb-controls{display:flex;align-items:center;gap:0.8rem;padding:0.8rem 1.2rem;border-top:1px solid #0a2e48;}
.lb-controls select{background:rgba(0,12,22,0.95);border:1px solid #0a2e48;color:#a8c8d8;font-family:'Share Tech Mono',monospace;font-size:0.72rem;padding:0.38rem 1.8rem 0.38rem 0.55rem;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300d4ff'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.5rem center;}
.lb-controls select:focus{border-color:#00d4ff;outline:none;}
.lb-gen-btn{font-family:'Orbitron',monospace;font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:#030810;background:#ff8c00;border:none;padding:0.45rem 1.2rem;cursor:pointer;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:all 0.2s;}
.lb-gen-btn:hover:not(:disabled){background:#ffaa33;box-shadow:0 0 16px rgba(255,140,0,0.4);}
.lb-gen-btn:disabled{opacity:0.45;cursor:not-allowed;}
.lb-dl-btn{font-family:'Orbitron',monospace;font-size:0.58rem;letter-spacing:0.12em;text-transform:uppercase;color:#00d4ff;background:transparent;border:1px solid #00d4ff;padding:0.45rem 1rem;cursor:pointer;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:all 0.2s;margin-left:auto;}
.lb-dl-btn:hover{background:rgba(0,212,255,0.08);box-shadow:0 0 12px rgba(0,212,255,0.25);}
.lb-dl-btn:disabled{opacity:0.3;cursor:not-allowed;}
.lb-error{color:#ff5555;font-size:0.68rem;padding:0 1.2rem 0.6rem;text-align:center;}
`;

function parseInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<span class="md-bold">$1</span>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,212,255,0.08);padding:0.1em 0.4em;font-family:inherit;color:#88c0cc">$1</code>');
}

function renderTable(rows, keyPrefix) {
  const nonSep = rows.filter(r => !/^\|[-|: ]+\|$/.test(r));
  if (nonSep.length === 0) return null;
  const parseRow = r => r.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
  const headers = parseRow(nonSep[0]);
  const body = nonSep.slice(1).map(parseRow);
  return (
    <table className="md-table" key={keyPrefix}>
      <thead><tr>{headers.map((h,i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>{body.map((row,ri) => (
        <tr key={ri}>{row.map((cell,ci) => <td key={ci} dangerouslySetInnerHTML={{__html: parseInline(cell)}}/>)}</tr>
      ))}</tbody>
    </table>
  );
}

function renderMarkdown(md, onImagePrompt) {
  const lines = md.split('\n');
  const out = [];
  let inCode = false, codeLines = [], codeLang = '';
  let inTable = false, tableRows = [];
  let inAppendixA = false;
  let lastLabel = '';
  let imgPromptIdx = 0;

  const flushTable = (idx) => {
    if (tableRows.length) out.push(renderTable(tableRows, `tbl-${idx}`));
    tableRows = []; inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Code blocks
    if (raw.startsWith('```')) {
      if (inCode) {
        const codeText = codeLines.join('\n');
        if (inAppendixA && onImagePrompt) {
          const idx = imgPromptIdx++;
          const label = lastLabel || `Image Prompt ${idx + 1}`;
          out.push(
            <div className="img-prompt-wrap" key={`code-${i}`}>
              <pre className="md-code">{codeText}</pre>
              <button
                className="img-prompt-btn"
                onClick={() => onImagePrompt(idx, codeText, label)}
              >
                ▸ Generate Image
              </button>
            </div>
          );
        } else {
          out.push(<pre className="md-code" key={`code-${i}`}>{codeText}</pre>);
        }
        codeLines = []; inCode = false;
      } else {
        if (inTable) flushTable(i);
        codeLang = raw.slice(3); inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(raw); continue; }

    // Tables
    if (raw.startsWith('|')) {
      inTable = true; tableRows.push(raw); continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Track Appendix A section
    if (raw.startsWith('## ') && /appendix\s*a/i.test(raw)) {
      inAppendixA = true;
    } else if (raw.startsWith('## ') && inAppendixA) {
      inAppendixA = false;
    }

    // Track labels for image prompts (h3 or bold lines)
    if (raw.startsWith('### ')) {
      lastLabel = raw.slice(4).trim();
    } else if (/^\*\*(.+?):\*\*\s*$/.test(raw)) {
      lastLabel = raw.replace(/^\*\*/, '').replace(/:\*\*\s*$/, '').trim();
    }

    // Headers
    if (raw.startsWith('# ')) {
      out.push(<h1 className="md-h1" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw.slice(2))}}/>);
    } else if (raw.startsWith('## ')) {
      out.push(<h2 className="md-h2" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw.slice(3))}}/>);
    } else if (raw.startsWith('### ')) {
      out.push(<h3 className="md-h3" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw.slice(4))}}/>);
    } else if (/^---+$/.test(raw.trim())) {
      out.push(<hr className="md-hr" key={i}/>);
    } else if (raw.startsWith('- ') || raw.startsWith('* ')) {
      out.push(<div className="md-li" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw.slice(2))}}/>);
    } else if (/^\d+\. /.test(raw)) {
      out.push(<div className="md-li" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw.replace(/^\d+\. /,''))}}/>);
    } else if (raw.startsWith('*') && raw.endsWith('*') && raw.length > 2 && !raw.startsWith('**')) {
      out.push(<p className="md-em" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw.slice(1,-1))}}/>);
    } else if (raw.trim() === '') {
      out.push(<div className="md-gap" key={i}/>);
    } else {
      out.push(<p className="md-p" key={i} dangerouslySetInnerHTML={{__html: parseInline(raw)}}/>);
    }
  }
  if (inTable) flushTable('end');
  if (inCode && codeLines.length) {
    const codeText = codeLines.join('\n');
    if (inAppendixA && onImagePrompt) {
      const idx = imgPromptIdx++;
      const label = lastLabel || `Image Prompt ${idx + 1}`;
      out.push(
        <div className="img-prompt-wrap" key="code-end">
          <pre className="md-code">{codeText}</pre>
          <button
            className="img-prompt-btn"
            onClick={() => onImagePrompt(idx, codeText, label)}
          >
            ▸ Generate Image
          </button>
        </div>
      );
    } else {
      out.push(<pre className="md-code" key="code-end">{codeText}</pre>);
    }
  }
  return out;
}

function buildPrompt(shipType, shipSize, faction, mission, tone) {
  const s = v => v === "Random" ? "randomly and creatively determined" : v;
  return `You are a sci-fi tabletop RPG adventure writer generating a complete, ready-to-run starship adventure document.

Seed parameters:
- Ship Type: ${s(shipType)}
- Ship Size: ${s(shipSize)}
- Controlling Faction: ${s(faction)}
- Primary Mission Type: ${s(mission)}
- Adventure Tone: ${s(tone)}

Generate the full adventure using the exact structure below. Be specific, vivid, and gameplay-focused. All random parameters must be creatively resolved—never output "randomly determined." Use proper markdown formatting.

---

# [ADVENTURE TITLE IN CAPS]

*[One punchy tagline sentence — tone and hook in one breath]*

---

## SHIP OVERVIEW
- **Ship Name:** [Give it a memorable name]
- **Ship Type:**
- **Size & Decks:**
- **Hull Shape:**
- **Condition:** [Pristine / Damaged / Derelict / Infested / AI-Controlled / Experimental]
- **Tech Style:**
- **Registry / Callsign:**

---

## INCITING INCIDENT
*Why the players are involved right now.* 2–3 sentences. Immediate and urgent.

---

## MISSION
**Primary Objective:** [One clear sentence]

---

## CORE PROBLEM
*What is wrong with the ship — the thing that makes this more than a simple job.* 2–3 sentences.

---

## THE TWIST
*One complication that changes expectations mid-adventure. Keep this secret from players until the moment is right.* 2–3 sentences.

---

## FACTION
- **Who Controls the Ship:**
- **Behavior:**
- **Immediate Goal:**
- **Notable NPC:** [Name — Role — one-line personality/voice]

---

## STORY SPINE
- **Goal:**
- **Opposition:**
- **Complication:**
- **Resolution Pressure:** [The ticking clock or escalation element]

---

## STAKES
- **Personal:** [Something the players care about]
- **External:** [Wider consequences]
- **Escalation:** [What happens if they fail or take too long]

---

## DECK STRUCTURE

### DECK A — [NAME] (Command / Top)

| Room # | Name | Purpose | Hazard / Encounter |
|--------|------|---------|-------------------|
| 1 | | | |
[3–5 rooms]

### DECK B — [NAME] (Crew / Operations / Middle)

| Room # | Name | Purpose | Hazard / Encounter |
|--------|------|---------|-------------------|
[3–5 rooms, numbers continuing from Deck A]

### DECK C — [NAME] (Engineering / Cargo / Bottom)

| Room # | Name | Purpose | Hazard / Encounter |
|--------|------|---------|-------------------|
[3–5 rooms, numbers continuing]

**Vertical Connections:** [Describe lift/ladder/shaft placements between decks]
**Entry Point:** [Where and how the players board]

---

## BOARDING SITUATION
*The immediate situation when players enter.* 3–4 sentences: tension, sensory details, first decision point.

---

## LOOT & SECRETS

| Room # | Loot | Hidden Secret | Risk / Complication |
|--------|------|--------------|---------------------|
[5 entries across key rooms]

---

## ADVENTURE SUMMARY
*3–4 paragraphs. Tone, tension, key player choices, and two possible endings (success and failure/compromise).*

---

## APPENDIX A: DECKPLAN GENERATION PROMPTS

### Master Deckplan Prompt (All Decks)
\`\`\`
[Full image generation prompt for the complete multi-deck top-down deckplan. Specify hull shape, each numbered room position by deck, corridor connections, overall size and style. Write it so an image model can attempt to render a usable schematic.]
\`\`\`

### Exterior Ship Prompt (3/4 Angle View)
\`\`\`
[Full image generation prompt for the ship's exterior, derived from interior logic: cockpit position from room 1, cargo access from cargo room, engine cluster from engineering deck, asymmetry from hidden/irregular rooms. Include tone and style details.]
\`\`\`

### Key Room Prompts

**Room [#] — [Name]:**
\`\`\`
[Interior room image prompt — top-down schematic view with furniture/equipment described]
\`\`\`

**Room [#] — [Name]:**
\`\`\`
[Interior room image prompt]
\`\`\`

**Room [#] — [Name]:**
\`\`\`
[Interior room image prompt]
\`\`\`

---

## APPENDIX B: HANDOUTS

### Handout 1 — Initial Contact
*[What the players receive before boarding: distress signal text, sensor ping, bounty posting, dispatch order, or transmission. Write it fully in-world with appropriate jargon and formatting.]*

---

### Handout 2 — Ship Document
*[An in-world document found aboard: cargo manifest, captain's log entry, security alert, crew roster, or mission brief. Write it in-world. Include redacted sections or damage if appropriate to the ship's condition.]*

---

### Handout 3 — Faction Intelligence
*[What a contact, database, or sensor sweep reveals about the faction controlling the ship. Written as an intelligence report, street rumor, or nav-computer entry depending on tone.]*

---

Output only the adventure document. No preamble, no explanation, no meta-commentary.`;
}

export default function App() {
  const [shipType, setShipType] = useState("Random");
  const [shipSize, setShipSize] = useState("Random");
  const [faction, setFaction] = useState("Random");
  const [mission, setMission] = useState("Random");
  const [tone, setTone] = useState("Random");
  const [provider, setProvider] = useState("claude");
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [adventure, setAdventure] = useState(null);
  const [error, setError] = useState(null);
  const [imageGallery, setImageGallery] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgError, setImgError] = useState(null);

  useEffect(() => {
    fetch("/api/ai/status").then(r => r.json()).then(s => {
      setAiStatus(s);
      if (!s.claude?.available && s.openai?.available) setProvider("openai");
      else if (!s.claude?.available && s.gemini?.available) setProvider("gemini");
      else if (!s.claude?.available && s.lmStudio?.available) setProvider("lmstudio");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStatusIdx(i => (i + 1) % LOADING_MSGS.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setAdventure(null);
    setImageGallery({});
    setStatusIdx(0);
    try {
      const res = await fetch("/api/ai/adventure", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ prompt: buildPrompt(shipType, shipSize, faction, mission, tone), provider })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdventure(data.text);
    } catch(e) {
      setError(`TRANSMISSION FAILED: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!adventure) return;
    const titleMatch = adventure.match(/^#\s+(.+)$/m);
    const filename = titleMatch
      ? titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g,'') + '.md'
      : 'starship-adventure.md';
    const blob = new Blob([adventure], {type: "text/markdown"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImagePrompt = (idx, prompt, label) => {
    setLightbox({ idx, prompt, label });
    setImgError(null);
  };

  const handleImageGenerate = async (imageProvider) => {
    if (!lightbox || imgGenerating) return;
    setImgGenerating(true);
    setImgError(null);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: lightbox.prompt, provider: imageProvider })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImageGallery(prev => ({
        ...prev,
        [lightbox.idx]: [
          ...(prev[lightbox.idx] || []),
          { dataUrl: data.image, provider: imageProvider, timestamp: Date.now() }
        ]
      }));
    } catch (e) {
      setImgError(`IMAGE GENERATION FAILED: ${e.message}`);
    } finally {
      setImgGenerating(false);
    }
  };

  const Selector = ({label, value, onChange, options}) => (
    <div className="sel-group">
      <div className="sel-label">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="scanlines"/>
      <div className="app">

        <div className="hdr">
          <div className="hdr-eyebrow">Mount Ogden Gaming Company · Procedural Engine v1.0</div>
          <div className="hdr-title">STARSHIP <span>ADVENTURE</span> GENERATOR</div>
          <div className="hdr-sub">ONE-CLICK · FULL MISSION BRIEF · IMAGE PROMPTS INCLUDED</div>
        </div>

        <div className="panel panel-top">
          <div className="panel-label">Mission Parameters</div>
          <div className="selectors">
            <Selector label="Ship Type"    value={shipType}  onChange={setShipType}  options={SHIP_TYPES}  />
            <Selector label="Ship Size"    value={shipSize}  onChange={setShipSize}  options={SHIP_SIZES}  />
            <Selector label="Faction"      value={faction}   onChange={setFaction}   options={FACTIONS}    />
            <Selector label="Mission Type" value={mission}   onChange={setMission}   options={MISSIONS}    />
            <Selector label="Tone"         value={tone}      onChange={setTone}      options={TONES}       />
            {aiStatus && (
              <div className="sel-group">
                <div className="sel-label">AI Provider</div>
                <select value={provider} onChange={e => setProvider(e.target.value)}>
                  {aiStatus.claude?.available  && <option value="claude">Claude</option>}
                  {aiStatus.openai?.available  && <option value="openai">OpenAI (GPT-4o)</option>}
                  {aiStatus.gemini?.available  && <option value="gemini">Gemini</option>}
                  {aiStatus.lmStudio?.available && <option value="lmstudio">Local (LM Studio)</option>}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="launch-wrap">
          <button
            className={`launch-btn${loading ? ' loading-state' : ''}`}
            onClick={generate}
            disabled={loading}
          >
            {loading ? 'GENERATING...' : 'ONWARD!'}
          </button>
          <div className="status-line">
            {loading ? LOADING_MSGS[statusIdx] : adventure ? '// MISSION BRIEF READY //' : '// SET PARAMETERS · INITIATE SEQUENCE //'}
          </div>
        </div>

        {error && <div className="err">{error}</div>}

        {adventure && (
          <div className="panel panel-amber">
            <div className="panel-label">Mission Brief — Classified</div>
            <div className="adv-actions">
              <button className="dl-btn" onClick={download}>⬇ Download .md</button>
            </div>
            <div className="md-content">
              {renderMarkdown(adventure, handleImagePrompt)}
            </div>
          </div>
        )}

      </div>
        {lightbox && (
          <ImageLightbox
            label={lightbox.label}
            prompt={lightbox.prompt}
            gallery={imageGallery[lightbox.idx] || []}
            generating={imgGenerating}
            error={imgError}
            onGenerate={handleImageGenerate}
            onClose={() => { setLightbox(null); setImgError(null); }}
          />
        )}
    </>
  );
}
