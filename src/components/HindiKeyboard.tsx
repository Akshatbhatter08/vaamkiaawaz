"use client";

const ROWS = [
  ["अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ"],
  ["क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ"],
  ["ड", "ढ", "ण", "त", "थ", "द", "ध", "न", "प", "फ"],
  ["ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स"],
  ["ह", "क्ष", "त्र", "ज्ञ", "ं", "ः", "़", "ा", "ि", "ी"],
  ["ु", "ू", "े", "ै", "ो", "ौ", "्", "ृ", "ँ", " "],
];

type HindiKeyboardProps = {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClose: () => void;
};

export function HindiKeyboard({ onKeyPress, onBackspace, onClose }: HindiKeyboardProps) {
  return (
    <div
      className="absolute left-0 top-full z-[120] mt-2 w-[min(100vw,420px)] rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 shadow-xl"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-[var(--muted)]">हिंदी कीबोर्ड</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          बंद करें
        </button>
      </div>
      <div className="space-y-1">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1">
            {row.map((char) => (
              <button
                key={`${rowIndex}-${char}`}
                type="button"
                onClick={() => onKeyPress(char)}
                className="min-w-[32px] rounded border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-1 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {char === " " ? "␣" : char}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onBackspace}
          className="flex-1 rounded border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-1.5 text-xs font-semibold hover:border-[var(--primary)]"
        >
          ⌫ हटाएं
        </button>
      </div>
    </div>
  );
}
