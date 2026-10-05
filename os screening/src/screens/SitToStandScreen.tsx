import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreening } from '../context/ScreeningContext';
import { useApp } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { api } from '../api/client';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface ChairStandMetrics {
  reps: number;
  belowAverage: boolean;
  cutoff: number;
  avgRiseSec: number | null;
  peakExtensionDeg: number | null;
  swayIndex: number | null;
  asymmetryDeg: number | null;
  reliability: number;
  motionScore: number;
  age: number;
  sex: string;
}

export default function SitToStandScreen() {
  const navigate = useNavigate();
  const { currentPatient, language } = useApp();
  const { session, updateSTS } = useScreening();
  const isAssamese = language === 'অসমীয়া';

  // Manual vs Camera toggle
  const [entryMode, setEntryMode] = useState<'camera' | 'manual'>('camera');
  const [manualReps, setManualReps] = useState(session?.stsData?.reps || 8);

  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // App & Model State
  const [modelReady, setModelReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Loading MediaPipe Pose Model...');
  const [trackingStatus, setTrackingStatus] = useState<'OK' | 'LOST' | 'INITIALIZING'>('INITIALIZING');
  const [lightingStatus, setLightingStatus] = useState<string>('Checking...');
  const [stateName, setStateName] = useState<string>('idle');
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Live HUD metrics
  const [timeLeft, setTimeLeft] = useState<number>(30.0);
  const [repsCount, setRepsCount] = useState<number>(0);
  const [liveAngle, setLiveAngle] = useState<number | null>(null);

  // Final Output
  const [completedMetrics, setCompletedMetrics] = useState<ChairStandMetrics | null>(null);
  const [whyNotes, setWhyNotes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Internal Logic Refs
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const DURATION = 30;
  const COUNTDOWN = 3;
  const STAND_THR = 152;
  const MIN_REP_GAP = 0.7;

  const envRef = useRef({ lo: 0, hi: 255, g: 1 });
  const lutRef = useRef(new Uint8Array(256).map((_, i) => i));
  const lightInfoRef = useRef({ mean: 128, contrast: 128 });
  const bufRef = useRef<number[]>([]);
  const emaRef = useRef<number | null>(null);
  const lostSinceRef = useRef<number | null>(null);
  const calRef = useRef<number[]>([]);
  const cdEndRef = useRef<number>(0);
  const startTRef = useRef<number>(0);
  const sitThrRef = useRef<number>(115);
  const lastTRef = useRef<number>(-1);
  const frameRef = useRef<number>(0);
  const phaseRef = useRef<'idle' | 'countdown' | 'running' | 'done'>('idle');
  const posOKRef = useRef<boolean>(false);
  const RRef = useRef<{
    state: 'SIT' | 'RISING' | 'STAND' | 'SITTING';
    reps: number;
    repT: number[];
    rise: number[];
    ext: number[];
    sway: number[];
    asym: number[];
    riseStart: number;
    cur: number[];
    peak: number;
    total: number;
    valid: number;
    lastRep: number;
  }>({
    state: 'SIT',
    reps: 0,
    repT: [],
    rise: [],
    ext: [],
    sway: [],
    asym: [],
    riseStart: 0,
    cur: [],
    peak: 0,
    total: 0,
    valid: 0,
    lastRep: -9,
  });

  // Audio Beeper using Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beep = (freq = 880, dur = 0.08) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ac = audioCtxRef.current;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch {
      // audio disabled/blocked
    }
  };

  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const med = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    return s[s.length >> 1];
  };

  // 1. Initialize MediaPipe Vision
  useEffect(() => {
    let active = true;
    async function initModel() {
      try {
        const fs = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const lm = await PoseLandmarker.createFromOptions(fs, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        if (active) {
          landmarkerRef.current = lm;
          setModelReady(true);
          setStatusMsg(isAssamese ? 'মডেল প্ৰস্তুত। কেমেৰা আৰম্ভ কৰক।' : 'Pose Model ready. Tap “Start Camera”.');
        }
      } catch (err: any) {
        if (active) {
          setStatusMsg('Model loading failed (check internet): ' + err.message);
        }
      }
    }
    initModel();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAssamese]);

  // 2. Start Camera
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setStatusMsg(
        isAssamese
          ? 'কুৰ্চিত পোন হৈ বহক, সম্পূৰ্ণ শৰীৰ ফ্ৰেমত ৰাখক, তাৰ পিছত আৰম্ভ কৰক।'
          : 'Sit on the chair with full body in frame, then tap Start Test.'
      );
      requestAnimationFrame(loop);
    } catch (e: any) {
      setStatusMsg('Camera error: ' + e.message);
    }
  };

  // 3. Adaptive Lighting Normalization
  function enhance(ctx: CanvasRenderingContext2D, W: number, H: number, video: HTMLVideoElement) {
    ctx.drawImage(video, 0, 0, W, H);
    const im = ctx.getImageData(0, 0, W, H);
    const d = im.data;
    if (frameRef.current % 6 === 0) {
      const hist = new Uint32Array(256);
      let sum = 0;
      let n = 0;
      for (let i = 0; i < d.length; i += 16) {
        const y = (d[i] * 54 + d[i + 1] * 183 + d[i + 2] * 19) >> 8;
        hist[y]++;
        sum += y;
        n++;
      }
      const mean = sum / n;
      let c = 0;
      let p2 = -1;
      let p98 = -1;
      for (let i = 0; i < 256; i++) {
        c += hist[i];
        if (p2 < 0 && c >= n * 0.02) p2 = i;
        if (p98 < 0 && c >= n * 0.98) p98 = i;
      }
      const lo = p2;
      const hi = Math.max(p98, lo + 50);
      const mn = clamp((mean - lo) / (hi - lo), 0.08, 0.92);
      const g = clamp(Math.log(0.45) / Math.log(mn), 0.5, 1.7);
      const k = frameRef.current === 0 ? 1 : 0.2;
      envRef.current.lo += k * (lo - envRef.current.lo);
      envRef.current.hi += k * (hi - envRef.current.hi);
      envRef.current.g += k * (g - envRef.current.g);

      for (let x = 0; x < 256; x++) {
        lutRef.current[x] = 255 * Math.pow(clamp((x - envRef.current.lo) / (envRef.current.hi - envRef.current.lo), 0, 1), envRef.current.g);
      }
      lightInfoRef.current = { mean, contrast: p98 - p2 };

      if (mean < 45) setLightingStatus(isAssamese ? 'পোহৰ কম' : 'Lighting: Low');
      else if (lightInfoRef.current.contrast < 55) setLightingStatus(isAssamese ? 'নিম্ন কন্ট্ৰাষ্ট' : 'Low Contrast');
      else if (mean > 205) setLightingStatus(isAssamese ? 'অত্যাধিক পোহৰ' : 'Too Bright');
      else setLightingStatus(isAssamese ? 'পোহৰ ভাল' : 'Lighting: Good');
    }

    for (let i = 0; i < d.length; i += 4) {
      d[i] = lutRef.current[d[i]];
      d[i + 1] = lutRef.current[d[i + 1]];
      d[i + 2] = lutRef.current[d[i + 2]];
    }
    ctx.putImageData(im, 0, 0);
  }

  // 4. 3D Metric World Geometry Angle
  function ang(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, c: { x: number; y: number; z: number }) {
    const u = [a.x - b.x, a.y - b.y, a.z - b.z];
    const v = [c.x - b.x, c.y - b.y, c.z - b.z];
    const m = Math.hypot(...u) * Math.hypot(...v);
    if (!m) return null;
    return Math.acos(clamp((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / m, -1, 1)) * (180 / Math.PI);
  }

  function measure(res: any, W: number, H: number) {
    const L = res.landmarks[0];
    const Wd = res.worldLandmarks[0];
    const o: Record<string, { v: number; a: number | null }> = {};
    for (const [s, h, k, aIdx] of [
      ['l', 23, 25, 27],
      ['r', 24, 26, 28],
    ] as const) {
      o[s] = {
        v: Math.min(L[h].visibility, L[k].visibility, L[aIdx].visibility),
        a: ang(Wd[h], Wd[k], Wd[aIdx]),
      };
    }
    const use = ['l', 'r'].filter((s) => o[s].v >= 0.5 && o[s].a != null);
    if (!use.length) return null;
    const sw = use.reduce((t, s) => t + o[s].v, 0);
    const angle = use.reduce((t, s) => t + (o[s].a as number) * o[s].v, 0) / sw;
    const asym = o.l.v >= 0.6 && o.r.v >= 0.6 && o.l.a !== null && o.r.a !== null ? Math.abs(o.l.a - o.r.a) : null;
    let lean = null;
    if (L[11].visibility > 0.4 && L[12].visibility > 0.4 && L[23].visibility > 0.4 && L[24].visibility > 0.4) {
      const sx = (L[11].x + L[12].x) / 2;
      const sy = (L[11].y + L[12].y) / 2;
      const hx = (L[23].x + L[24].x) / 2;
      const hy = (L[23].y + L[24].y) / 2;
      const tl = Math.hypot((sx - hx) * W, (sy - hy) * H) || 1;
      lean = ((sx - hx) * W) / tl;
    }
    return { angle, asym, lean };
  }

  function smooth(a: number) {
    bufRef.current.push(a);
    if (bufRef.current.length > 3) bufRef.current.shift();
    const m = [...bufRef.current].sort((x, y) => x - y)[bufRef.current.length >> 1];
    emaRef.current = emaRef.current == null ? m : emaRef.current + 0.55 * (m - emaRef.current);
    return emaRef.current;
  }

  function skeleton(ctx: CanvasRenderingContext2D, L: any[], W: number, H: number) {
    const P = [
      [11, 12],
      [11, 23],
      [12, 24],
      [23, 24],
      [23, 25],
      [25, 27],
      [24, 26],
      [26, 28],
      [27, 31],
      [28, 32],
      [11, 13],
      [13, 15],
      [12, 14],
      [14, 16],
    ];
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(63, 93, 76, 0.9)';
    for (const [a, b] of P) {
      if (L[a].visibility > 0.4 && L[b].visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(L[a].x * W, L[a].y * H);
        ctx.lineTo(L[b].x * W, L[b].y * H);
        ctx.stroke();
      }
    }
    for (const i of [23, 24, 25, 26, 27, 28]) {
      if (L[i].visibility > 0.4) {
        ctx.fillStyle = [25, 26].includes(i) ? '#a85c3f' : '#284536';
        ctx.beginPath();
        ctx.arc(L[i].x * W, L[i].y * H, 5, 0, 7);
        ctx.fill();
      }
    }
  }

  // 5. Finite State Machine (FSM)
  function fsm(t: number, a: number, m: { asym: number | null; lean: number | null }) {
    const r = RRef.current;
    if (m.asym != null) r.asym.push(m.asym);
    switch (r.state) {
      case 'SIT':
        if (a > sitThrRef.current) {
          r.state = 'RISING';
          r.riseStart = t;
          r.cur = [];
        }
        break;
      case 'RISING':
        if (m.lean != null) r.cur.push(m.lean);
        if (a >= STAND_THR) {
          r.state = 'STAND';
          r.peak = a;
          if (t - r.lastRep >= MIN_REP_GAP) {
            r.reps++;
            r.repT.push(+(t - startTRef.current).toFixed(2));
            r.rise.push(t - r.riseStart);
            r.lastRep = t;
            beep(880, 0.1);
            if (r.cur.length > 2) r.sway.push(Math.max(...r.cur) - Math.min(...r.cur));
            setRepsCount(r.reps);
          }
        } else if (a < sitThrRef.current) {
          r.state = 'SIT';
        }
        break;
      case 'STAND':
        r.peak = Math.max(r.peak, a);
        if (a < STAND_THR - 12) {
          r.ext.push(r.peak);
          r.state = 'SITTING';
        }
        break;
      case 'SITTING':
        if (a <= sitThrRef.current) r.state = 'SIT';
        else if (a >= STAND_THR) r.state = 'STAND';
        break;
    }
    setStateName(r.state.toLowerCase());
  }

  // 6. Main Detection Animation Loop
  function loop() {
    animFrameRef.current = requestAnimationFrame(loop);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current;
    if (!lm || !video || !canvas || video.readyState < 2 || video.currentTime === lastTRef.current) return;

    lastTRef.current = video.currentTime;
    const t = performance.now() / 1000;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const W = 480;
    const H = Math.round((W * video.videoHeight) / video.videoWidth) || 360;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    enhance(ctx, W, H, video);
    frameRef.current++;

    const res = lm.detectForVideo(canvas, performance.now());
    const has = res.landmarks && res.landmarks.length > 0;
    const m = has ? measure(res, W, H) : null;
    let a: number | null = null;

    if (m) {
      a = smooth(m.angle);
      lostSinceRef.current = null;
    } else {
      lostSinceRef.current = lostSinceRef.current || t;
      if (t - lostSinceRef.current > 1) {
        bufRef.current = [];
        emaRef.current = null;
      }
    }

    if (has) skeleton(ctx, res.landmarks[0], W, H);
    posOKRef.current = !!m;
    setTrackingStatus(m ? 'OK' : 'LOST');
    setLiveAngle(a != null ? Math.round(a) : null);

    // Countdown state
    if (phaseRef.current === 'countdown') {
      const left = cdEndRef.current - t;
      if (a != null) calRef.current.push(a);
      const n = Math.ceil(left);
      setCountdownText(String(n));

      if (left <= 0) {
        setCountdownText(null);
        if (calRef.current.length < 10 || med(calRef.current) > 135) {
          setStatusMsg(isAssamese ? 'ৰোগী বহা অৱস্থাত নাই। পুনৰ চেষ্টা কৰক।' : "Couldn't see you seated. Sit back and retry.");
          phaseRef.current = 'idle';
          return;
        }
        sitThrRef.current = clamp(med(calRef.current) + 22, 105, 130);
        RRef.current = {
          state: 'SIT',
          reps: 0,
          repT: [],
          rise: [],
          ext: [],
          sway: [],
          asym: [],
          riseStart: 0,
          cur: [],
          peak: 0,
          total: 0,
          valid: 0,
          lastRep: -9,
        };
        startTRef.current = t;
        phaseRef.current = 'running';
        beep(1200, 0.25);
        setStatusMsg(isAssamese ? 'আৰম্ভ হ’ল! সম্পূৰ্ণ উঠক আৰু বহক।' : 'GO! Stand fully, sit fully, arms crossed on chest.');
      }
    } else if (phaseRef.current === 'running') {
      const el = t - startTRef.current;
      setTimeLeft(Math.max(0, DURATION - el));
      RRef.current.total++;
      if (m && a != null) {
        RRef.current.valid++;
        fsm(t, a, m);
      }
      if (el >= DURATION) {
        finish(a);
      }
    }
  }

  // 7. Finish Test & Calculate Biomechanical Metrics
  function finish(a: number | null) {
    phaseRef.current = 'done';
    beep(1200, 0.4);

    const R = RRef.current;
    if (R.state === 'RISING' && a != null && a > (sitThrRef.current + STAND_THR) / 2) {
      R.reps++;
      R.repT.push(DURATION);
      setRepsCount(R.reps);
    }

    const age = currentPatient?.age || 58;
    const sex = currentPatient?.sex === 'male' ? 'm' : 'f';

    const bands = [
      [60, 64, 14, 12],
      [65, 69, 12, 11],
      [70, 74, 12, 10],
      [75, 79, 11, 10],
      [80, 84, 10, 9],
      [85, 89, 8, 8],
      [90, 200, 7, 4],
    ];
    const b = bands.find((x) => age <= x[1]) || bands[0];
    const cutoff = sex === 'm' ? b[2] : b[3];
    const avgRise = avg(R.rise);
    const sway = avg(R.sway);
    const asym = avg(R.asym);
    const ext = avg(R.ext);
    const rel = R.total ? R.valid / R.total : 0;

    const sc = {
      reps: clamp(R.reps / (cutoff + 4), 0, 1) * 100,
      rise: avgRise == null ? 0 : clamp((2.5 - avgRise) / 1.3, 0, 1) * 100,
      sway: sway == null ? null : clamp((0.35 - sway) / 0.25, 0, 1) * 100,
      asym: asym == null ? null : clamp((25 - asym) / 17, 0, 1) * 100,
    };

    const wts = { reps: 0.7, rise: 0.15, sway: 0.1, asym: 0.05 };
    let tot = 0;
    let ws = 0;
    for (const k in wts) {
      const key = k as keyof typeof sc;
      if (sc[key] != null) {
        tot += (sc[key] as number) * wts[key];
        ws += wts[key];
      }
    }

    const score = Math.round(tot / ws);
    const below = R.reps < cutoff;

    const notes = [
      `${R.reps} reps vs age/sex baseline ${cutoff} (CDC STEADI) → ${below ? 'Below standard (knee power deficit)' : 'Within normal age range'}`,
      avgRise != null ? `Average rise velocity: ${avgRise.toFixed(2)}s per stand` : 'No complete stand detected',
      asym != null ? `Bilateral joint asymmetry: ${asym.toFixed(1)}° delta` : 'Asymmetry within normal single-view bounds',
      `Tracking confidence: ${(rel * 100).toFixed(0)}%`,
    ];

    setCompletedMetrics({
      reps: R.reps,
      belowAverage: below,
      cutoff,
      avgRiseSec: avgRise ? +avgRise.toFixed(2) : null,
      peakExtensionDeg: ext ? +ext.toFixed(1) : null,
      swayIndex: sway ? +sway.toFixed(3) : null,
      asymmetryDeg: asym ? +asym.toFixed(1) : null,
      reliability: +rel.toFixed(2),
      motionScore: score,
      age,
      sex,
    });
    setWhyNotes(notes);
    setStatusMsg(isAssamese ? 'পৰীক্ষা সম্পূৰ্ণ হ’ল!' : 'Test complete! Biomechanical metrics calculated.');
  }

  const handleStartTest = () => {
    if (!posOKRef.current) {
      setStatusMsg(isAssamese ? 'আঁঠু আৰু ভৰি স্পষ্টকৈ দেখা নাই। কেমেৰা মিলাওক।' : "Cannot see knees and ankles clearly. Adjust camera distance.");
      return;
    }
    phaseRef.current = 'countdown';
    cdEndRef.current = performance.now() / 1000 + COUNTDOWN;
    calRef.current = [];
    bufRef.current = [];
    emaRef.current = null;
    setRepsCount(0);
    setTimeLeft(30.0);
    setStatusMsg(isAssamese ? 'কুৰ্চিত বহি থাকক, হাত দুখন বুকুত...' : 'Stay seated, arms crossed on chest…');
  };

  const handleSaveAndReturn = async () => {
    setSaving(true);
    const reps = entryMode === 'camera' ? (completedMetrics?.reps || repsCount) : manualReps;
    const quality = completedMetrics && completedMetrics.reliability >= 0.75 ? 'HIGH' : 'MEDIUM';

    updateSTS(
      {
        reps,
        durationSeconds: 30,
        cameraTracked: entryMode === 'camera',
        trackingQuality: quality,
        entryMethod: entryMode,
      },
      'complete'
    );

    if (currentPatient?.id) {
      try {
        await api.updateScreening(currentPatient.id, {
          sts_reps: reps,
          sts_duration_s: 30,
          sts_quality: quality,
          sts_entry_method: entryMode,
        });
      } catch {
        // fallback
      }
    }

    setSaving(false);
    navigate('/patient-hub');
  };

  return (
    <div className="bg-surface text-on-surface font-sans flex flex-col min-h-screen">
      <AppHeader showBack title={isAssamese ? '৩০-ছেকেণ্ড উঠা-বহা পৰীক্ষা' : '30-Second Chair Stand Test'} />

      <main className="flex flex-col w-full pt-16 pb-28 px-margin space-y-3 max-w-md mx-auto">
        
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-surface-container-high p-1.5 rounded-2xl">
          <button
            onClick={() => setEntryMode('camera')}
            className={`py-2 rounded-xl text-label-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'camera' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>{isAssamese ? 'কেমেৰা এআই' : 'Camera AI'}</span>
          </button>
          <button
            onClick={() => setEntryMode('manual')}
            className={`py-2 rounded-xl text-label-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'manual' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>{isAssamese ? 'মেনুৱেল এন্ট্ৰী' : 'Manual Entry'}</span>
          </button>
        </div>

        {/* ─── CAMERA AI MODE ──────────────────────────────────────────────── */}
        {entryMode === 'camera' && (
          <div className="space-y-3">
            {/* Video Stage & Live Canvas HUD */}
            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-card-2">
              <video ref={videoRef} playsInline muted className="hidden" />
              <canvas ref={canvasRef} className="w-full h-full object-cover scale-x-[-1]" />

              {/* HUD Overlays */}
              <div className="absolute top-2 left-2 right-2 flex justify-between gap-1.5 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md rounded-xl px-2.5 py-1 text-center text-white">
                  <span className="font-headline-md font-mono text-xl block leading-none">{timeLeft.toFixed(1)}</span>
                  <span className="text-[9px] text-primary-fixed uppercase font-bold">SEC LEFT</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md rounded-xl px-3 py-1 text-center text-white">
                  <span className="font-headline-md font-mono text-2xl block leading-none text-primary-fixed">{repsCount}</span>
                  <span className="text-[9px] text-white/80 uppercase font-bold">REPS</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md rounded-xl px-2.5 py-1 text-center text-white">
                  <span className="font-headline-md font-mono text-xl block leading-none">{liveAngle ? `${liveAngle}°` : '--'}</span>
                  <span className="text-[9px] text-white/80 uppercase font-bold">KNEE ANGLE</span>
                </div>
              </div>

              {/* Countdown Big Display */}
              {countdownText && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <span className="text-white text-8xl font-bold font-mono animate-ping">{countdownText}</span>
                </div>
              )}
            </div>

            {/* Diagnostic Pills */}
            <div className="flex items-center justify-between text-xs font-bold gap-1 px-1">
              <span className={`px-2.5 py-1 rounded-full ${
                lightingStatus.includes('Good') || lightingStatus.includes('ভাল') ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'
              }`}>
                {lightingStatus}
              </span>
              <span className={`px-2.5 py-1 rounded-full ${
                trackingStatus === 'OK' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-container text-on-secondary-container'
              }`}>
                Tracking: {trackingStatus}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface uppercase">
                State: {stateName}
              </span>
            </div>

            {/* Message Strip */}
            <div className="bg-surface-container-low p-2.5 rounded-xl text-center text-body-sm text-on-surface font-semibold border border-outline-variant/30">
              {statusMsg}
            </div>

            {/* Camera Control Actions */}
            <div className="grid grid-cols-2 gap-2">
              {!cameraActive ? (
                <button
                  onClick={handleStartCamera}
                  disabled={!modelReady}
                  className="btn-primary col-span-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                  <span>{isAssamese ? '১. কেমেৰা আৰম্ভ কৰক' : '1. Start Camera'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStartTest}
                    disabled={phaseRef.current === 'running' || phaseRef.current === 'countdown'}
                    className="btn-primary"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    <span>{isAssamese ? '২. পৰীক্ষা আৰম্ভ কৰক' : '2. Start Test (30s)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      phaseRef.current = 'idle';
                      setRepsCount(0);
                      setTimeLeft(30.0);
                      setCompletedMetrics(null);
                    }}
                    className="btn-outline"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    <span>Reset</span>
                  </button>
                </>
              )}
            </div>

            {/* Completed Biomechanical Metrics Card */}
            {completedMetrics && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border-2 border-primary space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {isAssamese ? 'বায়োমেকানিক্স ফলাফল' : 'Biomechanical Metrics'}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs">
                    {completedMetrics.motionScore}/100 Score
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-container-low p-2 rounded-xl">
                    <span className="text-2xl font-bold font-mono text-primary block">{completedMetrics.reps}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold">Reps</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-xl">
                    <span className="text-xl font-bold font-mono text-on-surface block">{completedMetrics.avgRiseSec || '--'}s</span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold">Avg Rise</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-xl">
                    <span className="text-xl font-bold font-mono text-secondary block">{completedMetrics.asymmetryDeg ? `${completedMetrics.asymmetryDeg}°` : '--'}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold">Asymmetry</span>
                  </div>
                </div>

                <ul className="space-y-1 text-body-sm text-on-surface-variant text-xs list-disc list-inside">
                  {whyNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ─── MANUAL FALLBACK ENTRY ───────────────────────────────────────── */}
        {entryMode === 'manual' && (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card-1 border border-outline-variant/30 space-y-4">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              {isAssamese ? 'মেনুৱেল গণনা এন্ট্ৰী' : 'Manual Counter Entry'}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {isAssamese
                ? 'যদি কেমেৰা অনুপলব্ধ থাকে, ৩০ ছেকেণ্ডৰ ষ্টপৱাচ ব্যৱহাৰ কৰি ৰোগীয়ে কেইবাৰ উঠিব-বহিব পাৰিলে গণনা কৰক।'
                : 'Count chair rises manually using a physical stopwatch if camera vision is not feasible.'}
            </p>

            <div className="flex items-center justify-between bg-surface-container p-4 rounded-2xl">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                {isAssamese ? 'সম্পূৰ্ণ উঠা-বহা সংখ্যা:' : 'Total 30s Repetitions:'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setManualReps((r) => Math.max(0, r - 1))}
                  className="w-11 h-11 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-2xl active:scale-95"
                >
                  −
                </button>
                <span className="text-3xl font-bold font-mono text-primary w-10 text-center">{manualReps}</span>
                <button
                  type="button"
                  onClick={() => setManualReps((r) => r + 1)}
                  className="w-11 h-11 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-2xl active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-on-surface-variant text-center pt-1 leading-snug">
          Setup: Place phone 2–3m away at hip height, full body visible, arms crossed over chest.
        </p>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 w-full bg-surface/95 backdrop-blur-xl border-t border-outline-variant px-margin py-3 pb-safe z-40 max-w-md mx-auto left-0 right-0">
        <button
          onClick={handleSaveAndReturn}
          disabled={saving}
          className="btn-primary flex items-center justify-between"
          type="button"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{saving ? 'Saving...' : isAssamese ? 'ফলাফল সংৰক্ষণ কৰক' : 'Save Mobility Results & Return'}</span>
          </div>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
