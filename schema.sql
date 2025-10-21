-- SwipeTake Database Schema for Cloudflare D1

CREATE TABLE IF NOT EXISTS debates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    vibe TEXT DEFAULT 'Fun',
    response_count INTEGER DEFAULT 0,
    max_responses INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS arguments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debate_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    side TEXT NOT NULL,
    text TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed some debates
INSERT INTO debates (prompt, vibe, max_responses) VALUES
('Pineapple on pizza is a crime', 'Fun', 10),
('Remote work kills creativity', 'Deep', 10),
('AI will replace teachers', 'Deep', 10),
('Cats are better than dogs', 'Fun', 10),
('Social media is ruining us', 'Deep', 10);