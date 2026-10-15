export type TriageResult = {
  summary: string
  type: 'bug' | 'feature' | 'other'
  reproduction_steps: string[]
  confidence: number
  report_id: string
  source: 'gemini' | 'fallback'
  warning?: string | null
  storage: 'firestore' | 'memory'
  attachment_count: number
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

export type ReviewedIssue = {
  report_id: string
  title: string
  summary: string
  type: TriageResult['type']
  reproduction_steps: string[]
}

export type IssueResult = {
  url: string
  number: number
  status: 'created'
  warning?: string | null
}
