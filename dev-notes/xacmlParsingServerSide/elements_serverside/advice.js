ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Advice> element SHALL contain an identifier for the advice and a set of attributes that form
 * arguments of the supplemental information defined by the advice.
 *
 * The <Advice> element is of AdviceType complexType.
 * See Section 7.18 for a description of how the set of advice to be returned by the PDP is determined.
 *
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Advice = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * Advice identifier.  The value of the advice identifier MAY be interpreted by the PEP.
     * @property adviceId
     * @type String
     * @default null
     */
    this.adviceId = config.adviceId;

    /**
     * Advice arguments assignment.  The values of the advice arguments MAY be interpreted by the PEP.
     * @property attributeAssignment
     * @type {ozpIwc.policyAuth.AttributeAssignment}
     * @defualt null
     */
    this.attributeAssignment = config.attributeAssignment;
});