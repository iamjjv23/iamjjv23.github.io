// ============================================================================
// OLIVE-SAGE, IVORY & GOLD WEDDING PALETTE STORY (`pallete.jpg`)
// 1. Removed background box from all scene descriptions; high-contrast readable text
// 2. Scene 1 description positioned at Top Ceiling (above stage); Scenes 2-8 at Bottom
// 3. Scroll dialog box uses a live progress-bar background color fill (no scene numbers)
// ============================================================================
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const smoothstep = (min, max, value) => {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
};
const normalizeAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

// DOM Elements
const container = document.getElementById('webglContainer');
const progressBar = document.getElementById('progressBar');
const scrollHint = document.getElementById('scrollHint');
const scrollHintText = document.getElementById('scrollHintText');
const lightBloom = document.getElementById('lightBloom');
const weddingSkyBanner = document.getElementById('weddingSkyBanner');
const weddingBottomBanner = document.getElementById('weddingBottomBanner');
const subtitleOverlay = document.getElementById('subtitleOverlay');
const subtitleSlides = document.querySelectorAll('.subtitle-slide');

// ============================================================================
// SUBTLE BACKGROUND MUSIC CONTROLLER (`music/music.mp3` + WEB AUDIO FALLBACK)
// ============================================================================
const audioToggleBtn = document.getElementById('audioToggle');
const audioIconMuted = document.getElementById('audioIconMuted');
const audioIconPlaying = document.getElementById('audioIconPlaying');
const audioLabel = document.getElementById('audioLabel');
const bgAudioElement = document.getElementById('bgAudioElement');

let isMusicPlaying = false;
let audioCtx = null;
let synthInterval = null;
let useHtmlAudio = false;

bgAudioElement.addEventListener('canplaythrough', () => {
  useHtmlAudio = true;
});

function startAmbientSynth() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const chords = [
    [174.61, 261.63, 329.63, 440.0, 523.25],  // Fmaj7
    [164.81, 246.94, 329.63, 392.0, 587.33],  // Cmaj9/E
    [146.83, 220.0,  293.66, 349.23, 523.25], // Dm7
    [116.54, 233.08, 293.66, 349.23, 440.0]   // Bbmaj7
  ];
  let chordIdx = 0;

  function playChordArpeggio() {
    if (!isMusicPlaying || !audioCtx) return;
    const notes = chords[chordIdx % chords.length];
    chordIdx++;

    const now = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const subOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sine';
      subOsc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.38);
      subOsc.frequency.setValueAtTime(freq * 0.5, now + i * 0.38);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now + i * 0.38);

      const startT = now + i * 0.38;
      gain.gain.setValueAtTime(0.0001, startT);
      gain.gain.linearRampToValueAtTime(0.032, startT + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 3.8);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startT);
      subOsc.start(startT);
      osc.stop(startT + 3.9);
      subOsc.stop(startT + 3.9);
    });
  }

  playChordArpeggio();
  synthInterval = setInterval(playChordArpeggio, 3600);
}

function stopAmbientSynth() {
  if (synthInterval) {
    clearInterval(synthInterval);
    synthInterval = null;
  }
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend();
  }
}

audioToggleBtn.addEventListener('click', () => {
  isMusicPlaying = !isMusicPlaying;
  audioToggleBtn.classList.toggle('playing', isMusicPlaying);
  audioToggleBtn.setAttribute('aria-pressed', String(isMusicPlaying));
  audioIconMuted.classList.toggle('hidden', isMusicPlaying);
  audioIconPlaying.classList.toggle('hidden', !isMusicPlaying);
  audioLabel.textContent = isMusicPlaying ? 'Music On' : 'Music Off';

  if (isMusicPlaying) {
    bgAudioElement.volume = 0.4;
    bgAudioElement.play().then(() => {
      useHtmlAudio = true;
    }).catch(() => {
      startAmbientSynth();
    });
  } else {
    bgAudioElement.pause();
    stopAmbientSynth();
  }
});

// ============================================================================
// 1. 3D SCENE, CAMERA & RENDERER (OLIVE-SAGE, IVORY & GOLD PALETTE — `pallete.jpg`)
// ============================================================================
const scene = new THREE.Scene();

const bgPastelColors = [
  new THREE.Color(0xf4f1ea), // Scene 1: Warm Cream Ivory
  new THREE.Color(0xeaece2), // Scene 2: Soft Eucalyptus Sage Verandah
  new THREE.Color(0xeef0e6), // Scene 3: Warm Sage & Gold Stage Glow
  new THREE.Color(0xe5e7dc), // Scene 4: Soft Sage Auditorium
  new THREE.Color(0xdde0d2), // Scene 5: Wide Backstage Olive-Sage Mist
  new THREE.Color(0xfbf6e8), // Scene 6: Warm Champagne Gold Chandelier Bloom
  new THREE.Color(0xf4f1ea), // Scene 7: Alabaster Ivory Church Nave
  new THREE.Color(0xf6f0e2), // Scene 8: 360° Sanctuary Golden Glow
  new THREE.Color(0xe8ece2)  // Scene 9: Soft Sage-Ivory Daylight Sky for Drone Finale
];
scene.background = bgPastelColors[0].clone();
scene.fog = new THREE.Fog(0xf4f1ea, 36, 92);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 2. 3D LIGHTING
const hemiLight = new THREE.HemisphereLight(0xfffdf8, 0xc2c4b6, 0.96);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff8eb, 0.9);
dirLight.position.set(7, 18, 12);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const stageSpotLight = new THREE.SpotLight(0xffeab5, 1.4, 42, Math.PI / 3, 0.5, 1.2);
stageSpotLight.position.set(0, 10.2, -7.2);
scene.add(stageSpotLight);

// 3. 3D ARCHITECTURAL & DECORATION MATERIALS (`pallete.jpg` Olive-Sage, Ivory & Gold)
const envMats = {
  floor: new THREE.MeshStandardMaterial({ color: 0xe6e2d6, roughness: 0.72 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.68, side: THREE.DoubleSide }),
  naveSkyVault: new THREE.MeshStandardMaterial({ color: 0xe4e8df, roughness: 0.65, side: THREE.DoubleSide }),
  ceilingBeam: new THREE.MeshStandardMaterial({ color: 0xc2c4b6, roughness: 0.6 }),
  woodStage: new THREE.MeshStandardMaterial({ color: 0xc8b496, roughness: 0.45 }),
  woodDesk: new THREE.MeshStandardMaterial({ color: 0x8f8872, roughness: 0.52 }),
  woodPew: new THREE.MeshStandardMaterial({ color: 0x6e4228, roughness: 0.44 }),
  furnishedTeak: new THREE.MeshStandardMaterial({ color: 0x54301a, roughness: 0.38, metalness: 0.08 }),
  trussMetal: new THREE.MeshStandardMaterial({ color: 0x3b3f32, roughness: 0.32, metalness: 0.72 }),
  speakerBox: new THREE.MeshStandardMaterial({ color: 0x24261e, roughness: 0.45, metalness: 0.4 }),
  curtainVelvet: new THREE.MeshStandardMaterial({ color: 0x62694b, roughness: 0.62, side: THREE.DoubleSide }),
  marble: new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.4 }),
  stonePillarGranite: new THREE.MeshStandardMaterial({ color: 0x5c5349, roughness: 0.68, metalness: 0.08 }),
  pillarBaseDark: new THREE.MeshStandardMaterial({ color: 0x3d362f, roughness: 0.7 }),
  sanctuaryRedCarpet: new THREE.MeshStandardMaterial({ color: 0xb81d22, roughness: 0.55 }),
  sanctuaryStepDarkRed: new THREE.MeshStandardMaterial({ color: 0x8f1519, roughness: 0.6 }),
  communionRailDark: new THREE.MeshStandardMaterial({ color: 0x281c17, roughness: 0.4, metalness: 0.4 }),
  churchWhite: new THREE.MeshStandardMaterial({ color: 0xf9fbfd, roughness: 0.42, side: THREE.DoubleSide }),
  churchWall: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.55, side: THREE.DoubleSide }),
  churchStone: new THREE.MeshStandardMaterial({ color: 0xd8d6cb, roughness: 0.55 }),
  blackGranite: new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.32, metalness: 0.22 }),
  terracottaTile: new THREE.MeshStandardMaterial({ color: 0xa63a2f, roughness: 0.52 }),
  colonialRoof: new THREE.MeshStandardMaterial({ color: 0x54382c, roughness: 0.6 }),
  gateBrick: new THREE.MeshStandardMaterial({ color: 0x969ba1, roughness: 0.65 }),
  redStep: new THREE.MeshStandardMaterial({ color: 0x8c3b35, roughness: 0.6 }),
  carpetWhite: new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd5ae64, roughness: 0.26, metalness: 0.76 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xc2c4b6, roughness: 0.3, metalness: 0.65 }),
  screenGlow: new THREE.MeshBasicMaterial({ color: 0xe6d6a8, side: THREE.DoubleSide }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xfff8dc }),
  haloGlow: new THREE.MeshBasicMaterial({ color: 0xfaecc4, transparent: true, opacity: 0.58, side: THREE.DoubleSide }),
  balloonPearl: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.2, metalness: 0.1 }),
  balloonBlush: new THREE.MeshStandardMaterial({ color: 0xc2c4b6, roughness: 0.22, metalness: 0.08 }),
  balloonGold: new THREE.MeshStandardMaterial({ color: 0xd5ae64, roughness: 0.22, metalness: 0.48 }),
  balloonLavender: new THREE.MeshStandardMaterial({ color: 0x7b8262, roughness: 0.24, metalness: 0.1 })
};

// Helper: Draw SVG Path2D without any white sticker border
function drawSVGPath(ctx, d, fillStyle, strokeStyle = null, lineWidth = 2) {
  const p = new Path2D(d);
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill(p);
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(p);
  }
}

