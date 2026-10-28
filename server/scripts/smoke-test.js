/**
 * End-to-end API smoke test (Node 18+). Run the server first, then: npm run smoke
 * It creates two throw-away users (smoke_*@example.com) and checks registration,
 * login, auth protection, task + note CRUD, user isolation and dashboard stats.
 * Delete the leftover users/records afterwards in MongoDB Compass if you like.
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let pass = 0;
let fail = 0;

const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${extra}`}`);
};

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

(async () => {
  const stamp = Date.now();
  const a = { name: 'Smoke A', email: `smoke_a_${stamp}@example.com`, password: 'secret123' };
  const b = { name: 'Smoke B', email: `smoke_b_${stamp}@example.com`, password: 'secret123' };

  let r = await call('GET', '/health');
  check('health: API up and database connected', r.status === 200 && r.data?.database === 'connected', JSON.stringify(r.data));

  // --- Registration & login
  r = await call('POST', '/auth/register', { ...a, confirmPassword: 'different' });
  check('register: mismatched passwords -> 400', r.status === 400);
  r = await call('POST', '/auth/register', { ...a, email: 'not-an-email', confirmPassword: a.password });
  check('register: invalid email -> 400', r.status === 400);
  r = await call('POST', '/auth/register', { ...a, confirmPassword: a.password });
  check('register: valid user -> 201 with token', r.status === 201 && !!r.data?.data?.token);
  check('register: response has no password/hash', !JSON.stringify(r.data).includes('password'));
  r = await call('POST', '/auth/register', { ...a, confirmPassword: a.password });
  check('register: duplicate email -> 409', r.status === 409);
  r = await call('POST', '/auth/login', { email: a.email, password: 'wrong-password' });
  check('login: wrong password -> 401', r.status === 401);
  r = await call('POST', '/auth/login', { email: { $gt: '' }, password: { $gt: '' } });
  check('login: NoSQL-injection object -> 400', r.status === 400);
  r = await call('POST', '/auth/login', { email: a.email, password: a.password });
  check('login: correct credentials -> 200 with token', r.status === 200 && !!r.data?.data?.token);
  const tokenA = r.data?.data?.token;

  r = await call('GET', '/auth/me');
  check('me: no token -> 401', r.status === 401);
  r = await call('GET', '/auth/me', null, 'garbage.token.value');
  check('me: invalid token -> 401', r.status === 401);
  r = await call('GET', '/auth/me', null, tokenA);
  check('me: valid token -> 200 and correct email', r.status === 200 && r.data?.data?.user?.email === a.email);
  r = await call('GET', '/tasks');
  check('tasks: no token -> 401', r.status === 401);

  // --- Tasks CRUD (user A)
  r = await call('POST', '/tasks', { description: 'no title' }, tokenA);
  check('tasks: create without title -> 400', r.status === 400);
  r = await call('POST', '/tasks', { title: 'Math assignment', subject: 'Math', priority: 'high', dueDate: new Date(Date.now() + 2 * 86400000).toISOString() }, tokenA);
  check('tasks: create -> 201', r.status === 201 && r.data?.data?.task?.title === 'Math assignment');
  const taskId = r.data?.data?.task?._id;
  await call('POST', '/tasks', { title: 'Late essay', priority: 'low', dueDate: new Date(Date.now() - 2 * 86400000).toISOString() }, tokenA);
  r = await call('GET', '/tasks', null, tokenA);
  check('tasks: list returns A\'s 2 tasks', r.status === 200 && r.data?.data?.count === 2);
  r = await call('GET', '/tasks?search=math&priority=high', null, tokenA);
  check('tasks: search + priority filter', r.data?.data?.count === 1);
  r = await call('GET', `/tasks/${taskId}`, null, tokenA);
  check('tasks: get one -> 200', r.status === 200);
  r = await call('GET', '/tasks/not-an-id', null, tokenA);
  check('tasks: malformed id -> 400', r.status === 400);
  r = await call('PUT', `/tasks/${taskId}`, { title: 'Math assignment (edited)' }, tokenA);
  check('tasks: update -> 200', r.status === 200 && r.data?.data?.task?.title.includes('edited'));
  r = await call('PATCH', `/tasks/${taskId}/status`, { status: 'completed' }, tokenA);
  check('tasks: PATCH status -> completed', r.status === 200 && r.data?.data?.task?.status === 'completed');
  r = await call('PATCH', `/tasks/${taskId}/status`, { status: 'bogus' }, tokenA);
  check('tasks: PATCH invalid status -> 400', r.status === 400);
  r = await call('GET', '/dashboard/stats', null, tokenA);
  const s = r.data?.data?.stats;
  check('dashboard: stats match real data (2 total, 1 done, 1 pending, 1 overdue)',
    s && s.total === 2 && s.completed === 1 && s.pending === 1 && s.overdue === 1, JSON.stringify(s));

  // --- Notes CRUD (user A)
  r = await call('POST', '/notes', { title: 'Only a title' }, tokenA);
  check('notes: create without content -> 400', r.status === 400);
  r = await call('POST', '/notes', { title: 'Lecture 1', content: 'Pointers and memory', subject: 'C' }, tokenA);
  check('notes: create -> 201', r.status === 201);
  const noteId = r.data?.data?.note?._id;
  r = await call('PUT', `/notes/${noteId}`, { content: 'Pointers, memory and arrays' }, tokenA);
  check('notes: update -> 200', r.status === 200 && r.data?.data?.note?.content.includes('arrays'));
  r = await call('GET', '/notes?search=arrays', null, tokenA);
  check('notes: search finds the note', r.data?.data?.count === 1);

  // --- Isolation (user B must not see or touch A's records)
  r = await call('POST', '/auth/register', { ...b, confirmPassword: b.password });
  const tokenB = r.data?.data?.token;
  check('isolation: user B registered', r.status === 201 && !!tokenB);
  r = await call('GET', '/tasks', null, tokenB);
  check('isolation: B sees 0 tasks', r.data?.data?.count === 0);
  r = await call('GET', '/notes', null, tokenB);
  check('isolation: B sees 0 notes', r.data?.data?.count === 0);
  r = await call('GET', `/tasks/${taskId}`, null, tokenB);
  check('isolation: B cannot read A\'s task (404)', r.status === 404);
  r = await call('PUT', `/tasks/${taskId}`, { title: 'hacked' }, tokenB);
  check('isolation: B cannot edit A\'s task (404)', r.status === 404);
  r = await call('DELETE', `/tasks/${taskId}`, null, tokenB);
  check('isolation: B cannot delete A\'s task (404)', r.status === 404);
  r = await call('DELETE', `/notes/${noteId}`, null, tokenB);
  check('isolation: B cannot delete A\'s note (404)', r.status === 404);
  r = await call('GET', '/dashboard/stats', null, tokenB);
  check('isolation: B dashboard shows zeros', r.data?.data?.stats?.total === 0);

  // --- Delete (user A)
  r = await call('DELETE', `/tasks/${taskId}`, null, tokenA);
  check('tasks: delete -> 200', r.status === 200);
  r = await call('GET', `/tasks/${taskId}`, null, tokenA);
  check('tasks: deleted task is gone (404)', r.status === 404);
  r = await call('DELETE', `/notes/${noteId}`, null, tokenA);
  check('notes: delete -> 200', r.status === 200);

  console.log(`\n${pass} passed, ${fail} failed`);
  console.log('Persistence check (Workflow 8) is manual: restart the server, log in, confirm data remains.');
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('Could not run smoke test. Is the server running at', BASE, '?\n', e.message);
  process.exit(1);
});
