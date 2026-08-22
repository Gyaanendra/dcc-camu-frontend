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
  Users,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Sliders,
} from 'lucide-react';

interface QRScannerModalProps {
  activeSessionId?: string;
  onScanSuccess?: (data: any) => void;
}

interface ScannedRecord {
  id: string;
  name: string;
  rollNumber: string;
  status: string;
  time: string;
  sessionTitle: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ activeSessionId, onScanSuccess }) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Zoom Controls (1x to 3.5x)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isZoomSupported, setIsZoomSupported] = useState<boolean>(true);

  // Rapid Scan Feedback States
  const [recentScans, setRecentScans] = useState<ScannedRecord[]>([]);
  const [activePopup, setActivePopup] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    subText?: string;
    status?: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  
  // Anti-Spam & Concurrency Locks (100% continuous multi-user scanning)
  const isScanningLockedRef = useRef<boolean>(false);
  const lastScannedBadgeMapRef = useRef<Map<string, number>>(new Map());
  const readerElementId = 'qr-camera-viewport';

  // Apply Zoom (both native hardware track constraints + CSS transform fallback)
  const applyZoom = useCallback(async (zoomValue: number) => {
    setZoomLevel(zoomValue);
    try {
      const container = document.getElementById(readerElementId);
      const videoElem = container?.querySelector('video') as HTMLVideoElement | null;
      
      if (videoElem) {
        // CSS transform fallback ensures smooth zoom on all mobile browsers
        videoElem.style.transform = `scale(${zoomValue})`;
        videoElem.style.transformOrigin = 'center center';
        videoElem.style.transition = 'transform 0.15s ease-out';

        // Try hardware native zoom if supported by track
        if (videoElem.srcObject) {
          const stream = videoElem.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          if (track && track.getCapabilities) {
            const capabilities: any = track.getCapabilities();
            if (capabilities && capabilities.zoom) {
              const minZ = capabilities.zoom.min || 1;
              const maxZ = capabilities.zoom.max || 5;
              const clamped = Math.min(Math.max(zoomValue, minZ), maxZ);
              await track.applyConstraints({
                advanced: [{ zoom: clamped } as any],
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Hardware zoom error, using CSS zoom fallback:', e);
    }
  }, []);

  // Web Audio API Synthesizer (instant feedback chime)
  const playAudioFeedback = useCallback((type: 'success' | 'error' | 'warning') => {
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
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (_) {}
  }, [isSoundEnabled]);

  // Discover and list cameras
  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('0')
        );
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
    } catch (e) {
      console.warn('Unable to enumerate cameras:', e);
    }
  };

  const stopCamera = async () => {
    isStartingRef.current = false;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Camera stop warning:', err);
      } finally {
        scannerRef.current = null;
      }
    }

    const container = document.getElementById(readerElementId);
    if (container) container.innerHTML = '';

    if (isMountedRef.current) {
      setIsCameraActive(false);
    }
  };

  const startCamera = async (cameraIdToUse?: string) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);

    try {
      await stopCamera();

      const container = document.getElementById(readerElementId);
      if (!container) {
        isStartingRef.current = false;
        return;
      }
      container.innerHTML = '';

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const targetCamera = cameraIdToUse || selectedCameraId;
      const cameraConfig = targetCamera ? { deviceId: { exact: targetCamera } } : { facingMode: 'environment' };

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.72);
          return { width: Math.max(180, size), height: Math.max(180, size) };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          // Process continuous scan without pausing or closing camera
          handleContinuousScan(decodedText);
        },
        () => {
          // Ignore non-QR frame ticks
        }
      );

      if (isMountedRef.current) {
        setIsCameraActive(true);
        // Reapply current zoom level to newly mounted stream
        setTimeout(() => {
          applyZoom(zoomLevel);
        }, 300);
      }
    } catch (err: any) {
      console.error('Camera startup error:', err);
      if (isMountedRef.current) {
        const isInsecure = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isInsecure) {
          setCameraError(
            'Camera access requires HTTPS or localhost. To test over local IP on phone, enable Chrome flag: chrome://flags/#unsafely-treat-insecure-origin-as-secure'
          );
        } else {
          setCameraError(
            err?.message || 'Camera permission denied or camera not accessible.'
          );
        }
        setIsCameraActive(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    discoverCameras();

    const timer = setTimeout(() => {
      startCamera();
    }, 150);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

  const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    if (isCameraActive) {
      await startCamera(newId);
    }
  };

  // ⚡ 100% Continuous High-Speed Multi-User Scanner
  const handleContinuousScan = async (payloadToken: string) => {
    const cleanToken = payloadToken.trim();
    if (!cleanToken) return;

    // In-flight concurrency lock (never send multiple API calls concurrently)
    if (isScanningLockedRef.current) {
      return;
    }

    // Cooldown per badge: ignore the exact same QR token within 2.5 seconds
    const now = Date.now();
    const lastScannedTime = lastScannedBadgeMapRef.current.get(cleanToken) || 0;
    if (now - lastScannedTime < 2500) {
      return;
    }

    // Lock scan and record scan time
    isScanningLockedRef.current = true;
    lastScannedBadgeMapRef.current.set(cleanToken, now);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60]);
      }

      const res = await api.scanQrPayload({
        qrCodeToken: cleanToken,
        sessionId: activeSessionId,
      });

      playAudioFeedback('success');

      const newRecord: ScannedRecord = {
        id: res.user?.id || String(now),
        name: res.user?.name || 'Member',
        rollNumber: res.user?.rollNumber || '',
        status: res.status === 'late' ? 'Late Arrival' : 'Present',
        time: new Date(res.record?.scannedAt || now).toLocaleTimeString(),
        sessionTitle: res.session?.title || 'Live Session',
      };

      // Add to live scanned session feed
      setRecentScans((prev) => [newRecord, ...prev.slice(0, 14)]);

      // Display non-blocking floating glassmorphism banner over camera
      setActivePopup({
        type: 'success',
        title: res.user?.name || 'Attendance Verified!',
        message: `${res.user?.rollNumber} • ${newRecord.status}`,
        subText: res.session?.title,
        status: res.status,
      });

      toast.success(`⚡ Checked in: ${res.user?.name} (${res.user?.rollNumber})`);
      if (onScanSuccess) onScanSuccess(res);
    } catch (error: any) {
      playAudioFeedback('error');
      const msg = error.message || 'Failed to record attendance';

      setActivePopup({
        type: 'error',
        title: 'Check-in Denied',
        message: msg,
      });

      toast.error(msg);
    } finally {
      // Release lock quickly (after 800ms) so the NEXT student can be scanned immediately!
      setTimeout(() => {
        isScanningLockedRef.current = false;
      }, 800);

      // Auto-hide popup after 1.8s
      setTimeout(() => {
        setActivePopup((cur) => (cur?.message === activePopup?.message ? null : cur));
      }, 1800);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header with Camera Switcher and Sound Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-zinc-800 text-white shrink-0 shadow-sm border border-transparent dark:border-zinc-700">
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
              <span>Continuous QR Scanner</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <Zap className="w-3 h-3" /> Auto-Scan Active
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400">Point at attendee QR codes in rapid succession</p>
          </div>
        </div>

        {/* Mobile-Optimized Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
            title={isSoundEnabled ? 'Mute Audio Chime' : 'Enable Audio Chime'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Camera Selector Dropdown */}
          {cameras.length > 1 && (
            <div className="relative flex-1 sm:flex-initial max-w-[170px] sm:max-w-[200px]">
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-medium focus:outline-none shadow-xs truncate"
              >
                {cameras.map((cam, i) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
              <SwitchCamera className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500 pointer-events-none" />
            </div>
          )}

          {/* Start/Stop Camera Button */}
          <button
            onClick={isCameraActive ? stopCamera : () => startCamera()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
              isCameraActive
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                : 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800'
            }`}
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
        </div>
      </div>

      {/* Viewfinder with Live Floating Popup & Zoom Support */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-950 min-h-[260px] sm:min-h-[320px] max-h-[340px] flex items-center justify-center shadow-inner">
        {/* Html5Qrcode video container with CSS overrides for default library clutter */}
        <div
          id={readerElementId}
          className="w-full h-full [&_video]:max-h-[340px] [&_video]:w-full [&_video]:object-cover overflow-hidden [&_input[type=range]]:!hidden [&_.zoom-range-selector]:!hidden [&_select]:!hidden [&_span]:!hidden [&_button]:!hidden [&_img]:!hidden"
        />

        {/* Viewfinder Target Guide Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-white/60 dark:border-zinc-400/60 rounded-2xl relative animate-pulse flex items-center justify-center">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
              <span className="text-[10px] text-white/80 font-mono uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                Continuous Scan
              </span>
            </div>
          </div>
        )}

        {/* Instant Non-Blocking Floating Success / Error Popup */}
        {activePopup && (
          <div className="absolute inset-x-3 top-3 sm:inset-x-4 sm:top-4 z-20 transition-all duration-300 animate-in fade-in slide-in-from-top-3 pointer-events-none">
            <div
              className={`p-3 sm:p-3.5 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-3 text-xs ${
                activePopup.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
                  : activePopup.type === 'warning'
                  ? 'bg-amber-950/95 border-amber-500/50 text-amber-100'
                  : 'bg-rose-950/95 border-rose-500/50 text-rose-100'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  activePopup.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : activePopup.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {activePopup.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm truncate">{activePopup.title}</div>
                <div className="opacity-90 font-mono text-[10px] sm:text-[11px] truncate">{activePopup.message}</div>
                {activePopup.subText && <div className="text-[10px] opacity-75 mt-0.5 truncate">{activePopup.subText}</div>}
              </div>
              {activePopup.status && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                    activePopup.status === 'late' ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {activePopup.status}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Paused / Error Overlay */}
        {!isCameraActive && (
          <div className="absolute inset-0 bg-slate-900/90 dark:bg-zinc-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
            {cameraError ? (
              <>
                <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium text-slate-200 max-w-xs">{cameraError}</div>
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-100 text-slate-900 dark:text-zinc-900 font-semibold text-xs shadow-sm hover:bg-slate-100 transition-colors"
                >
                  Retry Camera
                </button>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-slate-800 dark:bg-zinc-800 text-slate-300 dark:text-zinc-300 border border-slate-700 dark:border-zinc-700">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-300 dark:text-zinc-400">Camera is paused</div>
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 text-white dark:text-zinc-900 font-semibold text-xs shadow-sm"
                >
                  Start Camera
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 🔍 Sleek Custom Camera Zoom Controller (1x, 1.5x, 2x, 3x + Slider) */}
      {isCameraActive && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => applyZoom(parseFloat(e.target.value))}
              className="flex-1 sm:w-36 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
              aria-label="Camera Zoom"
            />
            <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-[11px] min-w-[32px] text-right">
              {zoomLevel.toFixed(1)}x
            </span>
          </div>

          {/* Quick Zoom Presets */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {[1.0, 1.5, 2.0, 2.5].map((preset) => (
              <button
                key={preset}
                onClick={() => applyZoom(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                  Math.abs(zoomLevel - preset) < 0.05
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                }`}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 font-medium text-center">
        <ScanLine className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse shrink-0" />
        <span>Continuous scanning active • Point at consecutive badges with 0 delay</span>
      </div>

      {/* Live Scan Queue (Shows up to 15 recent attendees checked in) */}
      {recentScans.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Scanned in This Session</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              ⚡ {recentScans.length} Checked In
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {recentScans.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 text-xs animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono truncate">{item.rollNumber}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      item.status === 'Late Arrival'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {item.status}
                  </span>
                  <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
