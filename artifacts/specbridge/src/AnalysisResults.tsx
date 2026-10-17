import { useEffect, useState, type FormEvent } from "react";
import AnalysisResults, { type AnalysisFinding } from "./AnalysisResults";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LockKeyhole,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";

type FormValues = {
  featureTitle: string;
  productName: string;
  featureDescription: string;
  targetUsers: string;
  prdText: string;
  acceptanceCriteria: string;
};

type ApiResponse = {
  valid: boolean;
  errors: Record<string, string>;
  normalizedInput?: FormValues;
  message?: string;
  findings?: AnalysisFinding[];
};

const initialValues: FormValues = {
  featureTitle: "",
  productName: "",
  featureDescription: "",
  targetUsers: "",
  prdText: "",
  acceptanceCriteria: "",
};

const requiredFields: Array<keyof FormValues> = [
  "featureTitle",
  "featureDescription",
  "prdText",
];

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.featureTitle.trim())
    errors.featureTitle = "Enter a feature title.";
  if (!values.featureDescription.trim())
    errors.featureDescription = "Add a short description of the feature.";
  const prdLength = values.prdText.trim().length;
  if (!prdLength) errors.prdText = "Paste the PRD content to continue.";
  else if (prdLength < 100)
    errors.prdText = `Add at least 100 characters. You have ${prdLength}.`;
  else if (values.prdText.length > 20000)
    errors.prdText = `PRD content must be 20,000 characters or fewer. You have ${values.prdText.length}.`;
  return errors;
}

