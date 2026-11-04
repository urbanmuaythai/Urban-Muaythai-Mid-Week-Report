// Builds index.html (the live midweek page) from one week's data file.
// Usage: node scripts/build-midweek.cjs data/2026-10-30-to-11-05.json
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const file = process.argv[2] ?? 'data/2026-10-30-to-11-05.json';
const d = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
// Keep the current page's look: reuse its style block
const css = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + n.toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 2});
const day = iso => /^\d{4}-\d\d-\d\d$/.test(iso) ? new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {weekday: 'short', day: 'numeric', month: 'short'}) : iso;
const longDay = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {day: 'numeric', month: 'long'});
const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
const first = name => name.split(' ')[0];

// Everything on the page must agree with the Daily Numbers grid.
const count = d.operatingCancellations.length;
const rolledList = d.outcomes.filter(o => o.status === 'Rolled Over');
const rolled = rolledList.length;
const stmList = d.outcomes.filter(o => o.status === 'Straight to Membership');
const stm = stmList.length;
const no = d.outcomes.filter(o => o.status === 'NO').length;
const eligible = rolled + no;
const pct = eligible ? Math.round(rolled / eligible * 100) : 0;
const intro = d.sales.filter(s => s.type !== 'Membership').length;
const total = d.sales.reduce((n, s) => n + (s.deposit ?? 0), 0);
const net = rolled + stm - count;
assert.equal(count, d.daily.cancellations);
assert.equal(d.daily.cancellations, d.daily.adultCancellations + d.daily.teensCancellations + d.daily.kidsCancellations);
assert(d.operatingCancellations.every(c => c.end >= d.period.start && c.end <= d.period.end && !/kickstarter|trial|short term/i.test(c.membership)));
assert.equal(rolled, d.daily.rollovers);
assert.equal(stm, d.daily.straightToMembership);
assert.equal(intro, d.daily.intro);
assert.equal(d.daily.intro, d.daily.phone + d.daily.walkIn + d.daily.referral + d.daily.other);
assert.equal(net, d.daily.net);
assert(d.outcomes.every(o => o.date >= d.period.start && o.date <= d.period.end));
assert(d.sales.every(s => s.sold >= d.period.start && s.sold <= d.period.end));

const table = (heads, rows) => `<div class="table"><table><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c?.html ?? esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`;
const section = (title, intro, content) => `<section class="pipeline"><h3>${esc(title)}</h3><p class="intro">${esc(intro)}</p>${content}</section>`;
const qa = (q, a, color = 'blue') => `<div class="qa-item"><div class="question">${esc(q)}</div><div class="answer ${color}">${esc(a)}</div></div>`;
const card = (label, value, sub, color = 'blue') => `<article class="card ${color}card"><div class="label">${esc(label)}</div><div class="value ${color}">${esc(value)}</div><div class="sub">${esc(sub)}</div></article>`;
const pill = status => ({html: `<span class="pill${status === 'Rolled Over' ? ' ready' : status === 'NO' ? ' no' : /overdue|today/i.test(status) ? ' warn' : ''}">${esc(status)}</span>`});
const netColor = net > 0 ? 'green' : net < 0 ? 'red' : 'gold';
const p = d.prior;
const cutoff = new Date(d.period.cutoff + 'T00:00:00').toLocaleDateString('en-AU', {weekday: 'long'});
const range = `${longDay(d.period.start)}–${longDay(d.period.end)}`;
const dueThisWeek = d.pipeline.filter(x => x.due <= d.period.cutoff).length;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Urban Muaythai — Midweek Numbers — ${esc(range)} 2026</title>
<style>${css}</style></head>
<body><main class="wrap">
<header class="header"><div class="logo">UM</div><div><h1>Midweek Numbers</h1><p>Urban Muaythai · Miami · Friday–Thursday reporting period</p></div></header>
<div class="period"><div><h2>${esc(day(d.period.start))} – ${esc(day(d.period.end))} 2026</h2><p>Week ${d.period.week} · ${esc(cutoff)} midweek check</p><span class="currentflag">Live · not yet final</span></div><div class="asof">Checked against live Daily Numbers + NMS<br>${esc(d.period.checked)}</div></div>

<section class="qa"><h3>The headline</h3><p>${esc(`Daily Numbers records ${rolled} rollovers and ${stm} straight-to-membership against ${count} autopay cancellations, for net movement of ${signed(net)}. Intro sales are ${intro}, with ${money(total)} recorded across ${d.sales.length} sale records. ${rolled} of ${eligible} rollover decisions so far rolled over (${pct}%). The week is still open: ${d.pipeline.length} decisions are outstanding.`)}</p></section>

