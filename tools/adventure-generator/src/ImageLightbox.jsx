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
