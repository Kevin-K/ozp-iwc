ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * 3.3.2 Policy
 * Rules are not exchanged amongst system entities. Therefore, a PAP combines rules in a policy.
 *
 * The <Policy> element is of PolicyType complex type.
 *
 * @class Policy
 * @namespace ozpIwc.policyAuth
 *
 *
 * @param {Object} config
 * @param {Object} config.target
 * @param {Function} config.ruleCombining
 * @param {Array<ozpIwc.policyAuth.Rules>} config.rules
 * @param {Array<Function>} config.obligations
 * @param {Array<Function>} config.advices
 * @constructor
 */
ozpIwc.policyAuth.Policy = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    config=config || {};

    /**
     * @property policyId
     * @type String
     * @default null
     */
    this.policyId = config.policyId;

    /**
     * @property version
     * @type Number
     * @default null
     */
    this.version = config.version;

    /**
     * @property ruleCombiningAlgId
     * @type String
     * @default null
     */
    this.ruleCombiningAlgId = config.ruleCombiningAlgId;

    /**
     * @property target
     * @type Object
     * @default {}
     */
    this.target = config.target || {};

    /**
     * Specifies the procedure by which the results of evaluating the component rules are combined when
     * evaluating the policy
     *
     * @property ruleCombining
     * @type Function
     * @default null
     */
    this.ruleCombining = config.ruleCombining || null;

    /**
     * An array of {{#crossLink "ozpIwc.policyAuth.Rule"}}{{/crossLink}}
     * @property rules
     * @type Array<ozpIwc.policyAuth.Rule>
     * @default []
     */
    this.rule = config.rule || [];

    /**
     * An array of Obligations expressions to be evaluated and returned to the PEP in the response context.
     *
     * @property obligations
     * @type Array<Function>
     * @default []
     */
    this.obligations = config.obligations || [];

    /**
     * An array of Advice expressions to be evaluated and returned to the PEP in the response context. Advices can be
     * ignored by the PEP.
     *
     * @property advices
     * @type Array<Function>
     * @default []
     */
    this.advices = config.advices || [];

    if(config.element){
        this.construct(config.element);
    }

});

/**
 * @property evaluate
 * @param request
 */
ozpIwc.policyAuth.Policy.prototype.evaluate = function(request){
    if(this.target.isTargeted(request)){
        return ozpIwc.policyAuth.RuleCombining[this.ruleCombiningAlgId](this.rule,request);
    } else {
        return "Deny";
    }
};


ozpIwc.policyAuth.Policy.prototype.requiredAttributes = ['PolicyId', 'Version', 'RuleCombiningAlgId'];
ozpIwc.policyAuth.Policy.prototype.requiredNodes = ['Target'];
ozpIwc.policyAuth.Policy.prototype.optionalNodes = ['Description','PolicyIssuer','PolicyDefaults','CombinerParameters','RuleCombinerParameters',
    'VariableDefinition','Rule','ObligationExpressions','AdviceExpressions'];