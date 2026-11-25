const today = new Date().toLocaleDateString();
document.getElementById('date').textContent = today;

let history = JSON.parse(localStorage.getItem('masonHistory') || '[]');

let quizIndex = 0;
let quizWrong = 0;
let currentQuestion = null;
const totalQuestions = 10;

let matchCards = [];
let flipped = [];
let matches = 0;
let matchWon = false;

function getStars(score) {
  if (score >= 4) return '★★★★★';
  if (score >= 3) return '★★★★☆';
  if (score >= 2) return '★★★☆☆';
  if (score >= 1) return '★★☆☆☆';
  return '☆☆☆☆☆';
}

function updateTodayStars() {
  const checks = ['teeth','bath','love','story'];
  const done = checks.filter(id => document.getElementById(id).checked).length;
  const bonus = matchWon ? 1 : 0;
  document.getElementById('todayStars').textContent = getStars(done + bonus);
}

function drawClockMarkers() {
  const clock = document.getElementById('clock');
  clock.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const num = document.createElement('div');
    num.className = 'number';
    num.textContent = i;
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const radius = 82;
    const x = 110 + radius * Math.cos(angle);
    const y = 110 + radius * Math.sin(angle);
    num.style.left = x + 'px';
    num.style.top = y + 'px';
    clock.appendChild(num);
  }
  for (let i = 0; i < 12; i++) {
    const tick = document.createElement('div');
    tick.className = 'tick hour-tick';
    tick.style.transform = `rotate(${i * 30}deg)`;
    clock.appendChild(tick);
  }
  const hourHand = document.createElement('div');
  hourHand.className = 'hand hour-hand';
  hourHand.id = 'hourHand';
  clock.appendChild(hourHand);
  const minuteHand = document.createElement('div');
  minuteHand.className = 'hand minute-hand';
  minuteHand.id = 'minuteHand';
  clock.appendChild(minuteHand);
  const center = document.createElement('div');
  center.className = 'center-dot';
  clock.appendChild(center);
}

function loadBook() {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const saved = JSON.parse(localStorage.getItem('masonBook') || '{}');
  const section = document.getElementById('bookSection');

  if (now.getDate() === 1) {
    section.innerHTML = `
      <p>Set this month's book:</p>
      <input type="text" id="bookInput" placeholder="Book title" value="${saved.month === currentMonthKey ? saved.title || '' : ''}">
      <button onclick="saveBook()">Save Book</button>
    `;
  } else if (saved.month === currentMonthKey && saved.title) {
    section.innerHTML = `<p style="font-size:1.2em;">📖 ${saved.title}</p>`;
  } else {
    section.innerHTML = `<p>No book set for this month yet.</p>`;
  }
}

function saveBook() {
  const input = document.getElementById('bookInput');
  if (!input) return;
  const title = input.value.trim();
  if (!title) return;
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  localStorage.setItem('masonBook', JSON.stringify({ month: currentMonthKey, title }));
  loadBook();
}

function startMatchingGame() {
  const pairs = ['⭐','⭐','❤️','❤️','🔵','🔵'];
  matchCards = pairs.sort(() => Math.random() - 0.5);
  flipped = [];
  matches = 0;
  matchWon = false;
  const board = document.getElementById('matchBoard');
  board.innerHTML = '';
  matchCards.forEach((symbol, index) => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.index = index;
    card.dataset.symbol = symbol;
    card.textContent = '?';
    card.onclick = () => flipCard(card);
    board.appendChild(card);
  });
  document.getElementById('matchStatus').textContent = 'Find the matching pairs!';
  updateTodayStars();
}

function flipCard(card) {
  if (card.classList.contains('matched') || card.classList.contains('flipped') || flipped.length >= 2) return;
  card.classList.add('flipped');
  card.textContent = card.dataset.symbol;
  flipped.push(card);

  if (flipped.length === 2) {
    setTimeout(checkMatch, 600);
  }
}

function checkMatch() {
  const [a, b] = flipped;
  if (a.dataset.symbol === b.dataset.symbol) {
    a.classList.add('matched');
    b.classList.add('matched');
    matches++;
    document.getElementById('matchStatus').textContent = `Matches: ${matches}/3`;
    if (matches === 3) {
      matchWon = true;
      document.getElementById('matchStatus').textContent = 'You won the checklist! 🎉 Great job!';
      updateTodayStars();
    }
  } else {
    a.classList.remove('flipped');
    b.classList.remove('flipped');
    a.textContent = '?';
    b.textContent = '?';
  }
  flipped = [];
}

function loadToday() {
  const saved = history.find(d => d.date === today);
  if (saved) {
    ['teeth','bath','love','story'].forEach(id => {
      document.getElementById(id).checked = !!saved[id];
    });
    document.getElementById('outsideMin').value = saved.outsideMin || '';
    document.getElementById('outsideActivity').value = saved.outsideActivity || '';
    document.getElementById('favoritePart').value = saved.favoritePart || '';
  }
  updateTodayStars();
  renderWeek();
  checkAspirationDay();
  drawClockMarkers();
  updateClock();
  setInterval(updateClock, 1000);
  startCalendarGame();
  startClockGame();
  nextQuestion();
  loadBook();
  startMatchingGame();
}

function startCalendarGame() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const correct = days[new Date().getDay()];
  document.getElementById('calQuestion').textContent = 'What day is today?';
  const choices = document.getElementById('calChoices');
  choices.innerHTML = '';
  const shuffled = [...days].sort(() => Math.random() - 0.5).slice(0, 4);
  if (!shuffled.includes(correct)) shuffled[0] = correct;
  shuffled.forEach(day => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = day;
    btn.onclick = () => {
      document.getElementById('calResult').textContent = day === correct ? 'Correct! 🎉' : `Try again! Today is ${correct}.`;
    };
    choices.appendChild(btn);
  });
}

