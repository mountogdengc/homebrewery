import express      from 'express';
import asyncHandler from 'express-async-handler';
import config       from './config.js';

const router = express.Router();

const getComfyUrl = ()=>config.get('comfyui_url') || 'http://127.0.0.1:8188';

// ── Status check — is ComfyUI reachable? ────────────────────────────
router.get('/api/comfyui/status', asyncHandler(async (req, res)=>{
	try {
		const response = await fetch(`${getComfyUrl()}/system_stats`, {
			signal: AbortSignal.timeout(3000)
		});
		const data = await response.json();
		res.status(200).send({ available: true, system: data });
	} catch (err) {
		res.status(200).send({ available: false });
	}
}));

// ── Queue a workflow prompt ─────────────────────────────────────────
router.post('/api/comfyui/generate', asyncHandler(async (req, res)=>{
	const { workflow, positivePrompt, negativePrompt, width, height } = req.body;

	if(!workflow) {
		return res.status(400).send({ error: 'Workflow JSON is required' });
	}
	if(!positivePrompt) {
		return res.status(400).send({ error: 'Positive prompt is required' });
	}

	// Deep clone and inject prompt into the workflow
	const prompt = JSON.parse(JSON.stringify(workflow));

	// Find and update the prompt nodes in the workflow
	// Convention: look for nodes with class_type containing "CLIPTextEncode"
	// or our custom markers _positive_prompt / _negative_prompt
	for (const [nodeId, node] of Object.entries(prompt)) {
		// Handle Text to Image nodes (Flux Klein style — has a "text" input)
		if(node.class_type && (
			node.class_type.includes('Text to Image') ||
			node.class_type.includes('TextToImage')
		)) {
			if(node.inputs && 'text' in node.inputs) {
				node.inputs.text = positivePrompt;
			}
		}

		// Handle standard CLIPTextEncode nodes
		if(node.class_type === 'CLIPTextEncode') {
			// Check for our marker in _meta, or default: first one = positive
			const title = node._meta?.title?.toLowerCase() || '';
			if(title.includes('negative')) {
				node.inputs.text = negativePrompt || '';
			} else {
				node.inputs.text = positivePrompt;
			}
		}

		// Handle simple Prompt nodes (class_type might vary)
		if(node.class_type === 'Prompt' || node._meta?.title === 'Prompt') {
			if(node.inputs && 'text' in node.inputs) {
				node.inputs.text = positivePrompt;
			}
		}

		// Randomize seed on KSampler nodes so each generation is unique
		if(node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
			if(node.inputs && 'seed' in node.inputs) {
				node.inputs.seed = Math.floor(Math.random() * 2**32);
			}
		}

		// Override resolution if specified
		if(width && height && node.inputs) {
			if('width' in node.inputs && 'height' in node.inputs) {
				node.inputs.width = width;
				node.inputs.height = height;
			}
		}
	}

	try {
		// Queue the prompt in ComfyUI
		const queueResponse = await fetch(`${getComfyUrl()}/prompt`, {
			method  : 'POST',
			headers : { 'Content-Type': 'application/json' },
			body    : JSON.stringify({ prompt }),
			signal  : AbortSignal.timeout(10000)
		});

		if(!queueResponse.ok) {
			const errText = await queueResponse.text();
			return res.status(502).send({ error: `ComfyUI rejected prompt: ${errText}` });
		}

		const { prompt_id } = await queueResponse.json();

		// Poll for completion
		const image = await pollForResult(prompt_id);
		res.status(200).send({ image, prompt_id });
	} catch (err) {
		console.error('ComfyUI generation error:', err);
		res.status(502).send({ error: `ComfyUI generation failed: ${err.message}` });
	}
}));

// ── Poll ComfyUI history until generation completes ─────────────────
async function pollForResult(promptId, maxWait = 300000) {
	const comfyUrl = getComfyUrl();
	const start = Date.now();
	const interval = 2000;

	while (Date.now() - start < maxWait) {
		await new Promise((r)=>setTimeout(r, interval));

		try {
			const historyRes = await fetch(`${comfyUrl}/history/${promptId}`, {
				signal: AbortSignal.timeout(5000)
			});

			if(!historyRes.ok) continue;

			const history = await historyRes.json();
			const entry = history[promptId];

			if(!entry) continue; // Not done yet

			if(entry.status?.status_str === 'error') {
				throw new Error(entry.status?.messages?.[0]?.[1]?.message || 'Generation failed in ComfyUI');
			}

			// Find the output image from any SaveImage node
			const outputs = entry.outputs;
			if(!outputs) continue;

			for (const nodeOutput of Object.values(outputs)) {
				if(nodeOutput.images && nodeOutput.images.length > 0) {
					const img = nodeOutput.images[0];
					// Fetch the actual image data
					const imageRes = await fetch(
						`${comfyUrl}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`,
						{ signal: AbortSignal.timeout(10000) }
					);

					if(!imageRes.ok) throw new Error('Failed to fetch generated image');

					const buffer = Buffer.from(await imageRes.arrayBuffer());
					const base64 = buffer.toString('base64');
					const mimeType = imageRes.headers.get('content-type') || 'image/png';

					return `data:${mimeType};base64,${base64}`;
				}
			}
		} catch (err) {
			if(err.message.includes('Generation failed')) throw err;
			// Otherwise keep polling
		}
	}

	throw new Error('ComfyUI generation timed out');
}

// ── Get queue status ────────────────────────────────────────────────
router.get('/api/comfyui/queue', asyncHandler(async (req, res)=>{
	try {
		const response = await fetch(`${getComfyUrl()}/queue`, {
			signal: AbortSignal.timeout(3000)
		});
		const data = await response.json();
		res.status(200).send(data);
	} catch (err) {
		res.status(502).send({ error: 'Cannot reach ComfyUI' });
	}
}));

export default router;
