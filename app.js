const API_URL = 'https://swipetake-api.luke-stubbins.workers.dev';

let currentDebate = null;
let currentUser = { 
    id: 1, 
    level: 1, 
    xp: 0,
    debates: 0,
    wins: 0,
    votes: 0
};
let timer = null;

const promptText = document.getElementById('prompt-text');
const vibeTag = document.getElementById('vibe-tag');
const slots = document.getElementById('slots');
const btnArgue = document.getElementById('btn-argue');
const btnSkip = document.getElementById('btn-skip');
const argueModal = document.getElementById('argue-modal');
const successModal = document.getElementById('success-modal');
const modalPrompt = document.getElementById('modal-prompt');
const argumentInput = document.getElementById('argument-input');
const sideSelect = document.getElementById('side-select');
const timerDisplay = document.getElementById('timer');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const btnCloseSuccess = document.getElementById('btn-close-success');
const levelDisplay = document.getElementById('level');
const xpDisplay = document.getElementById('xp');
const voteList = document.getElementById('vote-list');
const argCharCount = document.getElementById('arg-char-count');
const promptCharCount = document.getElementById('prompt-char-count');
const createPrompt = document.getElementById('create-prompt');
const createVibe = document.getElementById('create-vibe');
const createMax = document.getElementById('create-max');
const btnCreateDebate = document.getElementById('btn-create-debate');
const successTitle = document.getElementById('success-title');
const successMessage = document.getElementById('success-message');

init();

function init() {
    loadDebate();
    updateStats();
    
    btnArgue.addEventListener('click', openArgueModal);
    btnSkip.addEventListener('click', skipDebate);
    btnSubmit.addEventListener('click', submitArgument);
    btnCancel.addEventListener('click', closeArgueModal);
    btnCloseSuccess.addEventListener('click', () => successModal.classList.add('hidden'));
    btnCreateDebate.addEventListener('click', createDebate);
    
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
}

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    if (view === 'vote') loadVoteArguments();
    if (view === 'profile') updateProfile();
}

async function loadDebate() {
    animateCardOut();
    
    setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/debates/random`);
            currentDebate = await res.json();
            
            promptText.textContent = currentDebate.prompt;
            vibeTag.textContent = `#${currentDebate.vibe}`;
            slots.textContent = `${currentDebate.response_count}/${currentDebate.max_responses} responses`;
            
            animateCardIn();
        } catch (err) {
            console.error('Error:', err);
            currentDebate = {
                id: Math.floor(Math.random() * 1000),
                prompt: "Pineapple on pizza is a crime",
                vibe: "Fun",
                response_count: 3,
                max_responses: 10
            };
            promptText.textContent = currentDebate.prompt;
            vibeTag.textContent = `#${currentDebate.vibe}`;
            slots.textContent = `${currentDebate.response_count}/${currentDebate.max_responses} responses`;
            animateCardIn();
        }
    }, 300);
}

function skipDebate() {
    loadDebate();
}

function animateCardOut() {
    const card = document.getElementById('debate-card');
    card.style.transform = 'translateX(-100%) rotate(-10deg)';
    card.style.opacity = '0';
}

function animateCardIn() {
    const card = document.getElementById('debate-card');
    setTimeout(() => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.opacity = '1';
    }, 50);
}

