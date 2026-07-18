"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Target = { x: number; y: number; rare: boolean };
type GameStatus = "ready" | "levels" | "playing" | "ended";
const LEVELS = [
  { id: "bootloader", name: "BOOTLOADER", korean: "부트로더", layer: "STARTUP", seconds: 30, baseSpeed: 1.35, goal: 12, icon: ">_" },
  { id: "kernel-core", name: "KERNEL CORE", korean: "커널 코어", layer: "KERNEL", seconds: 30, baseSpeed: 1.28, goal: 16, icon: "K" },
  { id: "device-drivers", name: "DEVICE DRIVERS", korean: "장치 드라이버", layer: "HARDWARE", seconds: 29, baseSpeed: 1.2, goal: 20, icon: "DRV" },
  { id: "cpu-scheduler", name: "CPU SCHEDULER", korean: "CPU 스케줄러", layer: "KERNEL", seconds: 28, baseSpeed: 1.13, goal: 24, icon: "⌁" },
  { id: "process-manager", name: "PROCESS MANAGER", korean: "프로세스 관리", layer: "RESOURCE", seconds: 27, baseSpeed: 1.07, goal: 28, icon: "⚙" },
  { id: "memory-manager", name: "MEMORY MANAGER", korean: "메모리 관리", layer: "RESOURCE", seconds: 26, baseSpeed: 1.01, goal: 32, icon: "RAM" },
  { id: "virtual-memory", name: "VIRTUAL MEMORY", korean: "가상 메모리", layer: "RESOURCE", seconds: 25, baseSpeed: 0.96, goal: 36, icon: "VM" },
  { id: "file-system", name: "FILE SYSTEM", korean: "파일 시스템", layer: "STORAGE", seconds: 24, baseSpeed: 0.91, goal: 40, icon: "/" },
  { id: "io-manager", name: "I/O MANAGER", korean: "입출력 관리", layer: "HARDWARE", seconds: 23, baseSpeed: 0.86, goal: 44, icon: "I/O" },
  { id: "network-stack", name: "NETWORK STACK", korean: "네트워크 스택", layer: "SERVICES", seconds: 22, baseSpeed: 0.81, goal: 48, icon: "NET" },
  { id: "security-layer", name: "SECURITY LAYER", korean: "보안 계층", layer: "PROTECTION", seconds: 21, baseSpeed: 0.77, goal: 52, icon: "#" },
  { id: "system-calls", name: "SYSTEM CALLS", korean: "시스템 호출", layer: "INTERFACE", seconds: 20, baseSpeed: 0.73, goal: 56, icon: "SYS" },
  { id: "service-manager", name: "SERVICE MANAGER", korean: "서비스 관리", layer: "SERVICES", seconds: 19, baseSpeed: 0.69, goal: 60, icon: "SVC" },
  { id: "shell", name: "SHELL", korean: "명령 셸", layer: "USER SPACE", seconds: 18, baseSpeed: 0.65, goal: 66, icon: "$" },
  { id: "user-space", name: "USER SPACE", korean: "사용자 공간", layer: "APPLICATION", seconds: 17, baseSpeed: 0.61, goal: 72, icon: "APP" },
] as const;
const PATH_X = ["18%", "55%", "29%", "62%", "24%"] as const;
const newTarget = (): Target => ({ x: 8 + Math.random() * 82, y: 14 + Math.random() * 72, rare: Math.random() < 0.18 });

