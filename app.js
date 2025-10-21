const API_URL = 'https://swipetake-api.luke-stubbins.workers.dev';

let currentDebate = null;
let currentUser = null;
let sessionToken = null;
let timer = null;
let timerInterval = null;
let currentSide = null;

const authScreen = document.getElementById('auth-screen');
const app = document.getElementById('app');
const usernameInput = document.getElementById('username-input');
const btnLogin = document.getElementById('btn-login');
const usernameDisplay = document.getElementById('username-display');
const xpDisplay = document.getElementById('xp');
const levelDisplay = document.getElementById('level');
const streakDisplay = document.getElementById('streak-display');
const streakValue = document.getElementById('streak');
const liveCount = document.getElementById('live-count');
const record = document.getElementById('record');
const promptText = document.getElementById('prompt-text');
const vibeTag = document.getElementById('vibe-tag');
const slots = document.getElementById('slots');
const battleStatus = document.getElementById('battle-status');
const battleTimer = document.getElementById('battle-timer');
const timerDisplayEl = document.getElementById('timer-display');
const btnArgueFor = document.getElementById('btn-argue-for');
const btnArgueAgainst = document.getElementById('btn-argue-against');
const btnSkip = document.getElementById('btn-skip');
const argueModal = document.getElementById('argue-modal');
const winnerModal = document.getElementById('winner-modal');
const modalSide = document.getElementById('modal-side');
const modalPrompt = document.getElementById('modal-prompt');
const argumentInput = document.getElementById('argument-input');
const btnCloseArgue = document.getElementById('btn-close-argue');
const btnSubmit = document.getElementById('btn-submit');
const btnCloseWinner = document.getElementById('btn-close-winner');
const argCharCount = document.getElementById('arg-char-count');
const promptCharCount = document.getElementById('prompt-char-count');
const createPrompt = document.getElementById('create-prompt');
const createVibe = document.getElementById('create-vibe');
const createMax = document.getElementById('create-max');
const btnCreateDebate = document.getElementById('btn-create-debate');
const winnerTitle = document.getElementById('winner-title');
const winnerMessage = document.getElementById('winner-message');
const leaderboardList = document.getElementById('leaderboard-list');
const profileUsername = document.getElementById('profile-username');
const profileLevel = document.getElementById('profile-level');
const profileStreak = document.getElementById('profile-streak');
const profileXp = document.getElementById('profile-xp');
const profileWins = document.getElementById('profile-wins');
const profileLosses = document.getElementById('profile-losses');
const profileWinrate = document.getElementById('profile-winrate');
const btnLogout = document.getElementById('btn-logout');
const timerBar = document.getElementById('timer-bar');
const timerFill = document.getElementById('timer-fill');
const timerText = document.getElementById('timer-text');

init();

function init() {
    checkSession();
    loadTheme();
    
    btnLogin.addEventListener('click', login);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    btnArgueFor.addEventListener('click', () => openArgueModal('for'));
    btnArgueAgainst.addEventListener('click', () => openArgueModal('against'));
    btnSkip.addEventListener('click', skipDebate);
    btnSubmit.addEventListener('click', submitArgument);
    btnCloseArgue.addEventListener('click', closeArgueModal);
    btnCloseWinner.addEventListener('click', () => winnerModal.classList.add('hidden'));
    btnCreateDebate.addEventListener('click', createDebate);
    btnLogout.addEventListener('click', logout);
    
    argumentInput.addEventListener('input', () => {
        argCharCount.textContent = argumentInput.value.length;
    });
    
    createPrompt.addEventListener('input', () => {
        promptCharCount.textContent = createPrompt.value.length;
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.dataset.view;
            switchView(view);
        });
    });
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.dataset.theme;
            setTheme(theme);
        });
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('swipetake_theme') || 'dark';
    setTheme(savedTheme, false);
}

function setTheme(theme, save = true) {
    document.body.className = `theme-${theme}`;
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    
    if (save) {
        localStorage.setItem('swipetake_theme', theme);
        if (currentUser) {
            updateUserTheme(theme);
        }
    }
}

async function updateUserTheme(theme) {
    try {
        await fetch(`${API_URL}/user/theme`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ theme })
        });
    } catch (err) {
        console.error('Failed to save theme:', err);
    }
}

function checkSession() {
    sessionToken = localStorage.getItem('swipetake_session');
    if (sessionToken) {
        verifySession();
    }
}

async function verifySession() {
    try {
        const res = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_token: sessionToken })
        });
        
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            if (currentUser.theme) {
                setTheme(currentUser.theme, false);
            }
            showApp();
        } else {
            localStorage.removeItem('swipetake_session');
            sessionToken = null;
        }
    } catch (err) {
        console.error('Session verification failed:', err);
    }
}