function openArgueModal() {
    if (currentDebate.response_count >= currentDebate.max_responses) {
        showSuccess('Debate Full!', 'This debate has reached max responses. Try another!');
        loadDebate();
        return;
    }
    
    modalPrompt.textContent = currentDebate.prompt;
    argueModal.classList.remove('hidden');
    argumentInput.value = '';
    argCharCount.textContent = '0';
    argumentInput.focus();
    
    let timeLeft = 30;
    timerDisplay.textContent = `${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            timerDisplay.textContent = "Time's up!";
        }
    }, 1000);
}

function closeArgueModal() {
    argueModal.classList.add('hidden');
    clearInterval(timer);
}

async function submitArgument() {
    const argument = argumentInput.value.trim();
    const side = sideSelect.value;
    
    if (!argument) {
        alert('Please write an argument!');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/arguments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                debate_id: currentDebate.id,
                user_id: currentUser.id,
                side,
                text: argument
            })
        });
        
        if (res.ok) {
            currentUser.xp += 5;
            currentUser.debates++;
            updateStats();
            closeArgueModal();
            showSuccess('Argument Posted! 🎉', '+5 XP earned');
            setTimeout(() => loadDebate(), 2000);
        }
    } catch (err) {
        console.error('Error:', err);
        currentUser.xp += 5;
        currentUser.debates++;
        updateStats();
        closeArgueModal();
        showSuccess('Argument Posted! 🎉', '+5 XP earned');
        setTimeout(() => loadDebate(), 2000);
    }
}

async function createDebate() {
    const prompt = createPrompt.value.trim();
    const vibe = createVibe.value;
    const maxResponses = parseInt(createMax.value);
    
    if (!prompt) {
        alert('Please enter a debate statement!');
        return;
    }
    
    if (prompt.length < 10) {
        alert('Make your statement at least 10 characters!');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/debates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                vibe,
                max_responses: maxResponses,
                user_id: currentUser.id
            })
        });
        
        if (res.ok) {
            currentUser.xp += 10;
            updateStats();
            createPrompt.value = '';
            promptCharCount.textContent = '0';
            showSuccess('Debate Created! 🚀', '+10 XP earned');
            setTimeout(() => switchView('feed'), 2000);
        }
    } catch (err) {
        console.error('Error:', err);
        currentUser.xp += 10;
        updateStats();
        createPrompt.value = '';
        promptCharCount.textContent = '0';
        showSuccess('Debate Created! 🚀', '+10 XP earned');
        setTimeout(() => switchView('feed'), 2000);
    }
}

async function loadVoteArguments() {
    try {
        const res = await fetch(`${API_URL}/arguments/pending`);
        const args = await res.json();
        
        voteList.innerHTML = '';
        
        if (!args || args.length === 0) {
            voteList.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.7;">No arguments to vote on yet. Check back soon!</p>';
            return;
        }
        
        args.forEach(arg => {
            const item = document.createElement('div');
            item.className = 'vote-item';
            item.style.animation = 'slideIn 0.3s ease';
            item.innerHTML = `
                <p><strong>${arg.side === 'for' ? '✅ For' : '❌ Against'}</strong></p>
                <p>${arg.text}</p>
                <button onclick="vote(${arg.id})">Upvote 👍</button>
            `;
            voteList.appendChild(item);
        });
    } catch (err) {
        console.error('Error:', err);
        voteList.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.7;">No arguments available yet!</p>';
    }
}

async function vote(argumentId) {
    try {
        await fetch(`${API_URL}/votes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                argument_id: argumentId,
                user_id: currentUser.id
            })
        });
        
        currentUser.xp += 2;
        currentUser.votes++;
        updateStats();
        showSuccess('Vote Recorded! 👍', '+2 XP earned');
        setTimeout(() => loadVoteArguments(), 1500);
    } catch (err) {
        console.error('Error:', err);
        currentUser.xp += 2;
        currentUser.votes++;
        updateStats();
        showSuccess('Vote Recorded! 👍', '+2 XP earned');
        setTimeout(() => loadVoteArguments(), 1500);
    }
}

function updateStats() {
    currentUser.level = Math.floor(currentUser.xp / 100) + 1;
    levelDisplay.textContent = `Level ${currentUser.level}`;
    xpDisplay.textContent = `${currentUser.xp} XP`;
}

function updateProfile() {
    document.getElementById('profile-level').textContent = `Level ${currentUser.level}`;
    document.getElementById('profile-xp').textContent = currentUser.xp;
    document.getElementById('profile-debates').textContent = currentUser.debates;
    document.getElementById('profile-wins').textContent = currentUser.wins;
    document.getElementById('profile-votes').textContent = currentUser.votes;
}

function showSuccess(title, message) {
    successTitle.textContent = title;
    successMessage.textContent = message;
    successModal.classList.remove('hidden');
}

window.vote = vote;