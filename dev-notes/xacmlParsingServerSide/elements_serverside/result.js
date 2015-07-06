ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Result> element represents an authorization decision result.  It MAY include a set of obligations that MUST be
 * fulfilled by the PEP.  If the PEP does not understand or cannot fulfill an obligation, then the action of the PEP is
 * determined by its bias, see section 7.1. It MAY include a set of advice with supplemental information which
 * MAY be safely ignored by the PEP.
 *
 * The <Result> element is of ResultType complex type.
 *
 * @class Result
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Result = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The authorization decision: “Permit”, “Deny”, “Indeterminate” or “NotApplicable”.
     *
     * @property decision
     * @type {ozpIwc.policyAuth.Decision}
     */
    this.decision = config.decision;

    /**
     * Indicates whether errors occurred during evaluation of the decision request, and optionally, information about
     * those errors.  If the <Response> element contains <Result> elements whose <Status> elements are all identical,
     * and the <Response> element is contained in a protocol wrapper that can convey status information, then the
     * common status information MAY be placed in the protocol wrapper and this <Status> element MAY be
     * omitted from all <Result> elements.
     *
     * @property status
     * @type {ozpIwc.policyAuth.Status}
     */
    this.status = config.status;

    /**
     * A list of obligations that MUST be fulfilled by the PEP.  If the PEP does not understand or cannot fulfill an
     * obligation, then the action of the PEP is determined by its bias, see section 7.2.  See Section 7.18 for a
     * description of how the set of obligations to be returned by the PDP is determined.
     *
     * @property obligations
     * @type {ozpIwc.policyAuth.Obligations}
     */
    this.obligations = config.obligations;

    /**
     * A list of advice that provide supplemental information to the PEP.  If the PEP does not understand an advice,
     * the PEP may safely ignore the advice. See Section 7.18 for a description of how the set of advice to be
     * returned by the PDP is determined.
     *
     * @property associatedAdvice
     * @type {ozpIwc.policyAuth.AssociatedAdvice}
     */
    this.associatedAdvice = config.associatedAdvice;

    /**
     * A list of attributes that were part of the request. The choice of which attributes are included here is
     * made with the IncludeInResult attribute of the <Attribute> elements of the request. See section 5.46.
     *
     * @property attributes
     * @type {ozpIwc.policyAuth.Attributes}
     */
    this.attributes = config.attributes;

    /**
     * If the ReturnPolicyIdList attribute in the <Request> is true (see section 5.42), a PDP that implements this
     * optional feature MUST return a list of all policies which were found to be fully applicable. That is, all
     * policies where both the <Target> matched and the <Condition> evaluated to true, whether or not the <Effect>
     * was the same or different from the <Decision>.
     *
     * @property policyIdentifierList
     * @type {ozpIwc.policyAuth.policyIdentiferList}
     */
    this.policyIdentifierList = config.policyIdentifierList;

});
