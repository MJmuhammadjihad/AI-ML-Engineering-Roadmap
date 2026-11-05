/* First Principles Atlas — criterion-based assessment reducer, edition 3.
 * Browser: AtlasAssessment.evaluateAssessment(definition, attempt, policy?).
 * Node: require('./assessment.js').evaluateAssessment.
 *
 * definition: {id,skillId,referenceSheetAllowed:boolean,criteria:[{
 *   id,description,required:boolean,critical:boolean,repairTaskId
 * }]}
 * attempt: {assessmentId,assistance:'none'|'reference_sheet'|'hint'|'solution',
 *   results:[{criterionId,level:0|1|2,verification:'self_report'|'automated'|'human'}]}
 * policy?: {acceptedVerification:['self_report','automated','human']}
 *
 * This evaluates supplied records; it does not execute learner code or verify
 * authorship. A level-2 response revealed through a hint or solution remains
 * practice. All REQUIRED criteria must pass; critical failure cannot be averaged
 * away. A missing response is different from an observed mistake. Historical
 * demonstration should not be erased by an incomplete later attempt: the caller
 * owns longitudinal evidence reduction, separate from this one-attempt result.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AtlasAssessment = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function evaluateAssessment(definition, attempt, policy = {}) {
    const require = (condition, message) => { if (!condition) throw new TypeError(message); };
    const stableId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value);
    const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const verificationKinds = ['self_report', 'automated', 'human'];
    require(isRecord(definition) && isRecord(attempt) && isRecord(policy), 'Assessment, attempt, and policy must be objects');
    require(stableId(definition.id) && stableId(definition.skillId), 'Assessment and skill need stable IDs');
    require(attempt.assessmentId === definition.id, 'Attempt does not match this assessment');
    require(typeof definition.referenceSheetAllowed === 'boolean', 'State whether a reference sheet is allowed');
    require(Array.isArray(definition.criteria) && definition.criteria.length > 0, 'Provide assessment criteria');
    const criteria = new Map();
    for (const criterion of definition.criteria) {
      require(isRecord(criterion) && stableId(criterion.id), 'Each criterion needs a stable ID');
      require(!criteria.has(criterion.id), 'Duplicate criterion ID: ' + criterion.id);
      require(typeof criterion.required === 'boolean' && typeof criterion.critical === 'boolean', 'State criterion requirement and criticality');
      require(!criterion.critical || criterion.required, 'Critical criteria must be required');
      require(typeof criterion.description === 'string' && criterion.description.trim(), 'Criteria need observable descriptions');
      require(stableId(criterion.repairTaskId), 'Each criterion needs a repair task');
      criteria.set(criterion.id, {...criterion});
    }
    require([...criteria.values()].some(c => c.required), 'At least one criterion must be required');
    require(['none', 'reference_sheet', 'hint', 'solution'].includes(attempt.assistance), 'State assistance used in this attempt');
    require(Array.isArray(attempt.results), 'Attempt results must be an array');
    const acceptedVerification = policy.acceptedVerification === undefined ? verificationKinds.slice() : policy.acceptedVerification;
    require(Array.isArray(acceptedVerification) && acceptedVerification.length > 0, 'Accepted verification must be a nonempty array');
    require(acceptedVerification.every(v => verificationKinds.includes(v)), 'Unknown verification policy');
    require(new Set(acceptedVerification).size === acceptedVerification.length, 'Duplicate verification policy');
    const results = new Map();
    for (const item of attempt.results) {
      require(isRecord(item) && stableId(item.criterionId), 'Result needs a criterion ID');
      require(criteria.has(item.criterionId), 'Unknown criterion: ' + item.criterionId);
      require(!results.has(item.criterionId), 'Duplicate result: ' + item.criterionId);
      require(Number.isInteger(item.level) && item.level >= 0 && item.level <= 2, 'Criterion levels must be 0, 1, or 2');
      require(verificationKinds.includes(item.verification), 'Record each result\'s verification source');
      results.set(item.criterionId, {criterionId: item.criterionId, level: item.level, verification: item.verification});
    }
    const required = [...criteria.values()].filter(c => c.required);
    const missingCriterionIds = required.filter(c => !results.has(c.id)).map(c => c.id);
    const unmet = required.filter(c => results.has(c.id) && results.get(c.id).level < 2);
    const verificationNeededIds = required.filter(c => results.has(c.id) && !acceptedVerification.includes(results.get(c.id).verification)).map(c => c.id);
    const independent = attempt.assistance === 'none' || (attempt.assistance === 'reference_sheet' && definition.referenceSheetAllowed);
    let status;
    if (unmet.length > 0) status = 'repair_recommended';
    else if (missingCriterionIds.length > 0) status = 'incomplete';
    else if (!independent) status = 'practice_recorded';
    else if (verificationNeededIds.length > 0) status = 'verification_needed';
    else status = 'demonstrated';
    const nextAction = status === 'demonstrated' ? 'schedule_delayed_review'
      : status === 'repair_recommended' ? 'open_targeted_repair'
      : status === 'incomplete' ? 'collect_missing_evidence'
      : status === 'practice_recorded' ? 'attempt_fresh_transfer_task'
      : 'obtain_required_verification';
    const verificationSources = [...new Set(required.filter(c => results.has(c.id)).map(c => results.get(c.id).verification))].sort();
    return {
      assessmentId: definition.id, skillId: definition.skillId,
      status, independent, assistance: attempt.assistance,
      evidenceEligible: status === 'demonstrated',
      requiredCriterionCount: required.length,
      independentlyMetRequiredCount: independent
        ? required.filter(c => results.has(c.id) && results.get(c.id).level === 2 && acceptedVerification.includes(results.get(c.id).verification)).length : 0,
      missingCriterionIds, verificationNeededIds,
      criticalUnmetIds: unmet.filter(c => c.critical).map(c => c.id),
      repairRoutes: unmet.map(c => ({criterionId: c.id, taskId: c.repairTaskId, observedLevel: results.get(c.id).level})),
      criterionResults: [...criteria.keys()].filter(key => results.has(key)).map(key => ({...results.get(key)})),
      verificationSummary: {
        verification: verificationSources.length === 0 ? null : verificationSources.length === 1 ? verificationSources[0] : 'mixed',
        verificationSources
      },
      nextAction,
      explanation: 'Result evaluated from supplied evidence. Provenance is preserved; this function does not verify learner work.'
    };
  }
  return Object.freeze({evaluateAssessment});
});
