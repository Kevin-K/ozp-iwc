ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <VariableDefinition> element SHALL be used to define a value that can be referenced by a <VariableReference>
 * element.  The name supplied for its VariableId attribute SHALL NOT occur in the VariableId attribute of any other
 *<VariableDefinition> element within the encompassing policy.  The <VariableDefinition> element MAY contain undefined
 * VariableReference> elements, but if it does, a corresponding <VariableDefinition> element MUST be defined later in
 * the encompassing policy.  <VariableDefinition> elements MAY be grouped together or MAY be placed close to the
 * reference in the encompassing policy.  There MAY be zero or more references to each <VariableDefinition> element.
 *
 * The <VariableDefinition> element is of VariableDefinitionType complex type.
 *
 * @class VariableDefinition
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.VariableDefinition = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * @property expression
     * @type {ozpIwc.policyAuth.Expression}
     * @default null
     */
    this.expression = config.expression;

    /**
     * The name of the variable definition.
     * @property variableId
     * @type {String}
     */
    this.variableId = config.variableId;
});

/**
 * The <Expression> element is not used directly in a policy.  The <Expression> element signifies that an element that
 * extends the ExpressionType and is a member of the <Expression> element substitution group SHALL appear in its place.
 *
 * The following elements are in the <Expression> element substitution group:
 * <Apply>, <AttributeSelector>, <AttributeValue>, <Function>, <VariableReference> and <AttributeDesignator>.
 *
 * @class Expression
 * @namesapce ozpIwc.policyAuth
 */
