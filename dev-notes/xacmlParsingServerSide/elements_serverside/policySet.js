ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * A collection of {{#crossLink "ozpIwc.policyAuth.Policy"}}{{/crossLink}}.
 *
 * The <PolicySet> element is of PolicySetType complex type.
 *
 * @class PolicySet
 * @namespace ozpIwc.policyAuth
 *
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.PolicySet = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
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
     * @property policyCombiningAlgId
     * @type String
     * @default null
     */
    this.policyCombiningAlgId = config.policyCombiningAlgId;

    /**
     * @property target
     * @type Object
     * @default {}
     */
    this.target = config.target || {};

    /**
     * Specifies the procedure by which the results of evaluating the component policies are combined when
     * evaluating the policy
     *
     * @property ruleCombining
     * @type Function
     * @default null
     */
    this.policyCombining = config.policyCombining || null;

    /**
     * An array of {{#crossLink "ozpIwc.policyAuth.Policy"}}{{/crossLink}}
     * @property policies
     * @type Array<ozpIwc.policyAuth.Policy>
     * @default []
     */
    this.policies = config.policies || [];

    /**
     * An array of {{#crossLink "ozpIwc.policyAuth.PolicySet"}}{{/crossLink}}
     * @property policySets
     * @type Array<ozpIwc.policyAuth.PolicySet>
     * @default []
     */
    this.policySets = config.policySets || [];

    /**
     * An array of references to policies that MUST be included in this policy set.  If the <PolicyIdReference>
     * is a URL, then it MAY be resolvable.
     * @property policyIdReference
     * @type Array<String>
     * @default
     */
    this.policyIdReference = config.policyIdReference || [];

    /**
     * An array of references to policy sets that MUST be included in this policy set.  If the <PolicyIdReference>
     * is a URL, then it MAY be resolvable.
     * @property policySetIdReference
     * @type Array<ozpIwc.policyAuth.PolicySet>
     * @default []
     */
    this.policySetIdReference = config.policySetIdReference || [];
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
});