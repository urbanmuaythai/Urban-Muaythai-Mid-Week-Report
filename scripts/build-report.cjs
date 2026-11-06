const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/2026-10-30-to-11-05.json'), 'utf8'));
const archive = fs.readFileSync(path.join(root, 'reports/2026-10-09-to-15.html'), 'utf8');
const css = archive.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + n.toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 2});
const day = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {weekday: 'short', day: 'numeric', month: 'short'});

// Everything on the page must agree with the Daily Numbers grid.
const count = d.operatingCancellations.length;
const total = d.sales.reduce((n, s) => n + (s.deposit ?? 0), 0);
const intro = d.sales.filter(s => s.type !== 'Membership').length;
const rolled = d.outcomes.filter(o => o.status === 'Rolled Over').length;
const stm = d.outcomes.filter(o => o.status === 'Straight to Membership').length;
const no = d.outcomes.filter(o => o.status === 'NO').length;
const net = rolled + stm - count;
assert.equal(count, d.daily.cancellations);
assert.equal(d.daily.cancellations, d.daily.adultCancellations + d.daily.teensCancellations + d.daily.kidsCancellations);
assert(d.operatingCancellations.every(c => c.end >= d.period.start && c.end <= d.period.cutoff && !/kickstarter|trial|short term/i.test(c.membership)));
assert.equal(intro, d.daily.intro);
assert.equal(d.daily.intro, d.daily.phone + d.daily.walkIn + d.daily.referral + d.daily.other);
assert.equal(rolled, d.daily.rollovers);
assert.equal(stm, d.daily.straightToMembership);
assert.equal(rolled, d.rate.rolled);
assert.equal(no, d.rate.no);
assert.equal(net, d.daily.net);
assert.equal(total, 1528);

