'use strict';

const EVENT = Object.freeze({ date: '2026-11-20', year: 2026, time: '08:30', startUtc: '20261120T143000Z', program: null });
const $ = (selector) => document.querySelector(selector);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const soundEnabled = true;
let audioContext;
let toastTimer;
let filmPlaying = false;
let schoolRevealed = false;
let filmWatchdog;
let fallbackTimer;
let intertitleTimer;
let intertitleReadyTimer;
let intertitleShown = false;
let boardingShown = false;
let fallbackAudio;
let fallbackBuffer;
const trainVideo = $('#tren-video');

function unlockAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass) { audioContext ||= new AudioContextClass(); void audioContext.resume(); }
}

async function playFallbackAudio() {
  try {
    unlockAudio();
    if (!audioContext) return;
    fallbackBuffer ||= await audioContext.decodeAudioData(await (await fetch('assets/tren-audio.mp3')).arrayBuffer());
    if (!filmPlaying || schoolRevealed) return;
    fallbackAudio?.stop();
    fallbackAudio = audioContext.createBufferSource();
    fallbackAudio.buffer = fallbackBuffer;
    fallbackAudio.connect(audioContext.destination);
    fallbackAudio.start();
  } catch { playWelcome(); }
}

function playWelcome() {
  if (!soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  void audioContext.resume();
  [293.66, 369.99, 440, 587.33].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * 0.105;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.09, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.6);
  });
}

function celebrate() {
  if (reduceMotion.matches) return;
  const colors = ['#b34431', '#e0af55', '#173c32', '#f4e6c4', '#4c7e63'];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 48; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--left', `${Math.random() * 100}%`);
    piece.style.setProperty('--delay', `${Math.random() * 0.7}s`);
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty('--turn', `${Math.random() * 900}deg`);
    piece.style.backgroundColor = colors[i % colors.length];
    piece.addEventListener('animationend', () => piece.remove(), { once: true });
    fragment.append(piece);
  }
  $('#confeti').append(fragment);
}

function revealSchool() {
  if (schoolRevealed) return;
  schoolRevealed = true;
  filmPlaying = false;
  window.clearTimeout(filmWatchdog);
  window.clearTimeout(fallbackTimer);
  window.clearTimeout(intertitleTimer);
  window.clearTimeout(intertitleReadyTimer);
  fallbackAudio?.stop(); fallbackAudio = null;
  $('#omitir').hidden = true;
  const main = $('#contenido');
  main.hidden = false;
  $('#portada').classList.add('opening');
  document.body.classList.remove('cover-visible');
  document.body.classList.add('school-revealed');
  celebrate();
  window.setTimeout(() => {
    $('#portada').hidden = true;
    trainVideo.pause();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#titulo').focus({ preventScroll: true });
  }, reduceMotion.matches ? 0 : 1300);
}

function showBoardingPass() {
  if (schoolRevealed || boardingShown) return;
  boardingShown = true;
  filmPlaying = false;
  window.clearTimeout(filmWatchdog);
  window.clearTimeout(fallbackTimer);
  window.clearTimeout(intertitleTimer);
  window.clearTimeout(intertitleReadyTimer);
  trainVideo.pause();
  fallbackAudio?.stop(); fallbackAudio = null;
  $('#omitir').hidden = true;
  $('#escuela-intertitulo').hidden = true;
  $('#bienvenida-viaje').hidden = false;
  $('#portada').classList.add('is-boarding');
  $('#portada').scrollTop = 0;
  $('#bienvenida-titulo').focus({ preventScroll: true });
}

function showIntertitle() {
  if (schoolRevealed || intertitleShown || boardingShown) return;
  intertitleShown = true;
  $('#escuela-intertitulo').hidden = false;
  $('#escuela-intertitulo').dataset.ready = 'false';
  $('#continuar-invitacion').disabled = true;
  $('#portada').classList.add('is-titling');
  playWelcome();
  intertitleReadyTimer = window.setTimeout(() => {
    $('#escuela-intertitulo').dataset.ready = 'true';
    $('#continuar-invitacion').disabled = false;
  }, reduceMotion.matches ? 0 : 2200);
  intertitleTimer = window.setTimeout(showBoardingPass, 5600);
}

function startFallback() {
  if (!filmPlaying || schoolRevealed) return;
  $('#portada').classList.add('film-fallback');
  void playFallbackAudio();
  window.clearTimeout(fallbackTimer);
  fallbackTimer = window.setTimeout(showIntertitle, 7600);
}

function openInvitation() {
  if (filmPlaying) return;
  $('#abrir').disabled = true;
  schoolRevealed = false;
  filmPlaying = true;
  unlockAudio();
  if (reduceMotion.matches) { showIntertitle(); return; }
  $('#omitir').hidden = false;
  $('#portada').classList.add('is-playing');
  trainVideo.muted = false;
  trainVideo.volume = 1;
  trainVideo.currentTime = 0;
  trainVideo.play().catch(startFallback);
  filmWatchdog = window.setTimeout(showIntertitle, 20000);
}