<section class="qa"><h3>Weekly management answers</h3><p class="intro">The headline figures below reproduce the live Week ${d.daily.week} Daily Numbers grid. Kickstarter, trial, Short Term, casual, deposit and tour-product endings are excluded from cancellations.</p><div class="qa-list">
${qa('How many cancellations are recorded?', `${count} counted · matches Daily Numbers`, 'gold')}
${qa('How many rollovers and direct joins are recorded?', `${rolled} rollovers · ${stm} straight to membership`)}
${qa('Growth, loss or neutral?', `Net movement: ${signed(net)}`, netColor)}
${qa('Current rollover rate against the 80% target?', `${pct}% — ${rolled} of ${eligible} eligible outcomes`, pct >= d.rate.target ? 'green' : 'red')}
${qa('Which rollover decisions still need attention?', `${d.pipeline.length} open · ${dueThisWeek} due/overdue, ${d.pipeline.length - dueThisWeek} due Thursday`, 'gold')}
${qa('How many sales and deposits are recorded?', `${intro} intro · ${d.sales.length} sale records · ${money(total)} recorded`)}
</div></section>
<div class="cards">
${card('Daily Numbers cancellations', count, `${d.daily.adultCancellations} adults · ${d.daily.teensCancellations} teens · ${d.daily.kidsCancellations} kid${d.daily.kidsCancellations === 1 ? '' : 's'}`, 'red')}
${card('Rollovers recorded', rolled, rolledList.map(o => first(o.name)).join(' · '), 'green')}
${card('Straight to membership', stm, stmList.map(o => o.name).join(' · ') || 'None yet', 'green')}
${card('Net movement', signed(net), `${rolled} RO + ${stm} STM − ${count} cancels`, netColor)}
${card('Current rollover rate', pct + '%', `${rolled} of ${eligible} · target ${d.rate.target}%`, pct >= d.rate.target ? 'green' : 'red')}
${card('Intro sales', intro, `${d.daily.phone} phone · ${d.daily.walkIn} walk-in · ${d.daily.other} other`, 'gold')}
</div>

${section(`Cancellations — ${count} counted, matching Daily Numbers`, `Autopay memberships with an effective end date from ${day(d.period.start)} to ${day(d.period.end)}.`, table(['Member','Effective end','Membership','Reason'], d.operatingCancellations.map(c=>[c.name, day(c.end), c.membership, c.reason])))}

${section('Excluded endings — not counted as cancellations', 'These records fall inside the period but are not operating churn under the reporting rule.', table(['Member / record','Date','Membership','Why excluded'], d.excluded.map(c=>[c.name, day(c.end), c.membership, c.why])))}

${section(`Rollover outcomes — ${d.outcomes.length} resolved so far`, 'Outcome week follows the NMS Rolled Over Date. Rate = Rolled Over ÷ (Rolled Over + NO); direct joins sit outside the denominator.', table(['Member','Outcome','Date','From','Now on'], d.outcomes.map(o=>[o.name, pill(o.status), day(o.date), o.from, o.to])) + `<p class="sub">Current eligible rate: ${rolled} ÷ (${rolled} + ${no}) = ${pct}% against the ${d.rate.target}% target.</p>`)}

${section(`Rollover pipeline — ${d.pipeline.length} open decisions`, 'Blank or waiting NMS outcomes due inside this reporting week.', table(['Member','Due','State','Status / attendance','Next action'], d.pipeline.map(x=>[x.name, day(x.due), pill(x.state), `${x.status} · ${x.visits}`, x.action])))}

${section(`Sales and deposits — ${intro} intro sales, ${d.sales.length} records`, `Date Sold in NMS controls this table. Daily Numbers records ${intro} intros: ${d.daily.phone} phone, ${d.daily.walkIn} walk-in, ${d.daily.referral} referral and ${d.daily.other} other.`, table(['Member','Date sold','Type','Source','Deposit','Note'], d.sales.map(s=>[s.name, day(s.sold), s.type, s.source ?? 'Other / not recorded', s.deposit == null ? 'Blank' : money(s.deposit), s.note])) + `<p class="sub">Recorded deposit total: ${money(total)} (first payments only, not full contract value).</p>`)}

${section(`Previous week comparison — ${p.label}`, 'The previous week is closed; the current week remains live.', table(['Metric', `${range} · midweek`, p.label, 'Movement'], [
['Cancellations', `${count} (${d.daily.adultCancellations} adult · ${d.daily.teensCancellations} teen · ${d.daily.kidsCancellations} kid)`, `${p.cancellations} (${p.cancellationDetail})`, signed(count - p.cancellations) || 'No change'],
['Rollovers / STM', `${rolled} / ${stm}`, `${p.rollovers} / ${p.straightToMembership}`, `${signed(rolled - p.rollovers) || 'no change'} / ${signed(stm - p.straightToMembership) || 'no change'}`],
['Net movement', signed(net), signed(p.net), signed(net - p.net) || 'No change'],
['Intro sales', intro, p.intro, signed(intro - p.intro) || 'No change'],
['Current rollover rate', `${rolled}/${eligible} = ${pct}%`, `${p.rolled}/${p.eligible} = ${Math.round(p.rolled / p.eligible * 100)}%`, pct === Math.round(p.rolled / p.eligible * 100) ? 'No change' : `${signed(pct - Math.round(p.rolled / p.eligible * 100))} pts`],
]) + '<p><a href="reports/2026-10-23-to-29-final.html">23–29 October final</a> · <a href="reports/2026-10-23-to-29-midweek.html">23–29 October midweek</a> · <a href="reports/2026-10-16-to-22.html">16–22 October</a></p>')}

<section class="caution"><h3>Synced with NMS — week still open</h3><p>${esc(d.syncNote)}</p></section>
<footer class="footer">Urban Muaythai · Midweek Numbers · ${esc(range)} 2026 · checked ${esc(d.period.checked)}<br>
<a href="${esc(d.sources.daily)}">Daily Numbers grid</a> · <a href="${esc(d.sources.cancellations)}">Cancellation Raw Dump</a> · <a href="${esc(d.sources.nms)}">NMS reports</a> · <a href="${esc(file)}">Reviewed data snapshot</a>
</footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html: ${rolled} RO + ${stm} STM − ${count} cancels = ${signed(net)} · ${pct}% · ${intro} intro · ${money(total)}`);