const table = (heads, rows) => `<div class="table"><table><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`;
const section = (title, intro, content) => `<section class="pipeline"><h3>${esc(title)}</h3><p class="intro">${esc(intro)}</p>${content}</section>`;
const qa = (q, a, color='blue') => `<div class="qa-item"><div class="question">${esc(q)}</div><div class="answer ${color}">${esc(a)}</div></div>`;
const card = (label, value, sub, color='blue') => `<article class="card ${color}card"><div class="label">${esc(label)}</div><div class="value ${color}">${esc(value)}</div><div class="sub">${esc(sub)}</div></article>`;
const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
const p = d.prior;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Urban Muaythai — Weekly Numbers (Final) — 30 October – 5 November 2026</title>
<style>${css}\n.pipeline h3{margin:0 0 7px;font-size:17px}.pipeline .intro{font-size:12px}a{color:var(--blue)}.reconcile{border-color:#7a4400;background:#1b1308}.sub,.intro,.label,th,.footer{color:#aaa}.footer a{display:inline-block;margin:4px 6px}.card .value{overflow-wrap:anywhere}.table+.table{margin-top:12px}</style></head>
<body><main class="wrap">
<header class="header"><div class="logo">UM</div><div><h1>Weekly Numbers — Final</h1><p>Urban Muaythai · Miami · Friday–Thursday reporting period</p></div></header>
<div class="period"><div><h2>Fri 30 Oct – Thu 5 Nov 2026</h2><p>Week 27 · closed Thursday 5 November</p><span class="currentflag">Final · week closed</span></div><div class="asof">Synced with Daily Numbers<br>Fri 6 November 2026 · Brisbane</div></div>

<section class="qa"><h3>The headline</h3><p>A growth week. ${rolled} rollovers and ${stm} straight-to-membership against ${count} autopay cancellations, so net movement is ${signed(net)}. Autopay went from 312 to 314, because Sean Forster also moved from Short Term onto Fun &amp; Fitness. Rollover rate ${d.rate.percent}%: ${rolled} of ${d.rate.eligible}.</p></section>

<section class="qa"><h3>Weekly management answers</h3><p class="intro">Every figure below matches the Daily Numbers grid for Week 27 after Friday's Full Sync, except cancellations: the grid shows 6 because it counts Amelie Watts's downgrade. Cancellations count autopay memberships only — Kickstarter, trial and Short Term endings, casuals and deposits are excluded.</p><div class="qa-list">
${qa('How many cancellations are recorded?', `${count} counted · excludes Amelie Watts's downgrade`, 'gold')}
${qa('How many rollovers and direct joins are confirmed?', `${rolled} rollovers · ${stm} straight to membership`)}
${qa('Growth, loss or neutral?', `Net movement: ${signed(net)}`, net >= 0 ? 'green' : 'red')}
${qa('Rollover rate against the 80% target?', `${d.rate.percent}% — ${rolled} of ${d.rate.eligible} eligible outcomes`, 'green')}
${qa('Which rollover decisions need attention?', `${d.pipeline.length} overdue decisions`, 'gold')}
${qa('How many sales and deposits are recorded?', `${intro} intro · ${d.sales.length} sale records · ${money(total)}`)}
</div></section>
<div class="cards">
${card('Daily Numbers cancellations', count, `${d.daily.adultCancellations} adults · ${d.daily.teensCancellations} teens · ${d.daily.kidsCancellations} kids`, 'gold')}
${card('Rollovers', rolled, 'Sebastian · Val · Jimmy · Liam (KS) · Harrison (trial)', 'green')}
${card('Straight to membership', stm, 'Kai Lacey (returning ex-member)', 'green')}
${card('Net movement', signed(net), `${rolled} RO + ${stm} STM − ${count} cancels`, net >= 0 ? 'green' : 'red')}
${card('Rollover rate', d.rate.percent + '%', `${rolled} of ${d.rate.eligible} · target ${d.rate.target}%`, 'green')}
${card('Intro sales', intro, `${d.daily.phone} phone · ${d.daily.walkIn} walk-in · ${d.daily.other} source not recorded`, 'gold')}
</div>

${section(`Cancellations — ${count} counted`, 'Autopay memberships with an effective end date from Fri 30 October to Thu 5 November.', table(['Member','Effective end','Membership','Reason'], d.operatingCancellations.map(c=>[c.name, day(c.end), c.membership, c.reason])))}

${section('Excluded endings — not counted as cancellations', 'These end inside the week but are rollover outcomes or one-off products, not operating churn.', table(['Member / record','Date','Membership','Why excluded'], d.excluded.map(c=>[c.name, /^\d{4}-/.test(c.end) ? day(c.end) : c.end, c.membership, c.why])))}

${section(`Rollover outcomes — ${d.outcomes.length} resolved`, 'Outcome week follows Rolled Over Date (NMS column P). Rate = Rolled Over ÷ (Rolled Over + NO); Straight to Membership, Not Rolled Over and Short Term sit outside the denominator.', table(['Member','Outcome','Date','From','Now on'], d.outcomes.map(o=>[o.name, o.status, day(o.date), o.type, o.to])) + `<p class="sub">${rolled} ÷ (${rolled} + ${no}) = ${d.rate.percent}% against the 80% target. Remy Martinot is Not Rolled Over, dated Fri 6 Nov, so she sits in next week.</p>`)}

${section(`Rollover pipeline — ${d.pipeline.length} overdue decisions`, 'Decisions due this week (or overdue) with no roll-over status in the NMS Master yet.', table(['Member','Due','State','Status / attendance','Next action'], d.pipeline.map(x=>[x.name, day(x.due), x.state, `${x.status} · ${x.visits}`, x.action])) + '<p class="sub">Remy Martinot has been resolved since midweek and is no longer open.</p>')}

${section(`Sales and deposits — ${intro} intro sales, ${d.sales.length} records`, 'Date Sold (NMS column S) controls this table. Daily Numbers records the same 8 intros: 4 phone, 2 walk-in and 2 with no source recorded (chaz richmond, Bailey Spencer). Deposits are recorded amounts, not full contract value.', table(['Member','Date sold','Type','Source','Deposit','Note'], d.sales.map(s=>[s.name, day(s.sold), s.type, s.source, money(s.deposit), s.note])) + `<p class="sub">Total recorded sales ${money(total)} including Kai’s $65 first weekly payment and Adrian’s $65 first payment. First payments only, not full contract value.</p>`)}

${section(`Look-ahead — ${d.lookAhead.period}`, 'Next Friday–Thursday week, shown for planning only.', table(['Member','Due','Note'], d.lookAhead.rolloversDue.map(x=>[x.name, x.due, x.note])) + table(['Autopay ending','Ends','Membership','Reason'], [...d.lookAhead.cancellations.map(c=>[c.name, c.end, c.membership, c.reason]), ...d.lookAhead.excludedCancellations.map(c=>[c.name + ' (not counted)', c.end, c.membership, c.reason])]) + `<p class="sub">${d.lookAhead.cancellations.length} autopay endings already booked for next week (all adults). Rebecca Gasparote-Cardiga (teen) follows on Fri 13 Nov.</p>`)}

${section('Previous week — Fri 23 – Thu 29 October (final)', p.note, table(['Metric','30 Oct–5 Nov · final','23–29 Oct · final'],[
['Cancellations (Daily Numbers)', `${count} (${d.daily.adultCancellations} adults)`, `${p.gridCancellations} (${p.adultCancellations} adults · ${p.teensCancellations} teen · ${p.kidsCancellations} kids)`],
['Rollovers / STM', `${rolled} / ${stm}`, `${p.rollovers} / ${p.straightToMembership}`],
['Net movement', signed(net), signed(p.net)],
['Intro sales', String(intro), String(p.intro)],
['Rollover rate', `${rolled}/${d.rate.eligible} = ${d.rate.percent}%`, p.rate]
]) + '<p><a href="reports/2026-10-30-to-11-05-midweek.html">30 Oct–5 Nov midweek page</a> · <a href="reports/2026-10-23-to-29-final.html">23–29 October</a> · <a href="reports/2026-10-16-to-22.html">16–22 October</a> · <a href="reports/2026-10-09-to-15.html">9–15 October</a></p>')}

<section class="caution reconcile"><div class="caution-head"><div><h3>Still open after the close</h3><p>Roll-over decisions for Phoenix Muller, Jed Meadowcroft and Jonathan Lindal; Kickstarter set-up for Elias Batista once his form is signed; intro source for chaz richmond and Bailey Spencer.</p></div></div><p class="caution-detail">All Thursday 5 November activity is included (O’Shay Bayne, James Belding, Liam Tidey, Harrison Wortley, Dale Cleary, Adrian Malai). Autopay roster totals, attendance, equipment sales and counter fees are not part of this page.</p></section>
<footer class="footer">Urban Muaythai · Weekly Numbers · 30 October – 5 November 2026 · Final · synced with Daily Numbers 6 November 2026<br>
<a href="${esc(d.sources.daily)}">Daily Numbers grid</a> · <a href="${esc(d.sources.cancellations)}">Cancellation Raw Dump</a> · <a href="${esc(d.sources.nms)}">NMS Kickstarter Master</a> · <a href="data/2026-10-30-to-11-05.json">Reviewed data snapshot</a>
</footer></main></body></html>\n`;
fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log(JSON.stringify({cancellations: count, rollovers: rolled, stm, net, intro, deposits: total, pipeline: d.pipeline.length, htmlBytes: Buffer.byteLength(html)}));
