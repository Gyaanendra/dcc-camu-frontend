'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  QrCode,
  CheckCircle2,
  Camera,
  VideoOff,
  Video,
  AlertCircle,
  ScanLine,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Clock,
  FlipHorizontal2,
  Keyboard,
  UploadCloud,
  Flashlight,
  ArrowRight,
  Pause,
  Play,
  User,
  Sparkles,
  FileImage,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRScannerModalProps {
  activeSessionId?: string;
  onScanSuccess?: (data: any) => void;
}

type ScanState = 'scanning' | 'processing' | 'success' | 'error';
type ScanMode = 'camera' | 'manual' | 'upload';

interface ScanResult {
  type: 'success' | 'error';
  name?: string;
  rollNumber?: string;
  avatarUrl?: string;
  status?: string;
  sessionTitle?: string;
  time?: string;
  message: string;
  isEnded?: boolean;
}

function parseCameraLabel(rawLabel: string, index: number): { name: string; facing: 'front' | 'back' | 'unknown' } {
  const l = rawLabel.toLowerCase();
  const isFront = l.includes('front') || l.includes('facing front') || l.includes('user');
  const isBack = !isFront && (l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('facing back'));

  if (isBack) {
    if (l.includes('ultra') || l.includes('wide') || l.includes('0.5')) return { name: 'Ultrawide', facing: 'back' };
    if (l.includes('tele') || l.includes('zoom')) return { name: 'Telephoto', facing: 'back' };
    return { name: 'Back Camera', facing: 'back' };
  }

  if (isFront) return { name: 'Front Camera', facing: 'front' };
  if (rawLabel) return { name: rawLabel.split(' ').slice(0, 2).join(' '), facing: 'unknown' };
  return { name: `Camera ${index + 1}`, facing: 'unknown' };
}

