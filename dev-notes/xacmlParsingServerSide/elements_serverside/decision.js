ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Decision> element contains the result of policy evaluation.
 *
 * The <Decision> element is of DecisionType simple type.
 *
 * @class Decision
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Decision = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The values of the <Decision> element have the following meanings:
     * “Permit”: the requested access is permitted.
     * “Deny”: the requested access is denied.
     * “Indeterminate”: the PDP is unable to evaluate the requested access.  Reasons for such inability include:
     *      missing attributes, network errors while retrieving policies, division by zero during policy evaluation,
     *      syntax errors in the decision request or in the policy, etc.
     * “NotApplicable”: the PDP does not have any policy that applies to this decision request.
     *
     * @property decision
     * @type {String}
     */
    this.decision = config.decision;
});