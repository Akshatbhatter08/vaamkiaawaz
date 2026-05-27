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
  Image as ImageIcon
} from "lucide-react";

export default function ContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });
  const [context, setContext] = useState<{
    text: string;
    linkUrl: string;
    imgUrl: string;
  }>({ text: "", linkUrl: "", imgUrl: "" });
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const clickPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      const selection = window.getSelection()?.toString() || "";
      const linkTarget = (e.target as HTMLElement).closest("a");
      const imgTarget = (e.target as HTMLElement).closest("img");
      
      setContext({
        text: selection,
        linkUrl: linkTarget ? linkTarget.href : "",
        imgUrl: imgTarget ? imgTarget.src : ""
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
            label="इमेज कॉपी करें (Copy Image URL)" 
            onClick={() => copyToClipboard(context.imgUrl, "इमेज लिंक कॉपी हो गया!")}
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
