import { useMemo } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, FileSearch2, ShieldCheck } from 'lucide-react';
import './analysis-results.css';

export type FindingCategory = 'ambiguity' | 'missing_logic' | 'undefined_inputs';
export type FindingSeverity = 'high' | 'medium' | 'low';
export type DetectionConfidence = 'High' | 'Medium' | 'Low';

export type AnalysisFinding = {
  id: string | number;
  ruleId: string;
  category?: FindingCategory;
  title: string;
  description: string;
  evidence: string | null;
  suggestedClarification: string;
  severity: FindingSeverity;
  detectionMethod: string;
  confidence: DetectionConfidence;
  status: 'needs_ai_review';
};

export type AnalysisSummary = string | {
  overview?: string;
  message?: string;
  totalFindings?: number;
  highSeverity?: number;
  mediumSeverity?: number;
  lowSeverity?: number;
  [key: string]: string | number | undefined;
};

export type AnalysisResultsProps = {
  findings: AnalysisFinding[];
  summary?: AnalysisSummary | null;
};

const categoryDetails: Array<{ key: FindingCategory | 'uncategorized'; label: string; note: string }> = [
  { key: 'ambiguity', label: 'Ambiguity', note: 'Language that may leave room for interpretation' },
  { key: 'missing_logic', label: 'Missing logic', note: 'Behavior or decision paths that may need definition' },
  { key: 'undefined_inputs', label: 'Undefined inputs', note: 'Inputs or conditions that may need explicit boundaries' },
  { key: 'uncategorized', label: 'Other candidates', note: 'Additional items surfaced by the current rule set' },
];

function formatMethod(method: string) {
  return method.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getSummaryText(summary?: AnalysisSummary | null) {
  if (typeof summary === 'string') return summary;
  if (!summary) return '';
  return summary.overview || summary.message || '';
}

function getSummaryCount(summary?: AnalysisSummary | null, findingsCount = 0) {
  if (summary && typeof summary === 'object' && typeof summary.totalFindings === 'number') {
    return summary.totalFindings;
  }
  return findingsCount;
}

function AnalysisResults({ findings, summary }: AnalysisResultsProps) {
  const groupedFindings = useMemo(() => {
    const grouped = new Map<FindingCategory | 'uncategorized', AnalysisFinding[]>();
    findings.forEach((finding) => {
      const key = finding.category ?? 'uncategorized';
      grouped.set(key, [...(grouped.get(key) ?? []), finding]);
    });
    return grouped;
  }, [findings]);

  const summaryText = getSummaryText(summary);
  const total = getSummaryCount(summary, findings.length);
  const severityCounts = useMemo(() => ({
    high: findings.filter((finding) => finding.severity === 'high').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    low: findings.filter((finding) => finding.severity === 'low').length,
  }), [findings]);

  return (
    <section className="analysis-results" aria-labelledby="analysis-results-title">
      <header className="ar-header">
        <div className="ar-title-block">
          <div className="ar-kicker"><span className="ar-kicker-mark" /> Logic review · candidate findings</div>
          <h2 id="analysis-results-title">Potential gaps to review</h2>
          <p>Rule-based signals to help focus the handoff conversation. These are not confirmed defects.</p>
        </div>
        <div className="ar-total" aria-label={`${total} potential review candidates`}>
          <span className="ar-total-number">{total}</span>
          <span className="ar-total-label">candidates</span>
        </div>
      </header>

      {summaryText && (
        <div className="ar-summary" role="note">
          <div className="ar-summary-icon"><FileSearch2 size={16} aria-hidden="true" /></div>
          <p>{summaryText}</p>
        </div>
      )}

      {findings.length === 0 ? (
        <div className="ar-empty" role="status">
          <div className="ar-empty-mark"><CheckCircle2 size={20} aria-hidden="true" /></div>
          <div>
            <strong>No candidates surfaced</strong>
            <p>No potential gaps detected by the current rule set.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="ar-count-strip" aria-label="Candidates by severity">
            <span className="ar-count-label">Severity mix</span>
            <span className="ar-count-item"><i className="ar-severity-dot high" />{severityCounts.high} high</span>
            <span className="ar-count-item"><i className="ar-severity-dot medium" />{severityCounts.medium} medium</span>
            <span className="ar-count-item"><i className="ar-severity-dot low" />{severityCounts.low} low</span>
          </div>

          <div className="ar-groups">
            {categoryDetails.map(({ key, label, note }) => {
              const items = groupedFindings.get(key);
              if (!items?.length) return null;
              return (
                <section className="ar-group" key={key} aria-labelledby={`ar-group-${key}`}>
                  <div className="ar-group-heading">
                    <div>
                      <h3 id={`ar-group-${key}`}>{label}<span>{items.length}</span></h3>
                      <p>{note}</p>
                    </div>
                    <span className="ar-group-rule" aria-hidden="true" />
                  </div>
                  <div className="ar-finding-list">
                    {items.map((finding) => (
                      <article className={`ar-finding ar-severity-${finding.severity}`} key={finding.id}>
                        <div className="ar-finding-top">
                          <div className="ar-finding-identity">
                            <span className={`ar-severity-pill ${finding.severity}`}>
                              <i className="ar-severity-dot" />{finding.severity}
                            </span>
                            <code className="ar-rule-id">{finding.ruleId}</code>
                          </div>
                          <span className="ar-review-label"><ShieldCheck size={13} aria-hidden="true" />Rule-based candidate — awaiting AI review</span>
                        </div>

                        <div className="ar-finding-copy">
                          <h4>{finding.title}</h4>
                          <p>{finding.description}</p>
                        </div>

                        {finding.evidence !== null && finding.evidence.length > 0 && (
                          <div className="ar-evidence">
                            <span className="ar-section-label">Evidence from the spec</span>
                            <blockquote>{finding.evidence}</blockquote>
                          </div>
                        )}

                        <div className="ar-clarification">
                          <div className="ar-clarification-heading">
                            <ArrowUpRight size={14} aria-hidden="true" />
                            <span className="ar-section-label">Suggested clarification</span>
                          </div>
                          <p>{finding.suggestedClarification}</p>
                        </div>

                        <footer className="ar-finding-footer">
                          <span className="ar-detection"><AlertTriangle size={13} aria-hidden="true" />
                            <span>Detection method <strong>{formatMethod(finding.detectionMethod)}</strong></span>
                          </span>
                          <span className={`ar-confidence ar-confidence-${finding.confidence.toLowerCase()}`}>
                            <span className="ar-confidence-label">Detection strength</span>
                            <strong>{finding.confidence}</strong>
                          </span>
                        </footer>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="ar-footnote"><ShieldCheck size={13} aria-hidden="true" /> Candidates are deterministic rule matches and should be confirmed in context before engineering handoff.</p>
        </>
      )}
    </section>
  );
}

export default AnalysisResults;
