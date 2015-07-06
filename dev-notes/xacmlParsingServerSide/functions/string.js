ozpIwc = ozpIwc || {};
ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * A collection of functions for the XACML policy decision process.
 * @class Functions
 * @namespace ozpIwc.policyAuth
 * @type {{}|*|ozpIwc.policyAuth.Functions}
 */
ozpIwc.policyAuth.Functions = ozpIwc.policyAuth.Functions || {};

/**
 *
 * @property urn:oasis:names:tc:xacml:3.0:function:string-from-anyURI
 * @param {String} valA
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:3.0:function:string-from-anyURI'] = function(valA){
    return valA;
};