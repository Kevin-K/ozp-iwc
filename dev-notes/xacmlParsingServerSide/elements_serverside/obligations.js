ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Obligations> element SHALL contain a set of <Obligation> elements.
 *
 * The <Obligations> element is of ObligationsType complexType.
 *
 * @class Obligations
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Obligations = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    /**
     * A sequence of obligations.  See Section 5.34.
     * @property obligations
     * @type {Array<ozpIwc.policyAuth.Obligation>}
     * @default null
     */
    this.obligations = config.obligations
});
