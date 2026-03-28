/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getAttributeByKey, calculateAttributeCost } from '../../data/attributesLibrary';
import { getDefectByKey, calculateDefectBonus } from '../../data/defectsLibrary';
import { BesmCharacter } from '../../types/besm-character';
import { normalizeDerived } from '../../utils/derived';
import { useToast } from '../../contexts/ToastContext';

interface Step7FinalTouchesProps {
  character: BesmCharacter;
  onCharacterChange: (updates: Partial<BesmCharacter>) => void;
  onExport: () => void;
  onReset?: () => void;
}

export const Step7FinalTouches: React.FC<Step7FinalTouchesProps> = ({
  character,
  onCharacterChange,
  onExport,
  onReset
}) => {
  const { addToast } = useToast();
  const [notes, setNotes] = useState(character.notes || '');
  const [appearance, setAppearance] = useState(character.appearance || '');
  const [background, setBackground] = useState(character.background || '');
  const [personality, setPersonality] = useState(character.personality || '');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const handleSaveChanges = () => {
    onCharacterChange({
      notes,
      appearance,
      background,
      personality
    });
    try { addToast('Character details saved.', 'success'); } catch {}
  };

  // Assemble filled PDF and open in a new tab (no auto-print)
  const handleOpenFilledPdfInNewTab = async () => {
    try { console.log('[Step7][OpenFilled] start'); } catch {}
    try {
      const url = '/staticImages/besm/BESM4_character_sheets_corrected.pdf';
      const res = await fetch(url);
      const templateBytes = await res.arrayBuffer();
      const master = await PDFDocument.create();

      type SheetNote = { pageStart: number; isCompanion: boolean; text: string };
      const sheetNotes: SheetNote[] = [];

      const appendFilledSheet = async (data: {
        name: string;
        stats: { body: number; mind: number; soul: number };
        derived?: { healthPoints?: number; energyPoints?: number; attackCombatValue?: number; defenseCombatValue?: number; damage?: number } & Record<string, number>;
        meta?: { race?: string; className?: string; gender?: string; height?: string; weight?: string };
        attributes?: { name: string; level: number; points: number }[];
        defects?: { name: string; rank: number; points: number }[];
        notes?: string;
        ownerName?: string;
      }) => {
        const doc = await PDFDocument.load(templateBytes);
        const form = doc.getForm();
        const helv = await doc.embedStandardFont(StandardFonts.Helvetica);
        const trySetAny = (names: string[], value: string) => {
          for (const n of names) { try { form.getTextField(n).setText(value ?? ''); return true; } catch {} }
          return false;
        };
        trySetAny(['CHARACTER NAME', 'NAME'], data.name || '');
        trySetAny(['BODY', 'Body'], String(data.stats.body ?? ''));
        trySetAny(['MIND', 'Mind'], String(data.stats.mind ?? ''));
        trySetAny(['SOUL', 'Soul'], String(data.stats.soul ?? ''));
        if (data.derived) {
          if (data.derived.healthPoints != null) trySetAny(['HEALTH POINTS', 'HEALTH', 'HP'], String(data.derived.healthPoints));
          if (data.derived.energyPoints != null) trySetAny(['ENERGY POINTS', 'ENERGY', 'EP'], String(data.derived.energyPoints));
          if (data.derived.attackCombatValue != null) trySetAny(['ACV', 'ATTACK COMBAT', 'ATTACK VALUE', 'ATTACK COMBAT VALUE'], String(data.derived.attackCombatValue));
          if (data.derived.defenseCombatValue != null) trySetAny(['DCV', 'DEFENSE COMBAT', 'DEFENCE COMBAT', 'DEFENSE VALUE', 'DEFENCE VALUE', 'DEFENSE COMBAT VALUE'], String(data.derived.defenseCombatValue));
          const dmgMult = (data as any).derived?.damageMultiplier ?? data.derived.damage;
          if (dmgMult != null) trySetAny(['DAMAGE MULTIPLIER', 'DM', 'DAMAGE', 'DAMAGE MULT'], String(dmgMult));
        }
        if (data.meta) {
          trySetAny(['RACE', 'SPECIES', 'RACE/SPECIES', 'RACE - SPECIES'], data.meta.race || '');
          trySetAny(['CLASS', 'OCCUPATION', 'CLASS/OCCUPATION', 'CLASS OCCUPATION'], data.meta.className || '');
          trySetAny(['GENDER', 'SEX'], data.meta.gender || '');
          trySetAny(['HEIGHT'], data.meta.height || '');
          trySetAny(['WEIGHT'], data.meta.weight || '');
        }
        if (data.attributes && data.attributes.length) {
          const attrs = data.attributes.slice(0, 20);
          for (let i = 0; i < 20; i++) {
            const a = attrs[i];
            const name = a ? a.name : '';
            const level = a ? String(a.level) : '';
            const points = a ? String(a.points) : '';
            const idx = i.toString();
            try { form.getTextField(`ATTRIBUTE.${idx}`).setText(name); } catch {}
            if (i === 19) {
              try { form.getTextField('LEVEL.19.0').setText(level); } catch {}
              try { form.getTextField('POINTS.19.0').setText(points); } catch {}
            } else {
              try { form.getTextField(`LEVEL.${idx}`).setText(level); } catch {}
              try { form.getTextField(`POINTS.${idx}`).setText(points); } catch {}
            }
          }
        }
        if (data.defects && data.defects.length) {
          const defs = data.defects.slice(0, 8);
          for (let i = 0; i < 8; i++) {
            const d = defs[i];
            const dname = d ? d.name : '';
            const drank = d ? String(d.rank) : '';
            const dpoints = d ? String(d.points) : '';
            const idx = i.toString();
            try { form.getTextField(`DEFECT.${idx}`).setText(dname); } catch {}
            try { form.getTextField(`RANK.${idx}`).setText(drank); } catch {}
            try { form.getTextField(`BP.${idx}`).setText(dpoints); } catch {}
          }
        }
        // Write notes last; track success so we only overlay if needed
        let wroteNotesField = false;
        let usedNotesFieldName: string = '';
        try {
          const parts: string[] = [];
          if (data.ownerName) parts.push(`Companion of ${data.ownerName}`);
          if (data.notes) parts.push(data.notes);
          const notesText = parts.join('\r\n\r\n');
          const noteAliases = ['GAME NOTES', 'GAME NOTES.0', 'GAME NOTES 0', 'Game Notes', 'NOTES', 'Notes', 'NOTES.0'];
          for (const fname of noteAliases) {
            try { form.getTextField(fname).setText(notesText); wroteNotesField = true; usedNotesFieldName = fname; break; } catch {}
          }
        } catch {}
        try { form.updateFieldAppearances(helv); } catch {}
        try { form.flatten(); } catch {}

        const beforeCount = master.getPageCount();
        const pages = await master.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => master.addPage(p));
        // If we wrote a field, lock it read-only; otherwise, overlay fallback
        if (wroteNotesField && usedNotesFieldName) {
          try { form.getTextField(usedNotesFieldName).enableReadOnly(); } catch {}
        } else {
          const parts: string[] = [];
          if (data.ownerName) parts.push(`Companion of ${data.ownerName}`);
          if (data.notes) parts.push(data.notes);
          sheetNotes.push({ pageStart: beforeCount, isCompanion: !!data.ownerName, text: parts.join('\n') });
        }
      };

      // Main sheet
      await appendFilledSheet({
        name: character.name || '',
        stats: { body: character.stats.body, mind: character.stats.mind, soul: character.stats.soul },
        derived: {
          healthPoints: character.derivedValues.healthPoints,
          energyPoints: character.derivedValues.energyPoints,
          attackCombatValue: character.derivedValues.attackCombatValue,
          defenseCombatValue: character.derivedValues.defenseCombatValue,
          damage: character.derivedValues.damage,
        },
        meta: {
          race: ((character.templates?.race as any)?.race_name) || ((character.templates?.race as any)?.name) || '',
          className: ((character.templates?.class as any)?.name) || '',
          gender: (character as any).gender,
          height: (character as any).height,
          weight: (character as any).weight,
        },
        notes: [
          (character as any).description,
          character.notes,
          character.background,
          character.personality,
        ].filter(Boolean).join('\n\n'),
        attributes: (character.attributes || []).slice(0, 20).map(a => ({ name: a.template.name, level: a.level, points: a.cpCost })),
        defects: (character.defects || []).slice(0, 8).map(d => ({ name: d.template.name, rank: d.rank, points: d.cpRefund })),
      });

      // Companions
      const companions = (character.attributes || [])
        .filter(a => (a.template?.key === 'companion' || (a.template?.name || '').toLowerCase() === 'companion'))
        .map(a => (a.customInputs as any)?.companionConfig)
        .filter(Boolean) as any[];
      for (const comp of companions) {
        const stats = { body: comp?.stats?.body ?? 0, mind: comp?.stats?.mind ?? 0, soul: comp?.stats?.soul ?? 0 };
        const d = normalizeDerived(comp?.derived);
        const derived = {
          healthPoints: d.hp,
          energyPoints: d.ep,
          attackCombatValue: d.acv,
          defenseCombatValue: d.dcv,
          damage: d.dm,
        } as const;
        const cAttrs = Array.isArray(comp?.attributes) ? comp.attributes.slice(0, 20).map((a: any) => {
          const tpl = a?.key ? getAttributeByKey(a.key) : undefined;
          const level = Math.max(1, Math.trunc(a?.level || 1));
          const points = tpl ? calculateAttributeCost(tpl as any, level) : 0;
          return { name: tpl?.name || (a?.key || 'Attribute'), level, points };
        }) : [];
        const cDefs = Array.isArray(comp?.defects) ? comp.defects.slice(0, 8).map((df: any) => {
          const tpl = df?.key ? getDefectByKey(df.key) : undefined;
          const rank = Math.max(1, Math.trunc(df?.rank || 1));
          const points = tpl ? calculateDefectBonus(tpl as any, rank) : 0;
          return { name: tpl?.name || (df?.key || 'Defect'), rank, points };
        }) : [];
        const compNotes = [comp?.description].filter(Boolean).join('\n\n');
        await appendFilledSheet({ name: comp?.name || 'Companion', stats, derived, attributes: cAttrs, defects: cDefs, notes: compNotes, ownerName: character.name || '' });
      }

      // Overlay fallback
      try {
        const font = await master.embedStandardFont(StandardFonts.Helvetica);
        for (const sn of sheetNotes) {
          const page = master.getPage(sn.pageStart);
          page.setFont(font);
          page.setFontSize(10);
          page.drawText(sn.text, { x: 40, y: 80, maxWidth: 520, lineHeight: 12 });
        }
      } catch {}

      // Final safety: if any fields survived page copy, flatten entire master
      try { master.getForm().flatten(); } catch {}
      try { master.getForm().flatten(); } catch {}
      const filledBytes = await master.save();
      const blob = new Blob([filledBytes], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`<!doctype html><html><body style="margin:0">
        <iframe src="${objectUrl}#view=FitH" style="border:0;width:100vw;height:100vh"></iframe>
      </body></html>`);
      win.document.close();
      try { console.log('[Step7][OpenFilled] done'); } catch {}
    } catch (e) {
      console.error('Open filled PDF failed', e);
      alert('Could not generate PDF. Please ensure the PDF has form fields and try again.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Validate & sanitize
      const sanitized = (() => {
        const clampLen = (s: any, max = 2000) => String(s ?? '').slice(0, max);
        const isNum = (v: any) => typeof v === 'number' && isFinite(v);
        const ensureStats = (obj: any) => {
          const body = isNum(obj?.body) ? obj.body : 0;
          const mind = isNum(obj?.mind) ? obj.mind : 0;
          const soul = isNum(obj?.soul) ? obj.soul : 0;
          return { body, mind, soul };
        };
        if (!parsed || typeof parsed !== 'object') return null;
        // Require minimal fields: stats object, attributes/defects arrays if present
        if (parsed.stats && typeof parsed.stats !== 'object') return null;
        if (parsed.attributes && !Array.isArray(parsed.attributes)) return null;
        if (parsed.defects && !Array.isArray(parsed.defects)) return null;

        const out: Partial<BesmCharacter> = {} as any;
        if ('name' in parsed) (out as any).name = clampLen(parsed.name, 128);
        if ('description' in parsed) (out as any).description = clampLen(parsed.description);
        if ('notes' in parsed) (out as any).notes = clampLen(parsed.notes);
        if ('appearance' in parsed) (out as any).appearance = clampLen(parsed.appearance);
        if ('background' in parsed) (out as any).background = clampLen(parsed.background);
        if ('personality' in parsed) (out as any).personality = clampLen(parsed.personality);
        if ('totalCP' in parsed && isNum(parsed.totalCP)) (out as any).totalCP = parsed.totalCP;
        if ('availableCP' in parsed && isNum(parsed.availableCP)) (out as any).availableCP = parsed.availableCP;

        // Stats
        if ('stats' in parsed) (out as any).stats = ensureStats(parsed.stats);

        // Attributes (minimal safe copy of fields we use directly in UI/calcs)
        if (Array.isArray(parsed.attributes)) {
          (out as any).attributes = parsed.attributes.slice(0, 200).map((a: any) => ({
            id: clampLen(a?.id || '' , 64),
            template: a?.template && typeof a.template === 'object' ? {
              key: clampLen(a.template.key || '' , 128),
              name: clampLen(a.template.name || '' , 256),
              cost_per_level: isNum(a.template.cost_per_level) ? a.template.cost_per_level : 0,
            } : undefined,
            level: isNum(a?.level) ? a.level : 1,
            cpCost: isNum(a?.cpCost) ? a.cpCost : 0,
            notes: clampLen(a?.notes || '' , 2000),
            enhancements: Array.isArray(a?.enhancements) ? a.enhancements : [],
            limiters: Array.isArray(a?.limiters) ? a.limiters : [],
            selectedOptions: Array.isArray(a?.selectedOptions) ? a.selectedOptions.slice(0, 50).map((s: any) => clampLen(s, 128)) : [],
            customInputs: a?.customInputs && typeof a.customInputs === 'object' ? a.customInputs : {},
          }));
        }

        // Defects
        if (Array.isArray(parsed.defects)) {
          (out as any).defects = parsed.defects.slice(0, 200).map((d: any) => ({
            id: clampLen(d?.id || '' , 64),
            template: d?.template && typeof d.template === 'object' ? {
              key: clampLen(d.template.key || '' , 128),
              name: clampLen(d.template.name || '' , 256),
              cp_refund: isNum(d.template.cp_refund) ? d.template.cp_refund : 0,
            } : undefined,
            rank: isNum(d?.rank) ? d.rank : 1,
            cpRefund: isNum(d?.cpRefund) ? d.cpRefund : 0,
            notes: clampLen(d?.notes || '' , 2000),
            customInputs: d?.customInputs && typeof d.customInputs === 'object' ? d.customInputs : {},
          }));
        }

        // Templates block if present (shallow sanity only)
        if (parsed.templates && typeof parsed.templates === 'object') {
          (out as any).templates = {
            class: (parsed.templates as any).class || null,
            race: (parsed.templates as any).race || null,
            size: (parsed.templates as any).size || null,
          };
        }

        return out;
      })();

      if (!sanitized) {
        alert('Invalid character JSON structure.');
        try { addToast('Import failed: invalid structure.', 'error'); } catch {}
        return;
      }

      onCharacterChange(sanitized);
      try { addToast('Character imported successfully.', 'success'); } catch {}
    } catch (err) {
      console.error('Import failed', err);
      alert('Failed to import character JSON. Please ensure the file is a valid export.');
      try { addToast('Import failed. Please check the JSON file.', 'error'); } catch {}
    } finally {
      // Reset input so selecting the same file again triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleListPdfFields = async () => {
    try {
      const url = '/staticImages/besm/BESM4_character_sheets_corrected.pdf';
      const res = await fetch(url);
      const bytes = await res.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const info = fields.map((f: any) => ({ name: f.getName?.() || 'unknown', type: f?.constructor?.name || 'Field' }));
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>PDF Fields</title></head><body><pre>${
        JSON.stringify(info, null, 2)
      }</pre><script>console.log('PDF Fields:', ${JSON.stringify(info)});</script></body></html>`);
      w.document.close();
    } catch (e) {
      console.error('List PDF fields failed', e);
      alert('Could not list PDF fields. Ensure the PDF is accessible and has AcroForm fields.');
    }
  };

  // Calculate derived values for display
  const healthPoints = character.derivedValues.healthPoints;
  const energyPoints = character.derivedValues.energyPoints;
  const attackCombat = character.derivedValues.attackCombatValue;
  const defenseCombat = character.derivedValues.defenseCombatValue;
  
  // Tiered stat cost per BESM rule used elsewhere: 2/pt to 12, then 4/pt after
  const statCostTotal = (value: number) => {
    if (value <= 0) return 0;
    return value <= 12 ? value * 2 : 24 + (value - 12) * 4;
  };
  // Calculate total CP spent
  const statsCost = (
    statCostTotal(character.stats.body) +
    statCostTotal(character.stats.mind) +
    statCostTotal(character.stats.soul)
  );
  const attributesCost = character.attributes.reduce((total, attr) => total + attr.cpCost, 0);
  const defectsCost = character.defects.reduce((total, defect) => total - defect.cpRefund, 0); // Defects give CP back
  
  const handlePrintWorksheet = () => {
    const attrsRows = character.attributes.length
      ? character.attributes
          .map(a => `<tr><td class="col-name">${a.template.name}${(a.notes && String(a.notes).trim().length>0)?' 🛈':''}</td><td class="col-mid">L${a.level}</td><td class="col-amt">${a.cpCost} CP</td></tr>`)
          .join('')
      : '';

    const defectsRows = character.defects.length
      ? character.defects
          .map(d => `<tr><td class="col-name">${d.template.name}</td><td class="col-mid">Rank ${d.rank}</td><td class="col-amt">-${Math.abs(d.cpRefund)} CP</td></tr>`)
          .join('')
      : '';

    const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${character.name || 'Character'} — Character Worksheet</title>
        <style>
          *{ box-sizing:border-box }
          body{ margin:0; font-family: Arial, sans-serif; color:#111; }
          .page{ max-width:1000px; margin:16px auto; padding:0 12px; }
          .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
          h1{ font-size:18px; margin:0 0 6px; }
          h2{ font-size:14px; margin:10px 0 4px; }
          .box{ border-top:1px solid #ddd; padding-top:6px; }
          table{ width:100%; border-collapse:collapse; font-size:12px; }
          td{ padding:2px 0; vertical-align:top; }
          .left td:first-child{ color:#333; }
          .amt{ text-align:right; width:80px; }
          .divider{ border-left:1px solid #e5e5e5; padding-left:16px; }
          .muted{ color:#666; }
          @media print{ .page{ margin:0; } }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>Character Worksheet</h1>
          <div class="grid">
            <div>
              <div class="box">
                <div class="muted">${character.name || 'Unnamed Character'}</div>
              </div>
              <div class="box">
                <h2>Stats</h2>
                <table class="left"><tbody>
                  <tr><td>Body</td><td class="amt">${character.stats.body}</td></tr>
                  <tr><td>Mind</td><td class="amt">${character.stats.mind}</td></tr>
                  <tr><td>Soul</td><td class="amt">${character.stats.soul}</td></tr>
                  <tr><td><strong>Stats Cost</strong></td><td class="amt"><strong>${statsCost} CP</strong></td></tr>
                </tbody></table>
              </div>
              <div class="box">
                <h2>Attributes</h2>
                ${character.attributes.length ? `<table class="left"><tbody>${attrsRows}</tbody></table>` : '<div class="muted">None</div>'}
                <table><tbody><tr><td><strong>Attributes Cost</strong></td><td class="amt"><strong>${attributesCost} CP</strong></td></tr></tbody></table>
              </div>
              <div class="box">
                <h2>Defects</h2>
                ${character.defects.length ? `<table class="left"><tbody>${defectsRows}</tbody></table>` : '<div class="muted">None</div>'}
                <table><tbody><tr><td><strong>Defects Refund</strong></td><td class="amt"><strong>-${Math.abs(defectsCost)} CP</strong></td></tr></tbody></table>
              </div>
              <div class="box">
                <table><tbody>
                  <tr><td><strong>Total Spent</strong></td><td class="amt"><strong>${character.totalCP - character.availableCP} CP</strong></td></tr>
                  <tr><td><strong>Remaining</strong></td><td class="amt"><strong>${character.availableCP} CP</strong></td></tr>
                </tbody></table>
              </div>
            </div>
            <div class="divider">
              <h2>Assets</h2>
              <div class="muted">None</div>
            </div>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const handleExportPdfAndPrint = async () => {
    try { console.log('[Step7][Export] start'); } catch {}
    try {
      const url = '/staticImages/besm/BESM4_character_sheets_corrected.pdf';
      const res = await fetch(url);
      const templateBytes = await res.arrayBuffer();
      const master = await PDFDocument.create();

      // Track page notes for post-assembly overlay
      type SheetNote = { pageStart: number; isCompanion: boolean; text: string };
      const sheetNotes: SheetNote[] = [];

      // helper to fill one sheet (character or companion) and append its pages to master
      const appendFilledSheet = async (data: {
        name: string;
        stats: { body: number; mind: number; soul: number };
        derived?: { healthPoints?: number; energyPoints?: number; attackCombatValue?: number; defenseCombatValue?: number; damage?: number } & Record<string, number>;
        meta?: { race?: string; className?: string; gender?: string; height?: string; weight?: string };
        attributes?: { name: string; level: number; points: number }[];
        defects?: { name: string; rank: number; points: number }[];
        notes?: string;
        ownerName?: string; // when provided, add a 'Companion of <owner>' tag
      }) => {
        const doc = await PDFDocument.load(templateBytes);
        const form = doc.getForm();
        try {
          const fields = form.getFields();
          const names = fields.map(f => f.getName());
          const hasGameNotes = names.includes('GAME NOTES');
          console.log('[PDF Fields][Export] total=', names.length, 'has GAME NOTES=', hasGameNotes);
        } catch (e) {
          console.warn('[PDF Fields][Export] could not enumerate fields', e);
        }
        const helv = await doc.embedStandardFont(StandardFonts.Helvetica);

        // Reuse setters
        const trySetAny = (names: string[], value: string) => {
          for (const n of names) {
            try { form.getTextField(n).setText(value ?? ''); return true; } catch {}
          }
          return false;
        };

        trySetAny(['CHARACTER NAME', 'NAME'], data.name || '');
        trySetAny(['BODY', 'Body'], String(data.stats.body ?? ''));
        trySetAny(['MIND', 'Mind'], String(data.stats.mind ?? ''));
        trySetAny(['SOUL', 'Soul'], String(data.stats.soul ?? ''));
        if (data.derived) {
          if (data.derived.healthPoints != null) trySetAny(['HEALTH POINTS', 'HEALTH', 'HP'], String(data.derived.healthPoints));
          if (data.derived.energyPoints != null) trySetAny(['ENERGY POINTS', 'ENERGY', 'EP'], String(data.derived.energyPoints));
          if (data.derived.attackCombatValue != null) trySetAny(['ACV', 'ATTACK COMBAT', 'ATTACK VALUE', 'ATTACK COMBAT VALUE'], String(data.derived.attackCombatValue));
          if (data.derived.defenseCombatValue != null) trySetAny(['DCV', 'DEFENSE COMBAT', 'DEFENCE COMBAT', 'DEFENSE VALUE', 'DEFENCE VALUE', 'DEFENSE COMBAT VALUE'], String(data.derived.defenseCombatValue));
          const dmgMult = (data as any).derived?.damageMultiplier ?? data.derived.damage;
          if (dmgMult != null) trySetAny(['DAMAGE MULTIPLIER', 'DM', 'DAMAGE', 'DAMAGE MULT'], String(dmgMult));
        }

        // Basic meta if provided
        if (data.meta) {
          trySetAny(['RACE', 'SPECIES', 'RACE/SPECIES', 'RACE - SPECIES'], data.meta.race || '');
          trySetAny(['CLASS', 'OCCUPATION', 'CLASS/OCCUPATION', 'CLASS OCCUPATION'], data.meta.className || '');
          trySetAny(['GENDER', 'SEX'], data.meta.gender || '');
          trySetAny(['HEIGHT'], data.meta.height || '');
          trySetAny(['WEIGHT'], data.meta.weight || '');
        }
        // Notes write attempt #1
        let wroteNotesField = false;
        try {
          const parts: string[] = [];
          const isCompanion = !!(data as any).ownerName;
          if ((data as any).ownerName) parts.push(`Companion of ${(data as any).ownerName}`);
          if ((data as any).notes) parts.push((data as any).notes as string);
          const notesText = parts.join('\r\n\r\n');
          const writeText = notesText;
          const noteAliases = ['GAME NOTES', 'GAME NOTES.0', 'GAME NOTES 0', 'Game Notes', 'NOTES', 'Notes', 'NOTES.0'];
          let wrote = false;
          let usedField = '';
          for (const fname of noteAliases) {
            try { form.getTextField(fname).setText(writeText); wrote = true; wroteNotesField = true; usedField = fname; break; } catch {}
          }
          console.log(`[PDF Notes][Export] type=${isCompanion ? 'companion' : 'character'} wrote=${wrote} field=${usedField} length=${writeText.length}`);
        } catch (err) {
          console.warn('[PDF Notes][Export] failed to write notes', err);
        }

        // Notes write attempt #2 (alias-aware)
        try {
          const parts: string[] = [];
          const isCompanion = !!data.ownerName;
          if (data.ownerName) parts.push(`Companion of ${data.ownerName}`);
          if (data.notes) parts.push(data.notes);
          const notesText = parts.join('\r\n\r\n');
          const writeText = notesText;
          const noteAliases = ['GAME NOTES', 'Game Notes', 'NOTES', 'Notes', 'NOTES.0'];
          let wrote = false;
          let usedField = '';
          for (const fname of noteAliases) {
            try { form.getTextField(fname).setText(writeText); wrote = true; wroteNotesField = true; usedField = fname; break; } catch {}
          }
          // console debug
          console.log(`[PDF Notes][Export] type=${isCompanion ? 'companion' : 'character'} wrote=${wrote} field=${usedField} length=${writeText.length}`);
        } catch (err) {
          console.warn('[PDF Notes][Export] failed to write notes', err);
        }

        // Notes write attempt #3 (last), then update field appearances again, then flatten
        try {
          const parts: string[] = [];
          const isCompanion = !!data.ownerName;
          if (data.ownerName) parts.push(`Companion of ${data.ownerName}`);
          if (data.notes) parts.push(data.notes);
          const notesText = parts.join('\r\n\r\n');
          const writeText = notesText;
          const noteAliases = ['GAME NOTES', 'GAME NOTES.0', 'GAME NOTES 0', 'Game Notes', 'NOTES', 'Notes', 'NOTES.0'];
          let wrote = false;
          let usedField = '';
          for (const fname of noteAliases) {
            try { form.getTextField(fname).setText(writeText); wrote = true; wroteNotesField = true; usedField = fname; break; } catch {}
          }
          console.log(`[PDF Notes][Export-LAST] type=${isCompanion ? 'companion' : 'character'} wrote=${wrote} field=${usedField} length=${writeText.length}`);
        } catch (err) {
          console.warn('[PDF Notes][Export-LAST] failed to write notes', err);
        }
        try { form.updateFieldAppearances(helv); } catch {}
        try { form.flatten(); } catch {}

        // Attributes list (up to 20): ATTRIBUTE.i, LEVEL.i, POINTS.i (with LEVEL.19.0 quirk)
        if (data.attributes && data.attributes.length) {
          const attrs = data.attributes.slice(0, 20);
          for (let i = 0; i < 20; i++) {
            const a = attrs[i];
            const name = a ? a.name : '';
            const level = a ? String(a.level) : '';
            const points = a ? String(a.points) : '';
            const idx = i.toString();
            try { form.getTextField(`ATTRIBUTE.${idx}`).setText(name); } catch {}
            if (i === 19) {
              try { form.getTextField('LEVEL.19.0').setText(level); } catch {}
              try { form.getTextField('POINTS.19.0').setText(points); } catch {}
            } else {
              try { form.getTextField(`LEVEL.${idx}`).setText(level); } catch {}
              try { form.getTextField(`POINTS.${idx}`).setText(points); } catch {}
            }
          }
        }

        // Defects list (up to 8): DEFECT.i, RANK.i, BP.i
        if (data.defects && data.defects.length) {
          const defs = data.defects.slice(0, 8);
          for (let i = 0; i < 8; i++) {
            const d = defs[i];
            const dname = d ? d.name : '';
            const drank = d ? String(d.rank) : '';
            const dpoints = d ? String(d.points) : '';
            const idx = i.toString();
            try { form.getTextField(`DEFECT.${idx}`).setText(dname); } catch {}
            try { form.getTextField(`RANK.${idx}`).setText(drank); } catch {}
            try { form.getTextField(`BP.${idx}`).setText(dpoints); } catch {}
          }
        }

        // Write GAME NOTES last, then update appearances again, then flatten
        try {
          const parts: string[] = [];
          const isCompanion = !!data.ownerName;
          if (data.ownerName) parts.push(`Companion of ${data.ownerName}`);
          if (data.notes) parts.push(data.notes);
          const notesText = parts.join('\r\n\r\n');
          const writeText = notesText;
          const noteAliases = ['GAME NOTES', 'GAME NOTES.0', 'GAME NOTES 0', 'Game Notes', 'NOTES', 'Notes', 'NOTES.0'];
          let wrote = false;
          let usedField = '';
          for (const fname of noteAliases) {
            try { form.getTextField(fname).setText(writeText); wrote = true; usedField = fname; break; } catch {}
          }
          console.log(`[PDF Notes][Export-LAST] type=${isCompanion ? 'companion' : 'character'} wrote=${wrote} field=${usedField} length=${writeText.length}`);
        } catch (err) {
          console.warn('[PDF Notes][Export-LAST] failed to write notes', err);
        }
        try { form.updateFieldAppearances(helv); } catch {}
        try { form.flatten(); } catch {}
        const beforeCount = master.getPageCount();
        const pages = await master.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => master.addPage(p));
        // Record note text for overlay only if field write failed
        if (!wroteNotesField) {
          const isCompanion = !!data.ownerName;
          const parts: string[] = [];
          if (data.ownerName) parts.push(`Companion of ${data.ownerName}`);
          if (data.notes) parts.push(data.notes);
          const overlayText = parts.join('\n');
          sheetNotes.push({ pageStart: beforeCount, isCompanion, text: overlayText });
        }
      };

      // Fill main character then companions, save and print
      await appendFilledSheet({
        name: character.name || '',
        stats: { body: character.stats.body, mind: character.stats.mind, soul: character.stats.soul },
        derived: {
          healthPoints: character.derivedValues.healthPoints,
          energyPoints: character.derivedValues.energyPoints,
          attackCombatValue: character.derivedValues.attackCombatValue,
          defenseCombatValue: character.derivedValues.defenseCombatValue,
          damage: character.derivedValues.damage,
        },
        meta: {
          race: ((character.templates?.race as any)?.race_name) || ((character.templates?.race as any)?.name) || '',
          className: ((character.templates?.class as any)?.name) || '',
          gender: (character as any).gender,
          height: (character as any).height,
          weight: (character as any).weight,
        },
        notes: [
          (character as any).description,
          character.notes,
          character.background,
          character.personality,
        ].filter(Boolean).join('\r\n\r\n'),
        attributes: (character.attributes || []).slice(0, 20).map(a => ({
          name: a.template.name,
          level: a.level,
          points: a.cpCost,
        })),
        defects: (character.defects || []).slice(0, 8).map(d => ({
          name: d.template.name,
          rank: d.rank,
          points: d.cpRefund,
        })),
      });

      const companionsExp = (character.attributes || [])
        .filter(a => (a.template?.key === 'companion' || (a.template?.name || '').toLowerCase() === 'companion'))
        .map(a => (a.customInputs as any)?.companionConfig)
        .filter(Boolean) as any[];
      for (const comp of companionsExp) {
        const stats = { body: comp?.stats?.body ?? 0, mind: comp?.stats?.mind ?? 0, soul: comp?.stats?.soul ?? 0 };
        const derived = {
          healthPoints: comp?.derived?.HP ?? comp?.derived?.['Health Points'],
          energyPoints: comp?.derived?.EP ?? comp?.derived?.['Energy Points'],
          attackCombatValue: comp?.derived?.ACV ?? comp?.derived?.['Attack Combat Value'],
          defenseCombatValue: comp?.derived?.DCV ?? comp?.derived?.['Defense Combat Value'],
          damage: comp?.derived?.DM ?? comp?.derived?.['Damage Multiplier'],
        } as any;
        // Build attributes/defects for companion from keys
        const cAttrs = Array.isArray(comp?.attributes) ? comp.attributes.slice(0, 20).map((a: any) => {
          const tpl = a?.key ? getAttributeByKey(a.key) : undefined;
          const level = Math.max(1, Math.trunc(a?.level || 1));
          const points = tpl ? calculateAttributeCost(tpl as any, level) : 0;
          return { name: tpl?.name || (a?.key || 'Attribute'), level, points };
        }) : [];
        const cDefs = Array.isArray(comp?.defects) ? comp.defects.slice(0, 8).map((df: any) => {
          const tpl = df?.key ? getDefectByKey(df.key) : undefined;
          const rank = Math.max(1, Math.trunc(df?.rank || 1));
          const points = tpl ? calculateDefectBonus(tpl as any, rank) : 0;
          return { name: tpl?.name || (df?.key || 'Defect'), rank, points };
        }) : [];
        const compNotes = [comp?.description].filter(Boolean).join('\n\n');
        await appendFilledSheet({ name: comp?.name || 'Companion', stats, derived, attributes: cAttrs, defects: cDefs, notes: compNotes, ownerName: character.name || '' });
      }

      // Fallback: overlay notes directly onto the first page of each sheet in the master
      try {
        const font = await master.embedStandardFont(StandardFonts.Helvetica);
        for (const sn of sheetNotes) {
          const page = master.getPage(sn.pageStart);
          page.setFont(font);
          page.setFontSize(10);
          // Draw near bottom-left margin as a visible fallback (y from bottom)
          page.drawText(sn.text, { x: 40, y: 80, color: undefined, maxWidth: 520, lineHeight: 12 });
        }
      } catch (e) {
        console.warn('[PDF Overlay][Export] failed to place notes overlay', e);
      }

      const filled = await master.save();
      const blob = new Blob([filled], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      // Open printable viewer
      const printWin = window.open('', '_blank');
      if (!printWin) return;
      printWin.document.write(`<!doctype html><html><body style="margin:0">
        <iframe src="${objectUrl}#view=Fit" style="border:0;width:100vw;height:100vh" onload="this.contentWindow.focus(); this.contentWindow.print();"></iframe>
      </body></html>`);
      printWin.document.close();
      try { console.log('[Step7][Export] done'); } catch {}
    } catch (e) {
      console.error('PDF export failed', e);
      alert('Could not generate PDF. Please ensure the PDF has form fields and try again.');
    }
  };

  const handleGeneratePdfPreview = async () => {
    try { console.log('[Step7][Preview] start'); } catch {}
    try {
      const url = '/staticImages/besm/BESM4_character_sheets_corrected.pdf';
      const res = await fetch(url);
      const templateBytes = await res.arrayBuffer();
      const master = await PDFDocument.create();

      // Track page notes for post-assembly overlay (preview)
      type SheetNotePrev = { pageStart: number; isCompanion: boolean; text: string };
      const sheetNotesPrev: SheetNotePrev[] = [];

      const appendFilledSheet = async (data: {
        name: string;
        stats: { body: number; mind: number; soul: number };
        derived?: { healthPoints?: number; energyPoints?: number; attackCombatValue?: number; defenseCombatValue?: number; damage?: number } & Record<string, number>;
        meta?: { race?: string; className?: string; gender?: string; height?: string; weight?: string };
        attributes?: { name: string; level: number; points: number }[];
        defects?: { name: string; rank: number; points: number }[];
        notes?: string;
        ownerName?: string;
      }) => {
        const doc = await PDFDocument.load(templateBytes);
        const form = doc.getForm();
        const helv = await doc.embedStandardFont(StandardFonts.Helvetica);
        const trySetAny = (names: string[], value: string) => {
          for (const n of names) { try { form.getTextField(n).setText(value ?? ''); return true; } catch {} }
          return false;
        };
        trySetAny(['CHARACTER NAME', 'NAME'], data.name || '');
        trySetAny(['BODY', 'Body'], String(data.stats.body ?? ''));
        trySetAny(['MIND', 'Mind'], String(data.stats.mind ?? ''));
        trySetAny(['SOUL', 'Soul'], String(data.stats.soul ?? ''));
        if (data.derived) {
          if (data.derived.healthPoints != null) trySetAny(['HEALTH POINTS', 'HEALTH', 'HP'], String(data.derived.healthPoints));
          if (data.derived.energyPoints != null) trySetAny(['ENERGY POINTS', 'ENERGY', 'EP'], String(data.derived.energyPoints));
          if (data.derived.attackCombatValue != null) trySetAny(['ACV', 'ATTACK COMBAT', 'ATTACK VALUE', 'ATTACK COMBAT VALUE'], String(data.derived.attackCombatValue));
          if (data.derived.defenseCombatValue != null) trySetAny(['DCV', 'DEFENSE COMBAT', 'DEFENCE COMBAT', 'DEFENSE VALUE', 'DEFENCE VALUE', 'DEFENSE COMBAT VALUE'], String(data.derived.defenseCombatValue));
          const dmgMult = (data as any).derived?.damageMultiplier ?? data.derived.damage;
          if (dmgMult != null) trySetAny(['DAMAGE MULTIPLIER', 'DM', 'DAMAGE', 'DAMAGE MULT'], String(dmgMult));
        }
        if (data.meta) {
          trySetAny(['RACE', 'SPECIES', 'RACE/SPECIES', 'RACE - SPECIES'], data.meta.race || '');
          trySetAny(['CLASS', 'OCCUPATION', 'CLASS/OCCUPATION', 'CLASS OCCUPATION'], data.meta.className || '');
          trySetAny(['GENDER', 'SEX'], data.meta.gender || '');
          trySetAny(['HEIGHT'], data.meta.height || '');
          trySetAny(['WEIGHT'], data.meta.weight || '');
        }
        // Attributes list
        if (data.attributes && data.attributes.length) {
          const attrs = data.attributes.slice(0, 20);
          for (let i = 0; i < 20; i++) {
            const a = attrs[i];
            const name = a ? a.name : '';
            const level = a ? String(a.level) : '';
            const points = a ? String(a.points) : '';
            const idx = i.toString();
            try { form.getTextField(`ATTRIBUTE.${idx}`).setText(name); } catch {}
            if (i === 19) {
              try { form.getTextField('LEVEL.19.0').setText(level); } catch {}
              try { form.getTextField('POINTS.19.0').setText(points); } catch {}
            } else {
              try { form.getTextField(`LEVEL.${idx}`).setText(level); } catch {}
              try { form.getTextField(`POINTS.${idx}`).setText(points); } catch {}
            }
          }
        }
        // Defects list
        if (data.defects && data.defects.length) {
          const defs = data.defects.slice(0, 8);
          for (let i = 0; i < 8; i++) {
            const d = defs[i];
            const dname = d ? d.name : '';
            const drank = d ? String(d.rank) : '';
            const dpoints = d ? String(d.points) : '';
            const idx = i.toString();
            try { form.getTextField(`DEFECT.${idx}`).setText(dname); } catch {}
            try { form.getTextField(`RANK.${idx}`).setText(drank); } catch {}
            try { form.getTextField(`BP.${idx}`).setText(dpoints); } catch {}
          }
        }
        try { form.updateFieldAppearances(helv); } catch {}
        try { form.flatten(); } catch {}
        const beforeCount = master.getPageCount();
        const pages = await master.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => master.addPage(p));
        const partsPrev: string[] = [];
        if (data.ownerName) partsPrev.push(`Companion of ${data.ownerName}`);
        if (data.notes) partsPrev.push(data.notes);
        sheetNotesPrev.push({ pageStart: beforeCount, isCompanion: !!data.ownerName, text: partsPrev.join('\n') });
      };
      
      // Assemble the master doc: main character + each companion
      await appendFilledSheet({
        name: character.name || '',
        stats: { body: character.stats.body, mind: character.stats.mind, soul: character.stats.soul },
        derived: {
          healthPoints: character.derivedValues.healthPoints,
          energyPoints: character.derivedValues.energyPoints,
          attackCombatValue: character.derivedValues.attackCombatValue,
          defenseCombatValue: character.derivedValues.defenseCombatValue,
          damage: character.derivedValues.damage,
        },
        meta: {
          race: ((character.templates?.race as any)?.race_name) || ((character.templates?.race as any)?.name) || '',
          className: ((character.templates?.class as any)?.name) || '',
          gender: (character as any).gender,
          height: (character as any).height,
          weight: (character as any).weight,
        },
        notes: [
          (character as any).description,
          character.notes,
          character.background,
          character.personality,
        ].filter(Boolean).join('\n\n'),
        attributes: (character.attributes || []).slice(0, 20).map(a => ({
          name: a.template.name,
          level: a.level,
          points: a.cpCost,
        })),
        defects: (character.defects || []).slice(0, 8).map(d => ({
          name: d.template.name,
          rank: d.rank,
          points: d.cpRefund,
        })),
      });

      const companionsPrev = (character.attributes || [])
        .filter(a => (a.template?.key === 'companion' || (a.template?.name || '').toLowerCase() === 'companion'))
        .map(a => (a.customInputs as any)?.companionConfig)
        .filter(Boolean) as any[];
      for (const comp of companionsPrev) {
        const stats = { body: comp?.stats?.body ?? 0, mind: comp?.stats?.mind ?? 0, soul: comp?.stats?.soul ?? 0 };
        const derived = {
          healthPoints: comp?.derived?.HP ?? comp?.derived?.['Health Points'],
          energyPoints: comp?.derived?.EP ?? comp?.derived?.['Energy Points'],
          attackCombatValue: comp?.derived?.ACV ?? comp?.derived?.['Attack Combat Value'],
          defenseCombatValue: comp?.derived?.DCV ?? comp?.derived?.['Defense Combat Value'],
          damage: comp?.derived?.DM ?? comp?.derived?.['Damage Multiplier'],
        } as any;
        const cAttrs = Array.isArray(comp?.attributes) ? comp.attributes.slice(0, 20).map((a: any) => {
          const tpl = a?.key ? getAttributeByKey(a.key) : undefined;
          const level = Math.max(1, Math.trunc(a?.level || 1));
          const points = tpl ? calculateAttributeCost(tpl as any, level) : 0;
          return { name: tpl?.name || (a?.key || 'Attribute'), level, points };
        }) : [];
        const cDefs = Array.isArray(comp?.defects) ? comp.defects.slice(0, 8).map((df: any) => {
          const tpl = df?.key ? getDefectByKey(df.key) : undefined;
          const rank = Math.max(1, Math.trunc(df?.rank || 1));
          const points = tpl ? calculateDefectBonus(tpl as any, rank) : 0;
          return { name: tpl?.name || (df?.key || 'Defect'), rank, points };
        }) : [];
        const compNotes = [comp?.description, `Companion of ${character.name || ''}`].filter(Boolean).join('\n\n');
        await appendFilledSheet({ name: comp?.name || 'Companion', stats, derived, attributes: cAttrs, defects: cDefs, notes: compNotes, ownerName: character.name || '' });
      }

      const filled = await master.save();
      const blob = new Blob([filled], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });
      try { console.log('[Step7][Preview] done'); } catch {}
    } catch (e) {
      console.error('PDF preview generation failed', e);
      alert('Could not generate PDF preview. Please ensure the PDF has form fields and try again.');
    }
  };

  // Auto-generate preview when character changes and cleanup URL on unmount
  useEffect(() => {
    handleGeneratePdfPreview();
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);


  return (
    <div className="final-touches-step">
      <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Final Touches</h2>

      {/* Actions at top */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={handlePrintWorksheet} className="export-button" style={{ padding: '8px 12px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: 4 }}>
          Open CP Receipt (New Tab)
        </button>
        <button onClick={handleOpenFilledPdfInNewTab} className="export-button" style={{ padding: '8px 12px', backgroundColor: '#6366f1', color: 'white', borderRadius: 4 }}>
          Open Filled PDF (New Tab)
        </button>
        <button onClick={handleExportPdfAndPrint} className="export-button" style={{ padding: '8px 12px', backgroundColor: '#22c55e', color: 'white', borderRadius: 4 }}>
          Fill PDF & Print
        </button>
      </div>

      {/* Secondary actions (moved up from footer) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="export-button" onClick={onExport} style={{ padding: '8px 12px' }}>
          Export Character Sheet
        </button>
        <button className="export-button" onClick={handleImportClick} style={{ padding: '8px 12px', backgroundColor: '#059669', color: 'white' }}>
          Import Character (JSON)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImportFileChange}
        />
        {import.meta.env.DEV && (
          <button className="export-button" onClick={handleListPdfFields} style={{ padding: '8px 12px', backgroundColor: '#64748b', color: 'white' }}>
            List PDF Fields
          </button>
        )}
        {onReset && (
          <button onClick={onReset} className="reset-button" style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', borderRadius: 4 }}>
            Reset Character
          </button>
        )}
      </div>

      {/* Move footer guidance up */}
      <div className="export-info" style={{ marginBottom: 12, color: '#000' }}>
        Your character is complete! You can now export your character sheet for use in your BESM 4th Edition game.
      </div>

      {/* Inline Character Worksheet (two-column headers) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end', width: '100%', margin: '8px 0 6px' }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Character Worksheet</h3>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, textAlign: 'left' }}>Assets</h3>
      </div>
      {/* Two independent tables in a grid so right side doesn't stretch to match left */}
      <div className="cp-worksheet" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 16, alignItems: 'stretch', width: '100%' }}>
        {/* LEFT: Main character (35%/15% overall -> 70%/30% within half) */}
        <div className="left" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <table className="cp-half-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 13, color: '#000' }}>
            <colgroup>
              <col style={{ width: '70%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee', fontWeight: 700 }}>{character.name || 'Unnamed Character'}</td>
                <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee' }}></td>
              </tr>
              <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Stats</td><td></td></tr>
              <tr><td style={{ padding: '2px 6px' }}>Body</td><td style={{ padding: '2px 6px', textAlign: 'right' }}>{character.stats.body}</td></tr>
              <tr><td style={{ padding: '2px 6px' }}>Mind</td><td style={{ padding: '2px 6px', textAlign: 'right' }}>{character.stats.mind}</td></tr>
              <tr className="before-total"><td style={{ padding: '2px 6px' }}>Soul</td><td style={{ padding: '2px 6px', textAlign: 'right' }}>{character.stats.soul}</td></tr>
              <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Stats Cost</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>{statsCost} CP</td></tr>
              <tr><td style={{ padding: '6px 6px 2px', fontWeight: 700 }}>Attributes</td><td></td></tr>
              {(character.attributes || []).map((a, i) => {
                const enh = Array.isArray(a.enhancements) ? a.enhancements : [];
                const lim = Array.isArray(a.limiters) ? a.limiters : [];
                const enhText = enh.map((e: any) => e?.name || e?.label || e?.key).filter(Boolean).join(', ');
                const limText = lim.map((l: any) => l?.name || l?.label || l?.key).filter(Boolean).join(', ');
                const eff = Math.max(1, (a.level || 1) - enh.length + lim.length);
                const isLast = i === ((character.attributes?.length || 0) - 1);
                return (
                  <tr key={`attr-left-${i}`} className={isLast ? 'before-total' : undefined}>
                    <td style={{ padding: '2px 6px' }}>
                      <div>{a.template.name}</div>
                      {(enhText || limText) && (
                        <div style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>
                          {enhText && <div>+ {enhText}</div>}
                          {limText && <div>- {limText}</div>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{`L${a.level} (${eff}) ${a.cpCost} CP`}</td>
                  </tr>
                );
              })}
              <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Attributes Cost</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>{attributesCost} CP</td></tr>
              <tr><td style={{ padding: '6px 6px 2px', fontWeight: 700 }}>Defects</td><td></td></tr>
              {(character.defects || []).map((d, i) => {
                const isLast = i === ((character.defects?.length || 0) - 1);
                return (
                  <tr key={`def-left-${i}`} className={isLast ? 'before-total' : undefined}>
                    <td style={{ padding: '2px 6px' }}>{d.template.name}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{`Rank ${d.rank} -${Math.abs(d.cpRefund)} CP`}</td>
                  </tr>
                );
              })}
              <tr className="no-bottom"><td style={{ padding: '2px 6px', fontWeight: 700 }}>Defects Refund</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>-{Math.abs(defectsCost)} CP</td></tr>
              <tr><td style={{ padding: '6px 6px 2px', fontWeight: 700 }}>Total Spent</td><td style={{ padding: '6px 6px 2px', textAlign: 'right', fontWeight: 700 }}>{character.totalCP - character.availableCP} CP</td></tr>
              <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Remaining</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>{character.availableCP} CP</td></tr>
              {(() => {
                const blocks = [character.notes, character.background, character.personality]
                  .map(v => (v ? String(v).trim() : ''))
                  .filter(Boolean);
                if (blocks.length === 0) return null as any;
                return (
                  <>
                    <tr><td style={{ padding: '8px 6px 4px', fontWeight: 700 }}>Character Notes</td><td></td></tr>
                    <tr>
                      <td colSpan={2} style={{ padding: '2px 6px', color: '#333' }}>
                        {blocks.map((p, i) => (<div key={i} style={{ marginBottom: 6 }}>{p}</div>))}
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
        {/* Mid-gutter divider */}
        <div aria-hidden="true" style={{ background: '#e5e7eb', width: 1 }} />

        {/* RIGHT: Companions/minions/items (35%/15% overall -> 70%/30% within half) */}
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 13, color: '#000' }}>
            <colgroup>
              <col style={{ width: '70%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              
              {(() => {
                const comps = (character.attributes || [])
                  .filter(a => (a.template?.key === 'companion' || (a.template?.name || '').toLowerCase() === 'companion'))
                  .map(a => (a.customInputs as any)?.companionConfig)
                  .filter(Boolean) as any[];
                if (!comps.length) return (
                  <tr><td style={{ padding: '6px 6px 2px', color: '#666' }}>None</td><td></td></tr>
                );
                return comps.map((comp, idx) => (
                  <React.Fragment key={`cmp-right-${idx}`}>
                    <tr>
                      <td style={{ padding: '6px 6px 2px', fontWeight: 600, borderBottom: '1px solid #eee' }}>{comp?.name || 'Companion'}</td>
                      <td style={{ borderBottom: '1px solid #eee' }}></td>
                    </tr>
                    {/* Stats */}
                    <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Stats</td><td></td></tr>
                    <tr><td style={{ padding: '2px 6px' }}>Body</td><td style={{ padding: '2px 6px', textAlign: 'right' }}>{comp?.stats?.body ?? ''}</td></tr>
                    <tr><td style={{ padding: '2px 6px' }}>Mind</td><td style={{ padding: '2px 6px', textAlign: 'right' }}>{comp?.stats?.mind ?? ''}</td></tr>
                    <tr className="before-total"><td style={{ padding: '2px 6px' }}>Soul</td><td style={{ padding: '2px 6px', textAlign: 'right' }}>{comp?.stats?.soul ?? ''}</td></tr>
                    {(() => {
                      const b = statCostTotal(comp?.stats?.body ?? 0);
                      const m = statCostTotal(comp?.stats?.mind ?? 0);
                      const s = statCostTotal(comp?.stats?.soul ?? 0);
                      const cStatsCost = b + m + s;
                      return (
                        <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Stats Cost</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>{cStatsCost} CP</td></tr>
                      );
                    })()}
                    {/* Attributes */}
                    <tr><td style={{ padding: '4px 6px 2px', fontWeight: 600 }}>Attributes</td><td></td></tr>
                    {(Array.isArray(comp?.attributes) && comp.attributes.length > 0) ? comp.attributes.map((a: any, i: number) => {
                      const isLast = i === ((comp?.attributes?.length || 0) - 1);
                      const tpl = a?.key ? getAttributeByKey(a.key) : undefined;
                      const level = Math.max(1, Math.trunc(a?.level || 1));
                      const points = tpl ? calculateAttributeCost(tpl as any, level) : 0;
                      return (
                        <tr key={`cmp-a-right-${idx}-${i}`} className={isLast ? 'before-total' : undefined}>
                          <td style={{ padding: '2px 6px' }}>{a?.key || a?.name || 'Attribute'}</td>
                          <td style={{ padding: '2px 6px', textAlign: 'right' }}>{`L${level} ${points ? points + ' CP' : ''}`}</td>
                        </tr>
                      );
                    }) : (<tr><td style={{ padding: '2px 6px', color: '#666' }}>None</td><td></td></tr>)}
                    {(() => {
                      const attrCost = Array.isArray(comp?.attributes) ? comp.attributes.reduce((sum: number, a: any) => {
                        const tpl = a?.key ? getAttributeByKey(a.key) : undefined;
                        const level = Math.max(1, Math.trunc(a?.level || 1));
                        const pts = tpl ? calculateAttributeCost(tpl as any, level) : 0;
                        return sum + pts;
                      }, 0) : 0;
                      return (
                        <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>Attributes Cost</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>{attrCost} CP</td></tr>
                      );
                    })()}
                    {/* Defects */}
                    <tr><td style={{ padding: '4px 6px 2px', fontWeight: 600 }}>Defects</td><td></td></tr>
                    {(Array.isArray(comp?.defects) && comp.defects.length > 0) ? comp.defects.map((d: any, i: number) => {
                      const isLast = i === ((comp?.defects?.length || 0) - 1);
                      const tpl = d?.key ? getDefectByKey(d.key) : undefined;
                      const rank = Math.max(1, Math.trunc(d?.rank || 1));
                      const refund = tpl ? calculateDefectBonus(tpl as any, rank) : 0;
                      return (
                        <tr key={`cmp-d-right-${idx}-${i}`} className={isLast ? 'before-total' : undefined}>
                          <td style={{ padding: '2px 6px' }}>{d?.key || d?.name || 'Defect'}</td>
                          <td style={{ padding: '2px 6px', textAlign: 'right' }}>{`Rank ${rank} -${refund} CP`}</td>
                        </tr>
                      );
                    }) : (<tr><td style={{ padding: '2px 6px', color: '#666' }}>None</td><td></td></tr>)}
                    {(() => {
                      const defRefund = Array.isArray(comp?.defects) ? comp.defects.reduce((sum: number, d: any) => {
                        const tpl = d?.key ? getDefectByKey(d.key) : undefined;
                        const rank = Math.max(1, Math.trunc(d?.rank || 1));
                        const rf = tpl ? calculateDefectBonus(tpl as any, rank) : 0;
                        return sum + rf;
                      }, 0) : 0;
                      const attrCost = Array.isArray(comp?.attributes) ? comp.attributes.reduce((sum: number, a: any) => {
                        const tpl = a?.key ? getAttributeByKey(a.key) : undefined;
                        const level = Math.max(1, Math.trunc(a?.level || 1));
                        const pts = tpl ? calculateAttributeCost(tpl as any, level) : 0;
                        return sum + pts;
                      }, 0) : 0;
                      const totalSpent = attrCost - defRefund;
                      const level = Math.max(0, Math.trunc((comp?.level as number) || 0));
                      const budget = level * 10; // BESM companion budget rule
                      const remaining = Math.max(0, budget - Math.max(0, totalSpent));
                      return (
                        <>
                          <tr className="no-bottom"><td style={{ padding: '2px 6px', fontWeight: 700 }}>Defects Refund</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>-{Math.abs(defRefund)} CP</td></tr>
                          <tr><td style={{ padding: '6px 6px 2px', fontWeight: 700 }}>CP Budget</td><td style={{ padding: '6px 6px 2px', textAlign: 'right', fontWeight: 700 }}>{budget} CP</td></tr>
                          <tr><td style={{ padding: '2px 6px', fontWeight: 700 }}>CP Spent</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 700 }}>{totalSpent} CP</td></tr>
                          <tr><td style={{ padding: '2px 6px', fontWeight: 700, color: 'var(--besm-purple)' }}>CP Remaining</td><td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 800, color: 'var(--besm-purple)' }}>{remaining} CP</td></tr>
                        </>
                      );
                    })()}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline CP Receipt beneath actions (hidden per request) */}
      <div className="character-summary" style={{ display: 'none' }}>
        <div className="character-header">
          <div className="character-identity">
            <h3 className="character-name" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>{character.name || 'Unnamed Character'}</h3>
            <div className="character-identity-text">{character.identity || 'No identity set'}</div>
          </div>
          <div className="character-cp">
            <div className="cp-total">Total CP: {character.totalCP}</div>
            <div className="cp-spent">Spent CP: {character.totalCP - character.availableCP}</div>
            <div className="cp-available">Available CP: {character.availableCP}</div>
          </div>
        </div>

        <div className="character-stats-section" style={{ display: 'none' }}>
          <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Stats & Derived Values</h4>
          <div className="stats-grid">
            <div className="stat-box"><div className="stat-name">Body</div><div className="stat-value">{character.stats.body}</div></div>
            <div className="stat-box"><div className="stat-name">Mind</div><div className="stat-value">{character.stats.mind}</div></div>
            <div className="stat-box"><div className="stat-name">Soul</div><div className="stat-value">{character.stats.soul}</div></div>
            <div className="stat-box"><div className="stat-name">Health Points</div><div className="stat-value">{healthPoints}</div></div>
            <div className="stat-box"><div className="stat-name">Energy Points</div><div className="stat-value">{energyPoints}</div></div>
            <div className="stat-box"><div className="stat-name">Attack Combat</div><div className="stat-value">{attackCombat}</div></div>
            <div className="stat-box"><div className="stat-name">Defense Combat</div><div className="stat-value">{defenseCombat}</div></div>
          </div>
        </div>

        <div className="character-cp-breakdown">
          <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Character Points Breakdown</h4>
          <div className="cp-breakdown-table">
            <div className="cp-row"><div className="cp-category">Stats</div><div className="cp-amount">{statsCost} CP</div></div>
            <div className="cp-row"><div className="cp-category">Attributes</div><div className="cp-amount">{attributesCost} CP</div></div>
            <div className="cp-row"><div className="cp-category">Defects</div><div className="cp-amount">-{Math.abs(defectsCost)} CP</div></div>
            <div className="cp-row total"><div className="cp-category">Total Spent</div><div className="cp-amount">{character.totalCP - character.availableCP} CP</div></div>
            <div className="cp-row remaining"><div className="cp-category">Remaining</div><div className="cp-amount">{character.availableCP} CP</div></div>
          </div>
        </div>

        {/* Attributes with enhancements/limiters and effective level */}
        <div className="attributes-section">
          <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Attributes</h4>
          {character.attributes.length === 0 ? (
            <div className="empty-list">No attributes selected</div>
          ) : (
            <ul className="attributes-list">
              {character.attributes.map((attr, index) => {
                const enh = Array.isArray(attr.enhancements) ? attr.enhancements : [];
                const lim = Array.isArray(attr.limiters) ? attr.limiters : [];
                const enhCount = enh.length;
                const limCount = lim.length;
                const effLevel = Math.max(1, (attr.level || 1) - enhCount + limCount);
                const enhText = enh.map((e: any) => e?.name || e?.label || e?.key).filter(Boolean).join(', ');
                const limText = lim.map((l: any) => l?.name || l?.label || l?.key).filter(Boolean).join(', ');
                return (
                  <li key={index} className="attribute-item">
                    <div style={{ display:'flex', gap:8, alignItems:'baseline', flexWrap:'wrap' }}>
                      <span className="item-name">{attr.template.name}</span>
                      <span className="item-level">Level {attr.level} ({effLevel})</span>
                      <span className="item-cost">{attr.cpCost} CP</span>
                    </div>
                    {(enhText || limText) && (
                      <div style={{ marginLeft: 8, color:'#555', fontSize:12 }}>
                        {enhText && <div>+ Enhancements: {enhText}</div>}
                        {limText && <div>- Limiters: {limText}</div>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Defects */}
        <div className="defects-section">
          <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Defects</h4>
          {character.defects.length === 0 ? (
            <div className="empty-list">No defects selected</div>
          ) : (
            <ul className="defects-list">
              {character.defects.map((defect, index) => (
                <li key={index} className="defect-item">
                  <span className="item-name">{defect.template.name}</span>
                  <span className="item-level" style={{ marginLeft: 8 }}>Rank {defect.rank}</span>
                  <span className="item-refund" style={{ marginLeft: 8 }}>-{defect.cpRefund} CP</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Companions */}
        {(() => {
          const comps = (character.attributes || [])
            .filter(a => (a.template?.key === 'companion' || (a.template?.name || '').toLowerCase() === 'companion'))
            .map(a => (a.customInputs as any)?.companionConfig)
            .filter(Boolean) as any[];
          if (!comps.length) return null;
          return (
            <div className="companions-section">
              <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Companions</h4>
              {comps.map((comp, idx) => {
                const cAttrs = Array.isArray(comp?.attributes) ? comp.attributes : [];
                const cDefs = Array.isArray(comp?.defects) ? comp.defects : [];
                return (
                  <div key={idx} style={{ border:'1px solid #eee', borderRadius:6, padding:8, marginBottom:8 }}>
                    <div style={{ fontWeight:700, marginBottom:4 }}>{comp?.name || 'Companion'}</div>
                    {(comp?.stats) && (
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6, fontSize:12, color:'#333' }}>
                        <div>Body: {comp.stats.body ?? 0}</div>
                        <div>Mind: {comp.stats.mind ?? 0}</div>
                        <div>Soul: {comp.stats.soul ?? 0}</div>
                      </div>
                    )}
                    {/* Companion Attributes */}
                    <div style={{ marginBottom:4 }}>
                      <div style={{ fontWeight:600 }}>Attributes</div>
                      {cAttrs.length === 0 ? (
                        <div className="empty-list" style={{ fontSize:12, color:'#666' }}>None</div>
                      ) : (
                        <ul className="attributes-list" style={{ marginTop:4 }}>
                          {cAttrs.map((a:any, i:number) => (
                            <li key={i} className="attribute-item" style={{ fontSize:13 }}>
                              <span className="item-name">{a?.key || a?.name || 'Attribute'}</span>
                              <span className="item-level" style={{ marginLeft: 8 }}>Level {a?.level ?? 1}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Companion Defects */}
                    <div>
                      <div style={{ fontWeight:600 }}>Defects</div>
                      {cDefs.length === 0 ? (
                        <div className="empty-list" style={{ fontSize:12, color:'#666' }}>None</div>
                      ) : (
                        <ul className="defects-list" style={{ marginTop:4 }}>
                          {cDefs.map((d:any, i:number) => (
                            <li key={i} className="defect-item" style={{ fontSize:13 }}>
                              <span className="item-name">{d?.key || d?.name || 'Defect'}</span>
                              <span className="item-level" style={{ marginLeft: 8 }}>Rank {d?.rank ?? 1}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      
      <div className="character-details" style={{ display: 'none' }}>
        <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Character Details</h4>
        
        <div className="details-grid">
          <div className="detail-section">
            <label className="detail-label">Appearance</label>
            <textarea
              className="detail-textarea"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="Describe your character's physical appearance..."
            />
          </div>
          
          <div className="detail-section">
            <label className="detail-label">Personality</label>
            <textarea
              className="detail-textarea"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe your character's personality traits..."
            />
          </div>
          
          <div className="detail-section">
            <label className="detail-label">Background</label>
            <textarea
              className="detail-textarea"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Describe your character's history and background..."
            />
          </div>
          
          <div className="detail-section">
            <label className="detail-label">Notes</label>
            <textarea
              className="detail-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about your character..."
            />
          </div>
        </div>
        
        <div className="save-changes">
          <button 
            className="save-button"
            onClick={handleSaveChanges}
          >
            Save Details
          </button>
        </div>
      </div>
      
      <div className="export-section" style={{ display: 'none' }}>
        <h4 className="section-title" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Export Character</h4>
        <p className="export-info">
          Your character is complete! You can now export your character sheet for use in your BESM 4th Edition game.
        </p>
        
        <div className="export-buttons">
          <button 
            className="export-button"
            onClick={onExport}
          >
            Export Character Sheet
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          <button
            className="export-button"
            style={{ marginLeft: '12px', backgroundColor: '#059669' }}
            onClick={handleImportClick}
          >
            Import Character (JSON)
          </button>
          {import.meta.env.DEV && (
            <button
              className="export-button"
              style={{ marginLeft: '12px', backgroundColor: '#64748b' }}
              onClick={handleListPdfFields}
            >
              List PDF Fields
            </button>
          )}
          <button
            className="export-button"
            style={{ marginLeft: '12px', backgroundColor: '#0ea5e9' }}
            onClick={handlePrintWorksheet}
          >
            Print CP Worksheet
          </button>
          <button
            className="export-button"
            style={{ marginLeft: '12px', backgroundColor: '#22c55e' }}
            onClick={handleExportPdfAndPrint}
          >
            Fill PDF & Print
          </button>
          
          {onReset && (
            <button
              onClick={onReset}
              className="reset-button"
              style={{
                marginLeft: '12px',
                padding: '12px 24px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Reset Character
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
};
