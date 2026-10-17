                      className="field-control"
                      placeholder="Describe the capability, the problem it addresses, and its intended outcome."
                      value={values.featureDescription}
                      onChange={(event) => updateField('featureDescription', event.target.value)}
                      aria-invalid={Boolean(errors.featureDescription)}
                      aria-describedby={errors.featureDescription ? 'featureDescription-error' : undefined}
                      required
                    />
                    {errors.featureDescription && <div className="field-error" id="featureDescription-error"><AlertCircle size={12} />{errors.featureDescription}</div>}
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="targetUsers">Target users <span className="optional">Optional</span></label>
                      <span className="field-hint">Who is this for?</span>
                    </div>
                    <input
                      id="targetUsers"
                      className="field-control"
                      type="text"
                      placeholder="e.g. Returning customers who check out on mobile"
                      value={values.targetUsers}
                      onChange={(event) => updateField('targetUsers', event.target.value)}
                    />
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="prdText">PRD content<span className="required-star">*</span></label>
                      <span className="field-hint">100–20,000 characters</span>
                    </div>
                    <textarea
                      id="prdText"
                      className="field-control prd-control"
                      placeholder="Paste the relevant PRD section here. Include scope, expected behavior, constraints, and any decisions already made."
                      value={values.prdText}
                      onChange={(event) => updateField('prdText', event.target.value)}
                      aria-invalid={Boolean(errors.prdText)}
                      aria-describedby={`prdText-meta${errors.prdText ? ' prdText-error' : ''}`}
                      required
                    />
                    <div className="prd-meta" id="prdText-meta">
                      <span>Character count</span>
                      <span className={prdCount > 20000 ? 'count-warn' : ''}>{prdCount.toLocaleString()} / 20,000</span>
                    </div>
                    {errors.prdText && <div className="field-error" id="prdText-error"><AlertCircle size={12} />{errors.prdText}</div>}
                  </div>

                  <div className="field full">
                    <div className="field-label-row">
                      <label htmlFor="acceptanceCriteria">Acceptance criteria <span className="optional">Optional</span></label>
                      <span className="field-hint">One criterion per line</span>
                    </div>
                    <textarea
                      id="acceptanceCriteria"
                      className="field-control"
                      placeholder={'e.g. A returning customer can select a saved card\nThe card number is never displayed in full'}
                      value={values.acceptanceCriteria}
                      onChange={(event) => updateField('acceptanceCriteria', event.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <div className="privacy-note"><ShieldCheck size={14} aria-hidden="true" /> Your spec is checked using deterministic rules and is not stored at this stage.</div>
                  <div className="action-group">
                    <button className="button secondary" type="button" onClick={clearForm} disabled={isSubmitting}>
                      <RotateCcw size={14} aria-hidden="true" /> Clear form
                    </button>
                    <button className="button primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>Analyzing requirements<span className="sr-only">, please wait</span><span className="button-dots" aria-hidden="true">···</span></>
                      ) : (
                        <>Analyze PRD <ArrowRight size={15} aria-hidden="true" /></>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <aside className="side-rail" aria-label="Input guidance">
              <section className="rail-panel">
                <h2 className="rail-title"><Check size={15} /> Before you continue</h2>
                <div className="checklist">
                  <div className="check-row">
                    <span className="check-icon"><Check size={10} /></span>
                    <span><strong>One feature at a time</strong>Keep this spec focused on a single handoff.</span>
                  </div>
                  <div className="check-row">
                    <span className="check-icon"><Check size={10} /></span>
                    <span><strong>Use concrete language</strong>Include behaviors and constraints where known.</span>
                  </div>
                  <div className="check-row">
                    <span className="check-icon"><Check size={10} /></span>
                    <span><strong>Keep the PRD relevant</strong>Paste the section that defines this feature.</span>
                  </div>
                </div>
              </section>

              <section className="rail-panel stage-panel">
                <h2 className="rail-title"><Users size={15} /> A clean handoff starts here</h2>
                <p>This checkpoint confirms the specification can move forward. Rule-based findings help prepare for an engineering handoff; AI review comes later.</p>
                <div className="stage-label">Current stage · Rule-based analysis</div>
              </section>
            </aside>
          </div>

          {analysisFindings !== null && (
            <div style={{ marginTop: '24px' }}>
              <AnalysisResults
                findings={analysisFindings}
                summary={`The rule engine identified ${analysisFindings.length} potential review candidate${analysisFindings.length === 1 ? '' : 's'}. These findings require contextual review and are not confirmed defects.`}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PanelGlyph() {
  return <span className="panel-glyph" aria-hidden="true"><FileCheck2 size={16} /></span>;
}

export default App;
