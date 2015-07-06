ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <PolicySetIdReference> element SHALL be used to reference a <PolicySet> element by id.
 * If <PolicySetIdReference> is a URL, then it MAY be resolvable to the <PolicySet> element.
 * However, the mechanism for resolving a policy set reference to the corresponding policy set is outside the scope
 * of this specification.
 *
 * Element <PolicySetIdReference> is of xacml:IdReferenceType complex type.
 *
 * @class PolicySetIdReference
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.PolicySetIdReference = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    // parse as a URL
    if(typeof config === "string"){
        /*
         @TODO PARSE URL OF POLICY SET?
         */
    } else {
        /**
         * Specifies a matching expression for the version of the policy set referenced.
         * @property version
         * @type String
         * @default ""
         */
        this.version = config.version;

        /**
         * Specifies a matching expression for the earliest acceptable version of the policy set referenced.
         * @property earliestVersion
         * @type String
         * @default ""
         */
        this.earliestVersion = config.earliestVersion || "";

        /**
         * Specifies a matching expression for the latest acceptable version of the policy set referenced.
         * @property latestVersion
         * @type String
         * @default ""
         */
        this.latestVersion = config.latestVersion || "";
    }


});