// Helper: Draw Expressive Female Almond Eyes, Eyelashes, Arched Brows, Bindi & Smile
function drawExpressiveFemaleFace(ctx, cx, cy, turnX = 0, scale = 1, bindiColor = '#8c2d2d', smileOpen = true) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const fx = turnX * 0.38;

  ctx.fillStyle = 'rgba(229, 125, 115, 0.32)';
  ctx.beginPath();
  ctx.ellipse(-15 + fx, 5, 7.5, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(15 + fx, 5, 7.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSVGPath(ctx, `M${-21 + fx},-11 Q${-12 + fx},-17 ${-4 + fx},-11`, null, '#141418', 2.8);
  drawSVGPath(ctx, `M${4 + fx},-11 Q${12 + fx},-17 ${21 + fx},-11`, null, '#141418', 2.8);

  ctx.fillStyle = bindiColor;
  ctx.beginPath();
  ctx.arc(fx, -13, 2.6, 0, Math.PI * 2);
  ctx.fill();

  [-12 + fx, 12 + fx].forEach((ex, idx) => {
    const dir = idx === 0 ? -1 : 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ex - 7.5, -4);
    ctx.quadraticCurveTo(ex, -9.5, ex + 7.5, -4);
    ctx.quadraticCurveTo(ex, 0.5, ex - 7.5, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#241612';
    ctx.beginPath();
    ctx.arc(ex + turnX * 0.06, -4.2, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 1.3, -5.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    drawSVGPath(
      ctx,
      `M${ex - 8},-3.8 Q${ex},-9.8 ${ex + 8},-3.8 L${ex + dir * 10},-5.8`,
      null,
      '#141418',
      2.2
    );
  });

  drawSVGPath(ctx, `M${fx},-3 L${fx - 1.5},4.5 Q${fx},6.5 ${fx + 2.5},4.5`, null, '#c98863', 2.0);

  if (smileOpen) {
    drawSVGPath(
      ctx,
      `M${-9 + fx},11 Q${fx},19 ${9 + fx},11 Q${fx},13.5 ${-9 + fx},11 Z`,
      '#ffffff',
      '#b83b48',
      2.4
    );
  } else {
    drawSVGPath(ctx, `M${-8 + fx},11 Q${fx},17 ${8 + fx},11`, null, '#b83b48', 2.8);
  }

  ctx.restore();
}

// Helper: Draw a 2-Segment Articulated Limb (Shoulder -> Elbow -> Wrist/Hand + Optional DSLR)
function drawArticulatedArm(
  ctx,
  sx,
  sy,
  upperLen,
  foreLen,
  shoulderAng,
  elbowAng,
  sleeveColor,
  skinColor,
  hasBangles = false,
  holdCamera = false,
  hasPearlCuff = false,
  hasWhiteShirtCuff = false
) {
  const ex = sx + Math.sin(shoulderAng) * upperLen;
  const ey = sy + Math.cos(shoulderAng) * upperLen;
  const totalAng = shoulderAng + elbowAng;
  const wx = ex + Math.sin(totalAng) * foreLen;
  const wy = ey + Math.cos(totalAng) * foreLen;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = sleeveColor;
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.strokeStyle = hasWhiteShirtCuff ? sleeveColor : skinColor;
  ctx.lineWidth = hasWhiteShirtCuff ? 20 : 18;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(wx, wy);
  ctx.stroke();

  if (hasWhiteShirtCuff) {
    ctx.strokeStyle = '#d8e8f2';
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(wx - Math.sin(totalAng) * 7, wy - Math.cos(totalAng) * 7);
    ctx.lineTo(wx, wy);
    ctx.stroke();
  }

  if (hasBangles) {
    ctx.strokeStyle = hasPearlCuff ? '#f8fafc' : '#d5ae64';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(wx - Math.sin(totalAng) * 10, wy - Math.cos(totalAng) * 10);
    ctx.lineTo(wx - Math.sin(totalAng) * 4, wy - Math.cos(totalAng) * 4);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(-totalAng);

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.ellipse(0, 6, 9.5, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  if (holdCamera) {
    ctx.save();
    ctx.rotate(totalAng * 0.75);
    drawSVGPath(ctx, 'M-12,2 Q-24,24 -6,34', null, '#62694b', 3);
    ctx.fillStyle = '#1b1e24';
    ctx.beginPath();
    ctx.roundRect(10, -14, 34, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#d5ae64';
    ctx.fillRect(34, -14, 4, 22);
    ctx.fillStyle = '#e6d6a8';
    ctx.fillRect(41, -11, 3, 16);
    ctx.fillStyle = '#282c34';
    ctx.beginPath();
    ctx.roundRect(-22, -22, 38, 34, 6);
    ctx.fill();
    drawSVGPath(ctx, 'M-14,-22 L-6,-32 L8,-32 L14,-22 Z', '#1b1e24');
    ctx.fillStyle = '#d4dae2';
    ctx.fillRect(-18, -26, 7, 4);
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(8, -12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d5ae64';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-2, -4, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  return { wx, wy };
}

// ============================================================================
// 4. MALE CHARACTER SVG (`19549239.webp` Reference)
// ============================================================================
const profCanvas = document.createElement('canvas');
profCanvas.width = 400;
profCanvas.height = 580;
const profCtx = profCanvas.getContext('2d');
const profTex = new THREE.CanvasTexture(profCanvas);

function renderManMultiAngle({
  relAngle = 0,
  walkPhase = 0,
  walkAmt = 0,
  leftShoulder = -0.35,
  leftElbow = 0.65,
  rightShoulder = 0.55,
  rightElbow = 0.85,
  holdCamera = false
}) {
  const ctx = profCtx;
  ctx.clearRect(0, 0, 400, 580);

  const isBackView = Math.abs(relAngle) > Math.PI * 0.55;
  const turnX = Math.sin(relAngle) * 18;
  const bounce = Math.abs(Math.sin(walkPhase)) * 10 * walkAmt;
  const legSwing = Math.sin(walkPhase) * 22 * walkAmt;

  ctx.save();
  ctx.translate(0, -bounce);

  const lLegY = legSwing * 0.5;
  const rLegY = -legSwing * 0.5;

  drawSVGPath(ctx, `M${150 + legSwing * 0.2},342 L${148 - legSwing * 0.3},${524 + lLegY} L${184 - legSwing * 0.3},${524 + lLegY} L196,342 Z`, '#522120');
  drawSVGPath(ctx, `M${130 - legSwing * 0.3},${520 + lLegY} C118,${520 + lLegY} 114,${544 + lLegY} 128,${546 + lLegY} L${186 - legSwing * 0.3},${546 + lLegY} L${186 - legSwing * 0.3},${520 + lLegY} Z`, '#5e2c24');

  drawSVGPath(ctx, `M204,342 L${216 + legSwing * 0.3},${524 + rLegY} L${252 + legSwing * 0.3},${524 + rLegY} L${250 - legSwing * 0.2},342 Z`, '#451a19');
  drawSVGPath(ctx, `M${214 + legSwing * 0.3},${520 + rLegY} L${272 + legSwing * 0.3},${520 + rLegY} C286,${520 + rLegY} 282,${544 + rLegY} 270,${546 + rLegY} L${214 + legSwing * 0.3},${546 + rLegY} Z`, '#5e2c24');

  const drawArms = () => {
    drawArticulatedArm(ctx, 140 + turnX * 0.3, 210, 62, 58, leftShoulder, leftElbow, '#1d2d44', '#f3b69b', false, false, false, true);
    drawArticulatedArm(ctx, 260 + turnX * 0.3, 210, 62, 58, rightShoulder, rightElbow, '#1d2d44', '#f3b69b', false, holdCamera && !isBackView, false, true);
  };

  if (isBackView) drawArms();

  if (!isBackView) {
    drawSVGPath(ctx, 'M158,192 L242,192 L238,346 L162,346 Z', '#d8e8f2');
    drawSVGPath(ctx, `M${200 + turnX * 0.4},210 L${200 + turnX * 0.4},344`, null, '#bfd4e3', 2);
    drawSVGPath(
      ctx,
      `M174,186 L${194 + turnX * 0.35},216 L168,212 Z M226,186 L${206 + turnX * 0.35},216 L232,212 Z`,
      '#eef6fa',
      '#bfd4e3',
      1.5
    );

    ctx.fillStyle = '#3d1e18';
    ctx.fillRect(156, 338, 88, 12);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.8;
    ctx.strokeRect(191 + turnX * 0.35, 337, 18, 14);

    drawSVGPath(
      ctx,
      `M134,198 L174,188 L${184 + turnX * 0.35},354 L140,354 Z`,
      '#1d2d44'
    );
    drawSVGPath(
      ctx,
      `M266,198 L226,188 L${216 + turnX * 0.35},354 L260,354 Z`,
      '#1d2d44'
    );

    drawSVGPath(
      ctx,
      `M174,188 L154,230 L165,234 L158,246 L${182 + turnX * 0.35},292 L${182 + turnX * 0.35},212 Z`,
      '#142032',
      '#2c405e',
      1.5
    );
    drawSVGPath(
      ctx,
      `M226,188 L246,230 L235,234 L242,246 L${218 + turnX * 0.35},292 L${218 + turnX * 0.35},212 Z`,
      '#142032',
      '#2c405e',
      1.5
    );
    ctx.fillStyle = '#2b3e59';
    ctx.fillRect(224, 244, 24, 6);
    ctx.fillRect(144, 306, 30, 11);
    ctx.fillRect(226, 306, 30, 11);
  } else {
    drawSVGPath(ctx, 'M168,186 L232,186 L236,200 L164,200 Z', '#d8e8f2');
    drawSVGPath(ctx, 'M134,198 L266,198 L258,354 L142,354 Z', '#1d2d44');
    drawSVGPath(ctx, 'M200,200 L200,354', null, '#142032', 2.5);
  }

  if (!isBackView) drawArms();

  ctx.fillStyle = '#e09d80';
  ctx.fillRect(184 + turnX * 0.3, 168, 32, 28);
  drawSVGPath(ctx, `M182,186 L${200 + turnX * 0.35},212 L218,186 Z`, '#f3b69b');

  [148 + turnX * 0.4, 252 + turnX * 0.4].forEach((ex) => {
    ctx.fillStyle = '#f3b69b';
    ctx.beginPath();
    ctx.ellipse(ex, 126, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  drawSVGPath(
    ctx,
    `M${152 + turnX * 0.4},88 C${152 + turnX * 0.4},60 170,52 200,52 C230,52 ${248 + turnX * 0.4},60 ${248 + turnX * 0.4},88 L${248 + turnX * 0.4},142 C${248 + turnX * 0.4},172 228,186 200,186 C172,186 ${152 + turnX * 0.4},172 ${152 + turnX * 0.4},142 Z`,
    '#f3b69b'
  );

  if (!isBackView) {
    const fx = turnX * 0.65;

    ctx.fillStyle = 'rgba(228, 128, 108, 0.38)';
    ctx.beginPath();
    ctx.arc(168 + fx, 128, 9.5, 0, Math.PI * 2);
    ctx.arc(232 + fx, 128, 9.5, 0, Math.PI * 2);
    ctx.fill();

    [178 + fx, 222 + fx].forEach((ex) => {
      ctx.fillStyle = '#18181d';
      ctx.beginPath();
      ctx.arc(ex, 112, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + 1.4, 110.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });

    drawSVGPath(ctx, `M${166 + fx},98 Q${178 + fx},92 ${189 + fx},97`, null, '#18181d', 4.2);
    drawSVGPath(ctx, `M${211 + fx},97 Q${222 + fx},92 ${234 + fx},98`, null, '#18181d', 4.2);

    drawSVGPath(ctx, `M${200 + fx},110 L${200 + fx},127 Q${204 + fx},130 ${206 + fx},127`, null, '#d4886a', 3.0);

    drawSVGPath(
      ctx,
      `M${151 + turnX * 0.4},122 C${150 + turnX * 0.4},168 170,187 ${200 + fx * 0.4},187 C230,187 ${250 + turnX * 0.4},168 ${249 + turnX * 0.4},122 L${240 + fx * 0.4},122 L${238 + fx * 0.4},142 Q${200 + fx * 0.5},132 ${162 + fx * 0.4},142 L${160 + fx * 0.4},122 Z`,
      '#18181d'
    );

    drawSVGPath(
      ctx,
      `M${180 + fx},146 L${220 + fx},146 C${218 + fx},164 ${182 + fx},164 ${180 + fx},146 Z`,
      '#ffffff'
    );

    drawSVGPath(
      ctx,
      `M${150 + turnX * 0.4},118 L${148 + turnX * 0.4},82 C146,52 168,38 202,40 C228,42 252,52 252,78 L${250 + turnX * 0.4},118 L${242 + turnX * 0.4},118 L${242 + turnX * 0.4},84 C228,74 176,74 ${158 + turnX * 0.4},84 L${158 + turnX * 0.4},118 Z`,
      '#16161b'
    );
    drawSVGPath(
      ctx,
      `M${162 + turnX * 0.4},52 C168,32 198,32 222,44 C204,54 176,56 ${162 + turnX * 0.4},52 Z`,
      '#16161b'
    );
  } else {
    drawSVGPath(
      ctx,
      `M${148 + turnX * 0.3},128 C144,58 168,38 200,38 C232,38 256,58 ${252 + turnX * 0.3},128 C244,154 226,166 200,166 C174,166 156,154 ${148 + turnX * 0.3},128 Z`,
      '#16161b'
    );
  }

  ctx.restore();
  profTex.needsUpdate = true;
}

// ============================================================================
// 5. MULTI-ANGLE ARTICULATED KATHAK LEAD DANCER
// ============================================================================
const kathakCanvas = document.createElement('canvas');
kathakCanvas.width = 440;
kathakCanvas.height = 620;
const kathakCtx = kathakCanvas.getContext('2d');
const kathakTex = new THREE.CanvasTexture(kathakCanvas);

function renderKathakMultiAngle({
  relAngle = 0,
  danceTime = 0,
  danceBlend = 1.0,
  walkPhase = 0,
  walkAmt = 0
}) {
  const ctx = kathakCtx;
  ctx.clearRect(0, 0, 440, 620);

  const isBackView = Math.abs(relAngle) > Math.PI * 0.55;
  const turnX = Math.sin(relAngle) * 18;

  const tatkarBounce = Math.abs(Math.sin(danceTime * 3.8)) * 12 * danceBlend;
  const walkBounce = Math.abs(Math.sin(walkPhase)) * 9 * walkAmt;
  const skirtSway = Math.sin(danceTime * 3.8) * 14 * danceBlend + Math.sin(walkPhase) * 8 * walkAmt;

  ctx.save();
  ctx.translate(0, -(tatkarBounce + walkBounce));

  const footStep = Math.sin(danceTime * 3.8) * 14 * danceBlend + Math.sin(walkPhase) * 18 * walkAmt;

  ctx.save();
  ctx.translate(-footStep * 0.3, footStep * 0.5);
  drawSVGPath(ctx, 'M198,452 L194,536 L220,558 L228,548 L216,528 L222,452 Z', '#e5ab7d');
  drawSVGPath(ctx, 'M195,448 L222,448 L218,512 L192,512 Z', '#f4f1ea');
  ctx.fillStyle = '#d5ae64';
  ctx.fillRect(190, 506, 28, 13);
  ctx.restore();

  ctx.save();
  ctx.translate(footStep * 0.3, -footStep * 0.5);
  drawSVGPath(ctx, 'M226,452 L254,514 L248,546 L260,548 L272,512 L244,452 Z', '#e5ab7d');
  drawSVGPath(ctx, 'M224,448 L248,448 L264,498 L242,506 Z', '#f4f1ea');
  ctx.fillStyle = '#d5ae64';
  ctx.fillRect(240, 496, 28, 13);
  ctx.restore();

  const rShoulderAng = lerp(0.32 + Math.sin(walkPhase) * 0.25 * walkAmt, -2.35 + Math.sin(danceTime * 3.8) * 0.18, danceBlend);
  const rElbowAng = lerp(0.45, -1.15, danceBlend);
  const lShoulderAng = lerp(-0.32 - Math.sin(walkPhase) * 0.25 * walkAmt, 1.35 + Math.cos(danceTime * 3.8) * 0.18, danceBlend);
  const lElbowAng = lerp(-0.45, -1.05, danceBlend);

  const drawDancerArms = () => {
    drawArticulatedArm(ctx, 188 + turnX * 0.3, 196, 62, 58, rShoulderAng, rElbowAng, '#f4f1ea', '#e5ab7d', true, false);
    drawArticulatedArm(ctx, 252 + turnX * 0.3, 196, 62, 58, lShoulderAng, lElbowAng, '#f4f1ea', '#e5ab7d', true, false);
  };

  if (isBackView) drawDancerArms();

  drawSVGPath(
    ctx,
    `M242,188 C284,242 ${320 + skirtSway},295 ${324 + skirtSway},358 C300,378 272,354 248,280 Z`,
    '#62694b',
    '#d5ae64',
    2
  );

  drawSVGPath(
    ctx,
    `M186,262 L254,262 L${342 + skirtSway},446 C262,496 178,496 ${98 + skirtSway},446 Z`,
    '#f4f1ea',
    '#d5ae64',
    2.2
  );
  drawSVGPath(
    ctx,
    `M${101 + skirtSway},434 C178,484 262,484 ${339 + skirtSway},434 L${343 + skirtSway},448 C262,498 178,498 ${97 + skirtSway},448 Z`,
    '#d5ae64'
  );
  [-45, -15, 15, 45].forEach((px) => {
    drawSVGPath(ctx, `M${220 + px * 0.45},264 L${220 + px * 1.9 + skirtSway * 0.8},456`, null, '#c2c4b6', 1.8);
  });

  if (!isBackView) {
    drawSVGPath(ctx, 'M182,186 L258,186 L254,262 L186,262 Z', '#f4f1ea', '#d5ae64', 2);
    drawSVGPath(ctx, 'M236,184 L260,188 L226,262 L194,262 Z', '#62694b');
    drawSVGPath(ctx, 'M184,254 L256,254 L256,266 L184,266 Z', '#d5ae64');
  } else {
    drawSVGPath(ctx, 'M182,186 L258,186 L254,262 L186,262 Z', '#ebe6da', '#d5ae64', 2);
    drawSVGPath(ctx, 'M202,186 C202,225 238,225 238,186 Z', '#e5ab7d');
    drawSVGPath(ctx, 'M200,194 L240,194 M220,194 L214,230 M220,194 L226,230', null, '#d5ae64', 2.5);
    ctx.fillStyle = '#d5ae64';
    ctx.beginPath();
    ctx.arc(214, 232, 5, 0, Math.PI * 2);
    ctx.arc(226, 232, 5, 0, Math.PI * 2);
    ctx.fill();
    drawSVGPath(ctx, 'M194,186 L222,186 L256,262 L228,262 Z', '#62694b');
    drawSVGPath(ctx, 'M184,254 L256,254 L256,266 L184,266 Z', '#d5ae64');
  }

  if (!isBackView) drawDancerArms();

  ctx.fillStyle = '#e5ab7d';
  ctx.fillRect(208 + turnX * 0.25, 160, 24, 28);

  if (!isBackView) {
    ctx.fillStyle = '#141418';
    ctx.beginPath();
    ctx.arc(192 + turnX * 0.2, 126, 24, 0, Math.PI * 2);
    ctx.fill();
    [112, 126, 140].forEach((fy) => {
      ctx.fillStyle = '#fffdf6';
      ctx.beginPath();
      ctx.arc(173 + turnX * 0.2, fy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    drawSVGPath(ctx, `M${202 + turnX * 0.3},180 Q${220 + turnX * 0.3},196 ${238 + turnX * 0.3},180`, null, '#d5ae64', 5);
    ctx.fillStyle = '#d5ae64';
    ctx.beginPath();
    ctx.arc(192 + turnX * 0.4, 142, 5.5, 0, Math.PI * 2);
    ctx.arc(252 + turnX * 0.4, 142, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(222 + turnX * 0.45, 132);
    ctx.rotate(0.08 + Math.sin(danceTime * 1.9) * 0.07 * danceBlend);

    ctx.fillStyle = '#e8b288';
    ctx.beginPath();
    ctx.ellipse(0, 0, 29, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    drawSVGPath(ctx, 'M-29,-8 C-26,-42 26,-42 29,-8 C16,-24 -16,-24 -29,-8 Z', '#141418');
    ctx.fillStyle = '#d5ae64';
    ctx.beginPath();
    ctx.arc(turnX * 0.2, -21, 5, 0, Math.PI * 2);
    ctx.fill();

    drawExpressiveFemaleFace(ctx, 0, 2, turnX, 1.0, '#8c2424', true);
    ctx.restore();
  } else {
    ctx.fillStyle = '#141418';
    ctx.beginPath();
    ctx.ellipse(220, 128, 30, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      ctx.fillStyle = '#fffdf6';
      ctx.beginPath();
      ctx.arc(220 + Math.cos(a) * 22, 134 + Math.sin(a) * 22, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#0c0c10';
    ctx.beginPath();
    ctx.arc(220, 134, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  kathakTex.needsUpdate = true;
}

// ============================================================================
// 6. MULTI-ANGLE ARTICULATED TROUPE DANCERS (OLIVE-SAGE, IVORY & GOLD PALETTE)
// ============================================================================
function createAnimatedTroupeDancer(skirtHex, blouseHex, dupattaHex, dotHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);

  const geo = new THREE.PlaneGeometry(1.45, 2.15);
  geo.translate(0, 1.075, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);

  function updateDancer(relAngle, time, phaseOffset) {
    ctx.clearRect(0, 0, 360, 540);
    const isBack = Math.abs(relAngle) > Math.PI * 0.55;
    const t = time * 3.4 + phaseOffset;
    const bounce = Math.abs(Math.sin(t)) * 10;
    const sway = Math.sin(t) * 12;
    const armWave = Math.sin(t) * 0.25;

    ctx.save();
    ctx.translate(0, -bounce);

    ctx.fillStyle = '#e09f7d';
    ctx.beginPath();
    ctx.ellipse(152 - sway * 0.3, 492 + Math.sin(t) * 6, 16, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(208 + sway * 0.3, 492 - Math.sin(t) * 6, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    drawArticulatedArm(ctx, 148, 185, 55, 52, -2.1 + armWave, -0.8, blouseHex, '#e09f7d', true, false);
    drawArticulatedArm(ctx, 212, 185, 55, 52, 2.1 + armWave, 0.8, blouseHex, '#e09f7d', true, false);

    drawSVGPath(ctx, `M148,242 L212,242 L${312 + sway},442 C225,492 135,492 ${48 + sway},442 Z`, skirtHex);
    drawSVGPath(
      ctx,
      `M${51 + sway},426 C135,476 225,476 ${309 + sway},426 L${313 + sway},442 C225,492 135,492 ${47 + sway},442 Z`,
      dupattaHex
    );

    ctx.fillStyle = dotHex;
    for (let r = 0; r < 3; r++) {
      for (let c = -2; c <= 2; c++) {
        ctx.beginPath();
        ctx.ellipse(180 + c * (20 + r * 7) + sway * 0.4, 298 + r * 40, 3.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawSVGPath(ctx, 'M144,174 L216,174 L208,242 L152,242 Z', blouseHex);
    if (!isBack) {
      drawSVGPath(ctx, `M146,174 L186,174 L${238 + sway * 0.5},345 L${198 + sway * 0.5},355 Z`, dupattaHex);
    } else {
      drawSVGPath(ctx, 'M164,174 C164,210 196,210 196,174 Z', '#e09f7d');
      drawSVGPath(ctx, `M174,174 L214,174 L${162 + sway * 0.5},345 L${122 + sway * 0.5},335 Z`, dupattaHex);
    }
    ctx.fillStyle = '#d5ae64';
    ctx.fillRect(146, 236, 68, 9);

    if (!isBack) {
      drawSVGPath(ctx, 'M144,112 C134,150 140,185 154,205 L206,205 C220,185 226,150 216,112 Z', '#141418');
      ctx.fillStyle = '#e5ab7d';
      ctx.beginPath();
      ctx.arc(180, 120, 28, 0, Math.PI * 2);
      ctx.fill();
      drawSVGPath(ctx, 'M152,116 C152,80 208,80 208,116 C194,100 166,100 152,116 Z', '#141418');
      drawExpressiveFemaleFace(ctx, 180, 124, 0, 0.88, '#8c2424', true);
      drawSVGPath(ctx, 'M164,170 Q180,190 196,170', null, '#d5ae64', 2.8);
    } else {
      drawSVGPath(ctx, 'M146,110 C138,155 146,205 160,225 L200,225 C214,205 222,155 214,110 Z', '#121216');
      ctx.fillStyle = '#fffdf6';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.arc(180 + Math.cos(a) * 18, 124 + Math.sin(a) * 18, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#0c0c10';
      ctx.beginPath();
      ctx.arc(180, 124, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    tex.needsUpdate = true;
  }

  return { mesh, updateDancer };
}

// ============================================================================
// 7. MULTI-ANGLE ARTICULATED BRIDE & GROOM
// ============================================================================
const weddingCanvas = document.createElement('canvas');
weddingCanvas.width = 540;
weddingCanvas.height = 620;
const weddingCtx = weddingCanvas.getContext('2d');
const weddingTex = new THREE.CanvasTexture(weddingCanvas);

function renderWeddingCoupleMultiAngle(relAngle = 0, walkPhase = 0, walkAmt = 0) {
  const ctx = weddingCtx;
  ctx.clearRect(0, 0, 540, 620);

  const isBackView = Math.abs(relAngle) > Math.PI * 0.52;
  const turnX = Math.sin(relAngle) * 14;
  const bounce = Math.abs(Math.sin(walkPhase)) * 8 * walkAmt;
  const legStep = Math.sin(walkPhase) * 16 * walkAmt;

  ctx.save();
  ctx.translate(0, -bounce);

  if (isBackView) {
    ctx.translate(540, 0);
    ctx.scale(-1, 1);
  }

  // ================= GROOM (WORLD LEFT) =================
  const gFootL = legStep * 0.5;
  const gFootR = -legStep * 0.5;

  ctx.fillStyle = '#3b2019';
  ctx.beginPath();
  ctx.ellipse(156, 544 + gFootL, 15, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(204, 544 + gFootR, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSVGPath(
    ctx,
    `M140,356 L220,356 L214,${538 + gFootR} L190,${538 + gFootR} L180,408 L170,${538 + gFootL} L146,${538 + gFootL} Z`,
    '#1d2d44'
  );

  drawArticulatedArm(ctx, 126, 224, 62, 58, -0.12 + legStep * 0.008, 0.15, '#1d2d44', '#f3b69b', false, false, false, true);
  drawArticulatedArm(ctx, 232, 224, 64, 62, 0.34, 0.22, '#1d2d44', '#f3b69b', false, false, false, true);

  if (!isBackView) {
    drawSVGPath(ctx, 'M156,210 L204,210 L180,308 Z', '#ffffff');
    drawSVGPath(ctx, 'M174,218 L186,218 L190,282 L180,298 L170,282 Z', '#62694b');
    drawSVGPath(
      ctx,
      'M124,214 L156,208 L180,292 L204,208 L236,214 L230,352 C230,366 192,366 180,348 C168,366 130,366 130,352 Z',
      '#1d2d44'
    );
    drawSVGPath(ctx, 'M156,208 L142,242 L152,246 L146,256 L180,292 Z', '#142032');
    drawSVGPath(ctx, 'M204,208 L218,242 L208,246 L214,256 L180,292 Z', '#142032');
    ctx.fillStyle = '#62694b';
    ctx.beginPath();
    ctx.arc(148, 250, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.arc(150, 248, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawSVGPath(ctx, 'M160,204 L200,204 L204,216 L156,216 Z', '#ffffff');
    drawSVGPath(ctx, 'M124,212 L236,212 L230,366 L130,366 Z', '#162336');
    drawSVGPath(ctx, 'M180,214 L180,366', null, '#0f1826', 2.5);
  }

  ctx.fillStyle = '#e09d80';
  ctx.fillRect(168, 188, 24, 26);

  drawSVGPath(
    ctx,
    `M${138 + turnX * 0.3},102 C${138 + turnX * 0.3},76 154,68 180,68 C206,68 ${222 + turnX * 0.3},76 ${222 + turnX * 0.3},102 L${222 + turnX * 0.3},150 C${222 + turnX * 0.3},176 204,188 180,188 C156,188 ${138 + turnX * 0.3},176 ${138 + turnX * 0.3},150 Z`,
    '#f3b69b'
  );

  if (!isBackView) {
    const gx = turnX * 0.5;
    ctx.fillStyle = 'rgba(228, 128, 108, 0.36)';
    ctx.beginPath();
    ctx.arc(152 + gx, 136, 8.5, 0, Math.PI * 2);
    ctx.arc(208 + gx, 136, 8.5, 0, Math.PI * 2);
    ctx.fill();

    [160 + gx, 200 + gx].forEach((ex) => {
      ctx.fillStyle = '#18181d';
      ctx.beginPath();
      ctx.arc(ex, 122, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + 1.2, 120.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
    drawSVGPath(ctx, `M${150 + gx},109 Q${160 + gx},104 ${170 + gx},108`, null, '#18181d', 3.8);
    drawSVGPath(ctx, `M${190 + gx},108 Q${200 + gx},104 ${210 + gx},109`, null, '#18181d', 3.8);

    drawSVGPath(ctx, `M${180 + gx},120 L${180 + gx},135 Q${184 + gx},138 ${186 + gx},135`, null, '#d4886a', 2.6);

    drawSVGPath(
      ctx,
      `M${137 + turnX * 0.3},132 C${136 + turnX * 0.3},172 154,189 ${180 + gx * 0.4},189 C206,189 ${224 + turnX * 0.3},172 ${223 + turnX * 0.3},132 L${215 + gx * 0.4},132 L${213 + gx * 0.4},148 Q${180 + gx * 0.5},140 ${147 + gx * 0.4},148 L${145 + gx * 0.4},132 Z`,
      '#18181d'
    );
    drawSVGPath(
      ctx,
      `M${163 + gx},152 L${197 + gx},152 C${195 + gx},168 ${165 + gx},168 ${163 + gx},152 Z`,
      '#ffffff'
    );

    drawSVGPath(
      ctx,
      `M${136 + turnX * 0.3},128 L${134 + turnX * 0.3},94 C132,68 152,54 182,56 C206,58 226,66 226,90 L${224 + turnX * 0.3},128 L${217 + turnX * 0.3},128 L${217 + turnX * 0.3},96 C204,86 158,86 ${143 + turnX * 0.3},96 L${143 + turnX * 0.3},128 Z`,
      '#16161b'
    );
    drawSVGPath(
      ctx,
      `M${146 + turnX * 0.3},68 C152,50 178,50 200,60 C184,70 160,72 ${146 + turnX * 0.3},68 Z`,
      '#16161b'
    );
  } else {
    drawSVGPath(
      ctx,
      `M${134 + turnX * 0.3},138 C130,72 152,54 180,54 C208,54 230,72 ${226 + turnX * 0.3},138 C218,162 202,172 180,172 C158,172 142,162 ${134 + turnX * 0.3},138 Z`,
      '#16161b'
    );
  }

  // ================= BRIDE (WORLD RIGHT) =================
  const gownSway = Math.sin(walkPhase) * 8 * walkAmt;

  if (!isBackView) {
    drawSVGPath(ctx, 'M312,124 C302,184 308,244 322,284 L418,284 C432,244 438,184 428,124 Z', '#141418');
  }

  drawArticulatedArm(ctx, 334, 224, 62, 60, -0.42, -0.25, '#ffffff', '#f7cbb2', true, false, true);
  const rightHandPos = drawArticulatedArm(ctx, 406, 224, 58, 56, 0.35, -0.85, '#ffffff', '#f7cbb2', true, false, true);

  ctx.fillStyle = '#f5bfa6';
  ctx.beginPath();
  ctx.arc(272, 342, 13, 0, Math.PI * 2);
  ctx.fill();

  drawSVGPath(
    ctx,
    `M332,216 L408,216 L398,284 L${482 + gownSway},550 C405,578 335,578 ${268 + gownSway},550 L342,284 Z`,
    '#ffffff',
    '#d8d7dc',
    3
  );

  drawSVGPath(
    ctx,
    `M352,286 L${316 + gownSway},552 M370,286 L${375 + gownSway},560 M388,286 L${438 + gownSway},552`,
    null,
    '#e2e8f0',
    2.5
  );

  for (let px = 342; px <= 398; px += 7) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d5ae64';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, 284, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  for (let px = 338; px <= 402; px += 8) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d5ae64';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(px, 222 + Math.sin(((px - 338) / 64) * Math.PI) * 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  const pearlColumns = [-0.7, -0.35, 0, 0.35, 0.7];
  for (let r = 1; r <= 7; r++) {
    const py = 295 + r * 34;
    const halfWidth = lerp(28, 98, r / 7);
    pearlColumns.forEach((colFactor) => {
      const px = 370 + colFactor * halfWidth + gownSway * (r / 7);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, r === 7 ? 4.2 : 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  const bx = isBackView ? 418 : rightHandPos.wx - 8;
  const by = isBackView ? 318 : rightHandPos.wy + 8;
  ctx.save();
  ctx.translate(bx, by);
  drawSVGPath(ctx, 'M-6,12 L6,12 L10,38 L-10,38 Z', '#f4f1ea', '#d5ae64', 2);
  drawSVGPath(ctx, 'M-28,-8 C-38,-28 -10,-42 0,-28 C10,-42 38,-28 28,-8 C36,12 12,24 0,18 C-12,24 -36,12 -28,-8 Z', '#62694b');
  [
    [-12, -12, 12, '#ffffff'],
    [12, -10, 12, '#f4f1ea'],
    [0, -20, 13, '#ffffff'],
    [-14, 4, 11, '#c2c4b6'],
    [14, 5, 11, '#f4f1ea'],
    [0, 0, 14, '#fffdf9']
  ].forEach(([rx, ry, rr, rcol]) => {
    ctx.fillStyle = rcol;
    ctx.strokeStyle = '#d5ae64';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle = '#f7cbb2';
  ctx.fillRect(358, 190, 24, 28);
  ctx.beginPath();
  ctx.ellipse(370 + turnX * 0.3, 140, 50, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!isBackView) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d5ae64';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(318, 152, 5.5, 0, Math.PI * 2);
    ctx.arc(422, 152, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawExpressiveFemaleFace(ctx, 370 + turnX * 0.35, 146, turnX, 1.35, '#d5ae64', true);

    drawSVGPath(
      ctx,
      'M318,132 C318,76 355,60 392,66 C422,70 430,100 422,136 C410,106 388,100 355,104 C332,106 324,118 318,132 Z',
      '#141418'
    );
    for (let a = 0.2; a <= Math.PI - 0.2; a += Math.PI / 7) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(370 - Math.cos(a) * 42, 96 - Math.sin(a) * 18, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    drawSVGPath(
      ctx,
      'M316,125 C312,72 342,58 370,58 C398,58 428,72 424,125 C436,185 432,255 414,302 C385,318 355,318 326,302 C308,255 304,185 316,125 Z',
      '#141418'
    );
    drawSVGPath(
      ctx,
      'M342,110 Q328,165 346,220 Q362,265 344,295 M370,105 Q355,165 374,225 Q390,265 372,300 M398,110 Q384,165 402,220 Q416,265 398,295',
      null,
      '#2c2c36',
      3.5
    );
    [342, 356, 370, 384, 398].forEach((fx, i) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fx, 138 + Math.sin(i) * 3, 6.5, 0, Math.PI * 2);
      ctx.fill();
    });
    drawSVGPath(
      ctx,
      `M335,142 L405,142 L${458 + gownSway},490 C395,515 345,515 ${292 + gownSway},490 Z`,
      'rgba(255, 255, 255, 0.42)',
      'rgba(226, 232, 240, 0.7)',
      2
    );
  }

  ctx.restore();
  weddingTex.needsUpdate = true;
}
renderWeddingCoupleMultiAngle(0, 0, 0);

// Instantiate Standee Meshes
function makeStandeeMesh(tex, w, h) {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.04,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(geo, mat);
}

const manStandee = makeStandeeMesh(profTex, 1.48, 2.15);
const ladyStandee = makeStandeeMesh(kathakTex, 1.58, 2.15);
const weddingCoupleStandee = makeStandeeMesh(weddingTex, 2.15, 2.35);
weddingCoupleStandee.visible = false;
scene.add(manStandee, ladyStandee, weddingCoupleStandee);

// Instantiate 5 Troupe Dancers on Stage in Coordinated Olive-Sage, Ivory & Gold Palette
const troupeGroup = new THREE.Group();
scene.add(troupeGroup);
const troupeSpecs = [
  { x: -2.9, z: -7.4, s: '#62694b', b: '#3e442f', d: '#d5ae64', dot: '#f4f1ea' },
  { x: -1.5, z: -7.9, s: '#c2c4b6', b: '#62694b', d: '#f4f1ea', dot: '#62694b' },
  { x: 0.0,  z: -8.2, s: '#d5ae64', b: '#62694b', d: '#f4f1ea', dot: '#3e442f' },
  { x: 1.5,  z: -7.9, s: '#c2c4b6', b: '#62694b', d: '#d5ae64', dot: '#62694b' },
  { x: 2.9,  z: -7.4, s: '#62694b', b: '#3e442f', d: '#f4f1ea', dot: '#d5ae64' }
];
const troupeDancers = troupeSpecs.map((sp) => {
  const d = createAnimatedTroupeDancer(sp.s, sp.b, sp.d, sp.dot);
  d.mesh.position.set(sp.x, 0.36, sp.z);
  troupeGroup.add(d.mesh);
  return d;
});

// ============================================================================
// 8. SHARED 3D CEILING LIGHT CHANDELIER BUILDER (FOR SCENE 6 -> 7 MATCH-CUT)
// ============================================================================
function createCeilingMatchCutLight() {
  const group = new THREE.Group();

  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.12, 24), envMats.gold);
  medallion.position.y = 0.7;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12), envMats.gold);
  rod.position.y = 0.35;

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.055, 12, 32), envMats.gold);
  outerRing.rotation.x = Math.PI / 2;
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 12, 24), envMats.gold);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = -0.18;

  const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), envMats.lampGlow);
  coreOrb.position.y = -0.1;

  const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(1.45, 32), envMats.haloGlow);
  haloDisc.rotation.x = Math.PI / 2;
  haloDisc.position.y = -0.02;

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), envMats.lampGlow);
    bulb.position.set(Math.cos(a) * 0.85, 0.06, Math.sin(a) * 0.85);
    group.add(bulb);
  }

  group.add(medallion, rod, outerRing, innerRing, coreOrb, haloDisc);
  return group;
}

// ============================================================================
// 9. DEEPER 3D CONCERT STAGE (`z = -7.2`) + AUDITORIUM CEILING + CEILING LIGHT
// ============================================================================
const stageSet = new THREE.Group();
scene.add(stageSet);

const stageDeck = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.36, 4.4), envMats.woodStage);
stageDeck.position.set(0, 0.18, -7.2);
stageDeck.receiveShadow = true;
stageSet.add(stageDeck);

const ledCanvas = document.createElement('canvas');
ledCanvas.width = 512;
ledCanvas.height = 256;
const ledCtx = ledCanvas.getContext('2d');
const ledGrad = ledCtx.createLinearGradient(0, 0, 512, 256);
ledGrad.addColorStop(0, '#2c3022');
ledGrad.addColorStop(0.5, '#62694b');
ledGrad.addColorStop(1, '#c59b4e');
ledCtx.fillStyle = ledGrad;
ledCtx.fillRect(0, 0, 512, 256);
for (let w = 0; w < 4; w++) {
  ledCtx.strokeStyle = w % 2 === 0 ? 'rgba(244,241,234,0.78)' : 'rgba(213,174,100,0.75)';
  ledCtx.lineWidth = 6;
  ledCtx.beginPath();
  for (let x = 0; x <= 512; x += 16) {
    const y = 128 + Math.sin(x * 0.02 + w * 1.2) * (35 + w * 10);
    if (x === 0) ledCtx.moveTo(x, y);
    else ledCtx.lineTo(x, y);
  }
  ledCtx.stroke();
}
const ledTex = new THREE.CanvasTexture(ledCanvas);

const ledWallScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(8.2, 4.0),
  new THREE.MeshBasicMaterial({ map: ledTex, side: THREE.FrontSide })
);
ledWallScreen.position.set(0, 2.45, -9.0);
stageSet.add(ledWallScreen);

[-4.8, 4.8].forEach((xSide) => {
  for (let p = 0; p < 3; p++) {
    const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.0, 12), envMats.curtainVelvet);
    pleat.position.set(xSide + (p - 1) * 0.28, 2.8, -8.8);
    stageSet.add(pleat);
  }
});

const trussSpan = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.34, 0.34), envMats.trussMetal);
trussSpan.position.set(0, 5.35, -6.8);
stageSet.add(trussSpan);

[-5.4, 5.4].forEach((xTower) => {
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.34, 5.4, 0.34), envMats.trussMetal);
  tower.position.set(xTower, 2.7, -6.8);
  stageSet.add(tower);
});

for (let i = -3; i <= 3; i++) {
  if (i === 0) continue;
  const lx = i * 1.35;
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.3, 10), envMats.trussMetal);
  can.position.set(lx, 5.1, -6.8);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), envMats.lampGlow);
  bulb.rotation.x = Math.PI / 2;
  bulb.position.set(lx, 4.94, -6.8);

  const beamMat = new THREE.MeshBasicMaterial({
    color: i % 2 === 0 ? 0xf4f1ea : 0xd5ae64,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.8, 14, 1, true), beamMat);
  beam.position.set(lx, 2.55, -7.1);
  stageSet.add(can, bulb, beam);
}

[-4.9, 4.9].forEach((xSide) => {
  for (let b = 0; b < 4; b++) {
    const arrayBox = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.5), envMats.speakerBox);
    arrayBox.position.set(xSide, 4.65 - b * 0.31, -6.4);
    stageSet.add(arrayBox);
  }
  for (let s = 0; s < 2; s++) {
    const sub = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 0.75), envMats.speakerBox);
    sub.position.set(xSide, 0.72 + s * 0.72, -5.8);
    stageSet.add(sub);
  }
});

const auditoriumCeiling = new THREE.Mesh(new THREE.PlaneGeometry(28, 26), envMats.ceiling);
auditoriumCeiling.rotation.x = Math.PI / 2;
auditoriumCeiling.position.set(0, 6.1, -2.0);
stageSet.add(auditoriumCeiling);

for (let bz = -8.0; bz <= 6.0; bz += 2.8) {
  const beam = new THREE.Mesh(new THREE.BoxGeometry(24, 0.28, 0.35), envMats.ceilingBeam);
  beam.position.set(0, 5.95, bz);
  stageSet.add(beam);
}

const auditoriumCeilingLight = createCeilingMatchCutLight();
auditoriumCeilingLight.position.set(0, 5.35, 0.5);
stageSet.add(auditoriumCeilingLight);

// ============================================================================
// 10. SCENE 1 CLASSROOM + MINIMALIST "Digital Film Making" & CAMERA PPT BOARD
// ============================================================================
const classroomSet = new THREE.Group();
scene.add(classroomSet);

function createDigitalFilmMakingPPTSlide() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, 1024, 640);

  ctx.strokeStyle = '#62694b';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, 988, 604);

  ctx.fillStyle = '#2c3022';
  ctx.font = 'bold 68px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Digital Film Making', 512, 145);

  ctx.strokeStyle = '#d5ae64';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(312, 172);
  ctx.lineTo(712, 172);
  ctx.stroke();

  ctx.save();
  ctx.translate(512, 395);

  ctx.fillStyle = 'rgba(44, 48, 34, 0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 138, 195, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  [-82, 52].forEach((rx) => {
    ctx.fillStyle = '#2c3022';
    ctx.strokeStyle = '#d5ae64';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(rx, -112, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8f6f0';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.arc(rx + Math.cos(a) * 28, -112 + Math.sin(a) * 28, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d5ae64';
    ctx.beginPath();
    ctx.arc(rx, -112, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#2c3022';
  ctx.strokeStyle = '#62694b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-155, -58, 280, 170, 22);
  ctx.fill();
  ctx.stroke();

  drawSVGPath(
    ctx,
    'M125,-28 L168,-28 L168,82 L125,82 Z M168,-36 L235,-68 L235,122 L168,90 Z',
    '#1e2118',
    '#d5ae64',
    4
  );

  ctx.fillStyle = '#181b14';
  ctx.strokeStyle = '#d5ae64';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(-15, 28, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const lensGlass = ctx.createRadialGradient(-28, 14, 6, -15, 28, 46);
  lensGlass.addColorStop(0, '#9bd4e8');
  lensGlass.addColorStop(0.5, '#3b6978');
  lensGlass.addColorStop(1, '#16262e');
  ctx.fillStyle = lensGlass;
  ctx.beginPath();
  ctx.arc(-15, 28, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.beginPath();
  ctx.arc(-30, 12, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(82, -26, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  return new THREE.CanvasTexture(c);
}

const boardGroup = new THREE.Group();
boardGroup.position.set(-2.2, 1.62, 1.3);
boardGroup.rotation.y = 0.28;
const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.5, 0.08), envMats.trussMetal);
const boardSlideScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 1.36),
  new THREE.MeshBasicMaterial({ map: createDigitalFilmMakingPPTSlide() })
);
boardSlideScreen.position.z = 0.045;
boardGroup.add(boardFrame, boardSlideScreen);
classroomSet.add(boardGroup);

const studentCoords = [
  { x: -1.9, z: 2.9, col: '#62694b' },
  { x: 0.2,  z: 2.9, col: '#8f9478' },
  { x: 2.1,  z: 2.9, col: '#c59b4e' },
  { x: -0.9, z: 4.2, col: '#7b8262' },
  { x: 1.2,  z: 4.2, col: '#52583e' }
];

studentCoords.forEach((st) => {
  const deskGroup = new THREE.Group();
  deskGroup.position.set(st.x, 0, st.z);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.55), envMats.woodDesk);
  top.position.y = 0.76;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.76, 0.5), envMats.trussMetal);
  legL.position.set(-0.52, 0.38, 0);
  const legR = legL.clone();
  legR.position.x = 0.52;
  deskGroup.add(top, legL, legR);

  const stCanvas = document.createElement('canvas');
  stCanvas.width = 256;
  stCanvas.height = 256;
  const sCtx = stCanvas.getContext('2d');
  drawSVGPath(sCtx, 'M64,230 L64,125 C64,105 192,105 192,125 L192,230 Z', st.col);
  sCtx.fillStyle = '#141418';
  sCtx.beginPath();
  sCtx.arc(128, 72, 36, 0, Math.PI * 2);
  sCtx.fill();

  const stMesh = makeStandeeMesh(new THREE.CanvasTexture(stCanvas), 0.85, 1.15);
  stMesh.position.set(0, 0.25, 0.25);
  deskGroup.add(stMesh);
  classroomSet.add(deskGroup);
});

function createWorkstationProps() {
  const group = new THREE.Group();

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.055, 0.65), envMats.woodDesk);
  deskTop.position.set(0, 0.86, 0);
  group.add(deskTop);

  [-0.46, 0.46].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.86, 0.55), envMats.trussMetal);
    leg.position.set(x, 0.43, 0);
    group.add(leg);
  });

  const laptop = new THREE.Group();
  laptop.position.set(-0.1, 0.89, 0.02);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.30), envMats.silver);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.02), envMats.silver);
  lid.position.set(0, 0.14, -0.14);
  lid.rotation.x = -0.3;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.24), envMats.screenGlow);
  screen.position.set(0, 0.14, -0.128);
  screen.rotation.x = -0.3;
  laptop.add(base, lid, screen);
  group.add(laptop);

  const tripod = new THREE.Group();
  tripod.position.set(0.85, 0, 0.05);
  const hubY = 0.96;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), envMats.trussMetal);
  hub.position.y = hubY;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), envMats.trussMetal);
  col.position.y = hubY + 0.15;
  tripod.add(hub, col);

  for (let i = 0; i < 3; i++) {
    const yaw = new THREE.Group();
    yaw.position.set(0, hubY, 0);
    yaw.rotation.y = (i * Math.PI * 2) / 3;
    const pitch = new THREE.Group();
    pitch.rotation.x = -0.32;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.036, 1.04, 0.045), envMats.trussMetal);
    strut.position.y = -0.52;
    pitch.add(strut);
    yaw.add(pitch);
    tripod.add(yaw);
  }

  const dslr = new THREE.Group();
  dslr.position.set(0, hubY + 0.34, 0);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.15), envMats.speakerBox);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 12), envMats.speakerBox);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = -0.18;
  dslr.add(body, lens);
  tripod.add(dslr);
  group.add(tripod);

  return group;
}

