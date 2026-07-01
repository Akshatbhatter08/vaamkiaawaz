"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  focusFromCrop,
  getCroppedImageDataUrl,
  type PixelCrop,
} from "@/lib/imageCrop";

type ImageCropModalProps = {
  imageSrc: string;
  onConfirm: (result: { dataUrl: string; imageFocus: string }) => void;
  onCancel: () => void;
};

const PreviewFrame = ({
  label,
  aspectRatio,
  imageSrc,
  crop,
  imageSize,
}: {
  label: string;
  aspectRatio: number;
  imageSrc: string;
  crop: Area;
  imageSize: { width: number; height: number };
}) => {
  const focusX = ((crop.x + crop.width / 2) / imageSize.width) * 100;
  const focusY = ((crop.y + crop.height / 2) / imageSize.height) * 100;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          fontFamily: "'Noto Sans Devanagari', sans-serif",
          fontSize: 11,
          color: "var(--text-secondary)",
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <div
        style={{
          aspectRatio: String(aspectRatio),
          overflow: "hidden",
          borderRadius: 6,
          border: "1px solid var(--line)",
          background: "var(--surface-mid)",
        }}
      >
        <img
          src={imageSrc}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focusX}% ${focusY}%`,
          }}
        />
      </div>
    </div>
  );
};

export function ImageCropModal({ imageSrc, onConfirm, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number }) => {
    setImageSize(mediaSize);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const pixelCrop: PixelCrop = {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
      };
      const dataUrl = await getCroppedImageDataUrl(imageSrc, pixelCrop);
      const imageFocus = focusFromCrop(pixelCrop, imageSize.width, imageSize.height);
      onConfirm({ dataUrl, imageFocus });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          border: "1px solid var(--line)",
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 20px 0" }}>
          <h2
            style={{
              fontFamily: "'Noto Serif Devanagari', serif",
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            थंबनेल क्षेत्र चुनें
          </h2>
          <p
            style={{
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 6,
            }}
          >
            16:9 अनुपात में फोटो को खींचें और ज़ूम करें। नीचे देखें कि यह विभिन्न जगह कैसे दिखेगा।
          </p>
        </div>

        <div style={{ position: "relative", height: 320, margin: "16px 20px 0", background: "#111" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
          />
        </div>

        <div style={{ padding: "12px 20px 0" }}>
          <label
            style={{
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              fontSize: 12,
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: 6,
            }}
          >
            ज़ूम
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {croppedAreaPixels && (
          <div style={{ display: "flex", gap: 10, padding: "16px 20px 0" }}>
            <PreviewFrame
              label="कार्ड (16:9)"
              aspectRatio={16 / 9}
              imageSrc={imageSrc}
              crop={croppedAreaPixels}
              imageSize={imageSize}
            />
            <PreviewFrame
              label="होम हीरो (चौड़ा)"
              aspectRatio={2.3}
              imageSrc={imageSrc}
              crop={croppedAreaPixels}
              imageSize={imageSize}
            />
            <PreviewFrame
              label="ग्राउंड (4:3)"
              aspectRatio={4 / 3}
              imageSrc={imageSrc}
              crop={croppedAreaPixels}
              imageSize={imageSize}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: 20,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: "transparent",
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              fontSize: 14,
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            रद्द करें
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!croppedAreaPixels || saving}
            className="btn-primary"
            style={{ padding: "8px 18px", fontSize: 14, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "सेव हो रहा है…" : "पुष्टि करें"}
          </button>
        </div>
      </div>
    </div>
  );
}
