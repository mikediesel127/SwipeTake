// SwipeTake Frontend Logic
const API_URL = 'https://swipetake-api.luke-stubbins.workers.dev';

let currentDebate = null;
let currentUser = { id: 1, level: 1, xp: 0 }; // Mock user for MVP
let timer = null;

// Elements
const promptText = document.getElementById('prompt-text');
const vibeTag = document.getElementById('vibe-tag');
const slots = document.getElementById('slots');
const btnArgue = document.getElementById('btn-argue');
const btnSkip = document.getElementById('btn-skip');
const argueModal = document.getElementById('argue-modal');
const voteModal = document.getElementById('vote-modal');
const modalPrompt = document.getElementById('modal-prompt');
const argumentInput = document.getElementById('argument-input');
const sideSelect = document.getElementById('side-select');
const timerDisplay = document.getElementById('timer');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const levelDisplay = document.getElementById('level');
const xpDisplay = document.getElementById('xp');
const voteList = document.getElementById('vote-list');
const btnDoneVoting = document.getElementById('btn-done-voting');

// Initialize
init();

function init() {
    loadDebate();
    updateStats();
    
    btnArgue.addEventListener('click', openArgueModal);
    btnSkip.addEventListener('click', loadDebate);
    btnSubmit.addEventListener('click', submitArgument);
    btnCancel.addEventListener('click', closeArgueModal);
    btnDoneVoting.addEventListener('click', () => voteModal.classList.add('hidden'));
    
    // Nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.dataset.view;
            if (view === 'vote') openVoteModal();
        });
    });
}

async function loadDebate() {
    try {
        const res = await fetch(`${API_URL}/debates/random`);
        currentDebate = await res.json();
        
        promptText.textContent = currentDebate.prompt;
        vibeTag.textContent = `#${currentDebate.vibe}`;
        slots.textContent = `${currentDebate.response_count}/${currentDebate.max_responses} responses`;
    } catch (err) {
        console.error('Error loading debate:', err);
        // Fallback mock data
        currentDebate = {
            id: 1,
            prompt: "Pineapple on pizza is a crime",
            vibe: "Fun",
            response_count: 3,
            max_responses: 10
        };
        promptText.textContent = currentDebate.prompt;
        vibeTag.textContent = `#${currentDebate.vibe}`;
        slots.textContent = `${currentDebate.response_count}/${currentDebate.max_responses} responses`;
    }
}

function openArgueModal() {
    if (currentDebate.response_count >= currentDebate.max_responses) {
        alert('This debate is full! Swipe to find another.');
        return;
    }
    
    modalPrompt.textContent = currentDebate.prompt;
    argueModal.classList.remove('hidden');
    argumentInput.value = '';
    argumentInput.focus();
    
    // Start 30s timer
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
            currentUser.xp += 5; // +5 XP for arguing
            updateStats();
            closeArgueModal();
            alert('Argument submitted! +5 XP');
            loadDebate();
        }
    } catch (err) {
        console.error('Error submitting argument:', err);
        alert('Submitted! (Mock mode)');
        closeArgueModal();
        currentUser.xp += 5;
        updateStats();
        loadDebate();
    }
}

async function openVoteModal() {
    try {
        const res = await fetch(`${API_URL}/arguments/pending`);
        const arguments = await res.json();
        
        voteList.innerHTML = '';
        arguments.forEach(arg => {
            const item = document.createElement('div');
            item.className = 'vote-item';
            item.innerHTML = `
                <p><strong>${arg.side === 'for' ? '✅ For' : '❌ Against'}</strong></p>
                <p>${arg.text}</p>
                <button onclick="vote(${arg.id})">Upvote 👍</button>
            `;
            voteList.appendChild(item);
        });
        
        voteModal.classList.remove('hidden');
    } catch (err) {
        console.error('Error loading arguments:', err);
        alert('No arguments to vote on yet!');
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
        
        currentUser.xp += 2; // +2 XP for voting
        updateStats();
        alert('Voted! +2 XP');
    } catch (err) {
        console.error('Error voting:', err);
        alert('Voted! (Mock mode)');
        currentUser.xp += 2;
        updateStats();
    }
}

function updateStats() {
    currentUser.level = Math.floor(currentUser.xp / 100) + 1;
    levelDisplay.textContent = `Level ${currentUser.level}`;
    xpDisplay.textContent = `${currentUser.xp} XP`;
}