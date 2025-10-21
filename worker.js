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

        // Auth routes
        if (path === '/auth/login' && request.method === 'POST') {
            return login(request, env, corsHeaders);
        }

        if (path === '/auth/verify' && request.method === 'POST') {
            return verifySession(request, env, corsHeaders);
        }

        // Debate routes
        if (path === '/debates/random' && request.method === 'GET') {
            return getRandomDebate(env, corsHeaders);
        }

        if (path === '/debates' && request.method === 'POST') {
            return createDebate(request, env, corsHeaders);
        }

        if (path === '/arguments' && request.method === 'POST') {
            return createArgument(request, env, corsHeaders);
        }

        if (path === '/arguments/pending' && request.method === 'GET') {
            return getPendingArguments(env, corsHeaders);
        }

        if (path === '/votes' && request.method === 'POST') {
            return createVote(request, env, corsHeaders);
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

    // Check if user exists
    let user = await env.DB.prepare(
        'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    // Create user if doesn't exist
    if (!user) {
        await env.DB.prepare(
            'INSERT INTO users (username, xp, level) VALUES (?, 0, 1)'
        ).bind(username).run();

        user = await env.DB.prepare(
            'SELECT * FROM users WHERE username = ?'
        ).bind(username).first();
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await env.DB.prepare(
        'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, sessionToken, expiresAt).run();

    return Response.json({
        user: {
            id: user.id,
            username: user.username,
            xp: user.xp,
            level: user.level
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
            level: user.level
        }
    }, { headers: corsHeaders });
}

async function getRandomDebate(env, corsHeaders) {
    const debates = await env.DB.prepare(
        'SELECT * FROM debates WHERE response_count < max_responses ORDER BY RANDOM() LIMIT 1'
    ).all();

    if (debates.results.length === 0) {
        return Response.json({ error: 'No debates available' }, { status: 404, headers: corsHeaders });
    }

    return Response.json(debates.results[0], { headers: corsHeaders });
}

async function createDebate(request, env, corsHeaders) {
    const body = await request.json();
    const { prompt, vibe, max_responses, user_id } = body;

    await env.DB.prepare(
        'INSERT INTO debates (prompt, vibe, max_responses) VALUES (?, ?, ?)'
    ).bind(prompt, vibe || 'Fun', max_responses || 10).run();

    return Response.json({ success: true }, { headers: corsHeaders });
}

async function createArgument(request, env, corsHeaders) {
    const body = await request.json();
    const { debate_id, user_id, side, text } = body;

    await env.DB.prepare(
        'INSERT INTO arguments (debate_id, user_id, side, text) VALUES (?, ?, ?, ?)'
    ).bind(debate_id, user_id, side, text).run();

    await env.DB.prepare(
        'UPDATE debates SET response_count = response_count + 1 WHERE id = ?'
    ).bind(debate_id).run();

    return Response.json({ success: true }, { headers: corsHeaders });
}

async function getPendingArguments(env, corsHeaders) {
    const args = await env.DB.prepare(
        'SELECT * FROM arguments WHERE votes < 5 ORDER BY RANDOM() LIMIT 10'
    ).all();

    return Response.json(args.results, { headers: corsHeaders });
}

async function createVote(request, env, corsHeaders) {
    const body = await request.json();
    const { argument_id, user_id } = body;

    await env.DB.prepare(
        'UPDATE arguments SET votes = votes + 1 WHERE id = ?'
    ).bind(argument_id).run();

    return Response.json({ success: true }, { headers: corsHeaders });
}