const ZOOM_PRESETS = [1, 2, 5];

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ activeSessionId, onScanSuccess }) => {
  // Mode selection
  const [activeMode, setActiveMode] = useState<ScanMode>('camera');

  // Camera & Device state
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Scanning state
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Manual entry state
  const [manualInput, setManualInput] = useState<string>('');
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  // Image upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-advance continuous scanning (for rapid queue check-in)
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number>(4);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Accessibility screen reader announcement
  const [a11yAnnouncement, setA11yAnnouncement] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const hasScannedRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<any>(null);
  const readerElementId = 'qr-camera-viewport';

  // ─── Audio Feedback ───────────────────────────────────────────────────────
  const playAudio = useCallback((type: 'success' | 'error') => {
    if (!isSoundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      }
    } catch (_) {}
  }, [isSoundEnabled]);

  // ─── Torch / Flashlight Control ───────────────────────────────────────────
  const toggleTorch = async () => {
    try {
      const container = document.getElementById(readerElementId);
      const video = container?.querySelector('video') as HTMLVideoElement | null;
      if (video?.srcObject) {
        const track = (video.srcObject as MediaStream).getVideoTracks()[0];
        const nextState = !isTorchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState } as any] });
        setIsTorchOn(nextState);
      }
    } catch (_) {
      toast.error('Flashlight not available on this camera');
    }
  };

  // ─── Zoom Control ─────────────────────────────────────────────────────────
  const applyZoom = useCallback(async (value: number) => {
    const clamped = Math.max(1, Math.min(value, 10));
    setZoomLevel(clamped);
    try {
      const container = document.getElementById(readerElementId);
      const video = container?.querySelector('video') as HTMLVideoElement | null;
      if (!video) return;

      video.style.transform = `scale(${clamped})`;
      video.style.transformOrigin = 'center center';
      video.style.transition = 'transform 0.15s ease-out';

      if (video.srcObject) {
        const track = (video.srcObject as MediaStream).getVideoTracks()[0];
        if (track?.getCapabilities) {
          const caps: any = track.getCapabilities();
          if (caps?.zoom) {
            const hwZoom = Math.min(Math.max(clamped, caps.zoom.min), caps.zoom.max);
            await track.applyConstraints({ advanced: [{ zoom: hwZoom } as any] });
          }
        }
      }
    } catch (_) {}
  }, []);

  // ─── Camera Discovery ─────────────────────────────────────────────────────
  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices?.length > 0) {
        setCameras(devices);
        const mainBack = devices.find(d => {
          const l = d.label.toLowerCase();
          return (l.includes('back') || l.includes('rear') || l.includes('environment'))
            && !l.includes('ultra') && !l.includes('wide') && !l.includes('tele');
        });
        const anyBack = devices.find(d => {
          const l = d.label.toLowerCase();
          return l.includes('back') || l.includes('rear') || l.includes('environment');
        });
        setSelectedCameraId((mainBack || anyBack || devices[0]).id);
      }
    } catch (_) {}
  };

  // ─── Stop Camera ──────────────────────────────────────────────────────────
  const stopCamera = async () => {
    isStartingRef.current = false;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (_) {} finally {
        scannerRef.current = null;
      }
    }
    const el = document.getElementById(readerElementId);
    if (el) el.innerHTML = '';
    if (isMountedRef.current) {
      setIsCameraActive(false);
      setIsTorchOn(false);
    }
  };

  // ─── Start Camera ─────────────────────────────────────────────────────────
  const startCamera = async (camId?: string) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    hasScannedRef.current = false;
    setScanState('scanning');
    setScanResult(null);
    setA11yAnnouncement('Camera started. Align QR code within the viewfinder.');

    try {
      await stopCamera();
      const el = document.getElementById(readerElementId);
      if (!el) { isStartingRef.current = false; return; }
      el.innerHTML = '';

      const qr = new Html5Qrcode(readerElementId);
      scannerRef.current = qr;

      const camConfig = (camId || selectedCameraId)
        ? { deviceId: { exact: (camId || selectedCameraId) } }
        : { facingMode: 'environment' };

      await qr.start(
        camConfig,
        {
          fps: 24,
          qrbox: (w: number, h: number) => {
            const s = Math.floor(Math.min(w, h) * 0.76);
            return { width: Math.max(220, s), height: Math.max(220, s) };
          },
          aspectRatio: 1.0,
        },
        (decoded) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            handleScanned(decoded);
          }
        },
        () => {}
      );

      if (isMountedRef.current) {
        setIsCameraActive(true);
        setTimeout(async () => {
          applyZoom(zoomLevel);
          // Check torch capability
          try {
            const container = document.getElementById(readerElementId);
            const video = container?.querySelector('video') as HTMLVideoElement | null;
            if (video?.srcObject) {
              const track = (video.srcObject as MediaStream).getVideoTracks()[0];
              const caps: any = track?.getCapabilities?.();
              setIsTorchSupported(Boolean(caps?.torch));
            }
          } catch (_) {}
        }, 500);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const insecure = typeof window !== 'undefined'
          && !window.isSecureContext
          && !['localhost', '127.0.0.1'].includes(window.location.hostname);
        setCameraError(insecure
          ? 'Camera needs HTTPS. Please access over https:// or localhost.'
          : err?.message || 'Camera permission denied or device not accessible.'
        );
        setIsCameraActive(false);
        setA11yAnnouncement('Camera access failed.');
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  // ─── Process Check-in ─────────────────────────────────────────────────────
  const handleScanned = async (token: string) => {
    const clean = token.trim();
    if (!clean) {
      toast.error('Please enter a valid QR token or Roll Number');
      return;
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([80]);
    await stopCamera();
    setScanState('processing');
    setA11yAnnouncement('Processing check-in…');

    try {
      const res = await api.scanQrPayload({
        qrCodeToken: clean,
        memberRollNumber: clean.toUpperCase(),
        sessionId: activeSessionId,
      });

      playAudio('success');
      setScanResult({
        type: 'success',
        name: res.user?.name,
        rollNumber: res.user?.rollNumber,
        avatarUrl: res.user?.avatarUrl,
        status: res.status,
        sessionTitle: res.session?.title,
        time: new Date(res.record?.scannedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: res.message || 'Attendance marked successfully!',
      });
      setScanState('success');
      setA11yAnnouncement(`Success. ${res.user?.name} checked in as ${res.status}.`);
      toast.success(`✓ ${res.user?.name} checked in!`);
      if (onScanSuccess) onScanSuccess(res);

      // Start auto-advance countdown if enabled
      setAutoAdvanceTimer(4);
      setIsTimerPaused(false);
    } catch (err: any) {
      playAudio('error');
      setScanResult({
        type: 'error',
        message: err.message || 'Failed to record attendance.',
        isEnded: err.isEnded,
      });
      setScanState('error');
      setA11yAnnouncement(`Error. ${err.message || 'Failed to record attendance.'}`);
    }
  };

  // ─── Manual Check-in Handler ──────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error('Please enter a member Roll Number or token');
      return;
    }
    setIsSubmittingManual(true);
    try {
      await handleScanned(manualInput.trim());
      setManualInput('');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ─── Image File Upload Scanner ────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setScanState('processing');
    try {
      const tempReaderId = 'qr-file-upload-temp';
      let tempEl = document.getElementById(tempReaderId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempReaderId;
        tempEl.style.display = 'none';
        document.body.appendChild(tempEl);
      }

      const fileScanner = new Html5Qrcode(tempReaderId);
      const decodedText = await fileScanner.scanFile(file, true);
      await fileScanner.clear();
      if (tempEl) tempEl.remove();

      if (decodedText) {
        await handleScanned(decodedText);
      } else {
        throw new Error('No QR code detected in this image');
      }
    } catch (err: any) {
      playAudio('error');
      setScanResult({
        type: 'error',
        message: err?.message || 'Could not find a valid QR code in the uploaded image.',
      });
      setScanState('error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Continuous Scanning Auto-Advance Timer ───────────────────────────────
  useEffect(() => {
    if (scanState === 'success' && autoAdvance && !isTimerPaused) {
      countdownIntervalRef.current = setInterval(() => {
        setAutoAdvanceTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleScanAgain();
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [scanState, autoAdvance, isTimerPaused]);

  // ─── Lifecycle & Keyboard Shortcuts ───────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    discoverCameras();
    if (activeMode === 'camera') {
      const t = setTimeout(() => startCamera(), 250);
      return () => {
        isMountedRef.current = false;
        clearTimeout(t);
        stopCamera();
      };
    }
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [activeMode]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing into an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (scanState === 'scanning') {
          if (isCameraActive) stopCamera();
          else startCamera();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setIsSoundEnabled(prev => !prev);
        toast.info(!isSoundEnabled ? 'Sound enabled' : 'Sound muted');
      } else if (e.key === 'f' || e.key === 'F') {
        flipCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCameraActive, scanState, isSoundEnabled, cameras, selectedCameraId]);

  // ─── Camera Switching ─────────────────────────────────────────────────────
  const handleCameraSelect = async (camId: string) => {
    setSelectedCameraId(camId);
    setZoomLevel(1);
    setIsTorchOn(false);
    if (isCameraActive) await startCamera(camId);
  };

  const flipCamera = async () => {
    if (cameras.length < 2) {
      toast.info('Only one camera detected on this device');
      return;
    }
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    await handleCameraSelect(cameras[nextIndex].id);
    toast.info(`Switched to ${cameras[nextIndex].label || 'Camera'}`);
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setScanState('scanning');
    setAutoAdvanceTimer(4);
    setIsTimerPaused(false);
    if (activeMode === 'camera') {
      startCamera();
    }
  };

  const parsedCameras = cameras.map((c, i) => ({ ...c, ...parseCameraLabel(c.label, i) }));
  const hasMultipleCameras = cameras.length > 1;

  // ─── Render UI ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg mx-auto rounded-xl bg-card border border-border overflow-hidden shadow-sm">
      {/* Screen Reader Live Announcements */}
      <div aria-live="polite" className="sr-only">
        {a11yAnnouncement}
      </div>

      {/* ── HEADER & ACCESSIBILITY CONTROLS ── */}
      <div className="px-5 py-3.5 border-b border-border bg-secondary/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center text-background shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">Attendance Check-in</h2>
            <p className="text-xs text-muted-foreground">
              {scanState === 'scanning' && (activeMode === 'camera' ? 'Aim camera at QR badge' : activeMode === 'manual' ? 'Enter roll number or token' : 'Upload QR screenshot')}
              {scanState === 'processing' && 'Verifying attendee record…'}
              {scanState === 'success' && 'Attendee verified & checked in'}
              {scanState === 'error' && 'Check-in validation issue'}
            </p>
          </div>
        </div>

        {/* Quick Toolbar (Sound, Flashlight, Camera toggle) */}
        <div className="flex items-center gap-1.5">
          {/* Torch toggle (if supported) */}
          {activeMode === 'camera' && isCameraActive && isTorchSupported && (
            <button
              onClick={toggleTorch}
              className={cn(
                'p-2 rounded-lg border transition-colors focus-orange',
                isTorchOn
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
              title={isTorchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
              aria-label={isTorchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundEnabled(s => !s)}
            id="scanner-sound-toggle"
            className={cn(
              'p-2 rounded-lg border transition-colors focus-orange',
              isSoundEnabled
                ? 'bg-secondary border-border text-foreground'
                : 'bg-secondary/40 border-border text-muted-foreground'
            )}
            title={isSoundEnabled ? 'Mute audio feedback (Key: M)' : 'Enable audio feedback (Key: M)'}
            aria-label={isSoundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
          >
            {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-accent" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Camera Flip (quick toggle if > 1 camera) */}
          {activeMode === 'camera' && hasMultipleCameras && scanState === 'scanning' && (
            <button
              onClick={flipCamera}
              className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors focus-orange"
              title="Flip camera (Key: F)"
              aria-label="Flip camera"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Camera Start / Stop */}
          {activeMode === 'camera' && scanState === 'scanning' && (
            <button
              onClick={isCameraActive ? stopCamera : () => startCamera()}
              id="scanner-toggle-camera"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] focus-orange',
                isCameraActive
                  ? 'bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20'
                  : 'bg-accent text-accent-foreground hover:bg-accent/90'
              )}
              title="Toggle camera (Key: Space)"
              aria-label={isCameraActive ? 'Stop camera' : 'Start camera'}
            >
              {isCameraActive ? (
                <>
                  <VideoOff className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Start</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── MODE SWITCHER TABS ── */}
      {scanState === 'scanning' && (
        <div className="flex border-b border-border bg-secondary/15 p-1 gap-1">
          <button
            onClick={() => {
              setActiveMode('camera');
              if (!isCameraActive) startCamera();
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all focus-orange',
              activeMode === 'camera'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Camera className="w-3.5 h-3.5 text-accent" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('manual');
              stopCamera();
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all focus-orange',
              activeMode === 'manual'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Keyboard className="w-3.5 h-3.5 text-accent" />
            <span>Manual Entry</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('upload');
              stopCamera();
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all focus-orange',
              activeMode === 'upload'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <UploadCloud className="w-3.5 h-3.5 text-accent" />
            <span>Upload Image</span>
          </button>
        </div>
      )}

      {/* ── 1. LIVE CAMERA MODE ── */}
      {scanState === 'scanning' && activeMode === 'camera' && (
        <>
          {/* Camera Viewport Container */}
          <div className="relative bg-zinc-950 min-h-[300px] sm:min-h-[350px] max-h-[390px] flex items-center justify-center overflow-hidden">
            {/* Target element for html5-qrcode video */}
            <div
              id={readerElementId}
              className="w-full h-full [&_video]:max-h-[390px] [&_video]:w-full [&_video]:object-cover [&_input[type=range]]:!hidden [&_.zoom-range-selector]:!hidden [&_select]:!hidden [&_span]:!hidden [&_button]:!hidden [&_img]:!hidden [&_#qr-shaded-region]:!border-0 [&_#qr-shaded-region_div]:!border-0 [&_#qr-shaded-region_svg]:!hidden overflow-hidden"
            />

            {/* UNIFIED SLEEK VIEWFINDER RETICLE (Eliminates confusing double border) */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl border border-white/25 shadow-[0_0_0_9999px_rgba(0,0,0,0.50)] overflow-hidden">
                  {/* High-tech Corner Brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-accent rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-accent rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-accent rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-accent rounded-br-xl" />

                  {/* Smooth Laser Scan Sweep Beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_10px_hsl(var(--accent))] anim-laser-sweep" />
                </div>
              </div>
            )}

            {/* LIVE Indicator Badge */}
            {isCameraActive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold">Live Camera</span>
              </div>
            )}

            {/* Current Zoom Indicator */}
            {isCameraActive && zoomLevel > 1 && (
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10">
                <span className="text-xs font-bold text-white font-mono">{zoomLevel.toFixed(1)}×</span>
              </div>
            )}

            {/* Camera Off / Error State Overlay */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {cameraError ? (
                  <>
                    <div className="p-3 rounded-full bg-destructive/15 border border-destructive/30">
                      <AlertCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <p className="text-xs text-zinc-300 max-w-xs leading-relaxed font-medium">{cameraError}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => startCamera()}
                        className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors focus-orange"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => setActiveMode('manual')}
                        className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                      >
                        Use Manual Entry
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-zinc-800 border border-zinc-700 shadow-sm">
                      <Camera className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-400">Camera is paused</p>
                    <button
                      onClick={() => startCamera()}
                      className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 transition-colors focus-orange"
                    >
                      Start Camera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Camera Selection & Zoom Bar */}
          <div className="p-3 border-t border-border bg-secondary/15 space-y-2.5">
            {/* Camera selector if multiple */}
            {hasMultipleCameras && (
              <div className="flex items-center justify-between text-xs gap-2">
                <label htmlFor="camera-dropdown" className="text-muted-foreground font-medium shrink-0 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Camera:
                </label>
                <select
                  id="camera-dropdown"
                  value={selectedCameraId}
                  onChange={e => handleCameraSelect(e.target.value)}
                  className="bg-card border border-border rounded-md px-2 py-1 text-foreground text-xs font-medium focus-orange flex-1 max-w-[240px]"
                >
                  {parsedCameras.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.facing})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Smooth Zoom Controls */}
            {isCameraActive && (
              <div className="flex items-center gap-2.5 pt-1">
                <ZoomOut className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={zoomLevel}
                  aria-label="Camera Zoom Level"
                  onChange={e => applyZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[hsl(var(--accent))]"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--accent)) ${(zoomLevel - 1) / 4 * 100}%, hsl(var(--border)) ${(zoomLevel - 1) / 4 * 100}%)`,
                  }}
                />
                <ZoomIn className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

                {/* Preset Zoom Buttons */}
                <div className="flex gap-1 ml-1 shrink-0">
                  {ZOOM_PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => applyZoom(p)}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[11px] font-bold font-mono transition-all border focus-orange',
                        Math.abs(zoomLevel - p) < 0.15
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                      )}
                      title={`Zoom ${p}x`}
                      aria-label={`Zoom ${p}x`}
                    >
                      {p}×
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 2. MANUAL CODE / ROLL NUMBER ENTRY ── */}
      {scanState === 'scanning' && activeMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="manual-token-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-accent" />
              Member Roll Number or QR Token
            </label>
            <p className="text-xs text-muted-foreground">
              Type or paste a Bennett Roll Number (e.g. <span className="font-mono text-foreground font-semibold">S24CSEU0771</span>) or live session token.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              id="manual-token-input"
              type="text"
              autoFocus
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="e.g. S24CSEU0771"
              className="font-mono text-sm uppercase tracking-wide h-11"
              disabled={isSubmittingManual}
            />
            <Button
              type="submit"
              disabled={isSubmittingManual || !manualInput.trim()}
              className="h-11 px-5 font-bold focus-orange shrink-0"
            >
              {isSubmittingManual ? 'Checking in…' : 'Check In'}
            </Button>
          </div>

          <div className="rounded-lg bg-secondary/40 border border-border p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Keyboard Accessibility:</span> Press <kbd className="px-1 py-0.5 rounded border border-border bg-card font-mono text-[10px]">Enter</kbd> to submit instantly. The system validates roll numbers and automatically checks into the active session.
            </div>
          </div>
        </form>
      )}

      {/* ── 3. UPLOAD QR IMAGE ── */}
      {scanState === 'scanning' && activeMode === 'upload' && (
        <div className="p-6 space-y-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="qr-image-upload"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-8 cursor-pointer transition-all hover:bg-secondary/20 flex flex-col items-center justify-center gap-3 group"
          >
            <div className="p-3 rounded-full bg-secondary border border-border group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
              <FileImage className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {isUploading ? 'Decoding QR image…' : 'Click to select or drop QR image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PNG, JPEG, SVG, or screenshot from phones
              </p>
            </div>
            <Button variant="secondary" size="sm" className="mt-1 font-semibold">
              Browse Files
            </Button>
          </div>
        </div>
      )}

      {/* ── PROCESSING STATE ── */}
      {scanState === 'processing' && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
          <div className="relative h-12 w-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
            <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Verifying Attendance…</p>
            <p className="text-xs text-muted-foreground">Validating token & recording timestamp</p>
          </div>
        </div>
      )}

      {/* ── SUCCESS STATE (With Member Avatar & Auto-Advance) ── */}
      {scanState === 'success' && scanResult && (
        <div className="flex flex-col items-center gap-4 px-6 py-7 text-center">
          {/* Large prominent avatar with badge */}
          <div className="relative group">
            <MemberAvatar
              src={scanResult.avatarUrl}
              name={scanResult.name}
              className="h-20 w-20 rounded-2xl border-2 border-border shadow-md ring-4 ring-emerald-500/20"
            />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-card text-white shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{scanResult.name}</h3>
            <p className="font-mono text-xs text-muted-foreground mt-0.5 tracking-wider">{scanResult.rollNumber}</p>
          </div>

          {/* Status Badge */}
          <span
            className={cn(
              'px-3.5 py-1 rounded-full text-xs font-bold border',
              scanResult.status === 'late'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            )}
          >
            {scanResult.status === 'late' ? 'Late Arrival' : 'Present · On-Time'}
          </span>

          {/* Session & Timestamp details */}
          <div className="grid grid-cols-2 gap-2.5 w-full text-left">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground">Session</p>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{scanResult.sessionTitle || 'Live Meeting'}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-[11px] font-medium text-muted-foreground">Recorded at</p>
              <p className="text-xs font-mono font-semibold text-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                {scanResult.time}
              </p>
            </div>
          </div>

          {/* Continuous Queue Auto-Advance Bar */}
          {autoAdvance && (
            <div className="w-full bg-secondary/40 border border-border rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  {isTimerPaused ? 'Auto-scan paused' : `Scanning next in ${autoAdvanceTimer}s…`}
                </span>
                <button
                  onClick={() => setIsTimerPaused(p => !p)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  {isTimerPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(autoAdvanceTimer / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
            <Button
              onClick={handleScanAgain}
              id="scan-again-btn"
              autoFocus
              className="flex-1 h-11 font-bold gap-2 focus-orange"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Next Attendee
            </Button>
            <Button asChild variant="outline" className="h-11 font-semibold">
              <Link href="/my-attendance">
                View Attendance
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {scanState === 'error' && scanResult && (
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border',
            scanResult.isEnded ? 'bg-amber-500/10 border-amber-500/30' : 'bg-destructive/10 border-destructive/30'
          )}>
            <AlertCircle className={cn(
              'w-6 h-6',
              scanResult.isEnded ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
            )} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {scanResult.isEnded ? 'Session Attendance Closed' : 'Check-in Failed'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed font-medium">
              {scanResult.message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
            <Button
              onClick={handleScanAgain}
              id="scan-retry-btn"
              autoFocus
              className="flex-1 h-11 font-bold gap-2 focus-orange"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={() => {
                setActiveMode('manual');
                handleScanAgain();
              }}
              variant="outline"
              className="h-11 font-semibold"
            >
              Enter Manually
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Keyboard Shortcut Help Footer */}
      {scanState === 'scanning' && activeMode === 'camera' && (
        <div className="px-4 py-2.5 border-t border-border bg-secondary/10 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5 text-accent" />
            Align code inside reticle
          </span>
          <div className="hidden sm:flex items-center gap-2">
            <span><kbd className="px-1 py-0.5 rounded border border-border bg-card font-mono text-[9px]">Space</kbd> Pause</span>
            <span><kbd className="px-1 py-0.5 rounded border border-border bg-card font-mono text-[9px]">M</kbd> Mute</span>
            {hasMultipleCameras && <span><kbd className="px-1 py-0.5 rounded border border-border bg-card font-mono text-[9px]">F</kbd> Flip</span>}
          </div>
        </div>
      )}
    </div>
  );
};
