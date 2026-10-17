import type { PrdInput } from '../validate.js';

export type FindingCategory = 'ambiguity' | 'missing_logic' | 'undefined_inputs';
export type Severity = 'high' | 'medium' | 'low';
export type DetectionStrength = 'High' | 'Medium' | 'Low';

export type PrdFinding = {
  id: string;
  ruleId: string;
  category: FindingCategory;
  title: string;
  description: string;
  evidence: string | null;
  suggestedClarification: string;
  severity: Severity;
  detectionMethod: string;
  confidence: DetectionStrength;
  status: 'needs_ai_review';
};

export type LogicAnalysis = {
  findings: PrdFinding[];
  execution: {
    rulesEvaluated: number;
    candidatesIdentified: number;
    candidatesSuppressed: number;
    candidatesDeduplicated: number;
    executionDurationMs: number;
  };
};

type Candidate = Omit<PrdFinding, 'id' | 'status'>;

const RULE_COUNT = 10;
const MAX_FINDINGS = 7;

function fieldsOf(input: PrdInput): string[] {
  return [
    input.featureTitle,
    input.productName,
    input.featureDescription,
    input.targetUsers,
    input.prdText,
    input.acceptanceCriteria,
  ].filter(Boolean);
}

function findMatches(text: string, pattern: RegExp): RegExpMatchArray[] {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))];
}

function firstEvidence(fields: string[], pattern: RegExp): string | null {
  for (const field of fields) {
    const match = findMatches(field, pattern)[0];
    if (match?.[0]) return match[0];
  }
  return null;
}

function sentenceAt(text: string, index: number): string {
  const start = Math.max(
    text.lastIndexOf('.', index),
    text.lastIndexOf('?', index),
    text.lastIndexOf('!', index),
    text.lastIndexOf('\n', index),
  ) + 1;
  const stops = [
    text.indexOf('.', index),
    text.indexOf('?', index),
    text.indexOf('!', index),
    text.indexOf('\n', index),
  ].filter((position) => position >= 0);
  const end = stops.length ? Math.min(...stops) + 1 : text.length;
  return text.slice(start, end).trim();
}

function contextAround(text: string, index: number, length: number): string {
  return text.slice(Math.max(0, index - 100), Math.min(text.length, index + length + 180));
}

function addCandidate(
  candidates: Candidate[],
  candidate: Omit<Candidate, 'status' | 'id'>,
) {
  candidates.push(candidate);
}

const roleWords =
  /\b(?:administrator|admin|moderator|registered customer|customer|buyer|seller|vendor|merchant|account owner|team member|member|employee|manager|operator|patient|student|teacher|parent|guest|subscriber|agent|support representative)\b/i;
const genericActor = /\b(?:user|users|person|people|they)\b/i;

const vagueTerms = /\b(?:fast|quick(?:ly)?|easy|easily|user[- ]friendly|appropriate|seamless)\b/gi;
const measurePattern =
  /\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?|seconds?|secs?|minutes?|mins?|hours?|days?|characters?|steps?|attempts?|items?|records?|requests?)\b|\b(?:within|under|over|at least|at most|no more than|less than|greater than|up to)\s+\d+\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:seconds?|minutes?|hours?|days?|characters?|steps?|attempts?|items?)\b/i;

const conditionPattern = /\b(?:if|when|unless|in the event that)\b/i;
const outcomeVerb =
  /\b(?:then|show|display|return|send|notify|retry|allow|block|reject|redirect|provide|store|save|log|keep|stop|cancel|reset|use|prompt|make|is|are|becomes?|will|should|must|can|remains?|receive|flag|open|close|create|update|delete|process|continue|remove|set|navigate|capture|validate|succeed|fail|appear|switch|generate|render|record|start|complete|confirm|contain|include|remain|take|leave|preserve|expire|become|result|trigger|mark)\b/i;