async function login() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('ENTER A USERNAME');
        return;
    }
    
    if (username.length < 3) {
        alert('USERNAME MUST BE AT LEAST 3 CHARACTERS');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.user;
            sessionToken = data.session_token;
            localStorage.setItem('swipetake_session', sessionToken);
            if (currentUser.theme) {
                setTheme(currentUser.theme, false);
            }
            showApp();
        } else {
            alert(data.error || 'LOGIN FAILED');
        }
    } catch (err) {
        console.error('Login error:', err);
        currentUser = {
            id: 1,
            username,
            xp: 0,
            level: 1,
            wins: 0,
            losses: 0,
            streak: 0,
            theme: 'dark'
        };
        showApp();
    }
}

function logout() {
    localStorage.removeItem('swipetake_session');
    sessionToken = null;
    currentUser = null;
    app.classList.add('hidden');
    authScreen.classList.remove('hidden');
    usernameInput.value = '';
}

function showApp() {
    authScreen.classList.add('hidden');
    app.classList.remove('hidden');
    usernameDisplay.textContent = `@${currentUser.username}`;
    updateStats();
    loadDebate();
    updateLiveStats();
}

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    if (view === 'leaderboard') loadLeaderboard();
    if (view === 'profile') updateProfile();
    if (view === 'feed') loadDebate();
}

async function loadDebate() {
    animateCardOut();
    
    setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/debates/random`);
            currentDebate = await res.json();
            
            promptText.textContent = currentDebate.prompt;
            vibeTag.textContent = `#${currentDebate.vibe.toUpperCase()}`;
            slots.textContent = `${currentDebate.response_count}/${currentDebate.max_responses} FIGHTERS`;
            
            if (currentDebate.status === 'ended') {
                battleStatus.textContent = 'ENDED';
                battleStatus.classList.add('ended');
                btnArgueFor.disabled = true;
                btnArgueAgainst.disabled = true;
            } else {
                battleStatus.textContent = 'LIVE';
                battleStatus.classList.remove('ended');
                btnArgueFor.disabled = false;
                btnArgueAgainst.disabled = false;
                startBattleTimer(currentDebate.ends_at);
            }
            
            animateCardIn();
        } catch (err) {
            console.error('Error:', err);
            currentDebate = {
                id: Math.floor(Math.random() * 1000),
                prompt: "Trump was the best president in modern US history",
                vibe: "Spicy",
                response_count: 3,
                max_responses: 10,
                status: 'active',
                ends_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            };
            promptText.textContent = currentDebate.prompt;
            vibeTag.textContent = `#${currentDebate.vibe.toUpperCase()}`;
            slots.textContent = `${currentDebate.response_count}/${currentDebate.max_responses} FIGHTERS`;
            battleStatus.textContent = 'LIVE';
            startBattleTimer(currentDebate.ends_at);
            animateCardIn();
        }
    }, 300);
}

function startBattleTimer(endsAt) {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const now = new Date();
        const end = new Date(endsAt);
        const diff = end - now;
        
        if (diff <= 0) {
            battleTimer.textContent = '0:00';
            timerDisplayEl.classList.add('urgent');
            clearInterval(timerInterval);
            return;
        }
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        battleTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (diff < 120000) {
            timerDisplayEl.classList.add('urgent');
        }
    }, 1000);
}

function skipDebate() {
    if (timerInterval) clearInterval(timerInterval);
    loadDebate();
}

function animateCardOut() {
    const card = document.getElementById('battle-card');
    card.style.transform = 'translateX(-100%) rotate(-5deg)';
    card.style.opacity = '0';
}

function animateCardIn() {
    const card = document.getElementById('battle-card');
    setTimeout(() => {
        card.style.transform = 'translateX(0) rotate(0)';
        card.style.opacity = '1';
    }, 50);
}

