'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  QrCode,
  CheckCircle2,
  Camera,
  RefreshCw,
  UserCheck,
  KeyRound,
  VideoOff,
  Video,
  AlertCircle,
  ScanLine,
} from 'lucide-react';

interface QRScannerModalProps {
  activeSessionId?: string;
  onScanSuccess?: (data: any) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ activeSessionId, onScanSuccess }) => {
  const { user } = useAuth();
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualRoll, setManualRoll] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(true);
  const readerElementId = 'qr-camera-viewport';

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

    // Forcefully remove any lingering video/canvas elements from the DOM container
    const container = document.getElementById(readerElementId);
    if (container) {
      container.innerHTML = '';
    }

    if (isMountedRef.current) {
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);

    try {
      // 1. Cleanly stop and wipe any existing camera instance or DOM elements
      await stopCamera();

      // 2. Ensure container exists and is completely empty
      const container = document.getElementById(readerElementId);
      if (!container) {
        isStartingRef.current = false;
        return;
      }
      container.innerHTML = '';

      // 3. Instantiate fresh Html5Qrcode instance
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScanPayload(decodedText);
          stopCamera();
        },
        () => {
          // Frame parse error ignored
        }
      );

      if (isMountedRef.current) {
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera startup error:', err);
      if (isMountedRef.current) {
        setCameraError(
          err?.message || 'Camera permission denied or camera not accessible.'
        );
        setIsCameraActive(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Clean start when tab is camera
    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [activeTab]);

  const handleScanPayload = async (payloadToken: string, overrideRoll?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      const res = await api.scanQrPayload({
        qrCodeToken: payloadToken || undefined,
        memberRollNumber: overrideRoll || undefined,
        sessionId: activeSessionId,
      });

      setScannedResult(res);
      toast.success(res.message || 'Attendance verified!');
      if (onScanSuccess) onScanSuccess(res);
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === 'admin' && manualRoll && activeSessionId) {
      handleScanPayload('', manualRoll);
    } else if (manualToken) {
      handleScanPayload(manualToken);
    } else {
      toast.error('Please enter a valid QR token or Roll Number');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-zinc-800 text-white border border-transparent dark:border-zinc-700">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Attendance QR Scanner</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Scan Session QR Code or Enter Roll Number</p>
          </div>
        </div>

        {/* Camera Toggle Button */}
        {activeTab === 'camera' && (
          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isCameraActive
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                : 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200'
            }`}
          >
            {isCameraActive ? (
              <>
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 mb-5">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'camera'
              ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Camera Scanner
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" /> Enter Code Manually
        </button>
      </div>

      {/* Single Camera Viewport */}
      {activeTab === 'camera' && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-950 min-h-[300px] max-h-[340px] flex items-center justify-center">
            {/* The single viewport element where html5-qrcode attaches */}
            <div id={readerElementId} className="w-full h-full [&_video]:max-h-[340px] [&_video]:w-full [&_video]:object-cover overflow-hidden" />

            {/* If camera is not active or error occurred */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-900/90 dark:bg-zinc-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
                {cameraError ? (
                  <>
                    <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-medium text-slate-200 max-w-xs">{cameraError}</div>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-100 text-slate-900 dark:text-zinc-900 font-semibold text-xs shadow-sm hover:bg-slate-100"
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
                      onClick={startCamera}
                      className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs shadow-sm"
                    >
                      Start Camera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
            <ScanLine className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Position the session QR code inside the camera view</span>
          </div>
        </div>
      )}

      {/* Manual Entry View */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {user?.role === 'admin' && activeSessionId ? 'Member Roll Number' : 'Session QR Token Code'}
            </label>
            {user?.role === 'admin' && activeSessionId ? (
              <input
                type="text"
                placeholder="e.g. S24CSEU0771"
                value={manualRoll}
                onChange={(e) => setManualRoll(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-xs focus:border-slate-900 dark:focus:border-zinc-500 outline-none shadow-sm"
              />
            ) : (
              <input
                type="text"
                placeholder="e.g. DCC_SESSION_TOKEN_003_AIBOOTCAMP"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-xs focus:border-slate-900 dark:focus:border-zinc-500 outline-none shadow-sm"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            <span>Record Attendance</span>
          </button>
        </form>
      )}

      {/* Attendance Success Modal / Result Card */}
      {scannedResult && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">Attendance Recorded</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{scannedResult.session?.title}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 shadow-sm">
            <div>
              <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Member</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{scannedResult.user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Roll Number</span>
              <span className="font-mono text-slate-900 dark:text-zinc-100 font-medium">{scannedResult.user?.rollNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Status</span>
              <span className={`font-semibold ${scannedResult.status === 'late' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {scannedResult.status === 'late' ? 'Late Arrival' : 'Present (On-Time)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Time</span>
              <span className="font-mono text-slate-600 dark:text-zinc-400">
                {new Date(scannedResult.record?.scannedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setScannedResult(null);
                startCamera();
              }}
              className="flex-1 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold shadow-sm transition-colors"
            >
              Scan Next Member
            </button>
            <button
              onClick={() => setScannedResult(null)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold shadow-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
