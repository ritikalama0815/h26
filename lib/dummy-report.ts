/**
 * Sample contribution report for demos when USE_DUMMY_REPORT is enabled.
 * Not for real grading.
 */

export type DummyReportMember = {
  name: string
  githubUsername: string | null
  role: string
  joinedAt: string
}

export function buildDummyReportData(input: {
  groupName: string
  projectName: string | null
  description: string | null
  githubRepo: string | null
  createdAt: string
  roster: DummyReportMember[]
}) {
  const roster =
    input.roster.length > 0
      ? input.roster
      : [
          {
            name: "Alex Chen",
            githubUsername: "alexchen",
            role: "member",
            joinedAt: new Date().toISOString(),
          },
          {
            name: "Jordan Lee",
            githubUsername: "jordanl",
            role: "member",
            joinedAt: new Date().toISOString(),
          },
          {
            name: "Sam Rivera",
            githubUsername: "samrivera",
            role: "member",
            joinedAt: new Date().toISOString(),
          },
        ]

  const githubShares = [38, 35, 27]
  const docsShares = [33, 40, 27]
  const commitsEach = [24, 18, 14]
  const docsMins = [120, 95, 75]

  const memberBreakdown = roster.map((m, i) => {
    const k = i % 3
    return {
      name: m.name,
      commits: commitsEach[k] + (i >= 3 ? i : 0),
      githubAdditions: 420 + k * 80 + i * 5,
      githubDeletions: 110 + k * 20 + i * 2,
      githubPct: githubShares[k],
      docsPct: docsShares[k],
      docsMinutes: docsMins[k] + i * 3,
      docsLinesAdded: 800 + k * 100 + i * 10,
      docsLinesRemoved: 45 + k * 10 + i,
    }
  })

  const contributionList = memberBreakdown.map((m, i) => ({
    name: m.name,
    score: [42, 35, 23][i % 3],
    commits: m.commits,
    additions: m.githubAdditions,
    deletions: m.githubDeletions,
  }))

  const overview = `This is a sample report for "${input.groupName}" (project: ${input.projectName ?? "Untitled"}). The numbers below are placeholders so you can preview the layout. Connect GitHub, sync commits, and have students log Docs/Slides activity to replace this with real data.`

  const aiGrades = roster.map((m, i) => ({
    name: m.name,
    suggestedGrade: (["A-", "B+", "B", "B-", "C+"] as const)[i % 5],
    scoreOutOf100: [88, 82, 78, 75, 72][i % 5],
    justification: `Sample entry only: ${m.name} would receive a narrative based on actual GitHub commits and logged document work.`,
  }))

  return {
    isDummy: true as const,
    group: {
      name: input.groupName,
      projectName: input.projectName,
      description: input.description,
      githubRepo: input.githubRepo,
      createdAt: input.createdAt,
    },
    members: roster,
    contributions: contributionList,
    memberBreakdown,
    chart: {
      githubVsDocs: memberBreakdown.map((m) => ({
        name: m.name,
        githubPct: m.githubPct,
        docsPct: m.docsPct,
        commits: m.commits,
        docsMinutes: m.docsMinutes,
      })),
    },
    commitStats: {
      total: memberBreakdown.reduce((s, m) => s + m.commits, 0),
      totalAdditions: memberBreakdown.reduce((s, m) => s + m.githubAdditions, 0),
      totalDeletions: memberBreakdown.reduce((s, m) => s + m.githubDeletions, 0),
    },
    docsStats: {
      entries: roster.length * 3,
      totalMinutes: memberBreakdown.reduce((s, m) => s + m.docsMinutes, 0),
    },
    aiAnalysis: overview,
    aiGrades,
    generatedAt: new Date().toISOString(),
  }
}
