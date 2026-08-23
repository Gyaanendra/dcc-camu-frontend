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
  Loader2,
  Clock,
  FlipHorizontal2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRScannerModalProps {
  activeSessionId?: string;
  onScanSuccess?: (data: any) => void;
}

type ScanState = 'scanning' | 'processing' | 'success' | 'error';

interface ScanResult {
  type: 'success' | 'error';
  name?: string;
  rollNumber?: string;
  status?: string;
  sessionTitle?: string;
  time?: string;
  message: string;
  isEnded?: boolean;
}

// ─── Camera label parser ──────────────────────────────────────────────────────
// Infers a human-friendly name + emoji from the raw browser label string.
// Raw examples:  "back ultra wide camera 2",  "Front Camera",
//                "camera2 0, facing back",     "HD Webcam"
function parseCameraLabel(rawLabel: string, index: number): { name: string; icon: string; facing: 'front' | 'back' | 'unknown' } {
  const l = rawLabel.toLowerCase();

  // Facing detection
  const isFront =
    l.includes('front') || l.includes('facing front') || l.includes('user');
  const isBack =
    !isFront && (l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('facing back'));

  // Lens type detection (back cameras)
  if (isBack) {
    if (l.includes('ultra') || l.includes('wide') || l.includes('0.5')) return { name: 'Ultrawide', icon: '🔭', facing: 'back' };
    if (l.includes('tele') || l.includes('zoom') || l.includes('3x') || l.includes('5x') || l.includes('10x')) return { name: 'Telephoto', icon: '🔍', facing: 'back' };
    if (l.includes('macro')) return { name: 'Macro', icon: '🔬', facing: 'back' };
    if (l.includes('depth') || l.includes('tof')) return { name: 'Depth', icon: '📐', facing: 'back' };
    return { name: 'Main', icon: '📷', facing: 'back' };
  }

  if (isFront) return { name: 'Front', icon: '🤳', facing: 'front' };

  // Fallback
  if (rawLabel) return { name: rawLabel.split(' ').slice(0, 2).join(' '), icon: '📹', facing: 'unknown' };
  return { name: `Camera ${index + 1}`, icon: '📹', facing: 'unknown' };
}

