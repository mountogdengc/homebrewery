# Adventure Image Generation Lightbox — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-prompt image generation buttons to Appendix A code blocks in the starship adventure generator, with a gallery lightbox for browsing/downloading results from multiple providers (DALL-E 3, Imagen, ComfyUI/Flux).

**Architecture:** Two server endpoints (`GET /api/ai/image-status`, `POST /api/ai/generate-image`) handle provider detection and image generation. The adventure generator's markdown renderer detects Appendix A code blocks and overlays "Generate Image" buttons. A lightbox component manages a per-prompt gallery of generated images with provider selection, navigation arrows, and download.

**Tech Stack:** React (standalone Vite app), Express server, OpenAI SDK (DALL-E 3), Google Generative AI SDK (Imagen), ComfyUI REST API (Flux).

---

### Task 1: Add `comfyui_url` to config

**Files:**
- Modify: `config/default.json:14`

- [ ] **Step 1: Add comfyui_url to default config**

In `config/default.json`, add `comfyui_url` after the `gemini_api_key` line:

```json
{
	"development": true,
	"host" : "homebrewery.local.naturalcrit.com:8000",
	"naturalcrit_url" : "local.naturalcrit.com:8010",
	"secret" : "secret",
	"web_port" : 8000,
	"local_environments" : ["docker", "local"],
	"publicUrl" : "https://homebrewery.naturalcrit.com",
	"hb_images" : null,
	"hb_fonts" : null,
	"lm_studio_url" : "http://localhost:1234",
	"anthropic_api_key" : null,
	"openai_api_key" : null,
	"gemini_api_key" : null,
	"comfyui_url" : "http://localhost:8188"
}
```

- [ ] **Step 2: Add config getter in ai.api.js**

In `server/ai.api.js`, after line 13 (`const getGeminiKey = ...`), add:

```javascript
const getComfyuiUrl = ()=>config.get('comfyui_url') || process.env.COMFYUI_URL || 'http://localhost:8188';
```

- [ ] **Step 3: Commit**

```bash
git add config/default.json server/ai.api.js
git commit -m "feat: add comfyui_url config for image generation"
```

---

### Task 2: Add `GET /api/ai/image-status` endpoint

**Files:**
- Modify: `server/ai.api.js` (add before the `export default router` line at the end)

- [ ] **Step 1: Add the image-status endpoint**

In `server/ai.api.js`, add before the `export default router;` line:

```javascript
// ── Image Generation Status ─────────────────────────────────────────
router.get('/api/ai/image-status', asyncHandler(async (req, res)=>{
	let comfyuiAvailable = false;
	try {
		const comfyRes = await fetch(`${getComfyuiUrl()}/system_stats`, {
			signal: AbortSignal.timeout(3000)
		});
		comfyuiAvailable = comfyRes.ok;
	} catch (err) {
		// ComfyUI not reachable
	}

	res.status(200).send({
		openai   : { available: !!getOpenaiKey() },
		gemini   : { available: !!getGeminiKey() },
		comfyui  : { available: comfyuiAvailable }
	});
}));
```

- [ ] **Step 2: Verify endpoint works**

Run the server and test:

```bash
curl http://localhost:8000/api/ai/image-status
```

Expected: `{"openai":{"available":false},"gemini":{"available":false},"comfyui":{"available":false}}` (or `true` for any configured provider).

- [ ] **Step 3: Commit**

```bash
git add server/ai.api.js
git commit -m "feat: add GET /api/ai/image-status endpoint"
```

---

### Task 3: Add `POST /api/ai/generate-image` endpoint

**Files:**
- Modify: `server/ai.api.js` (add after the image-status endpoint from Task 2)

- [ ] **Step 1: Add the generate-image endpoint**

In `server/ai.api.js`, add after the image-status endpoint:

