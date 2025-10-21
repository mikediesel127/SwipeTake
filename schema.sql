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
    theme TEXT DEFAULT 'dark',
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

-- Seed WILD debates (redpill, political, polarizing, contemporary)
INSERT INTO debates (prompt, vibe, creator_id, max_responses, ends_at) VALUES
-- Political & Contemporary
('Trump was the best president in modern US history', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Woke culture is destroying Western civilization', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Socialism works better than capitalism', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Climate change is overblown by elites for control', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Democracy is failing and needs to be replaced', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Free speech should have zero limits, period', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Andrew Tate is right about modern masculinity', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Traditional gender roles create better societies', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('The left controls all mainstream media narratives', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Immigration is destroying European identity', 'Spicy', 1, 10, datetime('now', '+10 minutes')),

-- Redpill & Controversial
('Most people are too weak to handle the truth', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Women are naturally hypergamous and always trade up', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('The 9-5 is modern slavery designed to keep you poor', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Marriage is a scam created to benefit women', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Looks matter 10x more than personality in dating', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Universities are leftist indoctrination camps', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Money is the only thing that truly matters in life', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Alpha males are biologically superior to betas', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Hook-up culture has destroyed pair bonding forever', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('The blackpill is the ultimate truth about dating', 'Spicy', 1, 10, datetime('now', '+10 minutes')),

-- Tech & AI
('AI will make 90% of humans obsolete by 2035', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Elon Musk is the most important person alive', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Crypto is the future and fiat is dying', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Social media should be banned for under 18s', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Remote work kills innovation and productivity', 'Deep', 1, 10, datetime('now', '+10 minutes')),

-- Religion & Philosophy
('Religion is the opium of the masses and holds us back', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Atheism requires more faith than believing in God', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Nihilism is the only honest worldview', 'Deep', 1, 10, datetime('now', '+10 minutes')),
('Suffering is necessary for growth and meaning', 'Deep', 1, 10, datetime('now', '+10 minutes')),

-- Society & Culture
('Cancel culture is modern-day witch hunting', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('OnlyFans is empowering, not degrading', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Having kids in 2025 is selfish and irresponsible', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Psychedelics should be mandatory for all adults', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Monogamy is unnatural and outdated', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('Veganism is morally superior to eating meat', 'Spicy', 1, 10, datetime('now', '+10 minutes')),
('The patriarchy is a myth invented by feminists', 'Spicy', 1, 10, datetime('now', '+10 minutes')),

-- Fun/Light (Balance it out)
('Pineapple on pizza is actually elite', 'Fun', 1, 10, datetime('now', '+10 minutes')),
('Cats are objectively better than dogs', 'Fun', 1, 10, datetime('now', '+10 minutes')),
('Die Hard is NOT a Christmas movie', 'Fun', 1, 10, datetime('now', '+10 minutes')),
('Morning people are just masochists in denial', 'Fun', 1, 10, datetime('now', '+10 minutes'));