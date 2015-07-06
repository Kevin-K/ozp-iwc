ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AdviceExpression> element evaluates to an advice and SHALL contain an identifier for an advice and a set of
 * expressions that form arguments of the supplemental information defined by the advice.  The AppliesTo attribute
 * SHALL indicate the effect for which this advice must be provided to the PEP.
 *
 * The <AdviceExpression> element is of AdviceExpressionType complexType.
 * See Section 7.18 for a description of how the set of advice to be returned by the PDP is determined.
 *
 * @class AdviceExpression
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AdviceExpression = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * Advice identifier. The value of the advice identifier MAY be interpreted by the PEP.
     * @property adviceId
     * @type {String}
     * @default null
     */
    this.adviceId = config.adviceId;

    /**
     * The effect for which this advice must be provided to the PEP.
     * @property appliesTo
     * @type{ozpIwc.policyAuth.Effect}
     */
    this.appliesTo = config.appliesTo;

    /**
     * Advice arguments in the form of expressions. The expressions SHALL be evaluated by the PDP to constant
     * <AttributeValue> elements or bags, which shall be the attribute assignments in the <Advice> returned to the
     * PEP.  If an <AttributeAssignmentExpression> evaluates to an atomic attribute value, then there MUST be one
     * resulting <AttributeAssignment> which MUST contain this single attribute value. If the
     * <AttributeAssignmentExpression> evaluates to a bag, then there MUST be a resulting <AttributeAssignment> for
     * each of the values in the bag. If the bag is empty, there shall be no <AttributeAssignment> from this
     * <AttributeAssignmentExpression>.  The values of the advice arguments MAY be interpreted by the PEP.
     *
     * Optional
     *
     * @property attributeAssignmentExpression
     * @type {ozpIwc.policyAuth.AttributeAssignmentExpression}
     */
    this.attributeAssignmentExpression = config.attributeAssignmentExpression;
});