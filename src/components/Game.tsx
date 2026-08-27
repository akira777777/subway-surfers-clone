import { useCallback, useEffect, useRef, useState } from 'react'

type Lane = -1 | 0 | 1
type Entity = { id: number; lane: Lane; z: number; kind: 'coin' | 'crate' | 'barrier' }
type GamePhase = 'ready' | 'playing' | 'paused' | 'over'

const SAVE_KEY = 'midnight-line-high-score'
const lanes: Lane[] = [-1, 0, 1]
const getBest = () => { try { return Number(localStorage.getItem(SAVE_KEY) || 0) } catch { return 0 } }

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef<GamePhase>('ready')
  const gameRef = useRef({ lane: 0 as Lane, jump: 0, slide: 0, score: 0, coins: 0, distance: 0, entities: [] as Entity[], nextId: 0, spawn: 0, last: 0, lastHud: 0 })
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [hud, setHud] = useState({ score: 0, coins: 0, best: getBest() })

  const setGamePhase = useCallback((next: GamePhase) => { phaseRef.current = next; setPhase(next) }, [])
  const start = useCallback(() => {
    Object.assign(gameRef.current, { lane: 0, jump: 0, slide: 0, score: 0, coins: 0, distance: 0, entities: [], spawn: 0, last: 0, lastHud: 0 })
    setHud(current => ({ ...current, score: 0, coins: 0 }))
    setGamePhase('playing')
  }, [setGamePhase])
  const end = useCallback(() => {
    const game = gameRef.current; const best = Math.max(getBest(), game.score)
    try { localStorage.setItem(SAVE_KEY, String(best)) } catch { /* optional storage */ }
    setHud({ score: game.score, coins: game.coins, best }); setGamePhase('over')
  }, [setGamePhase])
  const control = useCallback((move: 'left' | 'right' | 'jump' | 'slide') => {
    if (phaseRef.current !== 'playing') return
    const game = gameRef.current
    if (move === 'left') game.lane = Math.max(-1, game.lane - 1) as Lane
    if (move === 'right') game.lane = Math.min(1, game.lane + 1) as Lane
    if (move === 'jump' && game.jump <= .02) game.jump = .72
    if (move === 'slide' && game.jump <= .02) game.slide = .58
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Escape'].includes(event.key)) event.preventDefault()
      if (event.key === 'Escape') setGamePhase(phaseRef.current === 'playing' ? 'paused' : phaseRef.current === 'paused' ? 'playing' : phaseRef.current)
      else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') control('left')
      else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') control('right')
      else if (event.key === 'ArrowUp' || event.key === ' ') control('jump')
      else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') control('slide')
    }
    window.addEventListener('keydown', onKey, { passive: false }); return () => window.removeEventListener('keydown', onKey)
  }, [control, setGamePhase])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let frame = 0
    const resize = () => { const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas)
    const draw = (time: number) => {
      const width = canvas.clientWidth, height = canvas.clientHeight, game = gameRef.current
      const horizon = height * .29, floor = height * .91
      const laneX = (lane: Lane, z: number) => width / 2 + lane * width * (.075 + (1 - z) * .19)
      const projectY = (z: number) => horizon + Math.pow(1 - z, 1.62) * (floor - horizon)
      const sky = ctx.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, '#151830'); sky.addColorStop(.33, '#4c3869'); sky.addColorStop(.62, '#ce6e68'); sky.addColorStop(1, '#f5b36a'); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#17172b'
      for (let i = -1; i < 12; i++) { const x = i * width / 10 + Math.sin(i * 41) * 24, building = 28 + ((i * 37) % 72 + 72) % 72; ctx.fillRect(x, horizon - building, width / 9, building); ctx.fillStyle = 'rgba(255,205,108,.42)'; for (let win = 0; win < 3; win++) ctx.fillRect(x + 10 + win * 16, horizon - building + 13, 6, 4); ctx.fillStyle = '#17172b' }
      ctx.fillStyle = '#20213b'; ctx.beginPath(); ctx.moveTo(width * .22, horizon); ctx.lineTo(width * .78, horizon); ctx.lineTo(width, floor); ctx.lineTo(0, floor); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#b9b9c1'; ctx.lineWidth = 2; [-1.5, -.5, .5, 1.5].forEach(line => { ctx.beginPath(); ctx.moveTo(width / 2 + line * width * .034, horizon); ctx.lineTo(width / 2 + line * width * .255, floor); ctx.stroke() })
      for (let z = .98; z > 0; z -= .075) { const y = projectY(z), p = 1 - z; ctx.fillStyle = 'rgba(21,17,34,.74)'; ctx.fillRect(width / 2 - 20 - p * width * .29, y, 40 + p * width * .58, 3 + p * 10) }
      ctx.fillStyle = Math.sin(time / 420) > -.4 ? '#f7d64a' : '#d05a88'; ctx.fillRect(width * .08, horizon + 14, 70, 8); ctx.fillStyle = '#17172b'; ctx.font = '700 9px system-ui'; ctx.fillText('MIDNIGHT LINE', width * .09, horizon + 21); ctx.fillStyle = '#91e4ef'; ctx.fillRect(width * .81, horizon + 28, 55, 7)
      game.entities.forEach(entity => {
        const p = 1 - entity.z, x = laneX(entity.lane, entity.z), y = projectY(entity.z), size = 10 + p * 62
        if (entity.kind === 'coin') { ctx.save(); ctx.translate(x, y - size * .72); ctx.rotate(time / 300 + entity.id); ctx.fillStyle = '#ffd454'; ctx.beginPath(); ctx.ellipse(0, 0, size * .34, size * .45, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff0a2'; ctx.lineWidth = Math.max(1, size * .06); ctx.stroke(); ctx.restore() }
        else if (entity.kind === 'crate') { ctx.fillStyle = '#643b42'; ctx.fillRect(x - size * .48, y - size * .86, size * .96, size * .86); ctx.strokeStyle = '#f3a04e'; ctx.lineWidth = Math.max(1, size * .06); ctx.strokeRect(x - size * .48, y - size * .86, size * .96, size * .86); ctx.beginPath(); ctx.moveTo(x - size*.42, y-size*.78); ctx.lineTo(x+size*.42, y-size*.1); ctx.moveTo(x+size*.42, y-size*.78); ctx.lineTo(x-size*.42, y-size*.1); ctx.stroke() }
        else { ctx.fillStyle = '#e85b50'; ctx.fillRect(x - size * .65, y - size * .55, size * 1.3, size * .55); ctx.fillStyle = '#f4d358'; for (let stripe = -1; stripe < 2; stripe++) ctx.fillRect(x + stripe * size * .42 - size * .12, y - size * .48, size * .2, size * .18); ctx.fillStyle = '#31304d'; ctx.fillRect(x - size * .5, y - size * .82, size, size * .2) }
      })
      const playerX = laneX(game.lane, 0), bob = game.jump > 0 ? Math.sin(game.jump / .72 * Math.PI) * height * .18 : Math.sin(time / 90) * 2, sliding = game.slide > 0
      ctx.save(); ctx.translate(playerX, floor - 20 - bob); ctx.shadowColor = '#ffcc65'; ctx.shadowBlur = 18; ctx.fillStyle = '#f8cb62'; ctx.beginPath(); ctx.arc(0, sliding ? -15 : -37, 11, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#1d2246'; ctx.fillRect(-12, sliding ? -17 : -27, 24, sliding ? 12 : 28); ctx.fillStyle = '#ee4f72'; ctx.fillRect(-14, sliding ? -10 : 0, 9, sliding ? 10 : 26); ctx.fillRect(5, sliding ? -10 : 0, 9, sliding ? 10 : 26); ctx.fillStyle = '#fcf5df'; ctx.fillRect(-17, sliding ? -4 : 24, 12, 5); ctx.fillRect(5, sliding ? -4 : 24, 12, 5); ctx.restore()
      if (phaseRef.current === 'playing') {
        const delta = Math.min(.04, (time - (game.last || time)) / 1000); game.last = time; const speed = .205 + Math.min(.14, game.distance / 17000); game.distance += delta * 100; game.score = Math.floor(game.distance * 10 + game.coins * 25); game.jump = Math.max(0, game.jump - delta); game.slide = Math.max(0, game.slide - delta); game.spawn -= delta
        if (game.spawn <= 0) { const lane = lanes[Math.floor(Math.random() * lanes.length)], isCoin = Math.random() < .62, kind: Entity['kind'] = isCoin ? 'coin' : Math.random() < .55 ? 'crate' : 'barrier'; game.entities.push({ id: ++game.nextId, lane, z: 1.06, kind }); if (isCoin && Math.random() < .38) game.entities.push({ id: ++game.nextId, lane, z: 1.25, kind: 'coin' }); game.spawn = isCoin ? .38 + Math.random() * .26 : .7 + Math.random() * .46 }
        game.entities.forEach(entity => { entity.z -= delta * speed }); const survivors: Entity[] = []
        for (const entity of game.entities) { const reachesPlayer = entity.z < .13 && entity.z > -.08 && entity.lane === game.lane; if (entity.kind === 'coin' && reachesPlayer) { game.coins += 1; continue }; if (entity.kind !== 'coin' && reachesPlayer) { const safe = entity.kind === 'crate' ? game.jump > .13 : game.slide > .08; if (!safe) { end(); continue } }; if (entity.z > -.12) survivors.push(entity) }
        game.entities = survivors; if (time - game.lastHud > 90) { setHud(current => ({ ...current, score: game.score, coins: game.coins })); game.lastHud = time }
      } else game.last = time
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw); return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [end])
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchEnd = (event: React.TouchEvent) => { const startPoint = touchStart.current; if (!startPoint) return; const touch = event.changedTouches[0], dx = touch.clientX - startPoint.x, dy = touch.clientY - startPoint.y; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) control('jump'); else if (Math.abs(dx) > Math.abs(dy)) control(dx > 0 ? 'right' : 'left'); else control(dy < 0 ? 'jump' : 'slide') }
  return <main className="game-shell"><section className="game-frame" aria-label="Midnight Line endless runner"><canvas ref={canvasRef} className="game-canvas" onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }} onTouchEnd={onTouchEnd} /><div className="topbar" aria-live="polite"><div className="brand"><span>ML</span><div>MIDNIGHT<br />LINE</div></div><div className="score"><small>SCORE</small><strong>{hud.score.toLocaleString()}</strong></div><div className="coin-count" aria-label={`${hud.coins} coins collected`}>◉ <b>{hud.coins}</b></div>{phase === 'playing' && <button className="pause" onClick={() => setGamePhase('paused')} aria-label="Pause game">Ⅱ</button>}</div>{phase !== 'playing' && <div className="panel">{phase === 'ready' && <><p className="eyebrow">ENDLESS NIGHT RUN · 01</p><h1>MAKE THE<br /><em>LAST TRAIN.</em></h1><p className="intro">Run the closing line. Dodge the crates, slide under the signal bars and keep the fare coins.</p></>}{phase === 'paused' && <><p className="eyebrow">THE CITY IS WAITING</p><h1>RUN<br /><em>PAUSED.</em></h1></>}{phase === 'over' && <><p className="eyebrow">END OF THE LINE</p><h1>{hud.score.toLocaleString()}<br /><em>POINTS.</em></h1><p className="intro">New route, new chance. Your best ride is {hud.best.toLocaleString()}.</p></>}<button className="start" onClick={phase === 'paused' ? () => setGamePhase('playing') : start}>{phase === 'paused' ? 'KEEP RUNNING' : phase === 'over' ? 'RUN AGAIN' : 'START THE RUN'} <span>→</span></button>{phase === 'ready' && <div className="controls"><span>← → change track</span><span>↑ jump</span><span>↓ slide</span></div>}</div>}<div className="route-label"><span>LAST SERVICE</span><b>METRO 07</b><i>∞</i></div></section></main>
}