const workstation = createWorkstationProps();
scene.add(workstation);

// ============================================================================
// 11. SCENE 2: 3D VERANDAH WITH OLIVE-SAGE, CYPRESS & IVORY PARALLAX GARDEN
// ============================================================================
const verandahSet = new THREE.Group();
scene.add(verandahSet);

const verandahFloor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.18, 5.2), envMats.marble);
verandahFloor.position.set(0, 0.09, 0.5);
verandahSet.add(verandahFloor);

[-5.2, -2.6, 0, 2.6, 5.2].forEach((xCol) => {
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 4.0, 14), envMats.marble);
  col.position.set(xCol, 2.1, -1.8);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.24, 0.58), envMats.marble);
  cap.position.set(xCol, 4.1, -1.8);
  verandahSet.add(col, cap);
});

const verandahBeam = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 0.65), envMats.marble);
verandahBeam.position.set(0, 4.4, -1.8);
verandahSet.add(verandahBeam);

function createBakedGardenPlane(drawFn, worldW, worldH, wPx = 1024, hPx = 320) {
  const c = document.createElement('canvas');
  c.width = wPx;
  c.height = hPx;
  drawFn(c.getContext('2d'), wPx, hPx);
  const tex = new THREE.CanvasTexture(c);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(worldW, worldH),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide })
  );
}

