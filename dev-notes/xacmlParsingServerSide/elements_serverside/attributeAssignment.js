ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AttributeAssignment> element is used for including arguments in obligation and advice expressions.
 * It SHALL contain an AttributeId and the corresponding attribute value, by extending the
 * AttributeValueType type definition.  The <AttributeAssignment> element MAY be used in any way that is consistent
 * with the schema syntax, which is a sequence of <xs:any> elements. The value specified SHALL be understood by
 * the PEP, but it is not further specified by XACML. See Section 7.18.  Section 4.2.4.3 provides a number of
 * examples of arguments included in obligation.expressions.
 *
 * The <AttributeAssignment> element is of AttributeAssignmentType complex type.
 *
 * @class AttributeAssignment
 * @namespace ozpIwc.policyAuth
 * @param {Object} config
 * @constructor
 */
ozpIwc.policyAuth.AttributeAssignment = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The attribute Identifier.
     *
     * @property attributeId
     * @type {String}
     * @default null
     */
    this.attributeId = config.attributeId;

    /**
     * An optional category of the attribute. If this attribute is missing, the attribute has no category. The PEP
     * SHALL interpret the significance and meaning of any Category attribute. Non-normative note: an expected use of
     * the category is to disambiguate attributes which are relayed from the request.
     *
     * @property category
     * @type {String}
     * @default null
     */
    this.category = config.category;

    /**
     * An optional issuer of the attribute. If this attribute is missing, the attribute has no issuer. The PEP SHALL
     * interpret the significance and meaning of any Issuer attribute. Non-normative note: an expected use of the
     * issuer is to disambiguate attributes which are relayed from the request.
     *
     * @property issuer
     * @type {String}
     * @default null
     */
    this.issuer = config.issuer;
});