```javascript
// ── Image Generation ────────────────────────────────────────────────
router.post('/api/ai/generate-image', asyncHandler(async (req, res)=>{
	const { prompt, provider } = req.body;
	if(!prompt) return res.status(400).send({ error: 'Missing prompt' });
	if(!provider) return res.status(400).send({ error: 'Missing provider' });

	let image; // will be a data URL: "data:image/png;base64,..."

	if(provider === 'openai') {
		const apiKey = getOpenaiKey();
		if(!apiKey) return res.status(503).send({ error: 'No OpenAI API key configured' });

		const client = new OpenAI({ apiKey });
		const response = await client.images.generate({
			model           : 'dall-e-3',
			prompt,
			n               : 1,
			size            : '1024x1024',
			response_format : 'b64_json'
		});
		const b64 = response.data?.[0]?.b64_json;
		if(!b64) return res.status(502).send({ error: 'No image data in OpenAI response' });
		image = `data:image/png;base64,${b64}`;

	} else if(provider === 'gemini') {
		const apiKey = getGeminiKey();
		if(!apiKey) return res.status(503).send({ error: 'No Gemini API key configured' });

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({
			model            : 'gemini-2.0-flash-exp',
			generationConfig : { responseModalities: ['image', 'text'] }
		});
		const result = await model.generateContent(prompt);
		const parts = result.response.candidates?.[0]?.content?.parts || [];
		const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
		if(!imgPart) return res.status(502).send({ error: 'No image in Gemini response' });
		const mime = imgPart.inlineData.mimeType;
		image = `data:${mime};base64,${imgPart.inlineData.data}`;

	} else if(provider === 'comfyui') {
		const comfyUrl = getComfyuiUrl();

		// Minimal txt2img workflow for Flux — user may need to customize this
		const clientId = crypto.randomUUID();
		const workflow = {
			prompt: {
				"1": {
					class_type: "EmptyLatentImage",
					inputs: { width: 1024, height: 1024, batch_size: 1 }
				},
				"2": {
					class_type: "CLIPTextEncode",
					inputs: { text: prompt, clip: ["4", 0] }
				},
				"3": {
					class_type: "KSampler",
					inputs: {
						seed: Math.floor(Math.random() * 2**32),
						steps: 20, cfg: 7, sampler_name: "euler",
						scheduler: "normal", denoise: 1,
						model: ["4", 0], positive: ["2", 0],
						negative: ["5", 0], latent_image: ["1", 0]
					}
				},
				"4": {
					class_type: "CheckpointLoaderSimple",
					inputs: { ckpt_name: "flux1-dev.safetensors" }
				},
				"5": {
					class_type: "CLIPTextEncode",
					inputs: { text: "", clip: ["4", 0] }
				},
				"6": {
					class_type: "VAEDecode",
					inputs: { samples: ["3", 0], vae: ["4", 2] }
				},
				"7": {
					class_type: "SaveImage",
					inputs: { filename_prefix: "adventure", images: ["6", 0] }
				}
			},
			client_id: clientId
		};

		// Queue the prompt
		const queueRes = await fetch(`${comfyUrl}/prompt`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(workflow),
			signal: AbortSignal.timeout(10000)
		});
		if(!queueRes.ok) {
			const errText = await queueRes.text();
			return res.status(502).send({ error: `ComfyUI queue failed: ${errText}` });
		}
		const { prompt_id } = await queueRes.json();

		// Poll for completion (up to 5 minutes)
		let outputImages = null;
		for(let attempt = 0; attempt < 300; attempt++) {
			await new Promise(r => setTimeout(r, 1000));
			const histRes = await fetch(`${comfyUrl}/history/${prompt_id}`, {
				signal: AbortSignal.timeout(5000)
			});
			if(!histRes.ok) continue;
			const hist = await histRes.json();
			if(hist[prompt_id]?.outputs?.["7"]?.images?.length) {
				outputImages = hist[prompt_id].outputs["7"].images;
				break;
			}
		}
		if(!outputImages?.length) {
			return res.status(504).send({ error: 'ComfyUI generation timed out' });
		}

		// Fetch the image
		const img = outputImages[0];
		const imgRes = await fetch(
			`${comfyUrl}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`,
			{ signal: AbortSignal.timeout(10000) }
		);
		if(!imgRes.ok) return res.status(502).send({ error: 'Failed to fetch ComfyUI output image' });
		const arrBuf = await imgRes.arrayBuffer();
		const b64 = Buffer.from(arrBuf).toString('base64');
		image = `data:image/png;base64,${b64}`;

	} else {
		return res.status(400).send({ error: `Unknown image provider: ${provider}` });
	}

	res.status(200).send({ image });
}));
```

Note: add `import crypto from 'crypto';` at the top of `server/ai.api.js` if not already imported. Check first — Node 19+ has `crypto.randomUUID()` as a global, so this import may not be needed. If the server is running Node 18+, `crypto.randomUUID()` is available globally. Test by running `node -e "console.log(crypto.randomUUID())"`. If it works, no import needed.

- [ ] **Step 2: Test the endpoint with curl (OpenAI)**

```bash
curl -X POST http://localhost:8000/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a top-down deckplan of a small spaceship","provider":"openai"}' \
  | head -c 100
```