const parallaxFar = createBakedGardenPlane((ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 80, 0, h);
  g.addColorStop(0, 'rgba(194, 196, 182, 0.92)');
  g.addColorStop(1, 'rgba(143, 148, 120, 0.98)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) ctx.lineTo(x, 140 + Math.sin(x * 0.008) * 35);
  ctx.lineTo(w, h);
  ctx.fill();
}, 26, 6.5);
parallaxFar.position.set(0, 2.6, -7.2);

const parallaxMid = createBakedGardenPlane((ctx, w, h) => {
  [110, 260, 430, 610, 780, 920].forEach((tx, idx) => {
    ctx.fillStyle = '#4e4332';
    ctx.fillRect(tx - 10, 160, 20, 140);
    ctx.fillStyle = idx % 2 === 0 ? '#62694b' : '#858c6c';
    ctx.beginPath();
    ctx.arc(tx, 130, 68, 0, Math.PI * 2);
    ctx.arc(tx - 42, 155, 48, 0, Math.PI * 2);
    ctx.arc(tx + 42, 155, 48, 0, Math.PI * 2);
    ctx.fill();
  });
}, 22, 5.8);
parallaxMid.position.set(0, 2.5, -4.8);

const parallaxNear = createBakedGardenPlane((ctx, w, h) => {
  for (let x = 30; x < w; x += 75) {
    ctx.fillStyle = '#4e553b';
    ctx.beginPath();
    ctx.arc(x, h - 35, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.arc(x - 12, h - 55, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d5ae64';
    ctx.beginPath();
    ctx.arc(x + 18, h - 42, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}, 18, 3.2);
parallaxNear.position.set(0, 1.4, -2.8);

verandahSet.add(parallaxFar, parallaxMid, parallaxNear);

// ============================================================================
// 12. AUDITORIUM SEATING & BLURRED AUDIENCE SILHOUETTES (FOR SCENES 3 - 6)
// ============================================================================
const audienceGroup = new THREE.Group();
scene.add(audienceGroup);

const blurredGuestColors = [0x62694b, 0xc2c4b6, 0xd5ae64, 0xf4f1ea, 0x858c6c];

for (let row = 0; row < 4; row++) {
  const zRow = -1.2 + row * 1.35;
  const bench = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.42, 0.55), envMats.woodPew);
  bench.position.set(0, 0.21, zRow);
  audienceGroup.add(bench);

  if (row >= 1) {
    for (let g = -3; g <= 3; g++) {
      const guest = new THREE.Group();
      guest.position.set(g * 0.92, 0.52, zRow);
      const col = blurredGuestColors[Math.abs(row + g) % blurredGuestColors.length];
      const coreMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.52 });
      const haloMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.24 });

      const bCore = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.7, 10), coreMat);
      bCore.position.y = 0.35;
      const bHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.82, 10), haloMat);
      bHalo.position.y = 0.35;
      const hCore = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), coreMat);
      hCore.position.y = 0.88;
      const hHalo = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), haloMat);
      hHalo.position.y = 0.88;

      guest.add(bCore, bHalo, hCore, hHalo);
      audienceGroup.add(guest);
    }
  }
}

