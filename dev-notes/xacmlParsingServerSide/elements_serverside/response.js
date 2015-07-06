ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Response> element is an abstraction layer used by the policy language.
 * Any proprietary system using the XACML specification MUST transform an XACML context <Response> element into the
 * form of its authorization decision.
 *
 * The <Response> element encapsulates the authorization decision produced by the PDP.  It includes a sequence of
 * one or more results, with one <Result> element per requested resource.  Multiple results MAY be returned by
 * some implementations, in particular those that support the XACML Profile for Requests for Multiple Resources
 * [Multi].  Support for multiple results is OPTIONAL.
 *
 * The <Response> element is of ResponseType complex type.
 *
 *
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Response = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * An authorization decision result.  See Section 5.48.
     *
     * @property result
     * @type {Array<ozpIwc.policyAuth.Result>}
     */
    this.result = config.result;
});