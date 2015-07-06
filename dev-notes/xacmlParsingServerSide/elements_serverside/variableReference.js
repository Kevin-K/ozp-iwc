ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <VariableReference> element is used to reference a value defined within the same encompassing <Policy> element.
 * The <VariableReference> element SHALL refer to the <VariableDefinition> element by identifier equality on the value
 * of their respective VariableId attributes.  One and only one <VariableDefinition> MUST exist within the same
 * encompassing <Policy> element to which the <VariableReference> refers.  There MAY be zero or more
 * <VariableReference> elements that refer to the same <VariableDefinition> element.
 *
 * The <VariableReference> element is of the VariableReferenceType complex type, which is of the ExpressionType complex
 * type and is a member of the <Expression> element substitution group.  The <VariableReference> element MAY appear
 * any place where an <Expression> element occurs in the schema.
 *
 * @class VariableReference
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.VariableReference = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The name used to refer to the value defined in a <VariableDefinition> element.
     * @property variableId
     * @type {String}
     */
    this.variableId = config.variableId;

});