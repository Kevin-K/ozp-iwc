ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};


/**
 * 3.3.1 Rule
 * A rule is the most elementary unit of policy.  It may exist in isolation only within one of the major actors of
 * the XACML domain.  In order to exchange rules between major actors, they must be encapsulated in a policy.
 * A rule can be evaluated on the basis of its contents.  The main components of a rule are:
 *
 * The <Rule> element is of RuleType complex type.
 *
 * @class Rule
 * @namespace ozpIwc.policyAuth
 *
 * @param {Object} config
 * @param {Object} config.target
 * @param {String} config.effect
 * @param {Array<Function>} config.obligations
 * @param {Array<Function>} config.advices
 *
 * @constructor
 */
ozpIwc.policyAuth.Rule = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    config=config || {};

    /**
     * A string identifying this rule.
     * @property ruleId
     * @type String
     * @default null
     */
    this.ruleId = config.ruleId;

    /**
     * @property target
     * @type Object
     * @default {}
     */
    this.target = config.target || null ;

    /**
     * The rule-writer's intended consequence of a "True" evaluation for the rule.
     * Two values are allowed: "Permit" and "Deny".
     * @property effect
     * @type String
     * @default "Permit"
     */
    this.setEffect(config.effect);

    /**
     * A Boolean expression that refines the applicability of the rule beyond the predicates implied by its target.
     * Therefore, it may be absent.
     *
     * @property condition
     * @type Function
     * @default null
     */
    this.condition = config.condition || null;

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
        this.setEffect(this.effect);
    }
});

ozpIwc.policyAuth.Rule.prototype.requiredAttributes = ['RuleId', 'Effect'];
ozpIwc.policyAuth.Rule.prototype.optionalNodes = ['Description','Target','Condition','ObligationExpressions','AdviceExpressions'];

/**
 * 3.3.1.2 Effect
 * The effect of the rule indicates the rule-writer's intended consequence of a "True" evaluation for the rule.
 * Two values are allowed: "Permit" and "Deny".
 *
 * @method setEffect
 * @param {String} effect
 */
ozpIwc.policyAuth.Rule.prototype.setEffect = function(effect){
    switch(effect){
        case "Permit":
            this.effect = effect;
            break;
        case "Deny":
            this.effect = effect;
            break;
        default:
            this.effect = "Permit";
    }
};


ozpIwc.policyAuth.Rule.prototype.evaluate = function(request){

    if(this.target.isTargeted(request)) {
        return this.effect;
    } else {
        return (this.effect === "Permit") ? "Deny" : "Permit";
    }
};