function openArgueModal(side) {
    if (currentDebate.response_count >= currentDebate.max_responses) {
        showWinner('BATTLE FULL!', 'This battle has reached max fighters. Try another!');
        skipDebate();
        return;
    }
    
    if (currentDebate.status === 'ended') {
        showWinner('BATTLE ENDED!', 'This battle is over. Find a live one!');
        skipDebate();
        return;
    }
    
    currentSide = side;
    modalSide.textContent = side === 'for' ? 'FIGHTING FOR' : 'FIGHTING AGAINST';
    modalSide.style.color = side === 'for' ? 'var(--accent-cyan)' : 'var(--accent-pink)';
    modalPrompt.textContent = currentDebate.prompt;
    argueModal.classList.remove('hidden');
    argumentInput.value = '';
    argCharCount.textContent = '0';
    argumentInput.focus();
    
    let timeLeft = 30;
    timerText.textContent = `${timeLeft}s`;
    timerFill.style.width = '100%';
    
    timer = setInterval(() => {
        timeLeft--;
        const percentage = (timeLeft / 30) * 100;
        timerFill.style.width = `${percentage}%`;
        timerText.textContent = `${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            timerText.textContent = "TIME'S UP!";
        }
    }, 1000);
}

function closeArgueModal() {
    argueModal.classList.add('hidden');
    clearInterval(timer);
}

async function submitArgument() {
    const argument = argumentInput.value.trim();
    
    if (!argument) {
        alert('WRITE AN ARGUMENT!');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/arguments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                debate_id: currentDebate.id,
                user_id: currentUser.id,
                username: currentUser.username,
                side: currentSide,
                text: argument
            })
        });
        
        if (res.ok) {
            currentUser.xp += 5;
            updateStats();
            closeArgueModal();
            showWinner('ARGUMENT POSTED! ⚔️', '+5 XP');
            setTimeout(() => skipDebate(), 2000);
        }
    } catch (err) {
        console.error('Error:', err);
        currentUser.xp += 5;
        updateStats();
        closeArgueModal();
        showWinner('ARGUMENT POSTED! ⚔️', '+5 XP');
        setTimeout(() => skipDebate(), 2000);
    }
}

async function createDebate() {
    const prompt = createPrompt.value.trim();
    const vibe = createVibe.value;
    const maxResponses = parseInt(createMax.value);
    
    if (!prompt) {
        alert('ENTER A STATEMENT!');
        return;
    }
    
    if (prompt.length < 10) {
        alert('STATEMENT MUST BE AT LEAST 10 CHARACTERS!');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/debates`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({
                prompt,
                vibe,
                max_responses: maxResponses,
                creator_id: currentUser.id
            })
        });
        
        if (res.ok) {
            currentUser.xp += 10;
            updateStats();
            createPrompt.value = '';
            promptCharCount.textContent = '0';
            showWinner('BATTLE LAUNCHED! 🚀', '+10 XP');
            setTimeout(() => switchView('feed'), 2000);
        }
    } catch (err) {
        console.error('Error:', err);
        currentUser.xp += 10;
        updateStats();
        createPrompt.value = '';
        promptCharCount.textContent = '0';
        showWinner('BATTLE LAUNCHED! 🚀', '+10 XP');
        setTimeout(() => switchView('feed'), 2000);
    }
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const leaders = await res.json();
        
        leaderboardList.innerHTML = '';
        
        if (!leaders || leaders.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.5;">No champions yet. Be the first!</p>';
            return;
        }
        
        leaders.forEach((leader, index) => {
            const rank = index + 1;
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            if (rank === 1) item.classList.add('top-1');
            if (rank === 2) item.classList.add('top-2');
            if (rank === 3) item.classList.add('top-3');
            
            const rankIcon = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            
            item.innerHTML = `
                <div class="leaderboard-rank ${rank <= 3 ? `top-${rank}` : ''}">${rankIcon}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-username">${leader.username}</div>
                    <div class="leaderboard-stats">${leader.wins}W / ${leader.losses}L ${leader.streak > 0 ? `🔥 ${leader.streak}` : ''}</div>
                </div>
                <div class="leaderboard-xp">${leader.xp}</div>
            `;
            leaderboardList.appendChild(item);
        });
    } catch (err) {
        console.error('Error:', err);
        leaderboardList.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.5;">Failed to load leaderboard</p>';
    }
}

function updateStats() {
    currentUser.level = Math.floor(currentUser.xp / 100) + 1;
    levelDisplay.textContent = `LVL ${currentUser.level}`;
    xpDisplay.textContent = currentUser.xp;
    
    if (currentUser.streak > 0) {
        streakDisplay.style.display = 'block';
        streakValue.textContent = currentUser.streak;
    } else {
        streakDisplay.style.display = 'none';
    }
}

function updateProfile() {
    profileUsername.textContent = currentUser.username.toUpperCase();
    profileLevel.textContent = `LEVEL ${currentUser.level}`;
    profileXp.textContent = currentUser.xp;
    profileWins.textContent = currentUser.wins;
    profileLosses.textContent = currentUser.losses;
    
    const total = currentUser.wins + currentUser.losses;
    const winrate = total > 0 ? Math.round((currentUser.wins / total) * 100) : 0;
    profileWinrate.textContent = `${winrate}%`;
    
    if (currentUser.streak > 0) {
        profileStreak.style.display = 'inline-block';
        profileStreak.textContent = `🔥 ${currentUser.streak} STREAK`;
    } else {
        profileStreak.style.display = 'none';
    }
}

async function updateLiveStats() {
    try {
        const res = await fetch(`${API_URL}/stats`);
        const stats = await res.json();
        
        liveCount.textContent = stats.live_battles || 0;
        record.textContent = `${currentUser.wins}/${currentUser.losses}`;
    } catch (err) {
        console.error('Error:', err);
        liveCount.textContent = '0';
        record.textContent = `${currentUser.wins}/${currentUser.losses}`;
    }
}

function showWinner(title, message) {
    winnerTitle.textContent = title;
    winnerMessage.textContent = message;
    winnerModal.classList.remove('hidden');
}