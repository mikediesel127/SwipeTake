export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (path === '/auth/login' && request.method === 'POST') {
            return login(request, env, corsHeaders);
        }

        if (path === '/auth/verify' && request.method === 'POST') {
            return verifySession(request, env, corsHeaders);
        }

        if (path === '/user/theme' && request.method === 'POST') {
            return updateTheme(request, env, corsHeaders);
        }

        if (path === '/debates/random' && request.method === 'GET') {
            return getRandomDebate(env, corsHeaders);
        }

        if (path === '/debates' && request.method === 'POST') {
            return createDebate(request, env, corsHeaders);
        }

        if (path === '/arguments' && request.method === 'POST') {
            return createArgument(request, env, corsHeaders);
        }

        if (path === '/leaderboard' && request.method === 'GET') {
            return getLeaderboard(env, corsHeaders);
        }

        if (path === '/stats' && request.method === 'GET') {
            return getStats(env, corsHeaders);
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};

async function login(request, env, corsHeaders) {
    const body = await request.json();
    const { username } = body;

    if (!username || username.length < 3) {
        return Response.json({ error: 'Username must be at least 3 characters' }, { status: 400, headers: corsHeaders });
    }

    let user = await env.DB.prepare(
        'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
        await env.DB.prepare(
            'INSERT INTO users (username, xp, level, wins, losses, streak, theme) VALUES (?, 0, 1, 0, 0, 0, ?)'
        ).bind(username, 'dark').run();

        user = await env.DB.prepare(
            'SELECT * FROM users WHERE username = ?'
        ).bind(username).first();
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
        'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, sessionToken, expiresAt).run();

    return Response.json({
        user: {
            id: user.id,
            username: user.username,
            xp: user.xp,
            level: user.level,
            wins: user.wins,
            losses: user.losses,
            streak: user.streak,
            theme: user.theme || 'dark'
        },
        session_token: sessionToken
    }, { headers: corsHeaders });
}

async function verifySession(request, env, corsHeaders) {
    const body = await request.json();
    const { session_token } = body;

    const session = await env.DB.prepare(
        'SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime("now")'
    ).bind(session_token).first();

    if (!session) {
        return Response.json({ error: 'Invalid session' }, { status: 401, headers: corsHeaders });
    }

    const user = await env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
    ).bind(session.user_id).first();

    return Response.json({
        user: {
            id: user.id,
            username: user.username,
            xp: user.xp,
            level: user.level,
            wins: user.wins,
            losses: user.losses,
            streak: user.streak,
            theme: user.theme || 'dark'
        }
    }, { headers: corsHeaders });
}

async function updateTheme(request, env, corsHeaders) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    const session = await env.DB.prepare(
        'SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime("now")'
    ).bind(sessionToken).first();

    if (!session) {
        return Response.json({ error: 'Invalid session' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { theme } = body;

    await env.DB.prepare(
        'UPDATE users SET theme = ? WHERE id = ?'
    ).bind(theme, session.user_id).run();

    return Response.json({ success: true }, { headers: corsHeaders });
}

async function getRandomDebate(env, corsHeaders) {
    const debates = await env.DB.prepare(
        'SELECT * FROM debates WHERE status = ? AND response_count < max_responses ORDER BY RANDOM() LIMIT 1'
    ).bind('active').all();

    if (debates.results.length === 0) {
        return Response.json({ error: 'No active battles' }, { status: 404, headers: corsHeaders });
    }

    return Response.json(debates.results[0], { headers: corsHeaders });
}

async function createDebate(request, env, corsHeaders) {
    const body = await request.json();
    const { prompt, vibe, max_responses, creator_id } = body;

    const endsAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await env.DB.prepare(
        'INSERT INTO debates (prompt, vibe, creator_id, max_responses, status, ends_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(prompt, vibe || 'Fun', creator_id, max_responses || 10, 'active', endsAt).run();

    return Response.json({ success: true }, { headers: corsHeaders });
}

async function createArgument(request, env, corsHeaders) {
    const body = await request.json();
    const { debate_id, user_id, username, side, text } = body;

    await env.DB.prepare(
        'INSERT INTO arguments (debate_id, user_id, username, side, text) VALUES (?, ?, ?, ?, ?)'
    ).bind(debate_id, user_id, username, side, text).run();

    await env.DB.prepare(
        'UPDATE debates SET response_count = response_count + 1 WHERE id = ?'
    ).bind(debate_id).run();

    return Response.json({ success: true }, { headers: corsHeaders });
}

async function getLeaderboard(env, corsHeaders) {
    const leaders = await env.DB.prepare(
        'SELECT username, xp, wins, losses, streak FROM users ORDER BY xp DESC LIMIT 10'
    ).all();

    return Response.json(leaders.results, { headers: corsHeaders });
}

async function getStats(env, corsHeaders) {
    const liveCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM debates WHERE status = ?'
    ).bind('active').first();

    return Response.json({
        live_battles: liveCount.count
    }, { headers: corsHeaders });
}