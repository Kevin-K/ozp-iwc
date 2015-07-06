ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Obligation> element SHALL contain an identifier for the obligation and a set of attributes that form
 * arguments of the action defined by the obligation.
 *
 * The <Obligation> element is of ObligationType complexType.  See Section 7.18 for a description of how the set of
 * obligations to be returned by the PDP is determined.
 *
 * @class Obligation
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Obligation = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    /**
     * Obligation identifier.  The value of the obligation identifier SHALL be interpreted by the PEP.
     * @property obligationId
     * @type {String}
     * @default null
     */
    this.obligationId = config.obligationId;

    /**
     * Obligation arguments assignment.  The values of the obligation arguments SHALL be interpreted by the PEP.
     * (Optional)
     * @property attributeAssignment
     * @type {ozpIwc.policyAuth.AttributeAssignment}
     */
    this.attributeAssignment = config.attributeAssignment;
});
