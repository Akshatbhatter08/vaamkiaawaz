"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Home, 
  Newspaper, 
  Calendar as CalendarIcon, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX, 
  Share2, 
  Link as LinkIcon, 
  Copy, 
  ExternalLink,
  Image as ImageIcon,
  ClipboardPaste
} from "lucide-react";

export default function ContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });
  const [context, setContext] = useState<{
    text: string;
    linkUrl: string;
    imgUrl: string;
    isInput: boolean;
  }>({ text: "", linkUrl: "", imgUrl: "", isInput: false });
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const clickPos = useRef({ x: 0, y: 0 });
  const rightClickedElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      const selection = window.getSelection()?.toString() || "";
      const target = e.target as HTMLElement;
      rightClickedElRef.current = target;
      
      const linkTarget = target.closest("a");
      const imgTarget = target.closest("img");
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      setContext({
        text: selection,
        linkUrl: linkTarget ? linkTarget.href : "",
        imgUrl: imgTarget ? imgTarget.src : "",
        isInput
      });

      clickPos.current = { x: e.clientX, y: e.clientY };
      setPosition({ top: e.clientY, left: e.clientX, opacity: 0 });
      setIsOpen(true);
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => setIsOpen(false);

    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newTop = clickPos.current.y;
      let newLeft = clickPos.current.x;

      if (newLeft + rect.width > window.innerWidth) {
        newLeft = window.innerWidth - rect.width - 10;
      }
      
      if (newTop + rect.height > window.innerHeight) {
        newTop = window.innerHeight - rect.height - 10;
      }
      if (newTop < 10) newTop = 10;

      setPosition({ top: newTop, left: newLeft, opacity: 1 });
    }
  }, [isOpen, context]);

  const changeFontSize = (delta: number) => {
    const root = document.documentElement;
    const currentSize = parseFloat(window.getComputedStyle(root).fontSize);
    root.style.fontSize = `${currentSize + delta}px`;
    setIsOpen(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = context.text || document.querySelector("article")?.innerText || document.body.innerText;
      if (textToRead) {
        const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 5000));
        utterance.lang = "hi-IN";
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
    setIsOpen(false);
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    alert(msg);
    setIsOpen(false);
  };

  const copyImage = async (url: string) => {
    try {
      const fullUrl = new URL(url, window.location.origin).href;
      
      // We'll try to fetch the image and copy it as a PNG blob
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = fullUrl;
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              alert("इमेज कॉपी हो गई! (Image copied to clipboard)");
            } catch (err) {
               // Fallback if browser blocks image copying
               copyToClipboard(fullUrl, "इमेज लिंक कॉपी हो गया! (Image link copied!)");
            }
          }
        }, "image/png");
      };
      
      img.onerror = () => {
        // Fallback if image fails to load (CORS etc)
        copyToClipboard(fullUrl, "इमेज लिंक कॉपी हो गया! (Image link copied!)");
      };
      
    } catch (e) {
      // Final fallback
      const fallbackUrl = new URL(url, window.location.origin).href;
      copyToClipboard(fallbackUrl, "इमेज लिंक कॉपी हो गया! (Image link copied!)");
    }
  };

  const handlePaste = async () => {
    try {
      let text = "";
      let html = "";
      
      try {
        if (navigator.clipboard.read) {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            if (item.types.includes('text/html')) {
              const blob = await item.getType('text/html');
              html = await blob.text();
            }
            if (item.types.includes('text/plain')) {
              const blob = await item.getType('text/plain');
              text = await blob.text();
            }
          }
        }
      } catch (e) {
        // Fallback for browsers that don't support read() or if it fails
      }
      
      // If we still don't have text, try the standard readText
      if (!text && !html) {
        text = await navigator.clipboard.readText();
      }
      
      // Determine the best target element: either the one we right-clicked on, or the currently active one
      const targetEl = rightClickedElRef.current || document.activeElement;
      
      if (targetEl) {
        (targetEl as HTMLElement).focus(); // Ensure it's focused
        
        if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA') {
          const input = targetEl as HTMLInputElement | HTMLTextAreaElement;
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          const value = input.value;
          input.value = value.substring(0, start) + text + value.substring(end);
          input.selectionStart = input.selectionEnd = start + text.length;
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        } else if ((targetEl as HTMLElement).isContentEditable) {
          // For rich text editors (like TipTap/ProseMirror)
          
          // Fallback 1: dispatch a paste event with HTML and plain text
          const dataTransfer = new DataTransfer();
          if (text) dataTransfer.setData('text/plain', text);
          if (html) dataTransfer.setData('text/html', html);
          
          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
          });
          const wasIntercepted = !targetEl.dispatchEvent(pasteEvent);
          
          // Fallback 2: if event wasn't natively handled by the editor, force execCommand
          if (!wasIntercepted) {
            if (html) {
              document.execCommand("insertHTML", false, html);
            } else {
              document.execCommand("insertText", false, text);
            }
          }
        }
      }
      
      setIsOpen(false);
    } catch (err) {
      console.error("Paste failed", err);
      alert("पेस्ट करने की अनुमति नहीं है (Paste permission denied)");
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[240px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]/90 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        opacity: position.opacity,
        maxHeight: 'calc(100vh - 20px)',
        overflowY: 'auto'
      }}
    >
      <div className="flex flex-col gap-1">
        {/* Context Aware Options */}
        {context.text && (
          <MenuItem 
            icon={<Copy className="h-4 w-4" />} 
            label="टेक्स्ट कॉपी करें (Copy Text)" 
            onClick={() => copyToClipboard(context.text, "टेक्स्ट कॉपी हो गया!")}
          />
        )}
        
        <MenuItem 
          icon={<ClipboardPaste className="h-4 w-4" />} 
          label="पेस्ट करें (Paste)" 
          onClick={handlePaste}
        />
        
        {context.linkUrl && (
          <>
            <MenuItem 
              icon={<ExternalLink className="h-4 w-4" />} 
              label="नये टैब में खोलें (Open in New Tab)" 
              onClick={() => {
                window.open(context.linkUrl, '_blank');
                setIsOpen(false);
              }}
            />
            <MenuItem 
              icon={<LinkIcon className="h-4 w-4" />} 
              label="लिंक कॉपी करें (Copy Link)" 
              onClick={() => copyToClipboard(context.linkUrl, "लिंक कॉपी हो गया!")}
            />
          </>
        )}
        
        {context.imgUrl && (
          <MenuItem 
            icon={<ImageIcon className="h-4 w-4" />} 
            label="इमेज कॉपी करें (Copy Image)" 
            onClick={() => copyImage(context.imgUrl)}
          />
        )}

        {(context.text || context.linkUrl || context.imgUrl) && <MenuDivider />}

        {/* Navigation */}
        <div className="px-2 py-1 text-xs font-semibold text-[var(--muted)]">नेविगेशन (Navigation)</div>
        <MenuItem 
          icon={<Home className="h-4 w-4" />} 
          label="होमपेज पर जाएँ (Home)" 
          onClick={() => { window.location.href = '/'; setIsOpen(false); }}
        />
        <MenuItem 
          icon={<Newspaper className="h-4 w-4" />} 
          label="नवीनतम समाचार (Latest News)" 
          onClick={() => {
            if (window.location.pathname === '/') {
              const el = document.getElementById('latest');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(null, '', window.location.pathname);
              }
            } else {
              window.location.href = '/#latest';
            }
            setIsOpen(false);
          }}
        />
        <MenuItem 
          icon={<CalendarIcon className="h-4 w-4" />} 
          label="अभियान कैलेंडर (Calendar)" 
          onClick={() => {
            if (window.location.pathname === '/') {
              const el = document.getElementById('abhiyan-calendar');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(null, '', window.location.pathname);
              }
            } else {
              window.location.href = '/#abhiyan-calendar';
            }
            setIsOpen(false);
          }}
        />

        <MenuDivider />

        {/* Accessibility Tools */}
        <div className="px-2 py-1 text-xs font-semibold text-[var(--muted)]">पढ़ने की सुविधा (Accessibility)</div>
        <div className="flex gap-1 px-1">
          <button 
            onClick={() => changeFontSize(2)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
            title="फ़ॉन्ट आकार बढ़ाएं"
          >
            <ZoomIn className="h-4 w-4" /> <span className="font-bold">A+</span>
          </button>
          <button 
            onClick={() => changeFontSize(-2)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
            title="फ़ॉन्ट आकार घटाएं"
          >
            <ZoomOut className="h-4 w-4" /> <span className="font-bold">A-</span>
          </button>
        </div>
        <MenuItem 
          icon={isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} 
          label={isSpeaking ? "पढ़ना रोकें (Stop Reading)" : "लेख पढ़कर सुनाएं (Read Aloud)"} 
          onClick={toggleSpeech}
        />

        <MenuDivider />

        {/* Social */}
        <div className="px-2 py-1 text-xs font-semibold text-[var(--muted)]">साझा करें (Share)</div>
        <MenuItem 
          icon={<LinkIcon className="h-4 w-4" />} 
          label="इस पेज का लिंक कॉपी करें" 
          onClick={() => copyToClipboard(window.location.href, "पेज लिंक कॉपी हो गया!")}
        />
        <MenuItem 
          icon={<Share2 className="h-4 w-4" />} 
          label="WhatsApp पर साझा करें" 
          onClick={() => {
            const urlToShare = context.linkUrl || window.location.href;
            const textToShare = context.linkUrl ? (context.text || document.title) : document.title;
            const text = encodeURIComponent(`${textToShare}\n\n${urlToShare}`);
            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] text-left"
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 h-[1px] w-full bg-[var(--line)] opacity-50" />;
}
