ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Attribute> element is the central abstraction of the request context.  It contains attribute meta-data and
 * one or more attribute values.  The attribute meta-data comprises the attribute identifier and the attribute issuer.
 * AttributeDesignator> elements in the policy MAY refer to attributes by means of this meta-data.
 *
 * @class Attribute
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Attribute = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The Attribute identifier.  A number of identifiers are reserved by XACML to denote commonly used attributes.
     * See Appendix Appendix B.
     * @property attributeId
     *
     * @type {String}
     */
    this.attributeId = config.attributeId;

    /**
     * Optional. The Attribute issuer.  For example, this attribute value MAY be an x500Name that binds to a public
     * key, or it may be some other identifier exchanged out-of-band by issuing and relying parties.
     *
     * @property issuer
     * @type {String}
     */
    this.issuer = config.issuer;

    /**
     * Whether to include this attribute in the result. This is useful to correlate requests with their
     * responses in case of multiple requests.
     *
     * @property includeInResult
     * @type {Boolean}
     * @default false
     */
    this.includeInResult = config.includeInResult || false;

    /**
     * One or more attribute values.  Each attribute value MAY have contents that are empty,
     * occur once or occur multiple times.
     *
     * @property attributeValue
     * @type {Array<ozpIwc.policyAuth.AttributeValue>}
     */
    this.attributeValue = config.attributeValue || [];

});