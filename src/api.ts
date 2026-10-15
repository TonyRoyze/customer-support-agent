import type { Complaint, TriageResult } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function triageComplaint(complaint: Complaint): Promise<TriageResult> {
  const body = new FormData()
  body.append('title', complaint.title)
  body.append('description', complaint.description)
  body.append('steps_to_reproduce', complaint.steps_to_reproduce)
  body.append('expected_result', complaint.expected_result)
  body.append('actual_result', complaint.actual_result)
  complaint.screenshots.forEach((file) => body.append('screenshots', file))

  const response = await fetch(`${API_URL}/triage`, { method: 'POST', body })
  if (!response.ok) throw new Error('Triage request failed. Check that the API is running.')
  return response.json() as Promise<TriageResult>
}
