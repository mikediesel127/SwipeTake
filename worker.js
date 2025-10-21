export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
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

        if (path === '/arguments/pending' && request.method === 'GET') {
            return getPendingArguments(env, corsHeaders);
        }

        if (path === '/votes' && request.method === 'POST') {
            return createVote(request, env, corsHeaders);
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};

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