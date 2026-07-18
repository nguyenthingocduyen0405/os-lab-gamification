"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Target = { x: number; y: number; rare: boolean };
const GAME_TIME = 30;
const newTarget = (): Target => ({ x: 8 + Math.random() * 82, y: 14 + Math.random() * 72, rare: Math.random() < 0.18 });

export default function Home() {
  const [status, setStatus] = useState<"ready" | "playing" | "ended">("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
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

  const beginGame = useCallback(() => {
    setScore(0); setCombo(0); setHits(0); setMisses(0); setLastGain(null);
    setTimeLeft(GAME_TIME); setTarget(newTarget()); setStatus("playing");
    window.setTimeout(() => targetRef.current?.focus(), 80);
  }, []);

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
  const speed = Math.max(0.55, 1.35 - score * 0.025);

  return (
    <main className="game-shell">
      <section className={"game-board " + (status === "playing" ? "is-playing" : "")} onClick={miss} aria-label="Khu vực chơi">
        <div className="grid" /><div className="corner-label corner-top">VÙNG SĂN // 01</div><div className="corner-label corner-bottom">HÃY NHẮM CHÍNH XÁC</div>
        {status === "playing" && <div className="game-hud" aria-live="polite">
          <div><span>점수</span><strong>{score.toString().padStart(2, "0")}</strong></div>
          <div><span>콤보</span><strong>×{combo}</strong></div>
          <div><span>시간</span><strong>{timeLeft}s</strong></div>
          <div className="hud-progress"><span style={{ width: ((timeLeft / GAME_TIME) * 100) + "%" }} /></div>
        </div>}
        {status === "playing" && <>
          <button ref={targetRef} className={"star-target " + (target.rare ? "rare" : "")} style={{ left: target.x + "%", top: target.y + "%", animationDuration: speed + "s" }} onClick={catchStar} aria-label={target.rare ? "Bắt sao vàng, được 3 điểm" : "Bắt ngôi sao"}><span>{target.rare ? "★" : "✦"}</span></button>
          {lastGain !== null && <div className="gain-pop">+{lastGain}</div>}
        </>}
        {status === "ready" && <div className="game-overlay os-start">
          <div className="os-logo" aria-label="OS">OS</div>
          <p className="os-welcome">OS lab에 오는 걸 환영합니다.</p>
          <h2 className="os-ready">준비됐어?</h2>
          <button className="primary-button os-start-button" onClick={(e) => { e.stopPropagation(); beginGame(); }}>시작하기</button>
        </div>}
        {status === "ended" && <div className="game-overlay results">
          <span className="overlay-icon">★</span><p className="overlay-kicker">HẾT GIỜ!</p><h2>{score >= best && score > 0 ? "Kỷ lục mới!" : "Một lượt săn đẹp!"}</h2>
          <div className="result-row"><div><strong>{score}</strong><span>ĐIỂM</span></div><div><strong>{accuracy}%</strong><span>CHÍNH XÁC</span></div><div><strong>{hits}</strong><span>SAO BẮT ĐƯỢC</span></div></div>
          <button className="primary-button" onClick={(e) => { e.stopPropagation(); beginGame(); }}>CHƠI LẠI <span>↻</span></button>
        </div>}
      </section>
    </main>
  );
}
