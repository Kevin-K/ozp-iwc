ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Apply> element denotes application of a function to its arguments, thus encoding a function call.
 * The <Apply> element can be applied to any combination of the members of the <Expression> element substitution group.
 * See Section 5.25.
 *
 * The <Apply> element is of ApplyType complex type.
 *
 * @class Apply
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Apply = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The identifier of the function to be applied to the arguments.
     * XACML-defined functions are described in Appendix A.3.
     *
     * @property functionId
     * @type {String}
     * @default null
     */
    this.functionId = config.functionId;

    /**
     * A free-form description of the <Apply> element.
     * @property description
     * @type {String}
     * @default ""
     */
    this.description = config.description || "";

    /**
     * Arguments to the function, which may include other functions.
     * @property expression
     * @type {ozpIwc.policyAuth.Expression}
     * @default null
     */
    this.expression = config.expression;
});