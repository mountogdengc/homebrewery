/*
  Utilities for exporting/importing user library files that live on disk.
  Files are JSON with a small wrapper for forward-compatibility:
  {
    "type": "companion" | "minion" | "item" | "metamorphosis" | "alt_form" | "weapon" | "template_race" | ...,
    "version": 1,
    "data": { ...entity specific payload... }
  }
*/

export type LibraryEntityType =
  | 'companion'
  | 'minion'
  | 'item'
  | 'metamorphosis'
  | 'alt_form'
  | 'weapon'
  | 'template_race'
  | 'template_class'
  | 'template_size'
  | 'attribute'
  | 'defect'
  | 'enhancement'
  | 'limiter';

export type LibraryWrapper<TData> = {
  type: LibraryEntityType | string;
  version: number;
  data: TData;
};

export type ExportFilenameOptions = {
  prefix?: string; // e.g. "BESM_companion"
  baseName?: string; // e.g. character/entity name
};

export function buildExportFilename(
  type: LibraryEntityType | string,
  opts: ExportFilenameOptions = {}
): string {
  const prefix = opts.prefix ?? `BESM_${type}`;
  const base = (opts.baseName ?? type).replace(/[^a-z0-9-_]+/gi, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${base}_${ts}.json`;
}

export function downloadJsonFile<TData>(data: TData, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export function exportLibraryFile<TData>(
  type: LibraryEntityType | string,
  version: number,
  payload: TData,
  filenameOpts: ExportFilenameOptions = {}
) {
  const wrapper: LibraryWrapper<TData> = { type, version, data: payload };
  const filename = buildExportFilename(type, filenameOpts);
  downloadJsonFile(wrapper, filename);
}

export async function parseLibraryFile<TData = unknown>(
  file: File,
  expectedType?: LibraryEntityType | string
): Promise<LibraryWrapper<TData> | { type?: string; version?: number; data: TData }> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  // Accept either wrapped or raw data
  if (parsed && typeof parsed === 'object' && 'data' in parsed && 'type' in parsed) {
    if (expectedType && parsed.type !== expectedType) {
      throw new Error(`Expected a '${expectedType}' file but got '${parsed.type}'.`);
    }
    return parsed as LibraryWrapper<TData>;
  }
  return { data: parsed as TData };
}
