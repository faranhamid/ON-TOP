#!/usr/bin/env node

/* Simple smoke test that hits health and non-AI endpoints 100 times.
   Uses AI endpoints only if OPENAI_API_KEY_TEST is set, to avoid costs. */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = process.env.API_BASE || 'http://localhost:3002';
const ITERATIONS = Number(process.env.ITERATIONS || 100);

async function run() {
  let failures = [];

  // Health checks
  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const r = await fetch(`${API_BASE}/api/health`);
      if (!r.ok) throw new Error(`Status ${r.status}`);
      await r.json();
    } catch (e) {
      failures.push({ step: 'health', iteration: i, error: e.message });
    }
  }

  // Auth cycle (register unique email → login)
  for (let i = 0; i < ITERATIONS; i++) {
    const email = `test_${Date.now()}_${i}@example.com`;
    try {
      let r = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Abcd1234!', firstName: 'Test', lastName: 'User' })
      });
      if (r.status !== 201) throw new Error(`register status ${r.status}`);
      r = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Abcd1234!' })
      });
      if (!r.ok) throw new Error(`login status ${r.status}`);
      const { token } = await r.json();

      // Save a few tasks
      const tasks = [ { title: 'a' }, { title: 'b' } ];
      r = await fetch(`${API_BASE}/api/user/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tasks })
      });
      if (!r.ok) throw new Error(`tasks save ${r.status}`);

      // Fetch tasks
      r = await fetch(`${API_BASE}/api/user/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!r.ok) throw new Error(`tasks fetch ${r.status}`);
      await r.json();
    } catch (e) {
      failures.push({ step: 'auth_and_tasks', iteration: i, error: e.message });
    }
  }

  // Optional AI ping to ensure no crash when disabled
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(`${API_BASE}/api/emma-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello', conversationContext: {}, recentChat: [] })
      });
      if (!r.ok) throw new Error(`emma status ${r.status}`);
      await r.json();
    } catch (e) {
      // acceptable if AI not configured; record but not fail entire run
      failures.push({ step: 'emma', iteration: i, error: e.message });
    }
  }

  console.log(JSON.stringify({ iterations: ITERATIONS, failures }, null, 2));
  process.exit(failures.length ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });



