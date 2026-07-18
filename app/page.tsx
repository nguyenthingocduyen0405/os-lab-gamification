"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Target = { x: number; y: number; rare: boolean };
type GameStatus = "ready" | "levels" | "playing" | "ended";
const LEVELS = [
  { number: "01", name: "BOOT SEQUENCE", korean: "부팅 시작", seconds: 30, baseSpeed: 1.35, goal: 12, icon: ">_" },
  { number: "02", name: "FILE SYSTEM", korean: "파일 구조", seconds: 30, baseSpeed: 1.28, goal: 16, icon: "/" },
  { number: "03", name: "PROCESS RUSH", korean: "프로세스", seconds: 29, baseSpeed: 1.2, goal: 20, icon: "⚙" },
  { number: "04", name: "MEMORY MAP", korean: "메모리", seconds: 28, baseSpeed: 1.13, goal: 24, icon: "RAM" },
  { number: "05", name: "THREAD SYNC", korean: "스레드", seconds: 27, baseSpeed: 1.07, goal: 28, icon: "⇄" },
  { number: "06", name: "I/O STORM", korean: "입출력", seconds: 26, baseSpeed: 1.01, goal: 32, icon: "I/O" },
  { number: "07", name: "DEADLOCK", korean: "교착 상태", seconds: 25, baseSpeed: 0.96, goal: 36, icon: "×" },
  { number: "08", name: "SCHEDULER", korean: "스케줄러", seconds: 24, baseSpeed: 0.91, goal: 40, icon: "⌁" },
  { number: "09", name: "VIRTUAL MEMORY", korean: "가상 메모리", seconds: 23, baseSpeed: 0.86, goal: 44, icon: "VM" },
  { number: "10", name: "SYSTEM CALL", korean: "시스템 호출", seconds: 22, baseSpeed: 0.81, goal: 48, icon: "#" },
  { number: "11", name: "CACHE MISS", korean: "캐시", seconds: 21, baseSpeed: 0.77, goal: 52, icon: "L1" },
  { number: "12", name: "RACE CONDITION", korean: "경쟁 상태", seconds: 20, baseSpeed: 0.73, goal: 56, icon: "≋" },
  { number: "13", name: "ROOT ACCESS", korean: "루트 권한", seconds: 19, baseSpeed: 0.69, goal: 60, icon: "$" },
  { number: "14", name: "KERNEL PANIC", korean: "커널 패닉", seconds: 18, baseSpeed: 0.65, goal: 66, icon: "!" },
  { number: "15", name: "FINAL UPTIME", korean: "최종 가동", seconds: 17, baseSpeed: 0.61, goal: 72, icon: "∞" },
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
        <div className="grid" /><div className="corner-label corner-top">VÙNG SĂN // 01</div><div className="corner-label corner-bottom">HÃY NHẮM CHÍNH XÁC</div>
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
            <div className="path-stats"><span title="Tiến trình">▰ <b>{unlockedLevel + 1}/15</b></span><span title="Kỷ lục">◆ <b>{best}</b></span></div>
          </nav>
          <div className="path-scroll">
            <header className="unit-banner">
              <div><small>SECTION {Math.floor(unlockedLevel / 5) + 1} · 15 LEVEL PROTOCOL</small><h2>OS MISSION PATH</h2><p>Level 1부터 순서대로 시스템을 정복하세요.</p></div>
              <span>{records.filter((value, index) => value >= LEVELS[index]?.goal).length}/15 CLEAR</span>
            </header>
            <div className="lesson-path" style={{ height: (LEVELS.length * 138 + 170) + "px" }}>
              <div className="path-line" aria-hidden="true" />
              {LEVELS.map((level, index) => {
                const completed = (records[index] || 0) >= level.goal;
                const locked = index > unlockedLevel;
                const current = index === unlockedLevel;
                return <button key={level.number} disabled={locked} style={{ top: (index * 138 + 55) + "px", left: PATH_X[index % PATH_X.length] }} className={"lesson-node" + (completed ? " completed" : "") + (current ? " current" : "") + (locked ? " locked" : "")} onClick={(e) => { e.stopPropagation(); if (!locked) beginGame(index); }} aria-label={locked ? level.name + " bị khóa" : level.name + ", " + level.seconds + " giây"}>
                  {current && <span className="start-bubble">CURRENT</span>}
                  <span className="node-circle"><b>{locked ? "⌁" : completed ? "✓" : level.icon}</b></span>
                  <span className="node-copy"><strong>{level.name}</strong><small>LV.{level.number} · {level.seconds}s · {level.goal} XP</small></span>
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
          <span className="overlay-icon">{passed ? "✓" : "!"}</span><p className="overlay-kicker">LEVEL {currentLevel.number}</p><h2>{passed ? "MISSION COMPLETE" : "TRY AGAIN"}</h2>
          <div className="result-row"><div><strong>{score}</strong><span>ĐIỂM / {currentLevel.goal}</span></div><div><strong>{accuracy}%</strong><span>CHÍNH XÁC</span></div><div><strong>{hits}</strong><span>SAO BẮT ĐƯỢC</span></div></div>
          <button className="primary-button" onClick={(e) => { e.stopPropagation(); if (passed) { setSelectedLevel(Math.min(selectedLevel + 1, LEVELS.length - 1)); setStatus("levels"); } else { beginGame(selectedLevel); } }}>{passed ? "LEVEL TIẾP THEO" : "THỬ LẠI"} <span>{passed ? "→" : "↻"}</span></button>
        </div>}
      </section>
    </main>
  );
}
