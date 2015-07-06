ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Condition> element is a Boolean function over attributes or functions of attributes.
 * @class Condition
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Condition = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The <Condition> contains one <Expression> element, with the restriction that the <Expression> return data-type
     * MUST be “http://www.w3.org/2001/XMLSchema#boolean”.
     * Evaluation of the <Condition> element is described in Section 7.9.
     *
     * @property expression
     * @type {ozpIwc.policyAuth.Expression}
     * @default null
     */
    this.expression = config.expression;
});