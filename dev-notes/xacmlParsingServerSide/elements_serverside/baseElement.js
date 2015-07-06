ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};


ozpIwc.policyAuth.BaseElement = function(config){
    config = config || {};
};


ozpIwc.policyAuth.BaseElement.prototype.construct = function(element){
    var parsed = ozpIwc.policyAuth.util.elementParser({
        element: element,
        reqAttrs: this.requiredAttributes,
        optAttrs: this.optionalAttributes,
        reqNodes: this.requiredNodes,
        optNodes: this.optionalNodes
    });
    this.constructNodes(parsed);
};

/**
 *
 *
 * @method constructNodes
 * @param {Object}config
 * @param {Object} config.attrs
 * @param {Object} config.nodes
 */
ozpIwc.policyAuth.BaseElement.prototype.constructNodes = function(config){
    config = config || {};
    config.attrs = config.attrs || {};
    config.nodes = config.nodes || {};

    var camelCasedProperty;
    // Attributes are just strings, simple assignment
    for(var i in config.attrs){
        // The property of the policy is the camelCase version of the tagName
        // (ex. this.policyId = parsed.attrs.PolicyId)
        camelCasedProperty = ozpIwc.policyAuth.util.camelCased(i);
        this[camelCasedProperty] = config.attrs[i];
    }

    // Each node is likely to be mapped to a XACML element, construct said element and set it as this elements property.
    for(var j in config.nodes){
        // The property of the policy is the camelCase version of the tagName
        camelCasedProperty = ozpIwc.policyAuth.util.camelCased(j);

        // If a property of the Policy accepts multiple elements, it's defaulted as an array.
        if(Array.isArray(this[camelCasedProperty])){

            // Check if the parsed node type is an array, then we will append all its elements to this element.
            if(Array.isArray(config.nodes[j])){
                for(var itt in config.nodes[j]){
                    // The property of the element is the camelCase version of the tagName, the node to construct from the
                    // parsed object uses the same notation as the tagName for the class call
                    // (ex.ozpIwc.policyAuth[i] = ozpIwc.policyAuth.Target)
                    this[camelCasedProperty].push(new ozpIwc.policyAuth[j]({element: config.nodes[j][itt]}));
                }
            }else{
                for(var k in config.nodes[j]) {
                    this[camelCasedProperty].push(new ozpIwc.policyAuth[j]({element: config.nodes[j][k]}));
                }
            }
        } else {
            for(var itter in config.nodes[j]) {
                this[camelCasedProperty] = new ozpIwc.policyAuth[j]({element: config.nodes[j][itter]});
            }
        }
    }
};


ozpIwc.policyAuth.BaseElement.prototype.requiredAttributes = [];
ozpIwc.policyAuth.BaseElement.prototype.optionalAttributes = [];
ozpIwc.policyAuth.BaseElement.prototype.requiredNodes = [];
ozpIwc.policyAuth.BaseElement.prototype.optionalNodes = [];