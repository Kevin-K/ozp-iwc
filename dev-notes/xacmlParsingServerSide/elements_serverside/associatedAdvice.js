ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AssociatedAdvice> element SHALL contain a set of <Advice> elements.
 *
 * The <AssociatedAdvice> element is of AssociatedAdviceType complexType.
 *
 * @class AssociatedAdvice
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AssociatedAdvice = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    /**
     * A sequence of advice.  See Section 5.35.
     * @property advice
     * @type {Array<ozpIwc.policyAuth.Advice>}
     * @default null
     */
    this.advice = config.advice
});
