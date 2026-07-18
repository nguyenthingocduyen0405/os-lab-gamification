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
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Săn Sao - trang chủ"><span className="brand-mark">✦</span><span>SĂN SAO</span></a>
        <div className="best-score"><span>KỶ LỤC</span><strong>{best.toString().padStart(2, "0")}</strong></div>
      </header>

      <section className="hero-copy">
        <div><p className="eyebrow">THỬ THÁCH PHẢN XẠ</p><h1>Chạm nhanh.<br /><span>Ghi điểm lớn.</span></h1></div>
        <p className="intro">Bắt các vì sao trước khi hết 30 giây. Giữ chuỗi combo để nhân điểm — và đừng bỏ lỡ sao vàng!</p>
      </section>

      <section className="score-strip" aria-live="polite">
        <div className="stat"><span>ĐIỂM</span><strong>{score.toString().padStart(2, "0")}</strong></div>
        <div className="stat combo-stat"><span>COMBO</span><strong>×{combo}</strong></div>
        <div className="timer-block"><div className="timer-copy"><span>THỜI GIAN</span><strong>{timeLeft}s</strong></div><div className="timer-track" aria-hidden="true"><div style={{ width: ((timeLeft / GAME_TIME) * 100) + "%" }} /></div></div>
      </section>

      <section className={"game-board " + (status === "playing" ? "is-playing" : "")} onClick={miss} aria-label="Khu vực chơi">
        <div className="grid" /><div className="corner-label corner-top">VÙNG SĂN // 01</div><div className="corner-label corner-bottom">HÃY NHẮM CHÍNH XÁC</div>
        {status === "playing" && <>
          <button ref={targetRef} className={"star-target " + (target.rare ? "rare" : "")} style={{ left: target.x + "%", top: target.y + "%", animationDuration: speed + "s" }} onClick={catchStar} aria-label={target.rare ? "Bắt sao vàng, được 3 điểm" : "Bắt ngôi sao"}><span>{target.rare ? "★" : "✦"}</span></button>
          {lastGain !== null && <div className="gain-pop">+{lastGain}</div>}
        </>}
        {status === "ready" && <div className="game-overlay">
          <span className="overlay-icon">✦</span><p className="overlay-kicker">BẠN ĐÃ SẴN SÀNG?</p><h2>30 giây. Vô số vì sao.</h2>
          <button className="primary-button" onClick={(e) => { e.stopPropagation(); beginGame(); }}>BẮT ĐẦU CHƠI <span>→</span></button><p className="hint">Dùng chuột, chạm màn hình hoặc phím Enter</p>
        </div>}
        {status === "ended" && <div className="game-overlay results">
          <span className="overlay-icon">★</span><p className="overlay-kicker">HẾT GIỜ!</p><h2>{score >= best && score > 0 ? "Kỷ lục mới!" : "Một lượt săn đẹp!"}</h2>
          <div className="result-row"><div><strong>{score}</strong><span>ĐIỂM</span></div><div><strong>{accuracy}%</strong><span>CHÍNH XÁC</span></div><div><strong>{hits}</strong><span>SAO BẮT ĐƯỢC</span></div></div>
          <button className="primary-button" onClick={(e) => { e.stopPropagation(); beginGame(); }}>CHƠI LẠI <span>↻</span></button>
        </div>}
      </section>
      <footer><p><span>●</span> MẸO: SAO VÀNG CHO ĐIỂM GẤP 3</p><p>THIẾT KẾ CHO NHỮNG NGÓN TAY NHANH NHẤT</p></footer>
    </main>
  );
}