function App() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [analysisFindings, setAnalysisFindings] = useState<
    AnalysisFinding[] | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setRequestError("");
    setAnalysisFindings(null);
  }

  function clearForm() {
    setValues({ ...initialValues });
    setErrors({});
    setRequestError("");
    setAnalysisFindings(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysisFindings(null);
    setRequestError("");
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      const firstInvalid = requiredFields.find((field) => clientErrors[field]);
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedValues = {
        featureTitle: values.featureTitle.trim(),
        productName: values.productName.trim(),
        featureDescription: values.featureDescription.trim(),
        targetUsers: values.targetUsers.trim(),
        prdText: values.prdText.trim(),
        acceptanceCriteria: values.acceptanceCriteria.trim(),
      };
      const response = await fetch("/api/analyze-logic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedValues),
      });
      let result: ApiResponse;
      try {
        result = (await response.json()) as ApiResponse;
      } catch {
        throw new Error(
          "The analysis service returned an unreadable response. Please try again.",
        );
      }

      if (!response.ok) {
        setErrors(result.errors ?? {});
        setRequestError(
          result.message ||
            "We could not validate this input. Review the fields and try again.",
        );
        return;
      }
      if (!result.valid) {
        setErrors(result.errors ?? {});
        setRequestError(
          result.message ||
            "A few details need attention before this can move forward.",
        );
        return;
      }
      setErrors({});
      setValues(result.normalizedInput ?? trimmedValues);
      if (!Array.isArray(result.findings)) {
        throw new Error(
          "The analysis response did not include findings. Please try again.",
        );
      }
      setAnalysisFindings(result.findings);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to reach the validation service. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const prdCount = values.prdText.length;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <FileCheck2 size={19} strokeWidth={1.8} />
          </div>
          <div>
            <div className="brand-name">
              Spec<span>Bridge</span>
            </div>
            <div className="brand-sub">Product handoff workspace</div>
          </div>
        </div>

        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Workspace">
          <div className="nav-item active" aria-current="page">
            <ClipboardCheck size={16} aria-hidden="true" />
            <span>New Analysis</span>
          </div>
          <div className="nav-item disabled" aria-disabled="true">
            <FileText size={16} aria-hidden="true" />
            <span>Analysis History</span>
            <span className="soon-pill">Soon</span>
          </div>
          <div className="nav-item disabled" aria-disabled="true">
            <PanelGlyph />
            <span>Admin Dashboard</span>
            <span className="soon-pill">Soon</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <strong>Built for the handoff moment.</strong>A clear checkpoint
            between product intent and engineering work.
          </div>
          <div className="account-chip">
            <div className="avatar-mark" aria-hidden="true">
              SB
            </div>
            <div className="account-copy">
              Product workspace<small>Input checkpoint</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb" aria-label="Breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>New Analysis</strong>
          </div>
          <div className="topbar-right">
            <div className="secure-label">
              <LockKeyhole size={13} aria-hidden="true" /> Structured input only
            </div>
            <button
              className="theme-toggle"
              type="button"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDarkMode((mode) => !mode)}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <div className="content">
          <section className="page-intro" aria-labelledby="page-title">
            <div>
              <div className="eyebrow">Logic checkpoint · 02</div>
              <h1 className="page-title" id="page-title">
                Start with a clear spec.
              </h1>
              <p className="page-subtitle">
                Bridge the gap between product requirements and engineering
                clarity. Add the feature context and PRD, then review potential
                requirement gaps identified by deterministic rules.
              </p>
            </div>
            <div className="step-indicator">
              <span className="step-dot">1</span> REQUIREMENT REVIEW
            </div>
          </section>

          <div className="workspace-grid">
            <section className="form-card" aria-labelledby="form-title">
              <div className="card-heading">
                <div className="card-heading-main">
                  <div className="heading-icon">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h2 id="form-title">Feature specification</h2>
                    <p>
                      Start with the essentials. Optional context helps add
                      clarity.
                    </p>
                  </div>
                </div>
                <div className="required-key">
                  <b>*</b> Required
                </div>
              </div>

              <form className="form-body" onSubmit={handleSubmit} noValidate>
                {requestError && (
                  <div className="notice error" role="alert">
                    <AlertCircle
                      className="notice-icon"
                      size={17}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>Input needs attention</strong>
                      <p>{requestError}</p>
                    </div>
                  </div>
                )}

                <div className="fields-grid">
                  <div className="field">
                    <div className="field-label-row">
                      <label htmlFor="featureTitle">
                        Feature title<span className="required-star">*</span>
                      </label>
                    </div>
                    <input
                      id="featureTitle"
                      className="field-control"
                      type="text"
                      placeholder="e.g. Saved payment methods"
                      value={values.featureTitle}
                      onChange={(event) =>
                        updateField("featureTitle", event.target.value)
                      }
                      aria-invalid={Boolean(errors.featureTitle)}
                      aria-describedby={
                        errors.featureTitle ? "featureTitle-error" : undefined
                      }
                      required
                    />
                    {errors.featureTitle && (
                      <div className="field-error" id="featureTitle-error">
                        <AlertCircle size={12} />
                        {errors.featureTitle}
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <div className="field-label-row">
                      <label htmlFor="productName">
                        Product name <span className="optional">Optional</span>
                      </label>
                    </div>
                    <input
                      id="productName"
                      className="field-control"
                      type="text"
                      placeholder="e.g. Merchant Portal"
                      value={values.productName}
                      onChange={(event) =>
                        updateField("productName", event.target.value)
                      }
                    />
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="featureDescription">
                        Feature description
                        <span className="required-star">*</span>
                      </label>
                      <span className="field-hint">What is changing?</span>
                    </div>
                    <textarea
                      id="featureDescription"
                      className="field-control"
                      placeholder="Describe the capability, the problem it addresses, and its intended outcome."
                      value={values.featureDescription}
                      onChange={(event) =>
                        updateField("featureDescription", event.target.value)
                      }
                      aria-invalid={Boolean(errors.featureDescription)}
                      aria-describedby={
                        errors.featureDescription
                          ? "featureDescription-error"
                          : undefined
                      }
                      required
                    />
                    {errors.featureDescription && (
                      <div
                        className="field-error"
                        id="featureDescription-error"
                      >
                        <AlertCircle size={12} />
                        {errors.featureDescription}
                      </div>
                    )}
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="targetUsers">
                        Target users <span className="optional">Optional</span>
                      </label>
                      <span className="field-hint">Who is this for?</span>
                    </div>
                    <input
                      id="targetUsers"
                      className="field-control"
                      type="text"
                      placeholder="e.g. Returning customers who check out on mobile"
                      value={values.targetUsers}
                      onChange={(event) =>
                        updateField("targetUsers", event.target.value)
                      }
                    />
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="prdText">
                        PRD content<span className="required-star">*</span>
                      </label>
                      <span className="field-hint">100–20,000 characters</span>
                    </div>
                    <textarea
                      id="prdText"
                      className="field-control prd-control"
                      placeholder="Paste the relevant PRD section here. Include scope, expected behavior, constraints, and any decisions already made."
                      value={values.prdText}
                      onChange={(event) =>
                        updateField("prdText", event.target.value)
                      }
                      aria-invalid={Boolean(errors.prdText)}
                      aria-describedby={`prdText-meta${errors.prdText ? " prdText-error" : ""}`}
                      required
                    />
                    <div className="prd-meta" id="prdText-meta">
                      <span>Character count</span>
                      <span className={prdCount > 20000 ? "count-warn" : ""}>
                        {prdCount.toLocaleString()} / 20,000
                      </span>
                    </div>
                    {errors.prdText && (
                      <div className="field-error" id="prdText-error">
                        <AlertCircle size={12} />
                        {errors.prdText}
                      </div>
                    )}
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="acceptanceCriteria">
                        Acceptance criteria{" "}
                        <span className="optional">Optional</span>
                      </label>
                      <span className="field-hint">One criterion per line</span>
                    </div>
                    <textarea
                      id="acceptanceCriteria"
                      className="field-control"
                      placeholder={
                        "e.g. A returning customer can select a saved card\nThe card number is never displayed in full"
                      }
                      value={values.acceptanceCriteria}
                      onChange={(event) =>
                        updateField("acceptanceCriteria", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <div className="privacy-note">
                    <ShieldCheck size={14} aria-hidden="true" /> Your spec is
                    checked using deterministic rules and is not stored at this
                    stage.
                  </div>
                  <div className="action-group">
                    <button
                      className="button secondary"
                      type="button"
                      onClick={clearForm}
                      disabled={isSubmitting}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Clear form
                    </button>
                    <button
                      className="button primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          Analyzing requirements
                          <span className="sr-only">, please wait</span>
                          <span className="button-dots" aria-hidden="true">
                            ···
                          </span>
                        </>
                      ) : (
                        <>
                          Analyze PRD{" "}
                          <ArrowRight size={15} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <aside className="side-rail" aria-label="Input guidance">
              <section className="rail-panel">
                <h2 className="rail-title">
                  <Check size={15} /> Before you continue
                </h2>
                <div className="checklist">
                  <div className="check-row">
                    <span className="check-icon">
                      <Check size={10} />
                    </span>
                    <span>
                      <strong>One feature at a time</strong>Keep this spec
                      focused on a single handoff.
                    </span>
                  </div>
                  <div className="check-row">
                    <span className="check-icon">
                      <Check size={10} />
                    </span>
                    <span>
                      <strong>Use concrete language</strong>Include behaviors
                      and constraints where known.
                    </span>
                  </div>
                  <div className="check-row">
                    <span className="check-icon">
                      <Check size={10} />
                    </span>
                    <span>
                      <strong>Keep the PRD relevant</strong>Paste the section
                      that defines this feature.
                    </span>
                  </div>
                </div>
              </section>

              <section className="rail-panel stage-panel">
                <h2 className="rail-title">
                  <Users size={15} /> A clean handoff starts here
                </h2>
                <p>
                  This checkpoint confirms the specification can move forward.
                  Rule-based findings help prepare for an engineering handoff;
                  AI review comes later.
                </p>
                <div className="stage-label">
                  Current stage · Rule-based analysis
                </div>
              </section>
            </aside>
          </div>

          {analysisFindings !== null && (
            <div style={{ marginTop: "24px" }}>
              <AnalysisResults
                findings={analysisFindings}
                summary={`The rule engine identified ${analysisFindings.length} potential review candidate${analysisFindings.length === 1 ? "" : "s"}. These findings require contextual review and are not confirmed defects.`}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PanelGlyph() {
  return (
    <span className="panel-glyph" aria-hidden="true">
      <FileCheck2 size={16} />
    </span>
  );
}

export default App;