const failureTerms =
  /\b(?:fail(?:s|ed|ure)?|error|invalid|unavailable|timeout|timed out|declined|rejected|retry|retries|unable to|cannot|could not)\b/i;
const successTerms =
  /\b(?:success(?:ful(?:ly)?)?|completed?|confirmation|confirmed|saved|sent|received|created|updated|deleted|redirected|available|shown|displayed|result(?:s)? in|ends? with)\b/i;

const actionPatterns = [
  /\b(?:password reset|reset(?:s|ting)? (?:the |a |their )?password)\b/i,
  /\b(?:payment|checkout|purchase|pay(?:s|ing)? for)\b/i,
  /\b(?:upload(?:s|ing)?|attach(?:es|ing)?)\b/i,
  /\b(?:submit(?:s|ting)? (?:the |a )?(?:form|request|application)|form submission)\b/i,
  /\b(?:invite(?:s|d|ing)?|invitation)\b/i,
  /\b(?:export(?:s|ing)?|download(?:s|ing)?)\b/i,
  /\b(?:delete(?:s|d|ing)?|remove(?:s|d|ing)?)\b/i,
  /\b(?:save(?:s|d|ing)?|create(?:s|d|ing)?|update(?:s|d|ing)?)\b/i,
];

const inputFields: Array<{ name: string; pattern: RegExp; constraint: RegExp }> = [
  {
    name: 'email address',
    pattern: /\bemail(?: address)?s?\b/i,
    constraint: /\b(?:valid email|email format|email address.{0,35}(?:format|valid|max|min|length|unique|domain|required|optional)|email.{0,35}(?:format|valid|max|min|length|unique|domain|required|optional))\b/i,
  },
  {
    name: 'password',
    pattern: /\bpasswords?\b/i,
    constraint: /\bpassword.{0,55}(?:minimum|maximum|min(?:imum)?|max(?:imum)?|length|characters?|uppercase|lowercase|digit|special character|symbol|required|optional|at least|at most|no more than)\b|\b(?:minimum|maximum|min(?:imum)?|max(?:imum)?|at least|at most)\b.{0,35}\bpassword\b/i,
  },
  {
    name: 'phone number',
    pattern: /\bphone numbers?\b|\bmobile numbers?\b/i,
    constraint: /\b(?:phone|mobile number).{0,55}(?:format|country code|digits?|length|valid|international|required|optional)\b|\b(?:valid|international)\s+(?:phone|mobile)\b/i,
  },
  {
    name: 'amount',
    pattern: /\b(?:amount|price|total|balance)s?\b/i,
    constraint: /\b(?:amount|price|total|balance).{0,55}(?:minimum|maximum|min|max|range|currency|decimal|positive|greater than|less than|at least|at most|no more than)\b/i,
  },
  {
    name: 'quantity',
    pattern: /\bquantit(?:y|ies)\b/i,
    constraint: /\bquantity.{0,55}(?:minimum|maximum|min|max|range|positive|integer|at least|at most|no more than)\b/i,
  },
  {
    name: 'date',
    pattern: /\bdates?\b/i,
    constraint: /\bdate.{0,55}(?:format|range|timezone|time zone|before|after|future|past|valid|required|optional)\b/i,
  },
  {
    name: 'file',
    pattern: /\bfiles?\b|\battachments?\b/i,
    constraint: /\b(?:file|attachment).{0,55}(?:type|extension|size|maximum|minimum|limit|format|dimensions?|megabytes?|mb\b|kilobytes?|kb\b)\b/i,
  },
  {
    name: 'username',
    pattern: /\busernames?\b/i,
    constraint: /\busername.{0,55}(?:minimum|maximum|min|max|length|characters?|allowed|unique|format|at least|at most)\b/i,
  },
  {
    name: 'verification code',
    pattern: /\b(?:verification|authentication|one[- ]time) codes?\b/i,
    constraint: /\b(?:verification|authentication|one[- ]time) code.{0,55}(?:length|digits?|expires?|expiration|attempts?|format|valid|single use)\b/i,
  },
  {
    name: 'postal code',
    pattern: /\bpostal codes?\b|\bzip codes?\b/i,
    constraint: /\b(?:postal|zip) code.{0,55}(?:format|length|characters?|country|valid|required|optional)\b/i,
  },
  {
    name: 'search query',
    pattern: /\bsearch queries\b|\bsearch query\b|\bsearch term\b/i,
    constraint: /\bsearch (?:query|term).{0,55}(?:minimum|maximum|min|max|length|characters?|limit|empty|required|optional)\b/i,
  },
];

