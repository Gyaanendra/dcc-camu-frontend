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
  SwitchCamera,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Loader2,
  Clock,
} from 'lucide-react';

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

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ activeSessionId, onScanSuccess }) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Core Flow State
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const hasScannedRef = useRef<boolean>(false);
  const readerElementId = 'qr-camera-viewport';

  // Audio Feedback
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
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (_) {}
  }, [isSoundEnabled]);

  // Camera Zoom via CSS + native track constraints
  const applyZoom = useCallback(async (value: number) => {
    setZoomLevel(value);
    try {
      const container = document.getElementById(readerElementId);
      const video = container?.querySelector('video') as HTMLVideoElement | null;
      if (video) {
        video.style.transform = `scale(${value})`;
        video.style.transformOrigin = 'center center';
        video.style.transition = 'transform 0.15s ease-out';
        if (video.srcObject) {
          const track = (video.srcObject as MediaStream).getVideoTracks()[0];
          if (track?.getCapabilities) {
            const caps: any = track.getCapabilities();
            if (caps?.zoom) {
              await track.applyConstraints({ advanced: [{ zoom: Math.min(Math.max(value, caps.zoom.min), caps.zoom.max) } as any] });
            }
          }
        }
      }
    } catch (_) {}
  }, []);

  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices?.length > 0) {
        setCameras(devices);
        const back = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('environment') ||
          d.label.toLowerCase().includes('rear')
        );
        setSelectedCameraId(back ? back.id : devices[0].id);
      }
    } catch (_) {}
  };

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
        setTimeout(() => applyZoom(zoomLevel), 300);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const insecure = typeof window !== 'undefined' && !window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname);
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

  // On QR scanned: stop camera → show loader → hit API → show result
  const handleScanned = async (token: string) => {
    const clean = token.trim();
    if (!clean) return;

    // Vibrate
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([80]);

    // Stop camera and show processing state
    await stopCamera();
    setScanState('processing');

    try {
      const res = await api.scanQrPayload({
        qrCodeToken: clean,
        sessionId: activeSessionId,
      });

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

  const handleCameraSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCameraId(e.target.value);
    if (isCameraActive) await startCamera(e.target.value);
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setScanState('scanning');
    startCamera();
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg overflow-hidden">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-700">
            <QrCode className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight">Live QR Scanner</h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {scanState === 'scanning' && 'Point camera at a QR badge'}
              {scanState === 'processing' && 'Processing check-in…'}
              {scanState === 'success' && 'Attendance confirmed'}
              {scanState === 'error' && 'Check-in failed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSoundEnabled(s => !s)}
            className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {scanState === 'scanning' && cameras.length > 1 && (
            <div className="relative">
              <select
                value={selectedCameraId}
                onChange={handleCameraSwitch}
                className="pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:outline-none max-w-[140px] truncate"
              >
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>{c.label || `Camera ${i + 1}`}</option>
                ))}
              </select>
              <SwitchCamera className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {scanState === 'scanning' && (
            <button
              onClick={isCameraActive ? stopCamera : () => startCamera()}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isCameraActive
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-700'
              }`}
            >
              {isCameraActive
                ? <><VideoOff className="w-3.5 h-3.5" /><span>Stop</span></>
                : <><Video className="w-3.5 h-3.5" /><span>Start</span></>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── SCANNING STATE: Camera Viewfinder ── */}
      {scanState === 'scanning' && (
        <>
          <div className="relative bg-slate-950 min-h-[300px] sm:min-h-[340px] max-h-[380px] flex items-center justify-center overflow-hidden">
            {/* Library video viewport */}
            <div
              id={readerElementId}
              className="w-full h-full [&_video]:max-h-[380px] [&_video]:w-full [&_video]:object-cover [&_input[type=range]]:!hidden [&_.zoom-range-selector]:!hidden [&_select]:!hidden [&_span]:!hidden [&_button]:!hidden [&_img]:!hidden overflow-hidden"
            />

            {/* Corner guide overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-52 h-52 sm:w-60 sm:h-60">
                  {/* Corner marks */}
                  {[['top-0 left-0 border-t-2 border-l-2', ''], ['top-0 right-0 border-t-2 border-r-2', ''], ['bottom-0 left-0 border-b-2 border-l-2', ''], ['bottom-0 right-0 border-b-2 border-r-2', '']].map(([cls], i) => (
                    <div key={i} className={`absolute w-5 h-5 ${cls} border-blue-400`} />
                  ))}
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-0 h-0.5 bg-blue-400/70 top-1/2 animate-bounce" style={{ animationDuration: '2s' }} />
                </div>
              </div>
            )}

            {/* Live indicator */}
            {isCameraActive && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
              </div>
            )}

            {/* Camera paused/error overlay */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {cameraError ? (
                  <>
                    <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/30">
                      <AlertCircle className="w-7 h-7 text-rose-400" />
                    </div>
                    <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{cameraError}</p>
                    <button onClick={() => startCamera()} className="mt-1 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors">
                      Retry Camera
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">Camera is off</p>
                    <button onClick={() => startCamera()} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">
                      Start Camera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Zoom controls */}
          {isCameraActive && (
            <div className="flex items-center gap-3 px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <ZoomOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="range" min="1" max="3" step="0.1" value={zoomLevel}
                onChange={e => applyZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <ZoomIn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-zinc-400 min-w-[30px] text-right">{zoomLevel.toFixed(1)}x</span>
              <div className="flex gap-1 ml-1">
                {[1, 1.5, 2, 2.5].map(p => (
                  <button key={p} onClick={() => applyZoom(p)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all ${Math.abs(zoomLevel - p) < 0.05 ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:border-slate-400'}`}>
                    {p}x
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 py-3 text-[11px] text-slate-400 dark:text-zinc-500">
            <ScanLine className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Point camera at any QR code to check in</span>
          </div>
        </>
      )}

      {/* ── PROCESSING STATE: Loader ── */}
      {scanState === 'processing' && (
        <div className="flex flex-col items-center justify-center gap-5 py-16 px-8">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-slate-100 dark:border-zinc-800" />
            <Loader2 className="h-20 w-20 text-blue-600 dark:text-blue-400 animate-spin absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-7 h-7 text-slate-600 dark:text-zinc-300" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Processing Check-in</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Verifying badge and recording attendance…</p>
          </div>
        </div>
      )}

      {/* ── SUCCESS STATE ── */}
      {scanState === 'success' && scanResult && (
        <div className="flex flex-col items-center gap-0 p-0">
          {/* Green success banner */}
          <div className="w-full px-6 py-8 bg-gradient-to-br from-emerald-500 to-emerald-600 flex flex-col items-center gap-3 text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <div>
              <p className="text-white text-xl font-bold leading-tight">{scanResult.name}</p>
              <p className="text-emerald-100 text-sm font-mono mt-0.5">{scanResult.rollNumber}</p>
            </div>
            <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${
              scanResult.status === 'late'
                ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                : 'bg-white/20 text-white border border-white/30'
            }`}>
              {scanResult.status === 'late' ? '🕐 Late Arrival' : '✓ Present (On-Time)'}
            </span>
          </div>

          {/* Details */}
          <div className="w-full px-6 py-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Session</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 mt-0.5 truncate">{scanResult.sessionTitle || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Checked In At</p>
                <p className="text-xs font-mono font-semibold text-slate-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {scanResult.time}
                </p>
              </div>
            </div>

            <button
              onClick={handleScanAgain}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
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
          {/* Red error banner */}
          <div className={`w-full px-6 py-8 flex flex-col items-center gap-3 text-center ${
            scanResult.isEnded
              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : 'bg-gradient-to-br from-rose-500 to-rose-700'
          }`}>
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

          {/* Actions */}
          <div className="w-full px-6 py-5 space-y-2">
            <button
              onClick={handleScanAgain}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
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
