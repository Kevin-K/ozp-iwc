ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AttributeAssignmentExpression> element is used for including arguments in obligations and advice.
 * It SHALL contain an AttributeId and an expression which SHALL by evaluated into the corresponding attribute value.
 * The value specified SHALL be understood by the PEP, but it is not further specified by XACML. See Section 7.18.
 * Section 4.2.4.3 provides a number of examples of arguments included in obligations.

 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AttributeAssignmentExpression = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     *The expression which evaluates to a constant attribute value or a bag of zero or more attribute values.
     * See section 5.25.
     *
     * @property expression
     * @type {ozpIwc.policyAuth.Expression}
     */
    this.expression = config.expression;

    /**
     * The attribute identifier. The value of the AttributeId attribute in the resulting <AttributeAssignment>
     * element MUST be equal to this value.
     * @property attributeId
     * @type {String}
     */
    this.attributeId = config.attributeId;

    /**
     * An optional category of the attribute. If this attribute is missing, the attribute has no category.
     * The value of the Category attribute in the resulting <AttributeAssignment> element MUST be equal to this value.
     * @property category
     * @type {String}
     */
    this.category = config.category;

    /**
     * An optional issuer of the attribute. If this attribute is missing, the attribute has no issuer. The value of the
     * Issuer attribute in the resulting <AttributeAssignment> element MUST be equal to this value.
     * @property issuer
     * @type {String}
     */
    this.issuer = config.issuer;
});