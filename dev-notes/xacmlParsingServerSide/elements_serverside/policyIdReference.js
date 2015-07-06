ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <PolicyIdReference> element SHALL be used to reference a <Policy> element by id.  If <PolicyIdReference>
 * is a URL, then it MAY be resolvable to the <Policy> element.  However, the mechanism for resolving a policy
 * reference to the corresponding policy is outside the scope of this specification.
 *
 * Element <PolicyIdReference> is of xacml:IdReferenceType complex type (see Section 5.10) .
 *
 * @class PolicyIdReference
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.PolicyIdReference = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    // parse as a URL
    // @TODO validate the URL
    if(typeof config === "string"){
        /*
        @TODO PARSE URL OF POLICY SET?
         */
    } else {
     /*
       @TODO Throw error that the reference wasn't a valid URL?
      */
    }
});
