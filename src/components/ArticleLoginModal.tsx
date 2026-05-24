import React, { useState, FormEvent } from "react";
import { LogOut, ShieldCheck } from "lucide-react";

interface ArticleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionEmail: string;
  roleText: string;
  onLoginSuccess: (email: string) => void;
  onLogout: () => void;
}

export default function ArticleLoginModal({
  isOpen,
  onClose,
  sessionEmail,
  roleText,
  onLoginSuccess,
  onLogout,
}: ArticleLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "गलत ईमेल या पासवर्ड।");
        return;
      }
      onLoginSuccess(data.user.email);
      setMessage(`स्वागत है ${data.user.email}`);
      setEmail("");
      setPassword("");
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to ensure article permissions update
      }, 1000);
    } catch (err) {
      setMessage("लॉगिन विफल।");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      onLogout();
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    } catch (err) {
      setMessage("लॉगआउट विफल।");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="shadow-input relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 md:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          Close
        </button>

        {!sessionEmail ? (
          <div className="w-full">
            <h3 className="text-xl font-bold text-[var(--headline)]">लॉगिन</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              लेख को संपादित करने या हटाने के लिए लॉगिन करें।
            </p>
            <form onSubmit={handleLogin} className="my-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--headline)]">
                  Email Address / Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@site.com"
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--headline)]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                  required
                />
              </div>
              <button
                className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] font-medium text-white"
                type="submit"
              >
                लॉगिन करें →
              </button>
            </form>
            {message && <p className="text-sm text-[var(--primary)]">{message}</p>}
          </div>
        ) : (
          <div className="w-full space-y-5">
            <h3 className="text-xl font-bold text-[var(--headline)]">अकाउंट</h3>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-4">
              <div className="flex flex-col gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--headline)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                  लॉगिन: {sessionEmail}
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold">
                    {roleText || "यूजर"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    लॉगआउट
                  </button>
                </div>
              </div>
            </div>
            {message && <p className="text-sm text-[var(--primary)]">{message}</p>}
            <p className="text-xs text-[var(--muted)]">
              नोट: पूरे सिस्टम को प्रबंधित करने (नया लेख, इवेंट्स, यूजर्स जोड़ने) के लिए मुख्य पेज (होमपेज) पर जाएँ।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
