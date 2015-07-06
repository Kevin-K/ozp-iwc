ozpIwc = ozpIwc || {};
ozpIwc.policyAuth = ozpIwc.policyAuth || {};
ozpIwc.policyAuth.util = ozpIwc.policyAuth.util || {};

ozpIwc.policyAuth.util.generateEmptyTarget = function(){
    return new ozpIwc.policyAuth.Target({
        anyOf: [new ozpIwc.policyAuth.AnyOf({
            allOf: [new ozpIwc.policyAuth.AllOf()]
        })]
    });
};

ozpIwc.policyAuth.util.generateAttributeSubjects = function(config){
    config = config || [];
    config = ozpIwc.util.ensureArray(config);

    var attributes = [];
    for (var i in config) {
        config[i].matchId = config[i].matchId || "urn:oasis:names:tc:xacml:1.0:function:string-equal";
        config[i].dataType = config[i].dataType || "http://www.w3.org/2001/XMLSchema#string";

        var attr = ozpIwc.policyAuth.util.generateAttribute({
            matchId: config[i].matchId,
            attributeId: "urn:oasis:names:tc:xacml:1.0:subject:subject-id",
            category: "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject",
            dataType: config[i].dataType,
            value: config[i].value
        });
        attributes.push(attr);
    }
    return attributes;
};

ozpIwc.policyAuth.util.generateAttributeResources = function(config){
    config = config || [];
    config = ozpIwc.util.ensureArray(config);

    var attributes = [];
    for (var i in config){
        config[i].matchId = config[i].matchId || "urn:oasis:names:tc:xacml:1.0:function:string-equal";
        config[i].dataType = config[i].dataType || "http://www.w3.org/2001/XMLSchema#string";

        var attr = ozpIwc.policyAuth.util.generateAttribute({
            matchId: config[i].matchId,
            attributeId: "urn:oasis:names:tc:xacml:1.0:resource:resource-id",
            category: "urn:oasis:names:tc:xacml:3.0:attribute-category:resource",
            dataType: config[i].dataType,
            value: config[i].value
        });
        attributes.push(attr);
    }
    return attributes;

};

ozpIwc.policyAuth.util.generateAttributeActions = function(config){
    config = config || [];
    config = ozpIwc.util.ensureArray(config);

    var attributes = [];
    for (var i in config) {
        config[i].matchId = config[i].matchId || "urn:oasis:names:tc:xacml:1.0:function:string-equal";
        config[i].dataType = config[i].dataType || "http://www.w3.org/2001/XMLSchema#string";

        var attr = ozpIwc.policyAuth.util.generateAttribute({
            matchId: config[i].matchId,
            attributeId: "urn:oasis:names:tc:xacml:1.0:action:action-id",
            category: "urn:oasis:names:tc:xacml:3.0:attribute-category:action",
            dataType: config[i].dataType,
            value: config[i].value
        });
        attributes.push(attr);
    }
    return attributes;
};


/**
 * Returns true if the the given document node is a direct descendant of the parent node.
 * @method isDirectDescendant
 * @param parent
 * @param child
 * @returns {boolean}
 */
ozpIwc.policyAuth.util.isDirectDescendant = function(child,parent){
    if (child.parentNode === parent) {
        return true;
    }
    return false;
};


/**
 *
 * @param {Object} config
 * @param {Array<String>} config.reqAttrs
 * @param {Array<String>} config.optAttrs
 * @param {Array<String>} config.reqNodes
 * @param {Array<String>} config.optNodes
 */
ozpIwc.policyAuth.util.elementParser = function(config){
    config = config || {};

    config.reqAttrs = config.reqAttrs || [];
    config.optAttrs = config.optAttrs || [];
    config.reqNodes = config.reqNodes || [];
    config.optNodes = config.optNodes || [];

    var element = config.element || {};

    var findings = {
        attrs: {},
        nodes: {}
    };
    config.reqAttrs.forEach(function(attr){
        var attribute = element.getAttribute(attr);
        if(attribute){
//            console.log('Found attribute of policy,(',attr,',',attribute,')');
            findings.attrs[attr] = attribute;
        } else {
            console.error('Required attribute not found,(',attr,')');
        }

    });

    config.optAttrs.forEach(function(attr){
        var attribute = element.getAttribute(attr);
        if(attribute){
//            console.log('Found attribute of policy,(',attr,',',attribute,')');
            findings.attrs[attr] = attribute;
        }

    });

    config.reqNodes.forEach(function(tag){
        var nodes = element.getElementsByTagName(tag);
        findings.nodes[tag] = findings.nodes[tag] || [];
        for(var i in nodes){
            if(ozpIwc.policyAuth.util.isDirectDescendant(nodes[i],element)){
//                console.log('Found node of policy: ', nodes[i]);
                findings.nodes[tag].push(nodes[i]);
            }
        }
        if(findings.nodes[tag].length <= 0) {
            console.error('Required node not found,(',tag,')');
        }
    });
    config.optNodes.forEach(function(tag){
        var nodes = element.getElementsByTagName(tag);
        for(var i in nodes){
            if(ozpIwc.policyAuth.util.isDirectDescendant(nodes[i],element)){
//                console.log('Found node of policy: ', nodes[i]);
                findings.nodes[tag] = findings.nodes[tag] || [];
                findings.nodes[tag].push(nodes[i]);
            }
        }
    });
    return findings;
};

ozpIwc.policyAuth.util.camelCased = function(string){
    return string.charAt(0).toLowerCase() + string.substring(1);
};