export default function Home() {
  const [status, setStatus] = useState<GameStatus>("ready");
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [records, setRecords] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LEVELS[0].seconds);
  const [target, setTarget] = useState<Target>(() => newTarget());
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const targetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setBest(Number(window.localStorage.getItem("san-sao-best") || 0));
    const savedUnlocked = Math.min(Number(window.localStorage.getItem("oslab-unlocked") || 0), LEVELS.length - 1);
    setUnlockedLevel(savedUnlocked); setSelectedLevel(savedUnlocked);
    try { setRecords(JSON.parse(window.localStorage.getItem("oslab-records") || "[]")); } catch { setRecords([]); }
  }, []);
  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => setTimeLeft((current) => {
      if (current <= 1) { window.clearInterval(timer); setStatus("ended"); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [status]);
  useEffect(() => {
    if (status !== "ended") return;
    setBest((old) => { const next = Math.max(old, score); window.localStorage.setItem("san-sao-best", String(next)); return next; });
    setRecords((old) => { const next = [...old]; next[selectedLevel] = Math.max(next[selectedLevel] || 0, score); window.localStorage.setItem("oslab-records", JSON.stringify(next)); return next; });
    if (score >= LEVELS[selectedLevel].goal && selectedLevel < LEVELS.length - 1) {
      setUnlockedLevel((old) => { const next = Math.max(old, selectedLevel + 1); window.localStorage.setItem("oslab-unlocked", String(next)); return next; });
    }
  }, [score, status, selectedLevel]);

  const beginGame = useCallback((levelIndex = selectedLevel) => {
    setSelectedLevel(levelIndex);
    setScore(0); setCombo(0); setHits(0); setMisses(0); setLastGain(null);
    setTimeLeft(LEVELS[levelIndex].seconds); setTarget(newTarget()); setStatus("playing");
    window.setTimeout(() => targetRef.current?.focus(), 80);
  }, [selectedLevel]);

  const catchStar = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (status !== "playing") return;
    const multiplier = 1 + Math.floor(combo / 5);
    const gain = (target.rare ? 3 : 1) * multiplier;
    setScore((v) => v + gain); setHits((v) => v + 1); setCombo((v) => v + 1);
    setLastGain(gain); setTarget(newTarget());
    window.setTimeout(() => setLastGain(null), 360);
    window.setTimeout(() => targetRef.current?.focus(), 0);
  };
  const miss = () => { if (status === "playing") { setMisses((v) => v + 1); setCombo(0); } };
  const accuracy = hits + misses === 0 ? 100 : Math.round(hits / (hits + misses) * 100);
  const currentLevel = LEVELS[selectedLevel];
  const speed = Math.max(0.42, currentLevel.baseSpeed - score * 0.016);
  const passed = score >= currentLevel.goal;

  return (
    <main className="game-shell">
      <section className={"game-board " + (status === "playing" ? "is-playing" : "")} onClick={miss} aria-label="Khu vực chơi">
        <div className="grid" /><div className="corner-label corner-top">OS LAB // TARGET</div><div className="corner-label corner-bottom">HÃY NHẮM CHÍNH XÁC</div>
        {status === "playing" && <div className="game-hud" aria-live="polite">
          <div><span>점수</span><strong>{score.toString().padStart(2, "0")}</strong></div>
          <div><span>콤보</span><strong>×{combo}</strong></div>
          <div><span>시간</span><strong>{timeLeft}s</strong></div>
          <div className="hud-progress"><span style={{ width: ((timeLeft / currentLevel.seconds) * 100) + "%" }} /></div>
        </div>}
        {status === "levels" && <div className="game-overlay duo-level">
          <nav className="path-topbar">
            <button onClick={(e) => { e.stopPropagation(); setStatus("ready"); }} aria-label="Quay lại">‹</button>
            <div className="path-brand"><img src="/os-penguin.png" alt="" /><strong>OS LAB</strong></div>
            <div className="path-stats"><span title="Tiến trình kiến trúc">▰ <b>{Math.round(((unlockedLevel + 1) / LEVELS.length) * 100)}%</b></span><span title="Kỷ lục">◆ <b>{best}</b></span></div>
          </nav>
          <div className="path-scroll">
            <header className="mission-console">
              <div className="mission-index"><span>STACK</span><strong>OS</strong></div>
              <div className="mission-main">
                <div className="mission-kicker"><span>OS LAB / ARCHITECTURE BUILD</span><b><i /> ONLINE</b></div>
                <h2>OS COMPONENT MAP</h2><p>부트로더부터 사용자 공간까지, 운영체제를 하나씩 완성하세요.</p>
                <div className="mission-progress"><span style={{ width: ((unlockedLevel + 1) / LEVELS.length * 100) + "%" }} /></div>
              </div>
              <div className="mission-readout"><div><strong>{Math.round((records.filter((value, index) => value >= LEVELS[index]?.goal).length / LEVELS.length) * 100)}</strong><span>%</span></div><small>SYSTEM<br />BUILT</small></div>
            </header>
            <div className="lesson-path" style={{ height: (LEVELS.length * 138 + 170) + "px" }}>
              <div className="path-line" aria-hidden="true" />
              {LEVELS.map((level, index) => {
                const completed = (records[index] || 0) >= level.goal;
                const locked = index > unlockedLevel;
                const current = index === unlockedLevel;
                return <button key={level.id} disabled={locked} style={{ top: (index * 138 + 55) + "px", left: PATH_X[index % PATH_X.length] }} className={"lesson-node" + (completed ? " completed" : "") + (current ? " current" : "") + (locked ? " locked" : "")} onClick={(e) => { e.stopPropagation(); if (!locked) beginGame(index); }} aria-label={locked ? level.name + " bị khóa" : level.name + ", " + level.seconds + " giây"}>
                  {current && <span className="start-bubble">ACTIVATE</span>}
                  <span className="node-circle"><b>{locked ? "⌁" : completed ? "✓" : level.icon}</b></span>
                  <span className="node-copy"><strong>{level.name}</strong><small>{level.layer} · {level.korean} · {level.goal} XP</small></span>
                </button>;
              })}
              <img className="path-mascot" style={{ top: (unlockedLevel * 138 + 145) + "px" }} src="/os-penguin.png" alt="Chim cánh cụt OS Lab cổ vũ" />
            </div>
          </div>
        </div>}
        {status === "playing" && <>
          <button ref={targetRef} className={"star-target " + (target.rare ? "rare" : "")} style={{ left: target.x + "%", top: target.y + "%", animationDuration: speed + "s" }} onClick={catchStar} aria-label={target.rare ? "Bắt sao vàng, được 3 điểm" : "Bắt ngôi sao"}><span>{target.rare ? "★" : "✦"}</span></button>
          {lastGain !== null && <div className="gain-pop">+{lastGain}</div>}
        </>}
        {status === "ready" && <div className="game-overlay os-start">
          <img className="os-penguin-logo" src="/os-penguin.png" alt="Chim cánh cụt Linux dễ thương của OS Lab" />
          <p className="os-welcome">OS lab에 오는 걸 환영합니다.</p>
          <h2 className="os-ready">준비됐어?</h2>
          <button className="primary-button os-start-button" onClick={(e) => { e.stopPropagation(); setStatus("levels"); }}>시작하기</button>
        </div>}
        {status === "ended" && <div className="game-overlay results">
          <span className="overlay-icon">{passed ? "✓" : "!"}</span><p className="overlay-kicker">OS MODULE / {currentLevel.name}</p><h2>{passed ? "MODULE ONLINE" : "MODULE FAILED"}</h2>
          <div className="result-row"><div><strong>{score}</strong><span>ĐIỂM / {currentLevel.goal}</span></div><div><strong>{accuracy}%</strong><span>CHÍNH XÁC</span></div><div><strong>{hits}</strong><span>SAO BẮT ĐƯỢC</span></div></div>
          <button className="primary-button" onClick={(e) => { e.stopPropagation(); if (passed) { setSelectedLevel(Math.min(selectedLevel + 1, LEVELS.length - 1)); setStatus("levels"); } else { beginGame(selectedLevel); } }}>{passed ? "MODULE TIẾP THEO" : "THỬ LẠI"} <span>{passed ? "→" : "↻"}</span></button>
        </div>}
      </section>
    </main>
  );
}
