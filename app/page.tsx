"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Target = { x: number; y: number; rare: boolean };
type GameStatus = "ready" | "levels" | "playing" | "ended";
const LEVELS = [
  { number: "01", name: "BOOT SEQUENCE", korean: "기초 프로세스", seconds: 30, baseSpeed: 1.35, goal: 15, icon: ">_" },
  { number: "02", name: "PROCESS RUSH", korean: "멀티태스킹", seconds: 25, baseSpeed: 1.05, goal: 25, icon: "⚙" },
  { number: "03", name: "KERNEL PANIC", korean: "최고 난이도", seconds: 20, baseSpeed: 0.82, goal: 35, icon: "!" },
] as const;
const newTarget = (): Target => ({ x: 8 + Math.random() * 82, y: 14 + Math.random() * 72, rare: Math.random() < 0.18 });

export default function Home() {
  const [status, setStatus] = useState<GameStatus>("ready");
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LEVELS[0].seconds);
  const [target, setTarget] = useState<Target>(() => newTarget());
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const targetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setBest(Number(window.localStorage.getItem("san-sao-best") || 0)), []);
  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => setTimeLeft((current) => {
      if (current <= 1) { window.clearInterval(timer); setStatus("ended"); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [status]);
  useEffect(() => {
    if (status === "ended") setBest((old) => {
      const next = Math.max(old, score);
      window.localStorage.setItem("san-sao-best", String(next));
      return next;
    });
  }, [score, status]);

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
  const speed = Math.max(0.48, currentLevel.baseSpeed - score * 0.02);

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
        {status === "levels" && <div className="game-overlay level-select">
          <div className="level-heading">
            <div><p>SELECT LEVEL</p><h2>레벨을 선택하세요</h2><span>원하는 난이도를 골라 시스템을 시작하세요.</span></div>
            <img src="/os-penguin.png" alt="" aria-hidden="true" />
          </div>
          <div className="level-grid">
            {LEVELS.map((level, index) => <button key={level.number} className={"level-card level-" + (index + 1)} onClick={(e) => { e.stopPropagation(); beginGame(index); }}>
              <span className="level-number">LV.{level.number}</span><strong className="level-icon">{level.icon}</strong>
              <div><b>{level.name}</b><small>{level.korean}</small></div>
              <dl><div><dt>시간</dt><dd>{level.seconds}s</dd></div><div><dt>목표</dt><dd>{level.goal}점</dd></div></dl>
              <span className="level-enter">ENTER →</span>
            </button>)}
          </div>
          <button className="level-back" onClick={(e) => { e.stopPropagation(); setStatus("ready"); }}>← 돌아가기</button>
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
          <span className="overlay-icon">★</span><p className="overlay-kicker">HẾT GIỜ!</p><h2>{score >= best && score > 0 ? "Kỷ lục mới!" : "Một lượt săn đẹp!"}</h2>
          <div className="result-row"><div><strong>{score}</strong><span>ĐIỂM</span></div><div><strong>{accuracy}%</strong><span>CHÍNH XÁC</span></div><div><strong>{hits}</strong><span>SAO BẮT ĐƯỢC</span></div></div>
          <button className="primary-button" onClick={(e) => { e.stopPropagation(); setStatus("levels"); }}>CHỌN LEVEL KHÁC <span>↻</span></button>
        </div>}
      </section>
    </main>
  );
}
