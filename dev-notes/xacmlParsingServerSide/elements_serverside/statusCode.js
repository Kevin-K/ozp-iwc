ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <StatusCode> element contains a major status code value and an optional sequence of minor status codes.
 *
 * The <StatusCode> element is of StatusCodeType complex type.
 *
 * @class StatusCode
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.StatusCode = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * See Section B.8 for a list of values.
     * @property value
     * @type {ozpIwc.policyAuth.StatusCode}
     */
    this.value = config.statusCode;

    /**
     * Minor status code.  This status code qualifies its parent status code.
     * @property statusCode
     * @type {ozpIwc.policyAuth.StatusCode}
     */
    this.statusCode = config.statusCode;

});