const summarizeDifficultyTip = (difficulty) => {
  if (difficulty === 'easy') {
    return 'Start with the smallest possible working solution, then improve it step by step.';
  }

  if (difficulty === 'hard') {
    return 'Break this into smaller sub-problems and validate each part with quick checks.';
  }

  return 'Solve one requirement at a time and test each change before adding more logic.';
};

const generateStudentHint = ({ challenge, latestSubmission, draftCode }) => {
  const hints = [];

  if (challenge?.instructions) {
    hints.push(`Focus: ${challenge.instructions}`);
  }

  if (Array.isArray(challenge?.objectives) && challenge.objectives.length) {
    hints.push(`Objective priority: ${challenge.objectives[0]}`);
  }

  if (latestSubmission?.result === 'failed') {
    hints.push('Your latest attempt did not pass yet. Re-check expected output and edge cases before resubmitting.');
  } else if (latestSubmission?.result === 'passed') {
    hints.push('Great job passing previously—now try improving readability and naming for cleaner code.');
  }

  if (draftCode && draftCode.length < 20) {
    hints.push('Your current draft is very short; sketch function structure first, then fill in logic.');
  }

  hints.push(summarizeDifficultyTip(challenge?.difficulty));

  if (Array.isArray(challenge?.hints) && challenge.hints.length) {
    hints.push(`Challenge hint: ${challenge.hints[0]}`);
  }

  return {
    suggestion: hints.slice(0, 4).join(' '),
    nextSteps: [
      'Run your code and compare actual vs expected output.',
      'Fix one failing case at a time.',
      'Submit once output matches the test expectations.',
    ],
  };
};

const generateTeacherInterventionSummary = ({ roster = [] }) => {
  const atRisk = roster.filter((student) => student.isAtRisk);
  const overdueHeavy = atRisk.filter((student) => (student.assignmentSummary?.overdue || 0) > 0);
  const lowPass = atRisk.filter((student) => {
    const passRate = student.adaptiveProfile?.recentPassRate;
    return passRate !== null && passRate !== undefined && passRate < 50;
  });

  const priorityStudents = atRisk
    .slice()
    .sort((a, b) => {
      const aOverdue = a.assignmentSummary?.overdue || 0;
      const bOverdue = b.assignmentSummary?.overdue || 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      return (b.failedSubmissions || 0) - (a.failedSubmissions || 0);
    })
    .slice(0, 5)
    .map((student) => ({
      id: student.id,
      name: student.name,
      reason: student.riskReasons?.[0] || 'Needs intervention',
      recommendation: student.interventionHint || 'Assign easy remediation and review misconceptions.',
    }));

  return {
    headline: atRisk.length
      ? `${atRisk.length} students are at risk and need targeted intervention.`
      : 'No at-risk students detected right now.',
    actions: [
      overdueHeavy.length
        ? `Prioritise overdue remediation for ${overdueHeavy.length} student(s).`
        : 'No overdue remediation backlog currently detected.',
      lowPass.length
        ? `Schedule guided review for ${lowPass.length} student(s) with low recent pass rates.`
        : 'Recent pass-rate trends are stable for active students.',
      'Use one-click remediation for priority students and review progress in 3-7 days.',
    ],
    priorityStudents,
  };
};

module.exports = {
  generateStudentHint,
  generateTeacherInterventionSummary,
};