// ============================================================================
// 13. ST. THOMAS KOTTAKKAVU INTERIOR NAVE (24 STONE PILLARS & BENCH BALLOONS)
// ============================================================================
const churchSet = new THREE.Group();
scene.add(churchSet);

const churchCeiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 30), envMats.naveSkyVault);
churchCeiling.rotation.x = Math.PI / 2;
churchCeiling.position.set(0, 6.2, 2.0);
churchSet.add(churchCeiling);

const churchCeilingLight = createCeilingMatchCutLight();
churchCeilingLight.position.set(0, 5.35, 0.5);
churchSet.add(churchCeilingLight);

function createKottakkavuGeometricTileFloor() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 2048;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, 1024, 2048);

  const cols = 24;
  const rows = 48;
  const cw = 1024 / cols;
  const ch = 2048 / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const cx = (col + 0.5) * cw;
      const cy = (r + 0.5) * ch;
      const isCenterAisle = col >= 9 && col <= 14;
      const primaryDark = isCenterAisle ? '#1864ab' : '#1e2022';
      const secondaryRed = '#b84232';
      const topWhite = '#f5f0e6';

      ctx.fillStyle = topWhite;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ch * 0.5);
      ctx.lineTo(cx + cw * 0.5, cy - ch * 0.16);
      ctx.lineTo(cx, cy + ch * 0.16);
      ctx.lineTo(cx - cw * 0.5, cy - ch * 0.16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = primaryDark;
      ctx.beginPath();
      ctx.moveTo(cx - cw * 0.5, cy - ch * 0.16);
      ctx.lineTo(cx, cy + ch * 0.16);
      ctx.lineTo(cx, cy + ch * 0.5);
      ctx.lineTo(cx - cw * 0.5, cy + ch * 0.16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = secondaryRed;
      ctx.beginPath();
      ctx.moveTo(cx, cy + ch * 0.16);
      ctx.lineTo(cx + cw * 0.5, cy - ch * 0.16);
      ctx.lineTo(cx + cw * 0.5, cy + ch * 0.16);
      ctx.lineTo(cx, cy + ch * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.fillStyle = '#c89b3c';
  ctx.fillRect(9 * cw - 6, 0, 12, 2048);
  ctx.fillRect(15 * cw - 6, 0, 12, 2048);

  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(11.6, 28.5),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.02, 2.0);
  return mesh;
}
churchSet.add(createKottakkavuGeometricTileFloor());

function createUpperArcadeWallTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 2048, 512);

  const bays = 11;
  const bw = 2048 / bays;

  for (let b = 0; b < bays; b++) {
    const bx = (b + 0.5) * bw;

    ctx.fillStyle = '#e2eef8';
    ctx.beginPath();
    ctx.ellipse(bx, 95, 38, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#1b1e24';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.38, 345);
    ctx.lineTo(bx - bw * 0.38, 255);
    ctx.quadraticCurveTo(bx - bw * 0.38, 185, bx, 165);
    ctx.quadraticCurveTo(bx + bw * 0.38, 185, bx + bw * 0.38, 255);
    ctx.lineTo(bx + bw * 0.38, 345);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(bx - bw * 0.44, 302, bw * 0.88, 48);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx - bw * 0.44, 302, bw * 0.88, 48);
    ctx.fillStyle = '#1b1e24';
    for (let q = -3; q <= 3; q++) {
      const qx = bx + q * 22;
      ctx.beginPath();
      ctx.arc(qx, 326, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.42, 512);
    ctx.lineTo(bx - bw * 0.42, 425);
    ctx.quadraticCurveTo(bx - bw * 0.42, 368, bx, 355);
    ctx.quadraticCurveTo(bx + bw * 0.42, 368, bx + bw * 0.42, 425);
    ctx.lineTo(bx + bw * 0.42, 512);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#d0d7de';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.42, 512);
    ctx.lineTo(bx - bw * 0.42, 425);
    ctx.quadraticCurveTo(bx - bw * 0.42, 368, bx, 355);
    ctx.quadraticCurveTo(bx + bw * 0.42, 368, bx + bw * 0.42, 425);
    ctx.lineTo(bx + bw * 0.42, 512);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(c);
}

const arcadeWallTex = createUpperArcadeWallTexture();
[-3.85, 3.85].forEach((xSide) => {
  const upperArcadePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(22.0, 3.2),
    new THREE.MeshBasicMaterial({ map: arcadeWallTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  );
  upperArcadePlane.rotation.y = Math.PI / 2;
  upperArcadePlane.position.set(xSide, 4.6, 4.0);
  churchSet.add(upperArcadePlane);

  const outerWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.2, 24.0), envMats.churchWall);
  outerWall.position.set(xSide > 0 ? 5.4 : -5.4, 2.6, 4.0);
  churchSet.add(outerWall);
});

for (let i = 0; i < 12; i++) {
  const zPillar = -7.0 + i * 2.0;

  [-3.85, 3.85].forEach((xCol) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(xCol, 0, zPillar);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.42, 8), envMats.pillarBaseDark);
    base.position.y = 0.21;

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 2.75, 18), envMats.stonePillarGranite);
    shaft.position.y = 1.78;
    shaft.castShadow = true;

    const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 8, 18), envMats.gold);
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.y = 3.12;

    const goldCapital = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.24, 0.32, 12), envMats.gold);
    goldCapital.position.y = 3.28;

    const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.1, 0.76), envMats.churchWhite);
    abacus.position.y = 3.48;

    pillarGroup.add(base, shaft, neckRing, goldCapital, abacus);
    churchSet.add(pillarGroup);
  });
}

const balloonGroups = [];
function createBenchBalloonAndBowDecoration(seed = 0) {
  const decoGroup = new THREE.Group();

  const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), envMats.carpetWhite);
  const bowLoopL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), envMats.carpetWhite);
  bowLoopL.scale.set(1.3, 0.65, 0.4);
  bowLoopL.position.set(-0.08, 0.02, 0);
  const bowLoopR = bowLoopL.clone();
  bowLoopR.position.x = 0.08;
  const ribbonTail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.02), envMats.carpetWhite);
  ribbonTail.position.y = -0.22;
  const floralRose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), envMats.balloonGold);
  floralRose.position.z = 0.03;
  decoGroup.add(bowKnot, bowLoopL, bowLoopR, ribbonTail, floralRose);

  const floatCluster = new THREE.Group();
  const balloonSpecs = [
    { x: 0.0,   y: 0.92, z: 0.0,   mat: envMats.balloonPearl, r: 0.145 },
    { x: -0.12, y: 0.78, z: 0.06,  mat: envMats.balloonBlush, r: 0.13 },
    { x: 0.12,  y: 0.82, z: -0.05, mat: seed % 2 === 0 ? envMats.balloonGold : envMats.balloonLavender, r: 0.135 }
  ];

  balloonSpecs.forEach((bs) => {
    const strLen = bs.y;
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, strLen, 6), envMats.gold);
    str.position.set(bs.x * 0.5, strLen * 0.5, bs.z * 0.5);
    str.rotation.z = -bs.x * 0.45;
    floatCluster.add(str);

    const balloon = new THREE.Mesh(new THREE.SphereGeometry(bs.r, 16, 16), bs.mat);
    balloon.scale.set(1.0, 1.18, 1.0);
    balloon.position.set(bs.x, bs.y, bs.z);
    floatCluster.add(balloon);
  });

  decoGroup.add(floatCluster);
  balloonGroups.push({ group: floatCluster, phase: seed * 1.1 });
  return decoGroup;
}

for (let i = 0; i < 11; i++) {
  const zPew = -4.2 + i * 1.8;
  [-2.35, 2.35].forEach((xSide, sideIdx) => {
    const pew = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.52, 0.62), envMats.woodPew);
    pew.position.set(xSide, 0.26, zPew);
    const pewBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 0.09), envMats.woodPew);
    pewBack.position.set(xSide, 0.66, zPew + 0.26);
    churchSet.add(pew, pewBack);

    const aisleEdgeX = xSide < 0 ? xSide + 1.16 : xSide - 1.16;
    const benchDeco = createBenchBalloonAndBowDecoration(i + sideIdx * 3);
    benchDeco.position.set(aisleEdgeX, 0.72, zPew + 0.15);
    churchSet.add(benchDeco);

    for (let g = 0; g < 2; g++) {
      const guestGroup = new THREE.Group();
      const guestX = xSide + (g === 0 ? -0.52 : 0.52);
      guestGroup.position.set(guestX, 0.52, zPew);

      const color = blurredGuestColors[(i + g + sideIdx) % blurredGuestColors.length];
      const coreMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.52 });
      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24 });

      const bodyCore = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.75, 12), coreMat);
      bodyCore.position.y = 0.35;
      const bodyHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.88, 12), haloMat);
      bodyHalo.position.y = 0.35;

      const headCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), coreMat);
      headCore.position.y = 0.92;
      const headHalo = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), haloMat);
      headHalo.position.y = 0.92;

      guestGroup.add(bodyCore, bodyHalo, headCore, headHalo);
      churchSet.add(guestGroup);
    }
  });
}

// ============================================================================
// 14. FURNISHED ARCHITECTURAL SANCTUARY & ALTAR (`altar.jpg`)
// ============================================================================
const altarGroup = new THREE.Group();
altarGroup.position.set(0, 0, -9.8);
churchSet.add(altarGroup);

const bemaLower = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.55, 0.16, 48), envMats.sanctuaryRedCarpet);
bemaLower.position.set(0, 0.08, 1.25);
const bemaUpper = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 4.0, 0.42, 48), envMats.sanctuaryRedCarpet);
bemaUpper.position.set(0, 0.37, 1.05);
altarGroup.add(bemaLower, bemaUpper);

for (let st = 0; st < 4; st++) {
  const stepBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.105, 0.32),
    st % 2 === 0 ? envMats.sanctuaryRedCarpet : envMats.sanctuaryStepDarkRed
  );
  stepBox.position.set(0, 0.21 + st * 0.105, 4.88 - st * 0.22);
  altarGroup.add(stepBox);
}

[-1, 1].forEach((side) => {
  const startX = side * 0.82;
  const endX = side * 3.75;
  const railLength = Math.abs(endX - startX);
  const midX = (startX + endX) * 0.5;

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.06, 0.07), envMats.furnishedTeak);
  topBar.position.set(midX, 1.06, 3.85);
  const botBar = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.05, 0.06), envMats.furnishedTeak);
  botBar.position.set(midX, 0.64, 3.85);
  altarGroup.add(topBar, botBar);

  for (let p = 0; p <= 3; p++) {
    const px = lerp(startX, endX, p / 3);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.54, 0.065), envMats.furnishedTeak);
    post.position.set(px, 0.82, 3.85);
    altarGroup.add(post);
  }
});

function createCofferedVaultTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a2b16';
  ctx.fillRect(0, 0, 512, 512);
  const grid = 6;
  const step = 512 / grid;
  for (let r = 0; r < grid; r++) {
    for (let col = 0; col < grid; col++) {
      ctx.strokeStyle = '#c8963e';
      ctx.lineWidth = 7;
      ctx.strokeRect(col * step + 6, r * step + 6, step - 12, step - 12);
      ctx.fillStyle = '#f8f3e8';
      ctx.fillRect(col * step + 13, r * step + 13, step - 26, step - 26);
      ctx.fillStyle = '#c8963e';
      ctx.beginPath();
      ctx.arc((col + 0.5) * step, (r + 0.5) * step, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return new THREE.CanvasTexture(c);
}

const cofferedVault = new THREE.Mesh(
  new THREE.CylinderGeometry(3.8, 3.8, 4.4, 32, 1, true, 0, Math.PI),
  new THREE.MeshBasicMaterial({ map: createCofferedVaultTexture(), side: THREE.DoubleSide })
);
cofferedVault.rotation.z = Math.PI / 2;
cofferedVault.rotation.y = Math.PI / 2;
cofferedVault.position.set(0, 4.55, 0.8);
altarGroup.add(cofferedVault);

function createFurnishedAltarTable() {
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0, 0.58, 1.55);

  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');

  const woodGrad = ctx.createLinearGradient(0, 120, 0, 512);
  woodGrad.addColorStop(0, '#5c361c');
  woodGrad.addColorStop(0.5, '#472814');
  woodGrad.addColorStop(1, '#361d0e');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(50, 120, 924, 392);

  ctx.strokeStyle = 'rgba(255, 215, 160, 0.08)';
  ctx.lineWidth = 2;
  for (let y = 130; y < 505; y += 8) {
    ctx.beginPath();
    ctx.moveTo(55, y);
    ctx.lineTo(969, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#d9a738';
  ctx.lineWidth = 8;
  ctx.strokeRect(56, 126, 912, 380);
  ctx.strokeRect(82, 215, 150, 265);
  ctx.strokeRect(792, 215, 150, 265);

  const reliefGrad = ctx.createRadialGradient(512, 345, 20, 512, 345, 250);
  reliefGrad.addColorStop(0, '#fff7d6');
  reliefGrad.addColorStop(0.6, '#f3d078');
  reliefGrad.addColorStop(1, '#b88628');
  ctx.fillStyle = reliefGrad;
  ctx.fillRect(260, 215, 504, 265);
  ctx.strokeStyle = '#d9a738';
  ctx.lineWidth = 10;
  ctx.strokeRect(260, 215, 504, 265);

  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(285, 365, 454, 52);
  ctx.strokeStyle = '#c8963e';
  ctx.lineWidth = 3;
  ctx.strokeRect(285, 365, 454, 52);

  for (let a = 0; a < 13; a++) {
    const ax = 302 + a * 35;
    ctx.fillStyle = a === 6 ? '#fffdf9' : '#e8c882';
    ctx.beginPath();
    ctx.arc(ax, 348, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d4a359';
    ctx.beginPath();
    ctx.arc(ax, 322, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fffdf9';
  ctx.beginPath();
  ctx.moveTo(42, 35);
  ctx.lineTo(982, 35);
  ctx.lineTo(982, 185);
  for (let sx = 982; sx >= 42; sx -= 78.3) {
    ctx.quadraticCurveTo(sx - 39.15, 222, sx - 78.3, 185);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d9a738';
  ctx.lineWidth = 5;
  ctx.stroke();

  for (let m = 0; m < 6; m++) {
    const mx = 165 + m * 138;
    ctx.fillStyle = '#9e2a2b';
    ctx.beginPath();
    ctx.arc(mx, 138, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a738';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(mx - 2.5, 123, 5, 30);
    ctx.fillRect(mx - 13, 135.5, 26, 5);
  }

  const frontPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 1.32),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, alphaTest: 0.04 })
  );
  frontPlane.position.set(0, 0.66, 0.46);

  const tableBox = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.24, 0.88), envMats.furnishedTeak);
  tableBox.position.set(0, 0.62, 0);
  const topCloth = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.08, 0.94), envMats.carpetWhite);
  topCloth.position.set(0, 1.26, 0);

  tableGroup.add(tableBox, topCloth, frontPlane);
  return tableGroup;
}
altarGroup.add(createFurnishedAltarTable());

