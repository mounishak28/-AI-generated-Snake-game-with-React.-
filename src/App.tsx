/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;
const TILE_SIZE = 20;
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: "AUDIO_STREAM_01.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "AUDIO_STREAM_02.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "AUDIO_STREAM_03.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

export default function App() {
  // Game State Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef({ x: 0, y: -1 });
  const nextDirectionRef = useRef({ x: 0, y: -1 });
  const foodRef = useRef({ x: 5, y: 5 });
  const gameOverRef = useRef(false);
  const isPausedRef = useRef(false);
  const scoreRef = useRef(0);

  // UI State
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shake, setShake] = useState(false);

  // Audio State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const resetGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = { x: 0, y: -1 };
    nextDirectionRef.current = { x: 0, y: -1 };
    foodRef.current = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    gameOverRef.current = false;
    isPausedRef.current = false;
    scoreRef.current = 0;

    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    triggerShake();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * TILE_SIZE, 0);
      ctx.lineTo(i * TILE_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * TILE_SIZE);
      ctx.lineTo(canvas.width, i * TILE_SIZE);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#FF00FF';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF00FF';
    ctx.fillRect(foodRef.current.x * TILE_SIZE + 2, foodRef.current.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#FFFFFF' : '#00FFFF';
      ctx.fillRect(segment.x * TILE_SIZE + 1, segment.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    });

    ctx.shadowBlur = 0;
  }, []);

  const update = useCallback((time: number) => {
    if (isPausedRef.current || gameOverRef.current) {
      lastUpdateTimeRef.current = time;
      draw();
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    if (time - lastUpdateTimeRef.current > GAME_SPEED) {
      directionRef.current = nextDirectionRef.current;
      const head = snakeRef.current[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)
      ) {
        gameOverRef.current = true;
        setGameOver(true);
        triggerShake();
        draw();
        requestRef.current = requestAnimationFrame(update);
        return;
      }

      const newSnake = [newHead, ...snakeRef.current];

      // Food
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setHighScore(prev => Math.max(prev, scoreRef.current));
        
        // New food
        let newFood;
        while (true) {
          newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
          if (!newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
        }
        foodRef.current = newFood;
        triggerShake();
      } else {
        newSnake.pop();
      }

      snakeRef.current = newSnake;
      lastUpdateTimeRef.current = time;
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    if (gameOverRef.current && e.key === 'Enter') {
      resetGame();
      return;
    }

    if (e.key === ' ') {
      isPausedRef.current = !isPausedRef.current;
      setIsPaused(isPausedRef.current);
      return;
    }

    const { x, y } = directionRef.current;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W':
        if (y !== 1) nextDirectionRef.current = { x: 0, y: -1 };
        break;
      case 'ArrowDown': case 's': case 'S':
        if (y !== -1) nextDirectionRef.current = { x: 0, y: 1 };
        break;
      case 'ArrowLeft': case 'a': case 'A':
        if (x !== 1) nextDirectionRef.current = { x: -1, y: 0 };
        break;
      case 'ArrowRight': case 'd': case 'D':
        if (x !== -1) nextDirectionRef.current = { x: 1, y: 0 };
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Audio Logic
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error(e));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const skipForward = () => { setCurrentTrackIndex(p => (p + 1) % TRACKS.length); setIsPlaying(true); };
  const skipBackward = () => { setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length); setIsPlaying(true); };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative">
      <div className="bg-noise"></div>
      <div className="scanlines"></div>

      <div className={`w-full max-w-3xl flex flex-col gap-6 z-10 screen-tear ${shake ? 'shake' : ''}`}>
        
        {/* Header */}
        <div className="flex justify-between items-end border-b-4 border-[#00FFFF] pb-2">
          <div>
            <h1 className="text-4xl text-[#FF00FF] glitch-text" data-text="SYS.OP.SNAKE">SYS.OP.SNAKE</h1>
            <p className="text-[#00FFFF] text-xl">STATUS: {gameOver ? 'FAILURE' : isPaused ? 'SUSPENDED' : 'ACTIVE'}</p>
          </div>
          <div className="text-right">
            <p className="text-[#00FFFF] text-xl">FRAGMENTS: <span className="text-[#FF00FF]">{score}</span></p>
            <p className="text-[#00FFFF] text-xl">MAX_FRAGMENTS: <span className="text-[#FF00FF]">{highScore}</span></p>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative mx-auto border-4 border-[#FF00FF] bg-black p-1 shadow-[0_0_20px_#FF00FF]">
          <canvas 
            ref={canvasRef}
            width={400}
            height={400}
            className="block bg-black w-full max-w-[400px] aspect-square"
          />
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center border-2 border-red-500">
              <h2 className="text-5xl text-red-500 glitch-text mb-4" data-text="SYSTEM FAILURE">SYSTEM FAILURE</h2>
              <p className="text-[#00FFFF] text-2xl mb-8">FRAGMENTS RECOVERED: {score}</p>
              <button 
                onClick={resetGame}
                className="px-6 py-2 border-2 border-[#00FFFF] text-[#00FFFF] text-2xl hover:bg-[#00FFFF] hover:text-black transition-colors cursor-pointer"
              >
                [ REBOOT SEQUENCE ]
              </button>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <h2 className="text-4xl text-[#00FFFF] glitch-text" data-text="AWAITING INPUT...">AWAITING INPUT...</h2>
            </div>
          )}
        </div>

        {/* Controls Info */}
        <div className="text-center text-[#00FFFF] text-lg">
          [W A S D] / [ARROWS] : OVERRIDE DIRECTION &nbsp;&nbsp;&nbsp; [SPACE] : HALT EXECUTION
        </div>

        {/* Audio Player */}
        <div className="border-4 border-[#00FFFF] p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/50 shadow-[0_0_20px_#00FFFF]">
          <div className="flex flex-col">
            <span className="text-[#FF00FF] text-2xl glitch-text" data-text={TRACKS[currentTrackIndex].title}>
              {TRACKS[currentTrackIndex].title}
            </span>
            <span className="text-[#00FFFF] text-lg">AUDIO.SUBSYSTEM // {isPlaying ? 'TRANSMITTING' : 'IDLE'}</span>
          </div>

          <div className="flex gap-4 text-2xl">
            <button onClick={skipBackward} className="text-[#00FFFF] hover:text-[#FF00FF] cursor-pointer">[ &lt;&lt; ]</button>
            <button onClick={togglePlay} className="text-[#00FFFF] hover:text-[#FF00FF] cursor-pointer">
              {isPlaying ? '[ || ]' : '[ > ]'}
            </button>
            <button onClick={skipForward} className="text-[#00FFFF] hover:text-[#FF00FF] cursor-pointer">[ &gt;&gt; ]</button>
          </div>
        </div>

      </div>

      <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} onEnded={skipForward} />
    </div>
  );
}
