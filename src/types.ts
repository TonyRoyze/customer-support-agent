export type TriageResult = {
  summary: string
  type: 'bug' | 'feature' | 'other'
  reproduction_steps: string[]
  confidence: number
  next_action: string
}

export type Complaint = {
  title: string
  description: string
  steps_to_reproduce: string
  expected_result: string
  actual_result: string
  screenshots: File[]
}
