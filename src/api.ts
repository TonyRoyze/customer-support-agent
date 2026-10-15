import type { Complaint, IssueResult, ReviewedIssue, TriageResult } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(`${API_URL}${path}`, options) }
  catch { throw new Error('Cannot reach the API. Check your connection and that the backend is running.') }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const detail = payload?.detail
    throw new Error(typeof detail === 'string' ? detail : `Request failed (HTTP ${response.status}). Check the report fields or backend configuration.`)
  }
  return response.json() as Promise<T>
}

export async function triageComplaint(complaint: Complaint): Promise<TriageResult> {
  const body = new FormData()
  body.append('title', complaint.title)
  body.append('description', complaint.description)
  body.append('steps_to_reproduce', complaint.steps_to_reproduce)
  body.append('expected_result', complaint.expected_result)
  body.append('actual_result', complaint.actual_result)
  complaint.screenshots.forEach((file) => body.append('screenshots', file))

  return request<TriageResult>('/triage', { method: 'POST', body })
}

export function createIssue(review: ReviewedIssue): Promise<IssueResult> {
  return request<IssueResult>('/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) })
}
