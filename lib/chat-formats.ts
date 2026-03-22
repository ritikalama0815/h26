/** Structured instructor reply posted into group chat */
export const INSTRUCTOR_ANSWER_PREFIX = "@instructor-answer::"

export type InstructorAnswerPayload = {
  questionId: string
  question: string
  answer: string
  resolved: boolean
  /** Set by server so students can show name without profile SELECT on instructor */
  instructorName?: string
}

export function parseInstructorAnswer(content: string): InstructorAnswerPayload | null {
  if (!content.startsWith(INSTRUCTOR_ANSWER_PREFIX)) return null
  try {
    return JSON.parse(content.slice(INSTRUCTOR_ANSWER_PREFIX.length)) as InstructorAnswerPayload
  } catch {
    return null
  }
}