Expected: starts with `{"image":"data:image/png;base64,`... (if OpenAI key is configured), or `{"error":"No OpenAI API key configured"}`.

- [ ] **Step 3: Commit**

```bash
git add server/ai.api.js
git commit -m "feat: add POST /api/ai/generate-image endpoint with DALL-E, Imagen, ComfyUI"
```

---

### Task 4: Add CSS for image prompt buttons and lightbox

**Files:**
- Modify: `tools/adventure-generator/src/App.jsx` (the `CSS` constant, lines 19–81)

- [ ] **Step 1: Append lightbox and image-prompt CSS to the CSS constant**

In `tools/adventure-generator/src/App.jsx`, find the end of the `CSS` constant (the line `.err{text-align:center;...}` ending with `\`;`). Insert the following CSS just before the closing backtick:

```css

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
```

- [ ] **Step 2: Commit**

```bash
cd tools/adventure-generator
git add src/App.jsx
git commit -m "feat: add CSS for image generation buttons and lightbox"
```

---

### Task 5: Build the ImageLightbox component

**Files:**
- Create: `tools/adventure-generator/src/ImageLightbox.jsx`

- [ ] **Step 1: Create the ImageLightbox component**

Create `tools/adventure-generator/src/ImageLightbox.jsx`:

```jsx
import { useState, useEffect } from "react";

export default function ImageLightbox({ label, prompt, gallery, generating, error, onGenerate, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(gallery.length > 0 ? gallery.length - 1 : 0);
  const [imageStatus, setImageStatus] = useState(null);
  const [imageProvider, setImageProvider] = useState(null);

  // Fetch available image providers on mount
  useEffect(() => {
    fetch("/api/ai/image-status")
      .then(r => r.json())
      .then(s => {
        setImageStatus(s);
        // Default to first available provider
        if (s.openai?.available) setImageProvider("openai");
        else if (s.gemini?.available) setImageProvider("gemini");
        else if (s.comfyui?.available) setImageProvider("comfyui");
      })
      .catch(() => {});
  }, []);

  // Jump to newest image when gallery grows
  useEffect(() => {
    if (gallery.length > 0) setCurrentIdx(gallery.length - 1);
  }, [gallery.length]);

  const current = gallery[currentIdx];
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < gallery.length - 1;

  const handleGenerate = () => {
    if (!imageProvider || generating) return;
    onGenerate(imageProvider);
  };

  const handleDownload = () => {
    if (!current) return;
    const link = document.createElement("a");
    link.href = current.dataUrl;
    const safeName = (label || "image").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    link.download = `${safeName}-${currentIdx + 1}.png`;
    link.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowLeft" && hasPrev) setCurrentIdx(i => i - 1);
    else if (e.key === "ArrowRight" && hasNext) setCurrentIdx(i => i + 1);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const noProviders = imageStatus && !imageStatus.openai?.available && !imageStatus.gemini?.available && !imageStatus.comfyui?.available;

  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="lb-hdr">
          <div className="lb-title">{label || "Image Prompt"}</div>
          <button className="lb-close" onClick={onClose}>✕</button>
        </div>

        {/* Image area */}
        <div className="lb-img-area">
          {generating && (
            <div className="lb-spinner">GENERATING IMAGE...</div>
          )}
          {!generating && !current && (
            <div className="lb-placeholder">
              {noProviders
                ? "NO IMAGE PROVIDERS CONFIGURED"
                : "SELECT A PROVIDER AND GENERATE"}
            </div>
          )}
          {!generating && current && (
            <img src={current.dataUrl} alt={label || "Generated image"} />
          )}

          {/* Nav arrows */}
          {hasPrev && !generating && (
            <button className="lb-nav lb-nav-left" onClick={() => setCurrentIdx(i => i - 1)}>◀</button>
          )}
          {hasNext && !generating && (
            <button className="lb-nav lb-nav-right" onClick={() => setCurrentIdx(i => i + 1)}>▶</button>
          )}

          {/* Counter */}
          {gallery.length > 1 && !generating && (
            <div className="lb-counter">{currentIdx + 1} OF {gallery.length}</div>
          )}
        </div>

        {/* Error */}
        {error && <div className="lb-error">{error}</div>}

        {/* Controls */}
        <div className="lb-controls">
          {imageStatus && (
            <select
              value={imageProvider || ""}
              onChange={e => setImageProvider(e.target.value)}
              disabled={generating}
            >
              {!imageProvider && <option value="">-- Select --</option>}
              {imageStatus.openai?.available && <option value="openai">DALL-E 3</option>}
              {imageStatus.gemini?.available && <option value="gemini">Imagen (Gemini)</option>}
              {imageStatus.comfyui?.available && <option value="comfyui">Flux (ComfyUI)</option>}
            </select>
          )}
          <button
            className="lb-gen-btn"
            onClick={handleGenerate}
            disabled={generating || !imageProvider}
          >
            {generating ? "GENERATING..." : "GENERATE"}
          </button>
          <button
            className="lb-dl-btn"
            onClick={handleDownload}
            disabled={!current || generating}
          >
            ⬇ DOWNLOAD
          </button>
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd tools/adventure-generator
git add src/ImageLightbox.jsx
git commit -m "feat: add ImageLightbox component with gallery navigation"
```