function startClockGame() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = Math.floor(now.getMinutes() / 5) * 5;
  const correct = `${h}:${m.toString().padStart(2,'0')}`;
  document.getElementById('clockQuestion').textContent = 'What time is it?';
  const choices = document.getElementById('clockChoices');
  choices.innerHTML = '';
  const options = [correct];
  while (options.length < 3) {
    const rh = Math.floor(Math.random()*12)+1;
    const rm = Math.floor(Math.random()*12)*5;
    const opt = `${rh}:${rm.toString().padStart(2,'0')}`;
    if (!options.includes(opt)) options.push(opt);
  }
  options.sort(() => Math.random()-0.5);
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt;
    btn.onclick = () => {
      document.getElementById('clockResult').textContent = opt === correct ? 'Correct! 🎉' : 'Try again!';
    };
    choices.appendChild(btn);
  });
}

function checkAspirationDay() {
  if (new Date().getDay() === 0) {
    document.getElementById('aspirationCard').style.display = 'block';
    document.getElementById('aspiration').value = localStorage.getItem('masonAspiration') || '';
  }
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;
  const hourHand = document.getElementById('hourHand');
  const minuteHand = document.getElementById('minuteHand');
  if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
  if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
  const displayHours = now.getHours() % 12 || 12;
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  document.getElementById('digitalTime').textContent = `${displayHours}:${minutes.toString().padStart(2,'0')} ${ampm}`;
}

function renderWeek() {
  const container = document.getElementById('weekCalendar');
  const last7 = [...history].slice(-7).reverse();
  let html = '';
  const todayData = history.find(d => d.date === today);
  const todayScore = todayData ? ['teeth','bath','love','story'].filter(k => todayData[k]).length : 0;
  html += `<div class="day-row today-row"><span><strong>Today</strong> (${today})</span><span>${todayScore}/4</span><span class="stars">${getStars(todayScore)}</span></div>`;
  last7.forEach(day => {
    if (day.date === today) return;
    const score = ['teeth','bath','love','story'].filter(k => day[k]).length;
    html += `<div class="day-row"><span>${day.date}</span><span>${score}/4</span><span class="stars">${getStars(score)}</span></div>`;
  });
  container.innerHTML = html || '<p>No days saved yet.</p>';
}

['teeth','bath','love','story'].forEach(id => {
  document.getElementById(id).addEventListener('change', updateTodayStars);
});

function nextQuestion() {
  if (quizIndex >= totalQuestions) {
    document.getElementById('quiz').innerHTML = '<p>Final question (ask a parent for help): What is 7 + 8?</p><input type="number" id="finalAnswer" style="width:80px"> <button onclick="checkFinal()">Check</button>';
    document.getElementById('quizStatus').textContent = 'Quiz complete!';
    return;
  }
  quizWrong = 0;
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  currentQuestion = a + b;
  document.getElementById('quiz').innerHTML = `<div>${a} + ${b} = <input type="number" id="qAnswer" style="width:80px"></div>`;
  document.getElementById('quizStatus').textContent = `Question ${quizIndex + 1} of 10 (wrong answers left: 3)`;
  quizIndex++;
}

function checkAnswer() {
  const val = parseInt(document.getElementById('qAnswer').value);
  if (val === currentQuestion) {
    document.getElementById('quizResult').textContent = 'Correct!';
    setTimeout(nextQuestion, 800);
  } else {
    quizWrong++;
    if (quizWrong >= 3) {
      document.getElementById('quizResult').textContent = `The answer was ${currentQuestion}. Moving on.`;
      setTimeout(nextQuestion, 1200);
    } else {
      document.getElementById('quizResult').textContent = `Try again (${3 - quizWrong} left)`;
    }
  }
}

document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && document.getElementById('qAnswer')) checkAnswer();
});

function checkFinal() {
  const val = parseInt(document.getElementById('finalAnswer').value);
  document.getElementById('quizResult').textContent = val === 15 ? 'Great job with parent help! 🎉' : 'Ask a parent to help check.';
}

function speakDay() {
  const fav = document.getElementById('favoritePart').value || 'nothing yet';
  const utter = new SpeechSynthesisUtterance(`My favorite part of the day was ${fav}.`);
  utter.rate = 0.9;
  speechSynthesis.speak(utter);
}

const video = document.getElementById('video');
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(() => { video.style.display = 'none'; });

function takePhoto() {
  const canvas = document.getElementById('canvas');
  const photo = document.getElementById('photo');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  photo.src = canvas.toDataURL('image/png');
}

function saveDay() {
  const data = {
    date: today,
    teeth: document.getElementById('teeth').checked,
    bath: document.getElementById('bath').checked,
    love: document.getElementById('love').checked,
    story: document.getElementById('story').checked,
    outsideMin: document.getElementById('outsideMin').value,
    outsideActivity: document.getElementById('outsideActivity').value,
    favoritePart: document.getElementById('favoritePart').value
  };
  history = history.filter(d => d.date !== today);
  history.push(data);
  if (history.length > 30) history = history.slice(-30);
  localStorage.setItem('masonHistory', JSON.stringify(history));
  if (document.getElementById('aspirationCard').style.display !== 'none') {
    localStorage.setItem('masonAspiration', document.getElementById('aspiration').value);
  }
  document.getElementById('savedMsg').textContent = 'Saved! Great job today Mason! 🌟';
  updateTodayStars();
  renderWeek();
}

loadToday();