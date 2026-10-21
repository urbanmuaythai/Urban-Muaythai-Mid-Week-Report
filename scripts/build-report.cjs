const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/2026-10-16-to-22.json'), 'utf8'));
const archive = fs.readFileSync(path.join(root, 'reports/2026-10-09-to-15.html'), 'utf8');
const css = archive.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + n.toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 2});
const count = d.operatingCancellations.length;
const total = d.sales.reduce((n, s) => n + (s.deposit ?? 0), 0);
const missing = d.sales.filter(s => s.deposit === null).length;
const net = d.daily.rollovers + d.daily.straightToMembership - count;
const active = d.pipeline.filter(p => ['Jimmy Wreghitt.', 'Lukas nazal.', 'Mackenzie Constantino'].includes(p.name));
assert.equal(count, 9);
assert.equal(new Set(d.operatingCancellations.map(c => c.name)).size, count);
assert(d.operatingCancellations.every(c => c.end >= d.period.start && c.end <= d.period.cutoff && !/kickstarter|trial|short term/i.test(c.membership)));
assert.equal(total, 1000);
assert.equal(missing, 1);
assert.equal(d.sales.filter(s => s.type !== 'Membership').length, d.daily.intro);
assert.equal(d.outcomes.filter(o => o.status === 'Rolled Over').length, d.rate.rolled);
assert.equal(d.outcomes.filter(o => o.status === 'NO').length, d.rate.no);
assert.equal(net, -9);
assert.equal(count, d.daily.cancellations);
assert.equal(d.daily.cancellations, d.daily.adultCancellations + d.daily.teensCancellations + d.daily.kidsCancellations);
assert.equal(d.daily.cancellations, 9);
const table = (heads, rows) => `<div class="table"><table><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`;
const section = (title, intro, content) => `<section class="pipeline"><h3>${esc(title)}</h3><p class="intro">${esc(intro)}</p>${content}</section>`;
const qa = (q, a, color='blue') => `<div class="qa-item"><div class="question">${esc(q)}</div><div class="answer ${color}">${esc(a)}</div></div>`;
const card = (label, value, sub, color='blue') => `<article class="card ${color}card"><div class="label">${esc(label)}</div><div class="value ${color}">${esc(value)}</div><div class="sub">${esc(sub)}</div></article>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Urban Muaythai — Weekly Numbers — 16–22 October 2026</title>
<style>${css}\n.pipeline h3{margin:0 0 7px;font-size:17px}.pipeline .intro{font-size:12px}a{color:var(--blue)}.reconcile{border-color:#7a4400;background:#1b1308}.sub,.intro,.label,th,.footer{color:#aaa}.footer a{display:inline-block;margin:4px 6px}.card .value{overflow-wrap:anywhere}</style></head>
<body><main class="wrap">
<header class="header"><div class="logo">UM</div><div><h1>Weekly Numbers — Full Reporting Week</h1><p>Urban Muaythai · Miami · Friday–Thursday reporting period</p></div></header>
<div class="period"><div><h2>Fri 16 Oct – Thu 22 Oct 2026</h2><p>Full-week entries, including Thursday 22 October</p><span class="currentflag">Provisional · week not yet closed</span></div><div class="asof">Verified from live sheets<br>21 October 2026 · Brisbane</div></div>

<section class="qa"><h3>Weekly management answers</h3><p class="intro">Full-week figures use all entries dated 16–22 October, including future-dated Thursday records. Cancellations exclude Short Term memberships, Kickstarter and trial endings. The nine counted named records match the Daily Numbers total.</p><div class="qa-list">
${qa('How many cancellations are recorded?', '9 counted · matches Daily Numbers', 'gold')}
${qa('How many rollovers and direct joins are confirmed?', '0 rollovers · 0 confirmed STM')}
${qa('Growth, loss or neutral?', 'Net movement: −9', 'red')}
${qa('Which rollover decisions need attention?', '3 unresolved · 2 overdue + 1 due today', 'gold')}
${qa('Rollover rate against the 80% target?', '0% — 0 of 1 eligible outcome', 'red')}
${qa('How many sales and deposits are recorded?', '5 intro · 6 sale records · $1,000*', 'gold')}
</div></section>
<div class="cards">
${card('Daily Numbers cancellations', d.daily.cancellations, '6 adults · 1 teen · 2 kids', 'gold')}
${card('Rollovers', 0, 'No dated rollover outcome')}
${card('Confirmed direct joins', 0, '1 NMS sale needs verification')}
${card('Grid movement', '−9', '0 RO + 0 STM − 9 cancels', 'red')}
${card('Unresolved this week', active.length, 'Lukas · Mackenzie · Jimmy')}
${card('Intro sales', 5, '3 phone · 1 walk-in · 1 other', 'gold')}
</div>

${section('Cancellation reconciliation — 9 counted, matching Daily Numbers', 'Daily Numbers records 9 cancellations for 16–22 October: 6 through Wednesday plus 3 on Thursday. The named dump contains 11 recurring membership endings before applying the Short Term exclusion. Excluding Angus Nowlan and Julia Cielecka brings the counted total to 9.', table(['View','Cancellations','Movement calculation','Net'], [
['Daily Numbers grid','9 (6 adults, 1 teen, 2 kids)','0 RO + 0 STM − 9','−9'],
['Named records after exclusions','9 (6 adults, 1 teen, 2 kids)','0 RO + 0 STM − 9','−9']
]) + '<p class="sub">These are calculated membership movements, not verified closing autopay roster totals. No new bad-debt exclusion is evidenced for this period. Mel’s nine exclusions applied to 9–15 October and are not subtracted again.</p>')}

${section('Nine counted cancellations — named evidence', 'Count memberships with an effective end date from 16 through 22 October after excluding Short Term, Kickstarter, trial and one-off product endings. Thursday entries are included, even though the report was read on Wednesday.', table(['Member','Effective end','Membership','Reason'], d.operatingCancellations.slice().sort((a,b)=>a.end.localeCompare(b.end)).map(c=>[c.name,c.end.slice(8)+' Oct',c.membership,c.reason])))}

${section('Short Term and intro endings — excluded from cancellations', 'These records are excluded from the nine counted cancellations. The full week includes both Wednesday and Thursday records.', table(['Member / record','Date','Treatment'], [
...d.excludedShortTermCancellations.map(c=>[c.name,c.end.slice(8)+' Oct',c.membership+' — excluded under the Short Term rule']),
...d.excludedIntroEndings.map(c=>[c.name,c.end.slice(8)+' Oct',c.membership+' — rollover/trial outcome, not operating churn'])
]) + '<p class="sub">Thursday’s 3 grid cancellations are included in the headline total of 9. Dean Guest, Cleo Parker and Jess Climan are included in the nine counted named records. Short Term memberships, Kickstarter/trial endings, expired class passes, deposits, casual sessions and part payments are excluded from cancellations.</p>')}

${section('Rollover outcomes — 3 resolved, 1 eligible', 'Outcome week follows Rolled Over Date (NMS column P). Rate = Rolled Over ÷ (Rolled Over + NO); Straight to Membership, Not Rolled Over and Short Term are outside this denominator.', table(['Member','Outcome','Outcome date','Rate treatment'],d.outcomes.map(o=>[o.name,o.status,o.date,o.status==='NO'?'Included in eligible denominator':'Excluded from eligible denominator'])) + '<p class="sub">0 ÷ (0 + 1) = 0.0%, against the existing 80% target. This is one eligible resolved outcome so far, not a final weekly conversion rate. Jeffrey’s NMS outcome is dated 19 October while his cancellation record ends 22 October; use each date for its own metric.</p>')}

${section('Rollover pipeline — 3 unresolved decisions this week', 'Effective due date uses the revised extension date where one is recorded. Attendance below is the NMS weekly attendance total; it is not a current full-gym attendance report.', table(['Member','Effective due','Status / attendance','Next action'], [
['Lukas nazal.','20 Oct · overdue','Status blank · 11 visits (3 + 3 + 3 + 2)','Confirm decision and record status/date'],
['Mackenzie Constantino','20 Oct · overdue','Pending Waiver · 3 visits; membership shows Cancelled Member','Resolve waiver and confirm membership outcome'],
['Jimmy Wreghitt.','21 Oct · due today','Revised extension date · 10 visits (2 + 3 + 2 + 3)','Complete rollover decision']
]) + '<p class="sub">Later revised dates: Phoenix Muller — 2 Nov (Waiting); Pheline Rosin — 3 Nov (Extended); Dale Cleary — 5 Nov. They are outside this week’s due pipeline. Unresolved and extended members are not treated as failed rollovers.</p>')}

${section('Sales and deposits — 5 intro records, 1 membership record', 'Date Sold (NMS column S) controls this table. Daily Numbers also records 5 intros: 3 phone, 1 walk-in and 1 other. Deposits are recorded amounts, not full contract revenue or verified cash received.', table(['Member','Date sold','Record type','Deposit','Verification'],d.sales.map(s=>[s.name,s.sold,s.type,s.deposit===null?'Missing':money(s.deposit),s.name==='Alek Lacey'?'STM status; Cancelled Member; no outcome date':s.deposit===null?'Confirm and enter deposit':'Recorded'])) + '<p class="sub">* $1,000 is the sum of the five populated deposit cells across six sale records, including Alek’s $40 part payment. Kim Scharnitzky’s deposit is blank, not zero. Alek is not counted as a confirmed direct join: the master says Straight to Membership but also Cancelled Member, has no start/outcome date, and the raw dump shows only an expired part payment. Verify activation before counting the join.</p>')}

${section('Previous completed week — 9–15 October', 'Both columns cover Friday–Thursday weeks. Current-week figures include Thursday entries already recorded but remain provisional as of Wednesday 21 October.', table(['Metric','16–22 Oct · provisional','9–15 Oct · full week'],[
['Grid cancellations','9','14'],['Counted cancellations','9','4 (restated: excludes Short Term)'],['Rollovers / confirmed STM','0 / 0','5 / 3'],['Grid movement','−9','−6'],['Movement after exclusions','−9','+4 (restated)'],['Intro sales / NMS sale records','5 / 6','10 / 13'],['Recorded deposits','$1,000; 1 blank','$1,179'],['Rollover rate · current NMS snapshot','0/1 = 0.0%','5/12 = 41.7%']
]) + '<p class="sub">Prior-period cancellations are restated under the clarified Short Term exclusion: the archived count of 5 included Ari Miles (Short Term Unlimited), so the comparable count is 4 and movement is 5 + 3 − 4 = +4. The nine bad-debt exclusions remain applied to that prior week. Prior-period rate is restated from the current NMS snapshot: Caden is now NO dated 14 October, bringing that period to 5 rollovers and 7 NO outcomes (41.7%). The archived report remains unchanged and shows the earlier figures.</p><p><a href="reports/2026-10-09-to-15.html">View the preserved previous-week report</a></p>')}

<section class="caution reconcile"><div class="caution-head"><div><h3>Follow-up before the final weekly close</h3><p>Verify Alek’s membership activation; fill Kim’s deposit; close the 3 outstanding rollover decisions. Cancellation counts now reconcile at 9 after excluding Short Term memberships.</p></div></div><p class="caution-detail">Autopay member totals, full-gym attendance, equipment sales and counter fees have not been verified from these sources. The full-week date range includes Thursday entries already recorded. Figures remain provisional until the week is complete.</p></section>
<footer class="footer">Urban Muaythai · Weekly Numbers · 16–22 October 2026 · Sources read 21 October 2026<br>
<a href="${esc(d.sources.daily)}">Daily Numbers grid</a> · <a href="${esc(d.sources.cancellations)}">Cancellation Raw Dump</a> · <a href="${esc(d.sources.nms)}">NMS Kickstarter Master</a> · <a href="data/2026-10-16-to-22.json">Reviewed data snapshot</a>
</footer></main></body></html>\n`;
fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log(JSON.stringify({operatingCancellations:count,gridCancellations:d.daily.cancellations,net,depositTotal:total,missingDeposits:missing,saleRecords:d.sales.length,pipeline:active.length,htmlBytes:Buffer.byteLength(html)}));