const formPattern =
  /\b(?:form|forms|registration|sign[- ]?up|checkout form|data entry|input fields?)\b/i;
const validationPattern =
  /\b(?:validat(?:e|es|ed|ion|ing)|required field|invalid input|valid format|allowed characters|must contain|must be (?:a|an|at least|no more than)|length limit|format requirement|field constraints?)\b/i;

const acceptancePattern =
  /\b(?:acceptance criteria|success criteria|testable criteria|given\b.{0,200}\bwhen\b.{0,200}\bthen\b)\b/i;
const explicitOutcomePattern =
  /\b(?:must|should|shall|will)\s+(?:show|display|return|send|save|create|update|delete|redirect|confirm|provide|allow|mark|generate|open|close|include|contain|preserve|receive)\b/i;

export function analyzePrdInput(input: PrdInput): LogicAnalysis {
  const startedAt = performance.now();
  const fields = fieldsOf(input);
  const allText = fields.join('\n');
  const candidates: Candidate[] = [];
  let candidatesSuppressed = 0;

  // R001 — Generic actors are only flagged when no specific role is given anywhere.
  const actorEvidence = firstEvidence(fields, genericActor);
  if (actorEvidence) {
    if (input.targetUsers.trim() || roleWords.test(allText)) {
      candidatesSuppressed += 1;
    } else {
      addCandidate(candidates, {
        ruleId: 'R001',
        category: 'undefined_inputs',
        title: 'The user role is not defined',
        description:
          'The specification refers to a generic user, but does not identify the role, permissions, or audience for this behavior.',
        evidence: actorEvidence,
        suggestedClarification:
          'Specify which user role performs this action and any role-specific access or permissions.',
        severity: 'medium',
        detectionMethod: 'generic_actor_without_defined_role',
        confidence: 'Medium',
      });
    }
  }

  // R002 — Vague phrases are flagged only when their sentence lacks a measurable definition.
  const vagueMatches = fields.flatMap((field) => findMatches(field, vagueTerms));
  const vagueOccurrences: string[] = [];
  for (const field of fields) {
    for (const match of findMatches(field, vagueTerms)) {
      if (measurePattern.test(sentenceAt(field, match.index ?? 0))) {
        candidatesSuppressed += 1;
      } else {
        vagueOccurrences.push(match[0]);
      }
    }
  }
  if (vagueOccurrences.length) {
    const uniqueTerms = [...new Set(vagueOccurrences.map((term) => term.toLowerCase()))];
    addCandidate(candidates, {
      ruleId: 'R002',
      category: 'ambiguity',
      title: 'A subjective quality needs a measurable definition',
      description: `The specification uses ${uniqueTerms.map((term) => `“${term}”`).join(', ')} without a measurable criterion in the same statement.`,
      evidence: firstEvidence(fields, vagueTerms),
      suggestedClarification:
        'Define an observable threshold or testable outcome for this quality.',
      severity: 'medium',
      detectionMethod: 'vague_term_without_nearby_measure',
      confidence: 'Medium',
    });
  }
  // A match can appear more than once; the category-level finding above intentionally consolidates them.
  candidatesSuppressed += Math.max(0, vagueOccurrences.length - 1);

  // R003 — Flag a conditional sentence when its trigger is present without a recognizable outcome.
  const incompleteConditional = fields
    .flatMap((field) => {
      const sentences = field.split(/(?<=[.!?])\s+|\n+/).map((sentence) => sentence.trim());
      return sentences.map((sentence) => ({ field, sentence }));
    })
    .find(({ sentence }) => {
      if (!conditionPattern.test(sentence)) return false;
      const comma = sentence.indexOf(',');
      if (comma >= 0) return !outcomeVerb.test(sentence.slice(comma + 1));
      return !/\bthen\b/i.test(sentence) && !outcomeVerb.test(sentence);
    });
  if (incompleteConditional) {
    const evidence = incompleteConditional.sentence.match(conditionPattern)?.[0];
    const sentence = incompleteConditional.sentence;
    const conditionalIndex = sentence.search(conditionPattern);
    const exactEvidence = evidence
      ? sentence.slice(conditionalIndex).replace(/[.!?]\s*$/, '').trim()
      : null;
    addCandidate(candidates, {
      ruleId: 'R003',
      category: 'missing_logic',
      title: 'A stated condition has no defined outcome',
      description:
        'A conditional trigger is stated, but the specification does not describe what the system or user should experience when it occurs.',
      evidence: exactEvidence,
      suggestedClarification:
        'Describe the expected system response, resulting state, and any user-visible feedback for this condition.',
      severity: 'high',
      detectionMethod: 'conditional_sentence_without_recognized_outcome',
      confidence: 'Medium',
    });
  }

  // R004 — Recognized actions need explicit failure behavior.
  const failureAction = actionPatterns
    .map((pattern) => firstEvidence(fields, pattern))
    .find((evidence) => evidence !== null);
  if (failureAction) {
    if (failureTerms.test(allText)) {
      candidatesSuppressed += 1;
    } else {
      const action = failureAction.toLowerCase();
      let suggestedClarification =
        'Define what the user sees if this action fails, including retry behavior and whether partial changes are retained.';
      if (action.includes('password')) {
        suggestedClarification =
          'Define responses for unknown accounts, expired reset links, and delivery failures, including safe messaging and retry behavior.';
      } else if (/payment|checkout|purchase|pay/.test(action)) {
        suggestedClarification =
          'Define responses for declined payments and processor timeouts, retry behavior, and whether the order remains unchanged.';
      } else if (/upload|attach/.test(action)) {
        suggestedClarification =
          'Define responses for unsupported or oversized files and interrupted uploads, including whether partial uploads are removed.';
      } else if (/form|submit/.test(action)) {
        suggestedClarification =
          'Define field-level and submission failure behavior, the messages shown, and whether entered values are preserved.';
      }
      addCandidate(candidates, {
        ruleId: 'R004',
        category: 'missing_logic',
        title: 'Failure behavior is not specified',
        description: `The requirement includes “${failureAction}” but does not describe a failure, timeout, or recovery path.`,
        evidence: failureAction,
        suggestedClarification,
        severity: 'high',
        detectionMethod: 'recognized_action_without_failure_behavior',
        confidence: 'Medium',
      });
    }
  }

  // R005 — Explicitly named input fields need a recognizable format, range, or boundary.
  const unconstrainedInputs = inputFields.filter(({ pattern, constraint }) => {
    const mentioned = fields.some((field) => pattern.test(field));
    if (!mentioned) return false;
    const defined = fields.some((field) => constraint.test(field));
    if (defined) candidatesSuppressed += 1;
    return !defined;
  });
  if (unconstrainedInputs.length) {
    const firstField = unconstrainedInputs[0];
    addCandidate(candidates, {
      ruleId: 'R005',
      category: 'undefined_inputs',
      title: 'Input constraints are unspecified',
      description: `The specification mentions ${unconstrainedInputs.map(({ name }) => name).join(', ')}, but no applicable format, range, or length constraints were recognized.`,
      evidence: firstEvidence(fields, firstField.pattern),
      suggestedClarification:
        'Specify accepted formats, minimum and maximum values or lengths, and any required or optional behavior for these inputs.',
      severity: 'medium',
      detectionMethod: 'recognized_input_without_field_constraint',
      confidence: 'Medium',
    });
  }

  // R006 — Explicit user actions need a recognizable completion outcome.
  const requestedActions = fields.flatMap((field) =>
    findMatches(
      field,
      /\b(?:can|will|must|should|may|is able to)\s+(?:request|submit|save|create|update|delete|reset|upload|invite|search|export|download|purchase|pay|change|add|remove|verify|select|send|cancel|open|close)\b/gi,
    ).map((match) => ({ field, match })),
  );
  const missingOutcome = requestedActions.find(({ field, match }) => {
    const context = contextAround(field, match.index ?? 0, match[0].length);
    return !successTerms.test(context);
  });
  if (missingOutcome) {
    const action = missingOutcome.match[0].replace(/^(?:can|will|must|should|may|is able to)\s+/i, '');
    const evidence = missingOutcome.match[0];
    addCandidate(candidates, {
      ruleId: 'R006',
      category: 'missing_logic',
      title: 'The completion outcome is unclear',
      description: `The specification allows the action “${action}” but does not state how completion is confirmed or what resulting state is expected.`,
      evidence,
      suggestedClarification:
        'State the successful end state and how the user or downstream system can confirm the action completed.',
      severity: 'medium',
      detectionMethod: 'recognized_user_action_without_nearby_success_signal',
      confidence: 'Medium',
    });
  } else if (requestedActions.length) {
    candidatesSuppressed += 1;
  }

  // R007 — Detect only an explicit contradictory numeric lower/upper bound in one statement.
  const numericConflict = fields
    .flatMap((field) => field.split(/(?<=[.!?])\s+|\n+/).map((sentence) => sentence.trim()))
    .map((sentence) => {
      const lower = findMatches(
        sentence,
        /\b(?:at least|minimum(?: of)?|no fewer than|greater than or equal to|over|above|more than)\s*(\d+)\b/gi,
      );
      const upper = findMatches(
        sentence,
        /\b(?:at most|maximum(?: of)?|no more than|less than or equal to|under|below|less than|up to)\s*(\d+)\b/gi,
      );
      return { sentence, lower, upper };
    })
    .find(({ sentence, lower, upper }) => {
      if (!lower.length || !upper.length) return false;
      const hasSharedMeasure =
        /\b(?:characters?|attempts?|times?|days?|hours?|minutes?|seconds?|items?|records?|requests?|users?|steps?|years?|bytes?|kb|mb|gb|percent|%)\b/i.test(
          sentence,
        ) || /\b(?:password|age|amount|quantity|size|limit|duration)\b/i.test(sentence);
      return (
        hasSharedMeasure &&
        lower.some((min) =>
          upper.some((max) => Number(min[1]) > Number(max[1])),
        )
      );
    });
  if (numericConflict) {
    addCandidate(candidates, {
      ruleId: 'R007',
      category: 'ambiguity',
      title: 'Numeric limits conflict in the same requirement',
      description:
        'A lower numeric bound is greater than an upper bound for what appears to be the same measure.',
      evidence: numericConflict.sentence,
      suggestedClarification:
        'Reconcile the minimum and maximum values and state the intended inclusive or exclusive boundary.',
      severity: 'high',
      detectionMethod: 'same_statement_lower_bound_exceeds_upper_bound',
      confidence: 'High',
    });
  }

  // R008 — Password-reset and verification links need explicit expiry and reuse semantics.
  const recoveryLink =
    /\b(?:password[- ]reset|reset|verification|verify|account activation)[- ]?(?:email )?(?:link|url)s?\b|\b(?:password reset|verification) links?\b/i;
  const linkEvidence = firstEvidence(fields, recoveryLink);
  if (linkEvidence) {
    const expiryDefined =
      /\b(?:expires?|expiration|expiry|valid for|valid until|expiration time)\b/i.test(allText);
    const reuseDefined =
      /\b(?:single[- ]use|one[- ]time|only be used once|can(?:not|'t) be reused|reus(?:e|able)|used more than once|multiple uses?)\b/i.test(
        allText,
      );
    const missing = [
      !expiryDefined ? 'expiration' : '',
      !reuseDefined ? 'reuse' : '',
    ].filter(Boolean);
    if (!missing.length) {
      candidatesSuppressed += 1;
    } else {
      addCandidate(candidates, {
        ruleId: 'R008',
        category: 'undefined_inputs',
        title: 'Recovery-link lifecycle is incomplete',
        description: `A password-reset or verification link is specified, but its ${missing.join(' and ')} behavior is not defined.`,
        evidence: linkEvidence,
        suggestedClarification:
          'Define how long each link remains valid and whether it can be used once or multiple times, including what happens after expiration.',
        severity: 'high',
        detectionMethod: 'recovery_link_without_expiry_or_reuse_policy',
        confidence: 'High',
      });
    }
  }

  // R009 — A named form or data-entry surface needs explicit validation requirements.
  const formEvidence = firstEvidence(fields, formPattern);
  if (formEvidence) {
    if (validationPattern.test(allText)) {
      candidatesSuppressed += 1;
    } else {
      addCandidate(candidates, {
        ruleId: 'R009',
        category: 'undefined_inputs',
        title: 'Form validation behavior is not described',
        description:
          'A form or data-entry surface is mentioned, but no field-validation, format, or invalid-submission requirements were recognized.',
        evidence: formEvidence,
        suggestedClarification:
          'Specify which fields are required, how formats and values are validated, when errors appear, and whether invalid submissions are blocked.',
        severity: 'medium',
        detectionMethod: 'form_or_data_entry_without_validation_requirements',
        confidence: 'Medium',
      });
    }
  }

  // R010 — Missing criteria is advisory and may be satisfied anywhere in the submitted fields.
  const criteriaProvided =
    Boolean(input.acceptanceCriteria.trim()) ||
    acceptancePattern.test(allText) ||
    explicitOutcomePattern.test(allText);
  if (criteriaProvided) {
    candidatesSuppressed += 1;
  } else {
    addCandidate(candidates, {
      ruleId: 'R010',
      category: 'missing_logic',
      title: 'Acceptance criteria are not specified',
      description:
        'No acceptance criteria or explicit success conditions were found in the submitted fields. This is an advisory, not an implementation blocker.',
      evidence: null,
      suggestedClarification:
        'Add one or more observable acceptance criteria that describe the expected behavior and result.',
      severity: 'low',
      detectionMethod: 'no_acceptance_criteria_or_explicit_success_condition',
      confidence: 'Low',
    });
  }

  const candidatesIdentified = candidates.length;
  const seen = new Set<string>();
  const deduplicated: Candidate[] = [];
  let candidatesDeduplicated = 0;
  for (const candidate of candidates) {
    const key = `${candidate.ruleId}:${candidate.category}`;
    if (seen.has(key)) {
      candidatesDeduplicated += 1;
      continue;
    }
    seen.add(key);
    deduplicated.push(candidate);
  }

  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  const findings = deduplicated
    .sort(
      (left, right) =>
        severityOrder[left.severity] - severityOrder[right.severity] ||
        left.ruleId.localeCompare(right.ruleId),
    )
    .slice(0, MAX_FINDINGS)
    .map((candidate) => ({
      ...candidate,
      id: candidate.ruleId,
      status: 'needs_ai_review' as const,
    }));

  return {
    findings,
    execution: {
      rulesEvaluated: RULE_COUNT,
      candidatesIdentified,
      candidatesSuppressed,
      candidatesDeduplicated,
      executionDurationMs: Number((performance.now() - startedAt).toFixed(3)),
    },
  };
}
