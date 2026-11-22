'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  Keyboard,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
} from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  totalGuests: number;
  initialCheckedIn: number;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'duplicate' | 'invalid';

interface ScanFeedback {
  status: ScanStatus;
  message: string;
  guestEmail?: string;
  scannedAt?: string | null;
}

export default function MobileGateScanner({ event }: { event: EventData }) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [checkedCount, setCheckedCount] = useState(event.initialCheckedIn);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownPercent, setCooldownPercent] = useState(100);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // References
  const scannerRef = useRef<any>(null);
  const isCooldownRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio cues using Web Audio API
  const playSound = useCallback((type: 'success' | 'duplicate' | 'invalid') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High, pleasant two-tone chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } else if (type === 'duplicate') {
        // Warning double pulse
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc.frequency.setValueAtTime(293.66, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        // Low discordant buzz for invalid
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(400);
        }
      }
    } catch (e) {
      console.warn('Audio playback not permitted or failed:', e);
    }
  }, [soundEnabled]);

  // Extract UUID from QR code text or URL
  const extractUuid = (rawText: string): string => {
    const text = rawText.trim();
    const urlMatch = text.match(/\/verify\/([0-9a-fA-F-]+)/);
    if (urlMatch && urlMatch[1]) return urlMatch[1];

    const uuidMatch = text.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
    if (uuidMatch && uuidMatch[1]) return uuidMatch[1];

    return text;
  };

  // Cooldown countdown runner (2.5 seconds)
  const triggerCooldown = useCallback(() => {
    isCooldownRef.current = true;
    setIsCooldown(true);
    setCooldownPercent(100);

    const duration = 2500;
    const intervalTime = 50;
    let elapsed = 0;

    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);

    cooldownIntervalRef.current = setInterval(() => {
      elapsed += intervalTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setCooldownPercent(remainingPercent);
    }, intervalTime);

    cooldownTimerRef.current = setTimeout(() => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      isCooldownRef.current = false;
      setIsCooldown(false);
      setScanStatus('scanning');
      setFeedback(null);
    }, duration);
  }, []);

  // Verification executor
  const handleVerify = useCallback(
    async (rawCode: string) => {
      if (isCooldownRef.current || isVerifying) return;

      const uuid = extractUuid(rawCode);
      if (!uuid) return;

      setIsVerifying(true);

      try {
        const res = await fetch(`/api/verify/${uuid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (res.status === 404 || data.status === 'invalid') {
          // Scenario 1: Solid RED Background
          setScanStatus('invalid');
          setFeedback({
            status: 'invalid',
            message: data.message || 'INVALID TICKET - Not on guest list.',
          });
          playSound('invalid');
        } else if (data.status === 'duplicate') {
          // Scenario 2: Solid YELLOW Background
          setScanStatus('duplicate');
          setFeedback({
            status: 'duplicate',
            message: data.message || 'DUPLICATE TICKET - Already scanned!',
            guestEmail: data.guestEmail,
            scannedAt: data.scannedAt,
          });
          playSound('duplicate');
        } else if (data.valid || data.status === 'success') {
          // Scenario 3: Solid GREEN Background
          setScanStatus('success');
          setFeedback({
            status: 'success',
            message: data.message || `WELCOME! - ${data.guestEmail} checked in successfully.`,
            guestEmail: data.guestEmail,
            scannedAt: data.scannedAt,
          });
          setCheckedCount((prev) => prev + 1);
          playSound('success');
        } else {
          setScanStatus('invalid');
          setFeedback({
            status: 'invalid',
            message: data.message || 'INVALID TICKET - Not on guest list.',
          });
          playSound('invalid');
        }
      } catch (err) {
        console.error('Scan error:', err);
        setScanStatus('invalid');
        setFeedback({
          status: 'invalid',
          message: 'INVALID TICKET - Verification network error.',
        });
        playSound('invalid');
      } finally {
        setIsVerifying(false);
        triggerCooldown();
      }
    },
    [isVerifying, playSound, triggerCooldown]
  );

  // Initialize html5-qrcode
  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        const readerElement = document.getElementById('qr-reader');
        if (!readerElement || !isMounted) return;

        html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            if (!isCooldownRef.current) {
              handleVerify(decodedText);
            }
          },
          () => {}
        );

        if (isMounted) {
          setScanStatus('scanning');
          setCameraError(null);
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.warn('Camera notice:', errMessage);
        if (isMounted) {
          setCameraError(
            'Camera access requires permission. For local testing, access over localhost or HTTPS.'
          );
          setScanStatus('idle');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } catch {}
      }
    };
  }, [handleVerify]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleVerify(manualCode.trim());
      setManualCode('');
      setShowManualInput(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] flex flex-col justify-between transition-colors duration-300 ${
        scanStatus === 'invalid'
          ? 'bg-rose-950 text-white'
          : scanStatus === 'duplicate'
          ? 'bg-amber-950 text-white'
          : scanStatus === 'success'
          ? 'bg-emerald-950 text-white'
          : 'bg-[#0F172A] text-white'
      }`}
    >
      {/* Top Header Card */}
      <div className="max-w-lg mx-auto w-full px-4 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center space-x-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Scanner</span>
          </Link>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-800/90 text-slate-200 border border-slate-700 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>

        {/* Event Stats Bar */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white line-clamp-1">{event.title}</h2>
            <p className="text-[11px] text-slate-400 font-medium">Gate Validation Mode</p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-emerald-300">
              {checkedCount} / {event.totalGuests}
            </span>
          </div>
        </div>
      </div>

      {/* Main Camera Frame Section */}
      <div className="max-w-lg mx-auto w-full px-4 flex-1 flex flex-col justify-center items-center py-4">
        {/* Camera Box */}
        <div className="w-full relative aspect-square max-w-[340px] bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl">
          <div id="qr-reader" className="w-full h-full" />

          {/* Laser scanning line when active */}
          {scanStatus === 'scanning' && !isCooldown && (
            <div className="absolute inset-x-0 h-0.5 bg-[#EA580C] shadow-[0_0_12px_#EA580C] animate-pulse top-1/2 pointer-events-none" />
          )}

          {/* Fallback info when camera has error */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center">
              <Camera className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-xs text-slate-200 mb-4">{cameraError}</p>
              <button
                onClick={() => setShowManualInput(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EA580C] text-white shadow-cta"
              >
                Enter Ticket UUID Manually
              </button>
            </div>
          )}
        </div>

        {/* Manual Input Toggle */}
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="mt-3.5 inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span>{showManualInput ? 'Hide manual entry' : 'Type/Paste ticket UUID manually'}</span>
        </button>

        {/* Manual Input Form */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="w-full max-w-[340px] mt-2.5 flex items-center space-x-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste ticket UUID or verify URL..."
              className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isVerifying}
              className="px-4 py-2.5 bg-[#EA580C] hover:bg-[#F97316] text-white text-xs font-bold rounded-xl shadow-cta disabled:opacity-50"
            >
              Verify
            </button>
          </form>
        )}
      </div>

      {/* State Machine Status Display Area */}
      <div className="max-w-lg mx-auto w-full px-4 pb-8">
        <div
          className={`p-6 rounded-3xl border shadow-2xl transition-all duration-200 text-center ${
            scanStatus === 'invalid'
              ? 'bg-rose-600 border-rose-500 text-white'
              : scanStatus === 'duplicate'
              ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold'
              : scanStatus === 'success'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-800/90 border-slate-700 text-slate-200'
          }`}
        >
          {scanStatus === 'invalid' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-white mb-2 animate-bounce" />
              <h3 className="text-xl font-black uppercase tracking-wide">
                ❌ {feedback?.message || 'INVALID TICKET - Not on guest list.'}
              </h3>
            </div>
          )}

          {scanStatus === 'duplicate' && (
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 text-slate-950 mb-2 animate-pulse" />
              <h3 className="text-xl font-black uppercase tracking-wide">
                ⚠️ {feedback?.message || 'DUPLICATE TICKET - Already scanned!'}
              </h3>
              {feedback?.guestEmail && (
                <p className="text-xs font-bold mt-1 text-slate-900">
                  Guest: {feedback.guestEmail}
                </p>
              )}
            </div>
          )}

          {scanStatus === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-white mb-2 scale-110" />
              <h3 className="text-xl font-black uppercase tracking-wide">
                {feedback?.message || 'WELCOME! - Ticket validated.'}
              </h3>
            </div>
          )}

          {scanStatus === 'scanning' && (
            <div className="flex flex-col items-center py-2">
              <div className="h-5 w-5 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm font-bold text-white">
                Ready to Scan &bull; Point camera at guest pass
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant gate validation with color & audio feedback
              </p>
            </div>
          )}

          {scanStatus === 'idle' && (
            <div className="flex flex-col items-center py-2">
              <p className="text-sm font-semibold text-slate-300">
                Initializing camera scanner...
              </p>
            </div>
          )}

          {/* 2.5s Cooldown Progress Bar */}
          {isCooldown && (
            <div className="mt-4 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1 opacity-90">
                <span>Resetting camera...</span>
                <span>{(cooldownPercent / 40).toFixed(1)}s</span>
              </div>
              <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 rounded-full"
                  style={{ width: `${cooldownPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
