"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  focusFromCrop,
  getCompressedImageDataUrl,
  type PixelCrop,
} from "@/lib/imageCrop";

export type ImageCropConfirmResult = {
  dataUrl: string;
  imageFocus: string;
  imageFocusHero: string;
  imageFocusGround: string;
};

type CropStepId = "card" | "hero" | "ground";

type StepConfig = {
  id: CropStepId;
  label: string;
  aspect: number;
  hint: string;
};

const STEPS: StepConfig[] = [
  {
    id: "card",
    label: "कार्ड (16:9)",
    aspect: 16 / 9,
    hint: "आर्टिकल कार्ड और सूची थंबनेल के लिए क्षेत्र चुनें।",
  },
  {
    id: "hero",
    label: "होम हीरो (चौड़ा)",
    aspect: 2.3,
    hint: "होम पेज के बड़े हीरो बैनर के लिए क्षेत्र चुनें।",
  },
  {
    id: "ground",
    label: "ग्राउंड (4:3)",
    aspect: 4 / 3,
    hint: "ग्राउंड रिपोर्ट / चौकोर कार्ड के लिए क्षेत्र चुनें।",
  },
];

type StepCropState = {
  crop: { x: number; y: number };
  zoom: number;
  pixels: Area | null;
};

const defaultStepState = (): StepCropState => ({
  crop: { x: 0, y: 0 },
  zoom: 1,
  pixels: null,
});

type ImageCropModalProps = {
  imageSrc: string;
  onConfirm: (result: ImageCropConfirmResult) => void;
  onCancel: () => void;
};

export function ImageCropModal({ imageSrc, onConfirm, onCancel }: ImageCropModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<Record<CropStepId, StepCropState>>({
    card: defaultStepState(),
    hero: defaultStepState(),
    ground: defaultStepState(),
  });
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const current = stepStates[step.id];

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setStepStates((prev) => ({
        ...prev,
        [step.id]: { ...prev[step.id], pixels: croppedAreaPixels },
      }));
    },
    [step.id],
  );

  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number; naturalWidth?: number; naturalHeight?: number }) => {
    setImageSize({
      width: mediaSize.naturalWidth || mediaSize.width,
      height: mediaSize.naturalHeight || mediaSize.height,
    });
  }, []);

  const setCrop = (crop: { x: number; y: number }) => {
    setStepStates((prev) => ({
      ...prev,
      [step.id]: { ...prev[step.id], crop },
    }));
  };

  const setZoom = (zoom: number) => {
    setStepStates((prev) => ({
      ...prev,
      [step.id]: { ...prev[step.id], zoom },
    }));
  };

  const allStepsReady =
    !!stepStates.card.pixels && !!stepStates.hero.pixels && !!stepStates.ground.pixels;

  const handleConfirm = async () => {
    if (!allStepsReady) return;
    setSaving(true);
    try {
      const toFocus = (pixels: Area) => {
        const pixelCrop: PixelCrop = {
          x: pixels.x,
          y: pixels.y,
          width: pixels.width,
          height: pixels.height,
        };
        return focusFromCrop(pixelCrop, imageSize.width, imageSize.height);
      };

      // Store full compressed image so all three focus regions remain valid.
      const dataUrl = await getCompressedImageDataUrl(imageSrc);
      onConfirm({
        dataUrl,
        imageFocus: toFocus(stepStates.card.pixels!),
        imageFocusHero: toFocus(stepStates.hero.pixels!),
        imageFocusGround: toFocus(stepStates.ground.pixels!),
      });
    } catch {
      setSaving(false);
    }
  };

  const canGoNext = !!current.pixels;
  const isLast = stepIndex === STEPS.length - 1;

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
            चरण {stepIndex + 1} / {STEPS.length}: {step.hint}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {STEPS.map((s, i) => {
              const done = !!stepStates[s.id].pixels;
              const active = i === stepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: active ? "1px solid var(--crimson)" : "1px solid var(--line)",
                    background: active ? "var(--surface-mid)" : "transparent",
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                    fontSize: 12,
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    opacity: done || active ? 1 : 0.7,
                  }}
                >
                  {s.label}
                  {done ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: "relative", height: 320, margin: "16px 20px 0", background: "#111" }}>
          <Cropper
            key={step.id}
            image={imageSrc}
            crop={current.crop}
            zoom={current.zoom}
            aspect={step.aspect}
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
            value={current.zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {current.pixels && (
          <div style={{ padding: "16px 20px 0" }}>
            <p
              style={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontSize: 11,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              पूर्वावलोकन — {step.label}
            </p>
            <div
              style={{
                aspectRatio: String(step.aspect),
                maxWidth: 360,
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
                  objectPosition: `${((current.pixels.x + current.pixels.width / 2) / imageSize.width) * 100}% ${((current.pixels.y + current.pixels.height / 2) / imageSize.height) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
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
          <div style={{ display: "flex", gap: 10 }}>
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
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
                पिछला
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                disabled={!canGoNext}
                className="btn-primary"
                style={{ padding: "8px 18px", fontSize: 14, opacity: canGoNext ? 1 : 0.5 }}
              >
                अगला
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!allStepsReady || saving}
                className="btn-primary"
                style={{ padding: "8px 18px", fontSize: 14, opacity: !allStepsReady || saving ? 0.7 : 1 }}
              >
                {saving ? "सेव हो रहा है…" : "पुष्टि करें"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
