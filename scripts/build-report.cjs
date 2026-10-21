const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/2026-10-21.json'), 'utf8'));
const archive = fs.readFileSync(path.join(root, 'reports/2026-10-09-to-15.html'), 'utf8');
const css = archive.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + n.toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 2});
const count = d.operatingCancellations.length;
const total = d.sales.reduce((n, s) => n + (s.deposit ?? 0), 0);
const missing = d.sales.filter(s => s.deposit === null).length;
const net = d.daily.rollovers + d.daily.straightToMembership - count;
const active = d.pipeline.filter(p => ['Jimmy Wreghitt.', 'Lukas nazal.', 'Mackenzie Constantino'].includes(p.name));
assert.equal(count, 8);
assert.equal(new Set(d.operatingCancellations.map(c => c.name)).size, count);
assert(d.operatingCancellations.every(c => c.end >= d.period.start && c.end <= d.period.cutoff && !/kickstarter|trial/i.test(c.membership)));
assert.equal(total, 1000);
assert.equal(missing, 1);
assert.equal(d.sales.filter(s => s.type !== 'Membership').length, d.daily.intro);
assert.equal(d.outcomes.filter(o => o.status === 'Rolled Over').length, d.rate.rolled);
assert.equal(d.outcomes.filter(o => o.status === 'NO').length, d.rate.no);
assert.equal(net, -8);
const table = (heads, rows) => `<div class="table"><table><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`;
const section = (title, intro, content) => `<section class="pipeline"><h3>${esc(title)}</h3><p class="intro">${esc(intro)}</p>${content}</section>`;
const qa = (q, a, color='blue') => `<div class="qa-item"><div class="question">${esc(q)}</div><div class="answer ${color}">${esc(a)}</div></div>`;
const card = (label, value, sub, color='blue') => `<article class="card ${color}card"><div class="label">${esc(label)}</div><div class="value ${color}">${esc(value)}</div><div class="sub">${esc(sub)}</div></article>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Urban Muaythai — Midweek Numbers — 16–21 October 2026</title>
<style>${css}\n.pipeline h3{margin:0 0 7px;font-size:17px}.pipeline .intro{font-size:12px}a{color:var(--blue)}.reconcile{border-color:#7a4400;background:#1b1308}.sub,.intro,.label,th,.footer{color:#aaa}.footer a{display:inline-block;margin:4px 6px}.card .value{overflow-wrap:anywhere}</style></head>
<body><main class="wrap">
<header class="header"><div class="logo">UM</div><div><h1>Weekly Numbers — Midweek Update</h1><p>Urban Muaythai · Miami · Friday–Thursday reporting period</p></div></header>
<div class="period"><div><h2>Fri 16 Oct – Wed 21 Oct 2026</h2><p>Reporting week ends Thu 22 Oct · Thursday entries excluded</p><span class="currentflag">Week to date · Wednesday incomplete</span></div><div class="asof">Verified from live sheets<br>21 October 2026 · Brisbane</div></div>

<section class="qa"><h3>Midweek management answers</h3><p class="intro">The Daily Numbers grid and named records are shown separately where they disagree. Operating cancellations count recurring memberships ending in the selected period; Kickstarter and trial endings stay in rollover reporting.</p><div class="qa-list">
${qa('How many cancellations are recorded?', '8 operating · 6 in the grid', 'gold')}
${qa('How many rollovers and direct joins are confirmed?', '0 rollovers · 0 confirmed STM')}
${qa('Growth, loss or neutral?', 'Operating movement: −8 · grid: −6', 'red')}
${qa('Which rollover decisions need attention?', '3 unresolved · 2 overdue + 1 due today', 'gold')}
${qa('Rollover rate against the 80% target?', '0% — 0 of 1 eligible outcome', 'red')}
${qa('How many sales and deposits are recorded?', '5 intro · 6 sale records · $1,000*', 'gold')}
</div></section>
<div class="cards">
${card('Operating cancellations', count, '7 adults · 1 child', 'gold')}
${card('Rollovers', 0, 'No dated rollover outcome')}
${card('Confirmed direct joins', 0, '1 NMS sale needs verification')}
${card('Operating movement', '−8', '0 RO + 0 STM − 8 cancels', 'red')}
${card('Unresolved this week', active.length, 'Lukas · Mackenzie · Jimmy')}
${card('Intro sales', 5, '3 phone · 1 walk-in · 1 other', 'gold')}
</div>

${section('Cancellation reconciliation — 8 operating, 6 in the grid', 'The named Cancellation Raw Dump is the evidence for operating churn. Its recurring memberships ending 16–21 October total 8. The grid has 6 entries; the net difference of 2 remains to be reconciled by name.', table(['View','Cancellations','Movement calculation','Net'], [
['Daily Numbers grid','6 (5 adults, 1 child)','0 RO + 0 STM − 6','−6'],
['Named operating records','8 (7 adults, 1 child)','0 RO + 0 STM − 8','−8']
]) + '<p class="sub">These are calculated membership movements, not verified closing autopay roster totals. No new bad-debt exclusion is evidenced for this period. Mel’s nine exclusions applied to 9–15 October and are not subtracted again.</p>')}

${section('Eight operating cancellations — named evidence', 'Include recurring memberships with an effective end date from 16 through 21 October, including recurring Short Term Unlimited memberships. Exclude Kickstarter, trial and one-off product endings.', table(['Member','Effective end','Membership','Reason'], d.operatingCancellations.slice().sort((a,b)=>a.end.localeCompare(b.end)).map(c=>[c.name,c.end.slice(8)+' Oct',c.membership,c.reason])))}

${section('Intro endings and Thursday exclusions', 'These are visible for reconciliation and are excluded from the eight operating cancellations.', table(['Member / record','Date','Treatment'], [
...d.excludedIntroEndings.map(c=>[c.name,c.end.slice(8)+' Oct',c.membership+' — rollover/trial outcome, not operating churn']),
...d.futureCancellations.map(c=>[c.name,'22 Oct',c.membership+' — after the selected cutoff'])
]) + '<p class="sub">The grid already contains 3 cancellations on 22 October. All three are excluded from its week-to-date total. The named dump also contains Thursday Kickstarter endings; those do not enter operating churn. Expired class passes, deposits, casual sessions and part payments are excluded.</p>')}

${section('Rollover outcomes — 3 resolved, 1 eligible', 'Outcome week follows Rolled Over Date (NMS column P). Rate = Rolled Over ÷ (Rolled Over + NO); Straight to Membership, Not Rolled Over and Short Term are outside this denominator.', table(['Member','Outcome','Outcome date','Rate treatment'],d.outcomes.map(o=>[o.name,o.status,o.date,o.status==='NO'?'Included in eligible denominator':'Excluded from eligible denominator'])) + '<p class="sub">0 ÷ (0 + 1) = 0.0%, against the existing 80% target. This is one eligible resolved outcome so far, not a final weekly conversion rate. Jeffrey’s NMS outcome is dated 19 October while his cancellation record ends 22 October; use each date for its own metric.</p>')}

${section('Rollover pipeline — 3 unresolved decisions this week', 'Effective due date uses the revised extension date where one is recorded. Attendance below is the NMS weekly attendance total; it is not a current full-gym attendance report.', table(['Member','Effective due','Status / attendance','Next action'], [
['Lukas nazal.','20 Oct · overdue','Status blank · 11 visits (3 + 3 + 3 + 2)','Confirm decision and record status/date'],
['Mackenzie Constantino','20 Oct · overdue','Pending Waiver · 3 visits; membership shows Cancelled Member','Resolve waiver and confirm membership outcome'],
['Jimmy Wreghitt.','21 Oct · due today','Revised extension date · 10 visits (2 + 3 + 2 + 3)','Complete rollover decision']
]) + '<p class="sub">Later revised dates: Phoenix Muller — 2 Nov (Waiting); Pheline Rosin — 3 Nov (Extended); Dale Cleary — 5 Nov. They are outside this week’s due pipeline. Unresolved and extended members are not treated as failed rollovers.</p>')}

${section('Sales and deposits — 5 intro records, 1 membership record', 'Date Sold (NMS column S) controls this table. Daily Numbers also records 5 intros: 3 phone, 1 walk-in and 1 other. Deposits are recorded amounts, not full contract revenue or verified cash received.', table(['Member','Date sold','Record type','Deposit','Verification'],d.sales.map(s=>[s.name,s.sold,s.type,s.deposit===null?'Missing':money(s.deposit),s.name==='Alek Lacey'?'STM status; Cancelled Member; no outcome date':s.deposit===null?'Confirm and enter deposit':'Recorded'])) + '<p class="sub">* $1,000 is the sum of the five populated deposit cells across six sale records, including Alek’s $40 part payment. Kim Scharnitzky’s deposit is blank, not zero. Alek is not counted as a confirmed direct join: the master says Straight to Membership but also Cancelled Member, has no start/outcome date, and the raw dump shows only an expired part payment. Verify activation before counting the join.</p>')}

${section('Previous completed week — 9–15 October', 'Full-week context only; the current period is shorter and Wednesday is incomplete. No like-for-like growth claim is made.', table(['Metric','16–21 Oct · WTD','9–15 Oct · full week'],[
['Grid cancellations','6','14'],['Operating cancellations','8','5 (after the prior-week adjustments)'],['Rollovers / confirmed STM','0 / 0','5 / 3'],['Operating movement','−8','+3'],['Intro sales / NMS sale records','5 / 6','10 / 13'],['Recorded deposits','$1,000; 1 blank','$1,179'],['Rollover rate · current NMS snapshot','0/1 = 0.0%','5/12 = 41.7%']
]) + '<p class="sub">Prior-period rate restated from the current NMS snapshot: Caden is now NO dated 14 October, bringing that period to 5 rollovers and 7 NO outcomes. The archived 16 October report showed 5/11 = 45.5% before this status change. The previous operating cancellation count and bad-debt adjustments are retained from that archived reconciliation.</p><p><a href="reports/2026-10-09-to-15.html">View the preserved previous-week report</a></p>')}

<section class="caution reconcile"><div class="caution-head"><div><h3>Follow-up before the final weekly close</h3><p>Reconcile the 6 grid cancellations with the 8 named autopay endings; verify Alek’s membership activation; fill Kim’s deposit; close the 3 outstanding rollover decisions.</p></div></div><p class="caution-detail">Autopay member totals, full-gym attendance, equipment sales and counter fees have not been verified from these sources. Current figures remain provisional until Wednesday and Thursday are complete.</p></section>
<footer class="footer">Urban Muaythai · Midweek Numbers · 16–21 October 2026 · Sources read 21 October 2026<br>
<a href="${esc(d.sources.daily)}">Daily Numbers grid</a> · <a href="${esc(d.sources.cancellations)}">Cancellation Raw Dump</a> · <a href="${esc(d.sources.nms)}">NMS Kickstarter Master</a> · <a href="data/2026-10-21.json">Reviewed data snapshot</a>
</footer></main></body></html>\n`;
fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log(JSON.stringify({operatingCancellations:count,gridCancellations:d.daily.cancellations,net,depositTotal:total,missingDeposits:missing,saleRecords:d.sales.length,pipeline:active.length,htmlBytes:Buffer.byteLength(html)}));