function reopenInvitation() {
  window.clearTimeout(filmWatchdog);
  window.clearTimeout(fallbackTimer);
  window.clearTimeout(intertitleTimer);
  window.clearTimeout(intertitleReadyTimer);
  fallbackAudio?.stop(); fallbackAudio = null;
  trainVideo.pause();
  trainVideo.currentTime = 0;
  filmPlaying = false;
  schoolRevealed = false;
  intertitleShown = false;
  boardingShown = false;
  $('#bienvenida-viaje').hidden = true;
  $('#escuela-intertitulo').hidden = true;
  $('#escuela-intertitulo').dataset.ready = 'false';
  $('#continuar-invitacion').disabled = true;
  $('#portada').hidden = false;
  $('#portada').classList.remove('opening', 'is-playing', 'film-fallback', 'is-titling', 'is-boarding');
  $('#portada').style.setProperty('--progress', '0%');
  $('#portada').scrollTop = 0;
  document.body.classList.add('cover-visible');
  document.body.classList.remove('school-revealed');
  $('#contenido').hidden = true;
  $('#omitir').hidden = true;
  $('#abrir').disabled = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#abrir').focus({ preventScroll: true });
}

function updateCountdown() {
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const today = Date.parse(`${localDate}T00:00:00Z`);
  const target = Date.parse(`${EVENT.date}T00:00:00Z`);
  const days = Math.round((target - today) / 86400000);
  if (days > 0) {
    $('#dias-etiqueta').textContent = days === 1 ? 'Falta' : 'Faltan';
    $('#dias').textContent = days;
    $('#dias-unidad').textContent = days === 1 ? 'día para celebrar' : 'días para celebrar';
  } else if (days === 0) {
    $('#dias-etiqueta').textContent = 'El gran día';
    $('#dias').textContent = '¡Hoy!';
    $('#dias-unidad').textContent = 'nuestra historia nos reúne';
    $('#cuenta-nota').textContent = 'Hoy es 20 de noviembre. Consulta los datos de la celebración.';
    $('#cuenta-regresiva').classList.add('countdown-message');
  } else {
    $('#dias-etiqueta').textContent = 'Nuestra historia';
    $('#dias').textContent = 'nos une';
    $('#dias-unidad').textContent = 'sigamos compartiendo nuestras tradiciones';
    $('#cuenta-nota').textContent = '20 de noviembre de 2026 · Revolución Mexicana';
    $('#cuenta-regresiva').classList.add('countdown-message');
  }
}

function showToast(text) {
  $('#aviso').textContent = text;
  $('#aviso').classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => $('#aviso').classList.remove('visible'), 4500);
}

function downloadCalendar() {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const contents = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rafael Ramirez//Invitacion escolar//ES',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:revolucion-20261120-rafael-ramirez@invitacion.local', `DTSTAMP:${now}`,
    `DTSTART:${EVENT.startUtc}`, 'SEQUENCE:1',
    'SUMMARY:Revolución Mexicana - Escuela Primaria Rafael Ramírez',
    'DESCRIPTION:20 de noviembre de 2026 a las 8:30 a. m. (hora de la Ciudad de México). Consulta la invitación para conocer el programa de participaciones.',
    'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT', 'END:VCALENDAR', ''
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '20-noviembre-rafael-ramirez.ics';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('Se descargó el recordatorio: 20 de noviembre, 8:30 a. m.');
}

$('#abrir').addEventListener('click', openInvitation);
$('.skip-link').addEventListener('click', (event) => {
  if ($('#contenido').hidden) { event.preventDefault(); revealSchool(); }
});
$('#omitir').addEventListener('click', showBoardingPass);
$('#continuar-invitacion').addEventListener('click', showBoardingPass);
$('#abordar-viaje').addEventListener('click', revealSchool);
trainVideo.addEventListener('ended', showIntertitle);
trainVideo.addEventListener('error', startFallback);
trainVideo.addEventListener('timeupdate', () => {
  if (Number.isFinite(trainVideo.duration)) $('#portada').style.setProperty('--progress', `${trainVideo.currentTime / trainVideo.duration * 100}%`);
  if (filmPlaying && trainVideo.currentTime >= 7.28) showIntertitle();
});
$('#volver-abrir').addEventListener('click', reopenInvitation);
$('#guardar-fecha').addEventListener('click', downloadCalendar);
updateCountdown();
window.setInterval(updateCountdown, 60000);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); sectionObserver.unobserve(entry.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.welcome,.boarding-section,.program-inner,.countdown-section,.school-inner').forEach(section => sectionObserver.observe(section));
