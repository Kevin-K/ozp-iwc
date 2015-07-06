ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Status> element represents the status of the authorization decision result.
 *
 * The <Status> element is of StatusType complex type.
 *
 * @class Status
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Status = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * Status Code
     * @property statusCode
     * @type {ozpIwc.policyAuth.StatusCode}
     */
    this.statusCode = config.statusCode;

    /**
     * A status message describing the status code.
     * @property statusMessage
     * @type {ozpIwc.policyAuth.StatusMessage}
     */
    this.statusMessage = config.statusMessage;

    /**
     * Additional status information.
     * @property statusDetail
     * @type {ozpIwc.policyAuth.StatusDetail}
     */
    this.statusDetail = config.statusDetail;

});