function createFurnishedAltarReredosPlane() {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1600;
  const ctx = c.getContext('2d');

  drawSVGPath(
    ctx,
    'M80,1600 L80,720 Q80,95 800,35 Q1520,95 1520,720 L1520,1600 Z',
    '#4a2b16',
    '#d9a738',
    14
  );

  const archGrad = ctx.createRadialGradient(800, 520, 80, 800, 620, 720);
  archGrad.addColorStop(0, '#fdfbf7');
  archGrad.addColorStop(0.55, '#f3ead8');
  archGrad.addColorStop(1, '#dfd0b8');
  drawSVGPath(
    ctx,
    'M145,1600 L145,740 Q145,150 800,88 Q1455,150 1455,740 L1455,1600 Z',
    archGrad,
    '#c8963e',
    16
  );

  for (let s = 0; s <= 36; s++) {
    const t = s / 36;
    const angle = lerp(Math.PI * 0.94, Math.PI * 0.06, t);
    const ax = 800 + Math.cos(angle) * 645;
    const ay = 780 - Math.sin(angle) * 680;
    ctx.fillStyle = '#c8963e';
    ctx.beginPath();
    ctx.arc(ax, ay, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const haloGrad = ctx.createRadialGradient(800, 380, 30, 800, 380, 420);
  haloGrad.addColorStop(0, 'rgba(246, 189, 96, 0.32)');
  haloGrad.addColorStop(1, 'rgba(246, 189, 96, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(800, 380, 420, 0, Math.PI * 2);
  ctx.fill();

  function drawFurnishedColumn(cx, topY, bottomY, w) {
    const h = bottomY - topY;
    ctx.fillStyle = '#4a2b16';
    ctx.fillRect(cx - w * 0.65, bottomY - 38, w * 1.3, 38);
    ctx.fillStyle = '#d9a738';
    ctx.fillRect(cx - w * 0.6, bottomY - 46, w * 1.2, 8);

    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(cx - w * 0.48, topY + 36, w * 0.96, h - 82);
    ctx.strokeStyle = '#d8cbb8';
    ctx.lineWidth = 2.5;
    for (let fx = -w * 0.36; fx <= w * 0.36; fx += w * 0.18) {
      ctx.beginPath();
      ctx.moveTo(cx + fx, topY + 36);
      ctx.lineTo(cx + fx, bottomY - 46);
      ctx.stroke();
    }

    ctx.fillStyle = '#4a2b16';
    ctx.fillRect(cx - w * 0.54, topY + 34, w * 1.08, 14);

    ctx.fillStyle = '#d99b26';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.68, topY);
    ctx.lineTo(cx + w * 0.68, topY);
    ctx.lineTo(cx + w * 0.48, topY + 34);
    ctx.lineTo(cx - w * 0.48, topY + 34);
    ctx.closePath();
    ctx.fill();
  }

  function drawFurnishedGothicNiche(cx, bottomY, w, h, isCenter = false) {
    ctx.fillStyle = '#f7f2e7';
    ctx.strokeStyle = '#d9a738';
    ctx.lineWidth = 4;
    ctx.fillRect(cx - w * 0.56, bottomY - h - 18, w * 1.12, h + 18);
    ctx.strokeRect(cx - w * 0.56, bottomY - h - 18, w * 1.12, h + 18);

    drawSVGPath(
      ctx,
      `M${cx - w * 0.46},${bottomY} L${cx - w * 0.46},${bottomY - h * 0.62} Q${cx - w * 0.46},${bottomY - h * 0.94} ${cx},${bottomY - h} Q${cx + w * 0.46},${bottomY - h * 0.94} ${cx + w * 0.46},${bottomY - h * 0.62} L${cx + w * 0.46},${bottomY} Z`,
      '#3d2210',
      '#fffdf9',
      9
    );
    drawSVGPath(
      ctx,
      `M${cx - w * 0.46},${bottomY} L${cx - w * 0.46},${bottomY - h * 0.62} Q${cx - w * 0.46},${bottomY - h * 0.94} ${cx},${bottomY - h} Q${cx + w * 0.46},${bottomY - h * 0.94} ${cx + w * 0.46},${bottomY - h * 0.62} L${cx + w * 0.46},${bottomY}`,
      null,
      '#d9a738',
      3.5
    );

    ctx.fillStyle = '#c8963e';
    ctx.fillRect(cx - w * 0.28, bottomY - 26, w * 0.56, 26);

    const sy = bottomY - 26;
    const sh = h * 0.66;
    ctx.fillStyle = '#fffdf9';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, sy);
    ctx.lineTo(cx - w * 0.16, sy - sh * 0.78);
    ctx.lineTo(cx + w * 0.16, sy - sh * 0.78);
    ctx.lineTo(cx + w * 0.2, sy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isCenter ? '#9e2a2b' : '#d9a738';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, sy - sh * 0.15);
    ctx.lineTo(cx - w * 0.18, sy - sh * 0.76);
    ctx.lineTo(cx + w * 0.14, sy - sh * 0.42);
    ctx.lineTo(cx + w * 0.2, sy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, sy - sh * 0.88, 19, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#eab696';
    ctx.beginPath();
    ctx.arc(cx, sy - sh * 0.88, 12.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fffdf9';
  ctx.strokeStyle = '#d9a738';
  ctx.lineWidth = 6;
  ctx.fillRect(510, 480, 580, 610);
  ctx.strokeRect(510, 480, 580, 610);

  drawFurnishedGothicNiche(625, 745, 135, 225, false);
  drawFurnishedGothicNiche(800, 745, 148, 250, true);
  drawFurnishedGothicNiche(975, 745, 135, 225, false);

  [542, 712, 888, 1058].forEach((cx) => {
    drawFurnishedColumn(cx, 480, 750, 42);
  });

  [
    { cx: 625, w: 156, baseY: 485, peakY: 310, crossH: 52 },
    { cx: 800, w: 176, baseY: 485, peakY: 235, crossH: 64 },
    { cx: 975, w: 156, baseY: 485, peakY: 310, crossH: 52 }
  ].forEach((gb) => {
    drawSVGPath(
      ctx,
      `M${gb.cx - gb.w / 2},${gb.baseY} L${gb.cx},${gb.peakY} L${gb.cx + gb.w / 2},${gb.baseY} Z`,
      '#fffdf9',
      '#d9a738',
      7
    );
    drawSVGPath(
      ctx,
      `M${gb.cx - gb.w * 0.34},${gb.baseY} L${gb.cx},${gb.peakY + 42} L${gb.cx + gb.w * 0.34},${gb.baseY} Z`,
      '#4a2b16',
      '#d9a738',
      3.5
    );
    ctx.fillStyle = '#d99b26';
    ctx.beginPath();
    ctx.arc(gb.cx, gb.peakY + 85, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a2b16';
    ctx.fillRect(gb.cx - 12, gb.peakY - 16, 24, 18);
    drawSVGPath(
      ctx,
      `M${gb.cx - 5},${gb.peakY - 16 - gb.crossH} L${gb.cx + 5},${gb.peakY - 16 - gb.crossH} L${gb.cx + 5},${gb.peakY - 16} L${gb.cx - 5},${gb.peakY - 16} Z M${gb.cx - 20},${gb.peakY - 16 - gb.crossH * 0.68} L${gb.cx + 20},${gb.peakY - 16 - gb.crossH * 0.68} L${gb.cx + 20},${gb.peakY - 16 - gb.crossH * 0.52} L${gb.cx - 20},${gb.peakY - 16 - gb.crossH * 0.52} Z`,
      '#fffdf9',
      '#d9a738',
      2.5
    );
  });

  [542, 712, 888, 1058].forEach((px, idx) => {
    const py = idx === 1 || idx === 2 ? 290 : 345;
    drawSVGPath(
      ctx,
      `M${px - 22},480 L${px},${py} L${px + 22},480 Z`,
      '#fffdf9',
      '#d9a738',
      3.5
    );
  });

  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(495, 748, 610, 20);
  ctx.fillStyle = '#4a2b16';
  ctx.fillRect(495, 766, 610, 10);

  drawFurnishedGothicNiche(625, 1075, 140, 265, false);
  drawFurnishedGothicNiche(800, 1075, 155, 280, true);
  drawFurnishedGothicNiche(975, 1075, 140, 265, false);

  [542, 712, 888, 1058].forEach((cx) => {
    drawFurnishedColumn(cx, 776, 1080, 46);
  });

  function drawFurnishedSideStatue(cx, baseY, hasWings = false) {
    ctx.fillStyle = '#4a2b16';
    ctx.fillRect(cx - 26, baseY, 52, 26);
    ctx.fillStyle = '#d9a738';
    ctx.fillRect(cx - 30, baseY - 6, 60, 8);

    if (hasWings) {
      drawSVGPath(ctx, `M${cx},${baseY - 115} C${cx - 42},${baseY - 155} ${cx - 55},${baseY - 95} ${cx - 18},${baseY - 75} Z`, '#fffdf9', '#d9a738', 2);
      drawSVGPath(ctx, `M${cx},${baseY - 115} C${cx + 42},${baseY - 155} ${cx + 55},${baseY - 95} ${cx + 18},${baseY - 75} Z`, '#fffdf9', '#d9a738', 2);
    }
    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(cx - 18, baseY - 122, 36, 116);
    drawSVGPath(ctx, `M${cx - 20},${baseY - 118} L${cx + 20},${baseY - 72} L${cx + 18},${baseY - 6} L${cx - 18},${baseY - 6} Z`, '#d9a738');
    ctx.fillStyle = '#eab696';
    ctx.beginPath();
    ctx.arc(cx, baseY - 136, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFurnishedSideStatue(462, 1055, false);
  drawFurnishedSideStatue(1138, 1055, false);
  drawFurnishedSideStatue(345, 1045, true);
  drawFurnishedSideStatue(1255, 1045, true);

  drawSVGPath(
    ctx,
    'M794,915 L806,915 L806,1125 L794,1125 Z M738,958 L862,958 L862,970 L738,970 Z',
    '#3d2210',
    '#d9a738',
    3
  );
  drawSVGPath(ctx, 'M748,964 L800,982 L852,964 M800,975 L800,1065', null, '#f3d078', 8);

  const retableGrad = ctx.createLinearGradient(0, 1085, 0, 1380);
  retableGrad.addColorStop(0, '#5c361c');
  retableGrad.addColorStop(1, '#3d2210');
  ctx.fillStyle = retableGrad;
  ctx.fillRect(465, 1085, 670, 295);
  ctx.strokeStyle = '#d9a738';
  ctx.lineWidth = 7;
  ctx.strokeRect(465, 1085, 670, 295);

  for (let row = 0; row < 3; row++) {
    const ry = 1135 + row * 68;
    for (let dx = 505; dx <= 1095; dx += 38) {
      ctx.strokeStyle = '#d9a738';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dx, ry - 16);
      ctx.lineTo(dx + 14, ry);
      ctx.lineTo(dx, ry + 16);
      ctx.lineTo(dx - 14, ry);
      ctx.closePath();
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#fffdf9';
  ctx.strokeStyle = '#d9a738';
  ctx.lineWidth = 5;
  ctx.fillRect(735, 1125, 130, 155);
  ctx.strokeRect(735, 1125, 130, 155);
  ctx.fillStyle = '#9e2a2b';
  ctx.beginPath();
  ctx.arc(800, 1205, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawFurnishedSideStatue(490, 1215, true);
  drawFurnishedSideStatue(1110, 1215, true);

  [265, 1335].forEach((cx) => {
    ctx.fillStyle = '#e8dec8';
    ctx.fillRect(cx - 95, 1240, 190, 360);
    ctx.strokeStyle = '#c8963e';
    ctx.lineWidth = 3;
    for (let px = cx - 85; px <= cx + 85; px += 20) {
      ctx.beginPath();
      ctx.moveTo(px, 1240);
      ctx.lineTo(px, 1600);
      ctx.stroke();
    }
  });

  const tex = new THREE.CanvasTexture(c);
  const geo = new THREE.PlaneGeometry(7.6, 6.6);
  geo.translate(0, 3.3, 0);
  return new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide })
  );
}

const reredosMesh = createFurnishedAltarReredosPlane();
reredosMesh.position.set(0, 0.25, -0.4);
altarGroup.add(reredosMesh);

// ============================================================================
// 15. ST. THOMAS KOTTAKKAVU FORANE CHURCH EXTERIOR (`stk.jpg`) AT `z = +16.0`
// ============================================================================
const kottakkavuExterior = new THREE.Group();
kottakkavuExterior.position.set(0, 0, 16.0);
churchSet.add(kottakkavuExterior);

function createExactKottakkavuFacadeMesh() {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1400;
  const ctx = c.getContext('2d');

  function drawGothicLatticeWindow(cx, bottomY, w, h, hasStatue = false) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 8, bottomY);
    ctx.lineTo(cx - w / 2 - 8, bottomY - h * 0.64);
    ctx.quadraticCurveTo(cx - w / 2 - 8, bottomY - h * 0.92, cx, bottomY - h - 10);
    ctx.quadraticCurveTo(cx + w / 2 + 8, bottomY - h * 0.92, cx + w / 2 + 8, bottomY - h * 0.64);
    ctx.lineTo(cx + w / 2 + 8, bottomY);
    ctx.closePath();
    ctx.fillStyle = '#e6ebf2';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - w / 2, bottomY);
    ctx.lineTo(cx - w / 2, bottomY - h * 0.65);
    ctx.quadraticCurveTo(cx - w / 2, bottomY - h * 0.9, cx, bottomY - h);
    ctx.quadraticCurveTo(cx + w / 2, bottomY - h * 0.9, cx + w / 2, bottomY - h * 0.65);
    ctx.lineTo(cx + w / 2, bottomY);
    ctx.closePath();
    ctx.fillStyle = hasStatue ? '#224c5c' : '#242d38';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    if (hasStatue) {
      ctx.fillStyle = '#38768c';
      ctx.beginPath();
      ctx.ellipse(cx, bottomY - h * 0.46, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8e4e8';
      ctx.fillRect(cx - w * 0.12, bottomY - h * 0.56, w * 0.24, h * 0.36);
      ctx.fillStyle = '#e8c49e';
      ctx.beginPath();
      ctx.arc(cx, bottomY - h * 0.64, w * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, bottomY - h);
      ctx.lineTo(cx, bottomY);
      ctx.stroke();
    } else {
      ctx.clip();
      ctx.strokeStyle = 'rgba(250, 252, 255, 0.9)';
      ctx.lineWidth = 3;
      for (let d = -h; d <= h; d += 18) {
        ctx.beginPath();
        ctx.moveTo(cx - w, bottomY - d);
        ctx.lineTo(cx + w, bottomY - d - w * 1.45);
        ctx.moveTo(cx + w, bottomY - d);
        ctx.lineTo(cx - w, bottomY - d - w * 1.45);
        ctx.stroke();
      }
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx, bottomY);
      ctx.lineTo(cx, bottomY - h * 0.78);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, bottomY - h * 0.82, w * 0.16, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRoseWindow(cx, cy, r) {
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#242d38';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTieredPinnacle(cx, baseY, w, h) {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#d0d7e2';
    ctx.lineWidth = 3;
    ctx.fillRect(cx - w * 0.46, baseY - h * 0.52, w * 0.92, h * 0.52);
    ctx.strokeRect(cx - w * 0.46, baseY - h * 0.52, w * 0.92, h * 0.52);
    ctx.strokeRect(cx - w * 0.26, baseY - h * 0.45, w * 0.52, h * 0.38);

    drawSVGPath(
      ctx,
      `M${cx - w * 0.52},${baseY - h * 0.52} L${cx},${baseY - h} L${cx + w * 0.52},${baseY - h * 0.52} Z`,
      '#ffffff',
      '#cbd5e1',
      3
    );
    for (let k = 1; k <= 4; k++) {
      const ky = baseY - h * 0.52 - (h * 0.44 * k) / 5;
      const kw = w * 0.52 * (1 - k / 5.2);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(cx - kw - 3, ky, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + kw + 3, ky, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSVGPath(ctx, `M${cx},${baseY - h - 22} L${cx},${baseY - h + 2} M${cx - 8},${baseY - h - 12} L${cx + 8},${baseY - h - 12}`, null, '#b8c2cc', 3);
  }

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#d8e0e8';
  ctx.lineWidth = 4;
  ctx.fillRect(220, 580, 1160, 820);
  ctx.strokeRect(220, 580, 1160, 820);

  [415, 1185].forEach((sx) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(sx - 105, 445, 210, 145);
    ctx.strokeRect(sx - 105, 445, 210, 145);
    [-55, -18, 18, 55].forEach((ox) => {
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(sx + ox - 8, 475, 16, 28);
    });

    drawSVGPath(ctx, `M${sx - 98},445 L${sx},185 L${sx + 98},445 Z`, '#ffffff', '#cfd8e3', 4);
    drawSVGPath(ctx, `M${sx},185 L${sx},445 M${sx},185 L${sx - 48},445 M${sx},185 L${sx + 48},445`, null, '#dce3ec', 2.5);
    [385, 315, 255].forEach((dy, idx) => {
      const span = 42 - idx * 11;
      drawSVGPath(ctx, `M${sx - span},${dy} L${sx},${dy - 28} L${sx + span},${dy}`, null, '#cfd8e3', 2.5);
    });

    drawSVGPath(ctx, `M${sx},135 L${sx},188 M${sx - 15},152 L${sx + 15},152 M${sx - 10},168 L${sx + 10},168`, null, '#94a3b8', 4.5);

    drawTieredPinnacle(sx - 148, 580, 46, 235);
    drawTieredPinnacle(sx - 98, 555, 38, 195);
    drawTieredPinnacle(sx + 98, 555, 38, 195);
    drawTieredPinnacle(sx + 148, 580, 46, 235);
  });

  drawSVGPath(ctx, 'M495,600 L800,145 L1105,600 L1105,1400 L495,1400 Z', '#ffffff', '#d0d8e2', 5);
  drawSVGPath(ctx, 'M522,600 L800,185 L1078,600', null, '#cbd5e1', 5);
  drawSVGPath(ctx, 'M565,625 Q800,295 1035,625', null, '#d8e0e8', 4);
  for (let s = 0; s <= 22; s++) {
    const t = s / 22;
    const lx = lerp(495, 800, t);
    const rx = lerp(1105, 800, t);
    const gy = lerp(600, 145, t);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(lx - 5, gy - 3, 4.5, 0, Math.PI * 2);
    ctx.arc(rx + 5, gy - 3, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(800, 395, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(782, 118, 36, 32);
  drawSVGPath(ctx, 'M792,52 L808,52 L808,122 L792,122 Z M770,74 L830,74 L830,90 L770,90 Z', '#5a1822', '#d9a738', 2.5);

  [592, 905, 980].forEach((cy) => {
    ctx.fillStyle = '#eef2f6';
    ctx.fillRect(214, cy, 1172, 22);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(214, cy, 1172, 22);
    ctx.fillStyle = '#cbd5e1';
    for (let fx = 240; fx <= 1360; fx += 28) {
      ctx.beginPath();
      ctx.arc(fx, cy + 11, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  drawGothicLatticeWindow(705, 675, 64, 165, false);
  drawGothicLatticeWindow(800, 675, 74, 205, true);
  drawGothicLatticeWindow(895, 675, 64, 165, false);

  drawGothicLatticeWindow(705, 880, 66, 175, false);
  drawGothicLatticeWindow(800, 880, 74, 185, false);
  drawGothicLatticeWindow(895, 880, 66, 175, false);

  [365, 1235].forEach((wx) => {
    drawRoseWindow(wx, 755, 64);
    drawGothicLatticeWindow(wx, 1265, 88, 245, false);
  });

  [618, 982].forEach((ax) => {
    drawSVGPath(
      ctx,
      `M${ax - 68},1400 L${ax - 68},1145 Q${ax - 68},1045 ${ax},1018 Q${ax + 68},1045 ${ax + 68},1145 L${ax + 68},1400 Z`,
      '#161a20',
      '#d8e0e8',
      7
    );
    drawSVGPath(ctx, `M${ax - 64},1125 Q${ax},1155 ${ax + 64},1125 L${ax + 64},1185 Q${ax},1145 ${ax - 64},1185 Z`, '#f1f5f9');
  });

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  drawSVGPath(
    ctx,
    'M695,1400 L695,1120 Q695,995 800,955 Q905,995 905,1120 L905,1400 Z',
    '#000000'
  );
  ctx.restore();

  drawSVGPath(
    ctx,
    'M695,1400 L695,1120 Q695,995 800,955 Q905,995 905,1120 L905,1400',
    null,
    '#dce3ec',
    10
  );
  drawSVGPath(
    ctx,
    'M698,1095 Q755,1125 800,1080 Q845,1125 902,1095 L902,1195 Q845,1135 800,1105 Q755,1135 698,1195 Z',
    'rgba(248, 250, 252, 0.95)'
  );

  const tex = new THREE.CanvasTexture(c);
  const geo = new THREE.PlaneGeometry(15.2, 13.2);
  geo.translate(0, 6.6, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(geo, mat);
}

const facadeMesh = createExactKottakkavuFacadeMesh();
kottakkavuExterior.add(facadeMesh);

[-5.5, -3.2, -1.45, 1.45, 3.2, 5.5].forEach((bx) => {
  const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.38, 7.2, 0.52), envMats.churchWhite);
  buttress.position.set(bx, 3.6, 0.12);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.85, 4), envMats.churchWhite);
  cap.rotation.y = Math.PI / 4;
  cap.position.set(bx, 7.6, 0.12);
  kottakkavuExterior.add(buttress, cap);
});

for (let s = 0; s < 5; s++) {
  const stepRadius = 3.6 + s * 0.42;
  const stepH = 0.40 - s * 0.075;
  const stepCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(stepRadius, stepRadius + 0.1, 0.08, 40, 1, false, -Math.PI * 0.5, Math.PI),
    envMats.blackGranite
  );
  stepCyl.position.set(0, stepH - 0.04, 0.25);
  kottakkavuExterior.add(stepCyl);
}

function createCheckeredCourtyardMesh() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#c2c5bd';
  ctx.fillRect(0, 0, 1024, 1024);

  const cols = 24;
  const rows = 24;
  const cellW = 1024 / cols;
  const cellH = 1024 / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const isCenterWalk = Math.abs(col - cols / 2 + 0.5) < 1.5;
      ctx.fillStyle = isCenterWalk ? '#aeb2a8' : '#486b43';
      ctx.fillRect(col * cellW + 6, r * cellH + 6, cellW - 12, cellH - 12);
    }
  }

  ctx.strokeStyle = '#5c625e';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(230, 1024, 280, Math.PI * 1.15, Math.PI * 1.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(794, 1024, 280, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(19.5, 13.0),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.03, 6.4);
  return mesh;
}
kottakkavuExterior.add(createCheckeredCourtyardMesh());

const kodimaramGroup = new THREE.Group();
kodimaramGroup.position.set(2.35, 0, 4.5);

const kPedestalOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.92, 0.42, 24), envMats.gateBrick);
kPedestalOuter.position.y = 0.21;
const kPedestalInner = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.68, 24), envMats.churchWhite);
kPedestalInner.position.y = 0.34;
const kPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 9.4, 20), envMats.gold);
kPole.position.y = 4.7;
kPole.castShadow = true;
kodimaramGroup.add(kPedestalOuter, kPedestalInner, kPole);

for (let r = 1; r <= 13; r++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15 - r * 0.004, 0.025, 8, 18), envMats.gold);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.75 + r * 0.62;
  kodimaramGroup.add(ring);
}
const kCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06), envMats.gold);
kCrossV.position.y = 9.55;
const kCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.06), envMats.gold);
kCrossH.position.y = 9.65;
kodimaramGroup.add(kCrossV, kCrossH);
kottakkavuExterior.add(kodimaramGroup);