---

### Task 6: Update renderMarkdown to detect Appendix A and add generate buttons

**Files:**
- Modify: `tools/adventure-generator/src/App.jsx` — the `renderMarkdown` function (lines 105–163)

- [ ] **Step 1: Rewrite renderMarkdown to accept onImagePrompt callback and track Appendix A context**

Replace the entire `renderMarkdown` function (lines 105–163) in `tools/adventure-generator/src/App.jsx` with:

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
cd tools/adventure-generator
git add src/App.jsx
git commit -m "feat: renderMarkdown detects Appendix A and adds generate image buttons"
```

---

### Task 7: Wire up gallery state, lightbox, and generation in App component

**Files:**
- Modify: `tools/adventure-generator/src/App.jsx` — the `App` component (lines 335–470)

- [ ] **Step 1: Add ImageLightbox import**

At the top of `tools/adventure-generator/src/App.jsx`, after the existing `import { useState, useEffect } from "react";` line, add:

```jsx
import ImageLightbox from "./ImageLightbox.jsx";
```

- [ ] **Step 2: Add gallery and lightbox state to the App component**

In the `App` component, after the `const [error, setError] = useState(null);` line, add:

```jsx
  const [imageGallery, setImageGallery] = useState({});  // { [promptIdx]: [{ dataUrl, provider, timestamp }] }
  const [lightbox, setLightbox] = useState(null);         // { idx, prompt, label } or null
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgError, setImgError] = useState(null);
```

- [ ] **Step 3: Add the image generation handler**

After the `download` function, add:

```jsx
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
```

- [ ] **Step 4: Update the renderMarkdown call to pass the callback**

Find the line:

```jsx
              {renderMarkdown(adventure)}
```

Replace with:

```jsx
              {renderMarkdown(adventure, handleImagePrompt)}
```

- [ ] **Step 5: Add the lightbox rendering**

After the closing `</div>` of the `<div className="app">` (right before the `</>` at the end of the return), add:

```jsx
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
```

- [ ] **Step 6: Clear image gallery when generating a new adventure**

In the `generate` function, after `setAdventure(null);` add:

```jsx
    setImageGallery({});
```

- [ ] **Step 7: Commit**

```bash
cd tools/adventure-generator
git add src/App.jsx
git commit -m "feat: wire up image gallery state, lightbox, and generation handler"
```

---

### Task 8: Build and verify

**Files:**
- No new files — build and manual test

- [ ] **Step 1: Build the adventure generator**

```bash
cd tools/adventure-generator && npm run build
```

Expected: Build succeeds with no errors, output in `../../prototypes/adventure/`.

- [ ] **Step 2: Restart server and verify image-status endpoint**

```bash
curl http://localhost:8000/api/ai/image-status
```

Expected: JSON showing available providers based on configured keys.

- [ ] **Step 3: Verify the adventure page loads**

Open `http://localhost:8000/adventure` in a browser. Generate an adventure. Scroll to Appendix A. Each code block should have a "Generate Image" button in the top-right corner. Code blocks outside Appendix A should have no button.

- [ ] **Step 4: Test the lightbox**

Click a "Generate Image" button. The lightbox should open with:
- The prompt label as the title
- Provider dropdown showing available providers
- Generate and Download buttons
- Placeholder text when no images exist yet

- [ ] **Step 5: Test image generation**

Select a provider and click Generate. The lightbox should show "GENERATING IMAGE..." then display the result. Generate a second image — arrow navigation should appear with "1 OF 2" / "2 OF 2" counter.

- [ ] **Step 6: Test download**

Click the download button. The image should download with a filename based on the prompt label.

- [ ] **Step 7: Final commit**

```bash
cd tools/adventure-generator
git add -A
git commit -m "feat: adventure generator image lightbox — complete"
```
