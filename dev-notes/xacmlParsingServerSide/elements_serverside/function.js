ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Function> element SHALL be used to name a function as an argument to the function defined by
 * the parent <Apply> element.
 *
 * The <Function> element is of FunctionType complex type.
 *
 * @class Function
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Function = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The identifier of the function.
     * @property functionId
     * @type {String}
     * @defualt null
     */
    this.functionId = config.functionId;
});