-- SwipeTake Battle Royale Database

CREATE TABLE IF NOT EXISTS debates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    vibe TEXT DEFAULT 'Fun',
    creator_id INTEGER NOT NULL,
    response_count INTEGER DEFAULT 0,
    max_responses INTEGER DEFAULT 10,
    status TEXT DEFAULT 'active',
    winner_id INTEGER,
    ends_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES arguments(id)
);

CREATE TABLE IF NOT EXISTS arguments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debate_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    side TEXT NOT NULL,
    text TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    is_winner BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_debate_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_user_xp ON users(xp DESC);

-- Seed some battle prompts
INSERT INTO debates (prompt, vibe, creator_id, max_responses, ends_at) VALUES
('Remote work kills creativity and innovation', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Pineapple on pizza is actually elite', 'Fun', 1, 10, datetime('now', '+10 minutes')),
('AI will replace 80% of jobs by 2030', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Cats are objectively better than dogs', 'Fun', 1, 10, datetime('now', '+10 minutes')),
('Social media does more harm than good', 'Deep', 1, 10, datetime('now', '+10 minutes'));