const kappelaGroup = new THREE.Group();
kappelaGroup.position.set(-4.35, 0, 5.4);

const kapBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.85, 2.35), envMats.churchWhite);
kapBody.position.y = 1.42;
kapBody.castShadow = true;
const kapGable = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.1, 3), envMats.churchWhite);
kapGable.position.set(0, 3.0, 1.15);
const kapRoofLower = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.45, 4), envMats.terracottaTile);
kapRoofLower.rotation.y = Math.PI / 4;
kapRoofLower.position.y = 3.48;
const kapRoofUpper = new THREE.Mesh(new THREE.ConeGeometry(1.18, 1.25, 4), envMats.terracottaTile);
kapRoofUpper.rotation.y = Math.PI / 4;
kapRoofUpper.position.y = 4.4;
const kapCross = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), envMats.churchWhite);
kapCross.position.y = 5.15;
[-1.12, 1.12].forEach((kx) => {
  [-1.12, 1.12].forEach((kz) => {
    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 4), envMats.churchWhite);
    pin.position.set(kx, 3.15, kz);
    kappelaGroup.add(pin);
  });
});
const kapDoor = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.85, 2.39), envMats.blackGranite);
kapDoor.position.y = 0.95;
kappelaGroup.add(kapBody, kapGable, kapRoofLower, kapRoofUpper, kapCross, kapDoor);

const kalluvilakku = new THREE.Group();
kalluvilakku.position.set(-1.65, 0, 4.2);
const kvBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.38, 12), envMats.blackGranite);
kvBase.position.y = 0.19;
const kvShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.75, 12), envMats.blackGranite);
kvShaft.position.y = 1.05;
kalluvilakku.add(kvBase, kvShaft);
kottakkavuExterior.add(kappelaGroup, kalluvilakku);

const parishHall = new THREE.Group();
parishHall.position.set(9.4, 0, -0.5);
parishHall.rotation.y = -0.18;
const hallBody = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.8, 3.2), envMats.churchWhite);
hallBody.position.y = 1.9;
const hallRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.6, 4), envMats.colonialRoof);
hallRoof.rotation.y = Math.PI / 4;
hallRoof.scale.set(1.4, 1, 0.72);
hallRoof.position.y = 4.6;
parishHall.add(hallBody, hallRoof);
for (let wx = -2.4; wx <= 2.4; wx += 0.95) {
  const archWin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 3.26), envMats.blackGranite);
  archWin.position.set(wx, 2.75, 0);
  parishHall.add(archWin);
}
kottakkavuExterior.add(parishHall);

function createAngelStatueMesh() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext('2d');
  drawSVGPath(ctx, 'M128,110 C75,45 25,65 45,145 C75,165 105,155 128,145 Z', '#f1f5f9', '#cbd5e1', 3);
  drawSVGPath(ctx, 'M128,110 C181,45 231,65 211,145 C181,165 151,155 128,145 Z', '#f1f5f9', '#cbd5e1', 3);
  drawSVGPath(ctx, 'M104,115 L152,115 L172,285 L84,285 Z', '#ffffff', '#cbd5e1', 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(72, 282, 112, 26);
  ctx.beginPath();
  ctx.arc(128, 86, 20, 0, Math.PI * 2);
  ctx.fill();
  drawSVGPath(ctx, 'M105,120 L72,82 M151,120 L184,82', null, '#ffffff', 10);
  return makeStandeeMesh(new THREE.CanvasTexture(c), 1.15, 1.45);
}

[-1.85, 1.85].forEach((gx) => {
  const gatePillar = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.6, 0.82), envMats.gateBrick);
  gatePillar.position.set(gx, 0.8, 8.4);
  const pillarCap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 0.92), envMats.churchWhite);
  pillarCap.position.set(gx, 1.62, 8.4);
  const angel = createAngelStatueMesh();
  angel.position.set(gx, 1.65, 8.4);
  kottakkavuExterior.add(gatePillar, pillarCap, angel);
});

[-3.8, 3.8].forEach((wx) => {
  const lowWall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 0.35), envMats.churchWhite);
  lowWall.position.set(wx, 0.32, 8.4);
  kottakkavuExterior.add(lowWall);
});

for (let st = 0; st < 4; st++) {
  const stepBar = new THREE.Mesh(
    new THREE.BoxGeometry(3.65, 0.14, 0.42),
    st % 2 === 0 ? envMats.redStep : envMats.churchWhite
  );
  stepBar.position.set(0, 0.32 - st * 0.08, 8.8 + st * 0.40);
  kottakkavuExterior.add(stepBar);
}

function createPalmTreeMesh() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext('2d');
  drawSVGPath(ctx, 'M122,310 Q132,210 126,125 L136,125 Q142,210 134,310 Z', '#5c4738');
  [
    'M130,128 Q65,75 18,135 Q72,115 130,132 Z',
    'M130,128 Q45,115 12,185 Q68,148 130,135 Z',
    'M130,128 Q85,45 45,65 Q95,85 130,128 Z',
    'M130,128 Q195,75 242,135 Q188,115 130,132 Z',
    'M130,128 Q215,115 248,185 Q192,148 130,135 Z',
    'M130,128 Q175,45 215,65 Q165,85 130,128 Z'
  ].forEach((d, idx) => {
    drawSVGPath(ctx, d, idx % 2 === 0 ? '#2d5a27' : '#3e7236');
  });
  return makeStandeeMesh(new THREE.CanvasTexture(c), 2.5, 3.1);
}

[
  [-3.1, 6.6],
  [2.85, 6.5],
  [4.8, 5.4],
  [5.5, 3.2],
  [6.2, 1.0],
  [-5.8, 2.5],
  [-6.4, 0.2]
].forEach(([px, pz]) => {
  const palm = createPalmTreeMesh();
  palm.position.set(px, 0, pz);
  kottakkavuExterior.add(palm);
});

// Universal Ground Plane
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), envMats.floor);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ============================================================================
// 16. SLOW, VELOCITY-CLAMPED SCROLL TRACKING & RESPONSIVE MOBILE FOV
// ============================================================================
let targetProgress = 0;
let smoothProgress = 0;

window.addEventListener('scroll', () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
}, { passive: true });

function updateCameraAspect() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.fov = aspect < 1 ? 58 : 44;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', updateCameraAspect);
updateCameraAspect();

function setGroupVisibility(group, weight, useVerticalSlide = true) {
  group.visible = weight > 0.01;
  group.position.y = useVerticalSlide ? (1 - weight) * -5.5 : 0;
}

