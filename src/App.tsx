import { useState } from 'react'
import { Activity, ArrowDown, ArrowRight, BadgeCheck, Bug, Check, ChevronDown, CircleHelp, ClipboardList, FileImage, Github, Layers3, LoaderCircle, MessageSquareText, Paperclip, RotateCcw, Sparkles, WandSparkles, X } from 'lucide-react'
import { triageComplaint } from './api'
import type { Complaint, TriageResult } from './types'

const initial: Complaint = { title: '', description: '', steps_to_reproduce: '', expected_result: '', actual_result: '', screenshots: [] }

export default function App() {
  const [form, setForm] = useState(initial)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(false)
  const update = (key: keyof Complaint, value: string) => setForm((old) => ({ ...old, [key]: value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setCreated(false)
    try { setResult(await triageComplaint(form)) } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy(false) }
  }

  function attach(files: FileList | null) {
    if (files) setForm((old) => ({ ...old, screenshots: [...old.screenshots, ...Array.from(files).filter((f) => f.type.startsWith('image/'))] }))
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={18} /></div><span>relay<span className="brand-dot">.</span></span></div>
      <div className="workspace"><div className="workspace-avatar">A</div><div className="workspace-copy"><strong>Acme Support</strong><small>Demo workspace</small></div><ChevronDown size={15} /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav><a className="nav-item active"><MessageSquareText size={17} /> Inbox <span className="nav-count">08</span></a><a className="nav-item"><ClipboardList size={17} /> All tickets</a><a className="nav-item"><Activity size={17} /> Activity</a></nav>
      <div className="sidebar-bottom"><div className="connected"><span className="status-dot" /> API connected <span className="tiny-chevron">⌄</span></div><div className="profile"><div className="profile-avatar">JD</div><div><strong>Jamie Dawson</strong><small>Support team</small></div><ChevronDown size={15} /></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Inbox</span><span className="crumb-slash">/</span><strong>New request</strong></div><div className="top-actions"><span className="env-pill"><span /> DEMO ENVIRONMENT</span><button className="icon-button" aria-label="Help"><CircleHelp size={18} /></button><div className="top-avatar">JD</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CUSTOMER SUPPORT <span className="eyebrow-line" /></div><h1>Turn a complaint into <em>clarity.</em></h1><p>Share what happened. We’ll help your team figure out what to do next.</p></div><div className="stepper"><div className="step current"><span>1</span><small>Report</small></div><i /><div className={`step ${result ? 'complete' : ''}`}><span>{result ? <Check size={13} /> : '2'}</span><small>Review</small></div><i /><div className="step"><span>3</span><small>Resolve</small></div></div></div>

        <div className="work-grid">
          <section className="form-card">
            <div className="card-heading"><div className="heading-icon"><MessageSquareText size={17} /></div><div><h2>Tell us what’s going on</h2><p>A few details help us get to the bottom of it faster.</p></div><span className="required-note"><b>*</b> Required</span></div>
            <form onSubmit={submit}>
              <label className="field"><span>Short summary <b>*</b></span><input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. I can’t export my monthly report" maxLength={140} /><small>Keep it clear and specific.</small></label>
              <label className="field"><span>What happened? <b>*</b></span><textarea required value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the issue in your own words..." rows={3} /></label>
              <label className="field"><span>Steps to reproduce <i>OPTIONAL</i></span><textarea value={form.steps_to_reproduce} onChange={(e) => update('steps_to_reproduce', e.target.value)} placeholder={'1. Go to Reports\n2. Select a date range\n3. Click “Export”'} rows={3} /></label>
              <div className="two-fields"><label className="field"><span>What did you expect?</span><input value={form.expected_result} onChange={(e) => update('expected_result', e.target.value)} placeholder="The report downloads as a CSV" /></label><label className="field"><span>What actually happened?</span><input value={form.actual_result} onChange={(e) => update('actual_result', e.target.value)} placeholder="The page freezes after clicking" /></label></div>
              <div className="field upload-field"><span>Screenshots <i>OPTIONAL</i></span><label className="upload-zone"><input type="file" accept="image/*" multiple onChange={(e) => attach(e.target.files)} /><div className="upload-icon"><Paperclip size={17} /></div><div><strong>Drop screenshots here, or <u>browse</u></strong><small>PNG, JPG or GIF · Up to 10 MB each</small></div></label>{form.screenshots.length > 0 && <div className="file-list">{form.screenshots.map((file, i) => <span key={`${file.name}-${i}`}><FileImage size={13} />{file.name}<button type="button" aria-label="Remove screenshot" onClick={() => setForm((old) => ({ ...old, screenshots: old.screenshots.filter((_, n) => n !== i) }))}><X size={13} /></button></span>)}</div>}</div>
              {error && <div className="error-box">{error}</div>}
              <div className="form-footer"><span><span className="lock">⌑</span> Your report is only shared with the support team.</span><button className="submit-button" type="submit" disabled={busy || !form.title || !form.description}>{busy ? <>Analyzing <LoaderCircle className="spin" size={15} /></> : <>Review report <ArrowRight size={16} /></>}</button></div>
            </form>
          </section>

          <aside className="result-column">
            <section className={`result-card ${result ? 'has-result' : ''}`}>
              <div className="result-header"><div className="ai-icon"><Sparkles size={17} /></div><div><h2>AI triage</h2><p>{result ? 'Here’s what we found.' : 'Your report, thoughtfully reviewed.'}</p></div><span className="ai-badge"><span /> AI ASSIST</span></div>
              {!result ? <div className="empty-result"><div className="empty-illustration"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="sparkle-center"><WandSparkles size={24} /></div><span className="spark s1">✳</span><span className="spark s2">✦</span></div><h3>A clearer picture starts here.</h3><p>Once you share the details, we’ll summarize the issue and suggest a next step for your team.</p><div className="empty-hint"><ArrowDown size={14} /> Your triage will appear here</div></div> : <div className="triage-content"><div className="summary-label">ISSUE SUMMARY</div><p className="summary-text">{result.summary}</p><div className="tag-row"><span className={`type-tag ${result.type}`}><Bug size={13} /> {result.type}</span><span className="confidence">{Math.round(result.confidence * 100)}% confidence</span></div><div className="next-action"><div className="next-icon"><BadgeCheck size={16} /></div><div><span>RECOMMENDED NEXT STEP</span><p>{result.next_action}</p></div></div><div className="repro"><strong>Reproduction notes</strong><ol>{result.reproduction_steps.map((step, i) => <li key={i}>{step}</li>)}</ol></div><div className="review-callout"><Check size={14} /> Please review the summary before creating a ticket.</div></div>}
            </section>
            <section className="github-card"><div className="github-top"><div className="github-icon"><Github size={18} /></div><div><h3>From report to resolution</h3><p>Every step stays in your hands.</p></div></div><div className="flow-step"><div className="flow-number">01</div><div><strong>Review the triage</strong><small>Make sure we got it right.</small></div><span className={result ? 'flow-done' : ''}>{result ? <Check size={14} /> : 'IN PROGRESS'}</span></div><div className="flow-step"><div className="flow-number">02</div><div><strong>Create a GitHub issue</strong><small>Track it where your team works.</small></div><span>COMING UP</span></div><div className="flow-step last"><div className="flow-number">03</div><div><strong>Developer reviews a fix</strong><small>Nothing ships without approval.</small></div><span>ALWAYS HUMAN</span></div>{result && <button className="ticket-button" onClick={() => setCreated(true)} disabled={created}>{created ? <><Check size={15} /> Ticket created</> : <>Create ticket <ArrowRight size={15} /></>}</button>}{created && <div className="created-note"><Check size={13} /> Demo mode: ticket action is ready to connect to GitHub.</div>}</section>
            <div className="privacy-note"><span className="shield">◈</span> Your data stays in your workspace <span>·</span> <button onClick={() => { setForm(initial); setResult(null); setCreated(false); setError('') }}><RotateCcw size={12} /> Start over</button></div>
          </aside>
        </div>
        <footer><span>RELAY SUPPORT <b>·</b> DEMO WORKSPACE</span><span>Built for better handoffs <span className="footer-star">✳</span></span></footer>
      </div>
    </main>
  </div>
}
