ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AdviceExpressions> element SHALL contain a set of <AdviceExpression> elements.
 *
 * The <AdviceExpressions> element is of AdviceExpressionsType complexType.
 *
 * @class AdviceExpressions
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AdviceExpressions = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * A sequence of advice expressions.  See Section 5.40.
     * @property adviceExpressions
     * @type {Array<ozpIwc.policyAuth.AdviceExpression>}
     */
    this.adviceExpressions = config.adviceExpressions;

});