// ============================================================================
// 17. MAIN 9-SCENE RENDER & DELIBERATE STORYTELLING LOOP
// ============================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const isPortrait = window.innerWidth < window.innerHeight;

  const diff = targetProgress - smoothProgress;
  const stepDelta = clamp(diff * 0.065, -0.0042, 0.0042);
  smoothProgress = clamp(smoothProgress + stepDelta, 0, 1);

  progressBar.style.width = `${smoothProgress * 100}%`;

  const scaled = smoothProgress * 8;
  const sceneIdx = Math.min(Math.floor(scaled), 7);
  const t = scaled - sceneIdx;
  const activeSubtitle = Math.round(scaled);

  const isDroneFinale = scaled >= 7.45;
  subtitleOverlay.classList.toggle('hidden', isDroneFinale);
  weddingSkyBanner.classList.toggle('visible', isDroneFinale);
  weddingBottomBanner.classList.toggle('visible', isDroneFinale);

  // Progress-Bar Background Color Fill on Scroll Dialog Box (No Scene Numbers — Request #3)
  scrollHint.classList.toggle('hidden', isDroneFinale);
  if (!isDroneFinale) {
    const dialogFillPct = clamp((scaled / 7.45) * 100, 0, 100);
    scrollHint.style.setProperty('--scroll-fill', `${dialogFillPct.toFixed(1)}%`);
    scrollHintText.textContent = smoothProgress < 0.08
      ? 'Scroll gently to unfold the story'
      : 'Keep scrolling to unfold the story';
  }

  subtitleSlides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === activeSubtitle && !isDroneFinale);
  });

  scene.background.lerpColors(bgPastelColors[sceneIdx], bgPastelColors[sceneIdx + 1], t);
  scene.fog.color.copy(scene.background);

  const lightCutProximity = 1 - clamp(Math.abs(scaled - 5.0) / 0.35, 0, 1);
  lightBloom.style.opacity = (lightCutProximity * 0.85).toFixed(3);

  balloonGroups.forEach((bg) => {
    bg.group.position.y = Math.sin(time * 2.2 + bg.phase) * 0.035;
    bg.group.rotation.z = Math.cos(time * 1.8 + bg.phase) * 0.04;
  });

  // Environment Set Weights
  let wClassroom = 0, wStage = 0, wTroupe = 0, wVerandah = 0, wAudience = 0, wChurch = 0;
  let slideSetsVertically = true;

  if (sceneIdx === 0) {
    const trans12 = smoothstep(0.62, 0.98, t);
    wClassroom = 1 - trans12;
    wStage = 1 - trans12;
    wTroupe = 1 - trans12;
    wVerandah = trans12;
  } else if (sceneIdx === 1) {
    const trans23 = smoothstep(0.68, 0.98, t);
    wVerandah = 1 - trans23;
    wStage = trans23;
    wTroupe = trans23;
    wAudience = trans23;
  } else if (sceneIdx >= 2 && sceneIdx <= 3) {
    wStage = 1;
    wTroupe = 1;
    wAudience = 1;
  } else if (sceneIdx === 4) {
    wStage = 1;
    wTroupe = 1;
    wAudience = 1;
    slideSetsVertically = false;
  } else if (sceneIdx === 5) {
    wStage = 0;
    wTroupe = 0;
    wAudience = 0;
    wChurch = 1;
    slideSetsVertically = false;
  } else if (sceneIdx >= 6) {
    wChurch = 1;
  }

  setGroupVisibility(classroomSet, clamp(wClassroom, 0, 1), slideSetsVertically);
  setGroupVisibility(stageSet, clamp(wStage, 0, 1), slideSetsVertically);
  setGroupVisibility(troupeGroup, clamp(wTroupe, 0, 1), slideSetsVertically);
  setGroupVisibility(verandahSet, clamp(wVerandah, 0, 1), slideSetsVertically);
  setGroupVisibility(audienceGroup, clamp(wAudience, 0, 1), slideSetsVertically);
  setGroupVisibility(churchSet, clamp(wChurch, 0, 1), slideSetsVertically);

  const isChurchWedding = scaled >= 5.0;
  manStandee.visible = !isChurchWedding;
  ladyStandee.visible = !isChurchWedding;
  weddingCoupleStandee.visible = isChurchWedding;

  let manFacingY = 0;
  let ladyFacingY = 0;
  let weddingFacingY = Math.PI;

  let manWalkPhase = 0, manWalkAmt = 0;
  let manLShoulder = -0.35, manLElbow = 0.65, manRShoulder = 0.55, manRElbow = 0.85, manHoldCamera = false;
  let ladyDanceBlend = 1.0, ladyWalkPhase = 0, ladyWalkAmt = 0;

  let camX = 0, camY = 2.0, camZ = 5.5;
  let lookX = 0, lookY = 1.6, lookZ = -2.0;

  if (sceneIdx === 0) {
    workstation.visible = true;

    const moveT = smoothstep(0.45, 0.98, t);
    const manX = lerp(-1.45, -0.75, moveT);
    const manZ = lerp(1.5, 0.35, moveT);
    manStandee.position.set(manX, 0, manZ);
    workstation.position.set(manX + 0.35, 0, manZ + 0.45);

    manFacingY = lerp(0.2, 0.45, moveT);
    manHoldCamera = true;
    manRShoulder = 0.52 + Math.sin(time * 3.0) * 0.14;
    manRElbow = 0.78 + Math.cos(time * 3.0) * 0.12;

    if (t < 0.45) {
      ladyStandee.position.set(0.0, 0.36, -6.6);
      ladyFacingY = time * 2.2;
      ladyDanceBlend = 1.0;
    } else {
      const walkT = smoothstep(0.45, 0.98, t);
      const baseY = lerp(0.36, 0, clamp(walkT * 2.5, 0, 1));
      ladyStandee.position.set(
        lerp(0.0, 0.65, walkT),
        baseY,
        lerp(-6.6, 0.35, walkT)
      );
      ladyFacingY = -0.35;
      ladyDanceBlend = 1 - smoothstep(0.0, 0.35, walkT);
      ladyWalkPhase = walkT * Math.PI * 10;
      ladyWalkAmt = smoothstep(0.05, 0.25, walkT) * (1 - smoothstep(0.85, 1.0, walkT));
    }

    const panT = smoothstep(0.0, 0.95, t);
    camX = lerp(-1.6, 0.3, panT);
    camY = lerp(isPortrait ? 2.25 : 2.1, 1.8, panT);
    camZ = lerp(5.4, 4.2, panT);
    lookX = lerp(-0.3, 0.0, panT);
    lookY = lerp(isPortrait ? 2.15 : 1.75, 1.4, panT);
    lookZ = lerp(-5.0, -0.4, panT);

  } else if (sceneIdx === 1) {
    const toStageT = smoothstep(0.68, 0.98, t);

    workstation.visible = t < 0.82;
    workstation.position.set(-0.4, -toStageT * 2.8, 0.8);

    const pShift = (t - 0.35) * 2.2;
    parallaxNear.position.x = -pShift * 1.35;
    parallaxMid.position.x = -pShift * 0.75;
    parallaxFar.position.x = -pShift * 0.3;

    manStandee.position.set(lerp(-0.75, -0.85, toStageT), 0, lerp(0.35, -1.2, toStageT));
    manFacingY = lerp(0.45, Math.PI - 0.25, toStageT);
    manHoldCamera = t < 0.68;
    manWalkPhase = toStageT * Math.PI * 6;
    manWalkAmt = smoothstep(0.68, 0.78, t) * (1 - smoothstep(0.9, 1.0, t));
    manLShoulder = -0.42 + Math.sin(time * 3.2) * 0.12;
    manLElbow = 0.72;
    manRShoulder = 0.48 + Math.cos(time * 3.2) * 0.14;
    manRElbow = 0.68;

    const ladyBaseY = lerp(0, 0.36, toStageT);
    ladyStandee.position.set(lerp(0.65, 0.0, toStageT), ladyBaseY, lerp(0.35, -6.6, toStageT));
    ladyFacingY = lerp(-0.45, 0, toStageT);
    ladyDanceBlend = toStageT;
    ladyWalkPhase = toStageT * Math.PI * 8 + time * 1.5 * (1 - toStageT);
    ladyWalkAmt = smoothstep(0.68, 0.78, t) * (1 - smoothstep(0.92, 1.0, t));

    camX = lerp(0.3, -0.2, toStageT);
    camY = lerp(1.8, 2.1, toStageT);
    camZ = lerp(4.2, 1.8, toStageT);
    lookX = 0;
    lookY = lerp(1.4, 1.5, toStageT);
    lookZ = lerp(-0.4, -6.2, toStageT);

  } else if (sceneIdx === 2) {
    workstation.visible = false;

    const walkToMan = smoothstep(0.48, 0.96, t);

    manStandee.position.set(lerp(-0.85, -0.6, walkToMan), 0, -1.2);
    manFacingY = lerp(Math.PI - 0.25, Math.PI - 0.15, walkToMan);
    const clap = Math.sin(time * 7) * 0.22 * (1 - walkToMan);
    manLShoulder = -0.55 + clap;
    manLElbow = -0.85;
    manRShoulder = 0.55 - clap;
    manRElbow = 0.85;

    const ladyBaseY = lerp(0.36, 0, clamp(walkToMan * 2, 0, 1));
    ladyStandee.position.set(
      lerp(0.0, 0.5, walkToMan),
      ladyBaseY,
      lerp(-6.6, -1.2, walkToMan)
    );
    ladyFacingY = walkToMan < 0.25
      ? Math.sin(time * 2.6) * 0.95
      : lerp(0, Math.PI + 0.15, smoothstep(0.55, 0.98, walkToMan));
    ladyDanceBlend = 1 - smoothstep(0.0, 0.35, walkToMan);
    ladyWalkPhase = walkToMan * Math.PI * 10;
    ladyWalkAmt = smoothstep(0.05, 0.25, walkToMan) * (1 - smoothstep(0.85, 1.0, walkToMan));

    camX = -0.2;
    camY = 2.1;
    camZ = lerp(1.8, 2.2, t);
    lookX = 0;
    lookY = 1.5;
    lookZ = lerp(-6.2, -4.8, t);

  } else if (sceneIdx === 3) {
    workstation.visible = false;

    manStandee.position.set(-0.6, 0, -1.2);
    ladyStandee.position.set(0.5, 0, -1.2);
    manFacingY = Math.PI - 0.2;
    ladyFacingY = Math.PI + 0.2;
    ladyDanceBlend = 0;

    const orbitT = smoothstep(0.35, 0.98, t);
    const angle = orbitT * Math.PI;
    camX = -Math.sin(angle) * 5.2;
    camY = lerp(2.1, 2.75, orbitT);
    camZ = lerp(2.2, -11.4, orbitT);

    lookX = 0;
    lookY = lerp(1.5, 1.45, orbitT);
    lookZ = lerp(-4.8, -1.2, orbitT);

  } else if (sceneIdx === 4) {
    workstation.visible = false;

    manStandee.position.set(-0.6, 0, -1.2);
    ladyStandee.position.set(0.5, 0, -1.2);
    manFacingY = Math.PI - 0.35;
    ladyFacingY = Math.PI + 0.35;
    ladyDanceBlend = 0;

    const moveT = smoothstep(0.3, 0.95, t);
    const tiltUp = smoothstep(0.45, 1.0, t);
    camX = 0;
    camY = lerp(2.75, 4.45, tiltUp);
    camZ = lerp(-11.4, 1.35, moveT);

    lookX = 0;
    lookY = lerp(1.45, 5.35, tiltUp);
    lookZ = lerp(-1.2, 0.5, tiltUp);

  } else if (sceneIdx === 5) {
    workstation.visible = false;

    const tiltDown = smoothstep(0.0, 0.52, t);
    const walkZ = lerp(6.5, -1.2, smoothstep(0.12, 0.98, t));

    weddingCoupleStandee.position.set(0, 0, walkZ);
    weddingFacingY = Math.PI;

    const sideArc = Math.sin(smoothstep(0.0, 0.85, t) * Math.PI) * -2.0;
    camX = sideArc;
    camY = lerp(4.45, 1.85, tiltDown);
    camZ = lerp(1.35, walkZ - 3.8, smoothstep(0.12, 1.0, t));

    lookX = 0;
    lookY = lerp(5.35, 1.35, tiltDown);
    lookZ = lerp(0.5, walkZ, smoothstep(0.12, 1.0, t));

    renderWeddingCoupleMultiAngle(
      normalizeAngle(Math.atan2(camX - 0, camZ - walkZ) - weddingFacingY),
      t * Math.PI * 12,
      1.0
    );

  } else if (sceneIdx === 6) {
    workstation.visible = false;

    const coupleZ = lerp(-1.2, -4.2, smoothstep(0.0, 0.85, t));
    weddingCoupleStandee.position.set(0, 0, coupleZ);
    weddingFacingY = Math.PI;

    const orbitAngle = lerp(Math.PI, Math.PI * 2, smoothstep(0.0, 0.88, t));
    const orbitRadius = lerp(3.6, 3.8, t);

    camX = Math.sin(orbitAngle) * orbitRadius;
    camY = lerp(1.85, 2.05, Math.sin(t * Math.PI));
    camZ = coupleZ + Math.cos(orbitAngle) * orbitRadius;

    lookX = 0;
    lookY = lerp(1.35, 2.15, t);
    lookZ = lerp(coupleZ, -9.8, smoothstep(0.45, 0.9, t));

    const camAzimuth = Math.atan2(camX - 0, camZ - coupleZ);
    const relAng = normalizeAngle(camAzimuth - weddingFacingY);
    renderWeddingCoupleMultiAngle(relAng, t * Math.PI * 8, 1 - smoothstep(0.65, 0.9, t));

  } else {
    workstation.visible = false;

    const coupleZ = -4.2;
    weddingCoupleStandee.position.set(0, 0, coupleZ);
    weddingFacingY = Math.PI;

    const trackZ = lerp(-0.4, 34.0, smoothstep(0.0, 0.96, t));
    const droneAscend = smoothstep(0.50, 0.96, t);

    camX = 0;
    camY = lerp(2.05, isPortrait ? 6.8 : 6.0, droneAscend);
    camZ = trackZ;

    lookX = 0;
    lookY = lerp(2.15, isPortrait ? 5.3 : 4.85, droneAscend);
    lookZ = lerp(-9.8, 16.0, droneAscend);

    const camAzimuth = Math.atan2(camX - 0, camZ - coupleZ);
    const relAng = normalizeAngle(camAzimuth - weddingFacingY);
    renderWeddingCoupleMultiAngle(relAng, 0, 0);
  }

  // Update Multi-Angle Professor, Kathak Lead & 5 Troupe Dancers
  if (!isChurchWedding) {
    const manCamAz = Math.atan2(camX - manStandee.position.x, camZ - manStandee.position.z);
    renderManMultiAngle({
      relAngle: normalizeAngle(manCamAz - manFacingY),
      walkPhase: manWalkPhase,
      walkAmt: manWalkAmt,
      leftShoulder: manLShoulder,
      leftElbow: manLElbow,
      rightShoulder: manRShoulder,
      rightElbow: manRElbow,
      holdCamera: manHoldCamera
    });

    const ladyCamAz = Math.atan2(camX - ladyStandee.position.x, camZ - ladyStandee.position.z);
    renderKathakMultiAngle({
      relAngle: normalizeAngle(ladyCamAz - ladyFacingY),
      danceTime: time,
      danceBlend: ladyDanceBlend,
      walkPhase: ladyWalkPhase,
      walkAmt: ladyWalkAmt
    });
  }

  if (wTroupe > 0.02) {
    troupeDancers.forEach((d, idx) => {
      const dCamAz = Math.atan2(camX - d.mesh.position.x, camZ - d.mesh.position.z);
      d.updateDancer(normalizeAngle(dCamAz - 0), time, idx * 0.7);
      d.mesh.rotation.y = dCamAz;
    });
  }

  manStandee.rotation.y = Math.atan2(camX - manStandee.position.x, camZ - manStandee.position.z);
  ladyStandee.rotation.y = Math.atan2(camX - ladyStandee.position.x, camZ - ladyStandee.position.z);
  weddingCoupleStandee.rotation.y = Math.atan2(camX - weddingCoupleStandee.position.x, camZ - weddingCoupleStandee.position.z);

  const zSign = camZ >= lookZ ? 1 : -1;
  camera.position.set(
    camX,
    camY,
    camZ + (isPortrait ? zSign * (sceneIdx === 7 ? 3.5 : 0.95) : 0)
  );
  camera.lookAt(lookX, lookY, lookZ);

  renderer.render(scene, camera);
}

animate();