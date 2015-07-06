ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <ObligationExpressions> element SHALL contain a set of <ObligationExpression> elements.
 *
 * The <ObligationExpressions> element is of ObligationExpressionsType complexType.
 *
 * @class ObligationExpressions
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.ObligationExpressions = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * A sequence of obligation expressions.  See Section 5.39.
     * @property obligationExpressions
     * @type {Array<ozpIwc.policyAuth.ObligationExpression>}
     * @defualt null
     */
    this.obligationExpressions = config.obligationExpressions;

});