// ─── Zoom preset buttons ──────────────────────────────────────────────────────
const ZOOM_PRESETS = [1, 2, 5, 10];

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ activeSessionId, onScanSuccess }) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [nativeZoomRange, setNativeZoomRange] = useState<{ min: number; max: number } | null>(null);

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const hasScannedRef = useRef<boolean>(false);
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
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      }
    } catch (_) {}
  }, [isSoundEnabled]);

  // ─── Zoom ─────────────────────────────────────────────────────────────────
  // Two-layer zoom:
  //   1. Native hardware zoom via MediaStreamTrack.applyConstraints({ zoom })
  //      — works on Chrome Android / some desktop Chrome
  //   2. CSS scale() fallback on the <video> element
  const applyZoom = useCallback(async (value: number) => {
    const clamped = Math.max(1, Math.min(value, 10));
    setZoomLevel(clamped);
    try {
      const container = document.getElementById(readerElementId);
      const video = container?.querySelector('video') as HTMLVideoElement | null;
      if (!video) return;

      // CSS zoom always applied as a reliable fallback
      video.style.transform = `scale(${clamped})`;
      video.style.transformOrigin = 'center center';
      video.style.transition = 'transform 0.15s ease-out';

      // Native hardware zoom if supported
      if (video.srcObject) {
        const track = (video.srcObject as MediaStream).getVideoTracks()[0];
        if (track?.getCapabilities) {
          const caps: any = track.getCapabilities();
          if (caps?.zoom) {
            const hwZoom = Math.min(Math.max(clamped, caps.zoom.min), caps.zoom.max);
            await track.applyConstraints({ advanced: [{ zoom: hwZoom } as any] });
            // Store range for slider labeling
            if (!nativeZoomRange) setNativeZoomRange({ min: caps.zoom.min, max: caps.zoom.max });
          }
        }
      }
    } catch (_) {}
  }, [nativeZoomRange]);

  // ─── Camera Discovery ─────────────────────────────────────────────────────
  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices?.length > 0) {
        setCameras(devices);
        // Prefer the main back camera (not ultrawide, not telephoto)
        const mainBack = devices.find(d => {
          const l = d.label.toLowerCase();
          return (l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('facing back'))
            && !l.includes('ultra') && !l.includes('wide') && !l.includes('tele') && !l.includes('depth');
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
    if (isMountedRef.current) setIsCameraActive(false);
  };

  // ─── Start Camera ─────────────────────────────────────────────────────────
  const startCamera = async (camId?: string) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    hasScannedRef.current = false;
    setScanState('scanning');
    setScanResult(null);

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
          fps: 15,
          qrbox: (w: number, h: number) => {
            const s = Math.floor(Math.min(w, h) * 0.72);
            return { width: Math.max(200, s), height: Math.max(200, s) };
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
        // Re-apply current zoom after camera starts
        setTimeout(() => applyZoom(zoomLevel), 400);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const insecure = typeof window !== 'undefined'
          && !window.isSecureContext
          && !['localhost', '127.0.0.1'].includes(window.location.hostname);
        setCameraError(insecure
          ? 'Camera needs HTTPS. Enable flag: chrome://flags/#unsafely-treat-insecure-origin-as-secure'
          : err?.message || 'Camera permission denied or not accessible.'
        );
        setIsCameraActive(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  // ─── Handle QR Scanned ───────────────────────────────────────────────────
  const handleScanned = async (token: string) => {
    const clean = token.trim();
    if (!clean) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([80]);
    await stopCamera();
    setScanState('processing');

    try {
      const res = await api.scanQrPayload({ qrCodeToken: clean, sessionId: activeSessionId });
      playAudio('success');
      setScanResult({
        type: 'success',
        name: res.user?.name,
        rollNumber: res.user?.rollNumber,
        status: res.status,
        sessionTitle: res.session?.title,
        time: new Date(res.record?.scannedAt || Date.now()).toLocaleTimeString(),
        message: res.message || 'Attendance marked successfully!',
      });
      setScanState('success');
      toast.success(`✓ ${res.user?.name} checked in!`);
      if (onScanSuccess) onScanSuccess(res);
    } catch (err: any) {
      playAudio('error');
      setScanResult({
        type: 'error',
        message: err.message || 'Failed to record attendance.',
        isEnded: err.isEnded,
      });
      setScanState('error');
    }
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    discoverCameras();
    const t = setTimeout(() => startCamera(), 200);
    return () => {
      isMountedRef.current = false;
      clearTimeout(t);
      stopCamera();
    };
  }, []);

  // ─── Camera Switch ────────────────────────────────────────────────────────
  const handleCameraSelect = async (camId: string) => {
    setSelectedCameraId(camId);
    setZoomLevel(1); // reset zoom on camera change
    setNativeZoomRange(null);
    if (isCameraActive) await startCamera(camId);
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setScanState('scanning');
    startCamera();
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const parsedCameras = cameras.map((c, i) => ({ ...c, ...parseCameraLabel(c.label, i) }));
  const backCameras = parsedCameras.filter(c => c.facing === 'back');
  const frontCameras = parsedCameras.filter(c => c.facing === 'front');
  const otherCameras = parsedCameras.filter(c => c.facing === 'unknown');
  const hasCameraChoice = cameras.length > 1;

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl bg-card border border-border shadow-lg overflow-hidden anim-fade-up">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
            <QrCode className="w-4 h-4 text-background" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">Live QR Scanner</h2>
            <p className="text-[11px] text-muted-foreground">
              {scanState === 'scanning' && 'Point camera at a QR badge'}
              {scanState === 'processing' && 'Processing check-in…'}
              {scanState === 'success' && 'Attendance confirmed'}
              {scanState === 'error' && 'Check-in failed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setIsSoundEnabled(s => !s)}
            id="scanner-sound-toggle"
            className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
            title={isSoundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {isSoundEnabled
              ? <Volume2 className="w-4 h-4 text-accent" />
              : <VolumeX className="w-4 h-4" />
            }
          </button>

          {/* Camera start/stop */}
          {scanState === 'scanning' && (
            <button
              onClick={isCameraActive ? stopCamera : () => startCamera()}
              id="scanner-toggle-camera"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97]',
                isCameraActive
                  ? 'bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20'
                  : 'bg-accent text-accent-foreground hover:bg-accent/90'
              )}
            >
              {isCameraActive
                ? <><VideoOff className="w-3.5 h-3.5" /><span>Stop</span></>
                : <><Video className="w-3.5 h-3.5" /><span>Start</span></>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── SCANNING STATE ── */}
      {scanState === 'scanning' && (
        <>
          {/* Camera Viewfinder */}
          <div className="relative bg-zinc-950 min-h-[300px] sm:min-h-[340px] max-h-[380px] flex items-center justify-center overflow-hidden">
            <div
              id={readerElementId}
              className="w-full h-full [&_video]:max-h-[380px] [&_video]:w-full [&_video]:object-cover [&_input[type=range]]:!hidden [&_.zoom-range-selector]:!hidden [&_select]:!hidden [&_span]:!hidden [&_button]:!hidden [&_img]:!hidden overflow-hidden"
            />

            {/* Corner guide overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-52 h-52 sm:w-60 sm:h-60">
                  {(['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                    'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'] as const)
                    .map((cls, i) => (
                      <div key={i} className={`absolute w-5 h-5 ${cls} border-accent`} />
                    ))}
                  <div className="absolute inset-x-0 h-0.5 bg-accent/70 top-1/2 animate-bounce" style={{ animationDuration: '2s' }} />
                </div>
              </div>
            )}

            {/* LIVE badge */}
            {isCameraActive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
              </div>
            )}

            {/* Zoom badge overlay */}
            {isCameraActive && zoomLevel > 1 && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 border border-white/10">
                <span className="text-[11px] font-bold text-white font-mono">{zoomLevel.toFixed(1)}×</span>
              </div>
            )}

            {/* Camera off overlay */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {cameraError ? (
                  <>
                    <div className="p-3 rounded-full bg-destructive/20 border border-destructive/30">
                      <AlertCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">{cameraError}</p>
                    <button
                      onClick={() => startCamera()}
                      className="mt-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors"
                    >
                      Retry Camera
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-zinc-800 border border-zinc-700">
                      <Camera className="w-8 h-8 text-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-400">Camera is off</p>
                    <button
                      onClick={() => startCamera()}
                      className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors"
                    >
                      Start Camera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── CAMERA SELECTOR STRIP ── */}
          {hasCameraChoice && scanState === 'scanning' && (
            <div className="px-4 pt-3 pb-0 border-t border-border bg-secondary/20">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                <FlipHorizontal2 className="w-3 h-3" />
                Camera
              </p>
              <div className="flex flex-wrap gap-2 pb-3">
                {/* Back cameras */}
                {backCameras.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {backCameras.map(cam => (
                      <button
                        key={cam.id}
                        onClick={() => handleCameraSelect(cam.id)}
                        id={`cam-${cam.id.slice(-6)}`}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-[0.97]',
                          selectedCameraId === cam.id
                            ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                        )}
                      >
                        <span>{cam.icon}</span>
                        <span>{cam.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Divider if both front and back */}
                {backCameras.length > 0 && frontCameras.length > 0 && (
                  <div className="flex items-center self-stretch">
                    <div className="w-px h-full bg-border mx-1" />
                  </div>
                )}

                {/* Front cameras */}
                {frontCameras.map(cam => (
                  <button
                    key={cam.id}
                    onClick={() => handleCameraSelect(cam.id)}
                    id={`cam-${cam.id.slice(-6)}`}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      selectedCameraId === cam.id
                        ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                    )}
                  >
                    <span>{cam.icon}</span>
                    <span>{cam.name}</span>
                  </button>
                ))}

                {/* Other / unknown cameras */}
                {otherCameras.map(cam => (
                  <button
                    key={cam.id}
                    onClick={() => handleCameraSelect(cam.id)}
                    id={`cam-${cam.id.slice(-6)}`}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      selectedCameraId === cam.id
                        ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                    )}
                  >
                    <span>{cam.icon}</span>
                    <span>{cam.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ZOOM CONTROLS ── */}
          {isCameraActive && (
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-secondary/20">
              <ZoomOut className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={zoomLevel}
                onChange={e => applyZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[hsl(var(--accent))]"
                style={{ background: `linear-gradient(to right, hsl(var(--accent)) ${(zoomLevel - 1) / 9 * 100}%, hsl(var(--secondary)) ${(zoomLevel - 1) / 9 * 100}%)` }}
              />
              <ZoomIn className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

              {/* Preset zoom buttons: 1× 2× 5× 10× */}
              <div className="flex gap-1 ml-1 shrink-0">
                {ZOOM_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => applyZoom(p)}
                    id={`zoom-preset-${p}x`}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all border active:scale-[0.97]',
                      Math.abs(zoomLevel - p) < 0.15
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-secondary text-muted-foreground border-border hover:border-accent/40 hover:text-foreground'
                    )}
                  >
                    {p}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom hint */}
          <div className="flex items-center justify-center gap-1.5 py-3 text-[11px] text-muted-foreground border-t border-border">
            <ScanLine className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>Point camera at any QR code to check in</span>
          </div>
        </>
      )}

      {/* ── PROCESSING STATE ── */}
      {scanState === 'processing' && (
        <div className="flex flex-col items-center justify-center gap-5 py-16 px-8">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-secondary" />
            <Loader2 className="h-20 w-20 text-accent animate-spin absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-7 h-7 text-muted-foreground" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-foreground">Processing Check-in</p>
            <p className="text-xs text-muted-foreground">Verifying badge and recording attendance…</p>
          </div>
        </div>
      )}

      {/* ── SUCCESS STATE ── */}
      {scanState === 'success' && scanResult && (
        <div className="flex flex-col items-center gap-0 p-0">
          <div className="w-full px-6 py-8 bg-gradient-to-br from-emerald-500 to-emerald-600 flex flex-col items-center gap-3 text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <div>
              <p className="text-white text-xl font-bold leading-tight">{scanResult.name}</p>
              <p className="text-emerald-100 text-sm font-mono mt-0.5">{scanResult.rollNumber}</p>
            </div>
            <span className={cn(
              'px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider',
              scanResult.status === 'late'
                ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                : 'bg-white/20 text-white border border-white/30'
            )}>
              {scanResult.status === 'late' ? '🕐 Late Arrival' : '✓ Present (On-Time)'}
            </span>
          </div>

          <div className="w-full px-6 py-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-secondary border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Session</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{scanResult.sessionTitle || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Checked In At</p>
                <p className="text-xs font-mono font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {scanResult.time}
                </p>
              </div>
            </div>

            <button
              onClick={handleScanAgain}
              id="scan-again-btn"
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Next Attendee
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {scanState === 'error' && scanResult && (
        <div className="flex flex-col items-center gap-0 p-0">
          <div className={cn(
            'w-full px-6 py-8 flex flex-col items-center gap-3 text-center',
            scanResult.isEnded
              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : 'bg-gradient-to-br from-rose-500 to-rose-700'
          )}>
            <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
              <AlertCircle className="w-9 h-9 text-white" />
            </div>
            <div>
              <p className="text-white text-lg font-bold leading-tight">
                {scanResult.isEnded ? 'Session Ended' : 'Check-in Failed'}
              </p>
              <p className="text-white/80 text-xs mt-1.5 max-w-xs leading-relaxed">{scanResult.message}</p>
            </div>
          </div>

          <div className="w-full px-6 py-5">
            <button
              onClick={handleScanAgain}
              id="scan-retry-btn"
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
