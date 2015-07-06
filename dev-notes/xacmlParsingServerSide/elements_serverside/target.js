ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};


/**
 * The <Target> element identifies the set of decision requests that the parent element is intended to evaluate.
 * The <Target> element SHALL appear as a child of a <PolicySet> and <Policy> element and MAY appear as a child of
 * a <Rule> element.
 *
 * The <Target> element is of TargetType complex type.
 *
 * @class Target
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Target = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * Matching specification for attributes in the context.  If this element is missing, then the target
     * SHALL match all contexts.
     * @property anyOf
     * @type {Array<ozpIwc.policyAuth.AnyOf>}
     */
    this.anyOf = config.anyOf || [];


    if(config.element){
        this.construct(config.element);
    }
});



/**
 * Determines if the given  target meets the criteria of the request
 *   For the parent of the <Target> element to be applicable to the decision request, there MUST be at least one
 *   positive match between each <AnyOf> element of the <Target> element and the corresponding section of the <Request> element.
 * @method isTargeted
 * @param {Object} request
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Target.prototype.isTargeted = function(request){
    //@TODO : is True if no anyOf's? Is that a global all?
    for(var i in this.anyOf){
        if(!this.anyOf[i].any(request)){
            return false;
        }
    }
    return true;

};

ozpIwc.policyAuth.Target.prototype.optionalNodes = ['AnyOf'];


ozpIwc.policyAuth.Target.prototype.generateEmptyTarget = function(){
    return new ozpIwc.policyAuth.Target({
        anyOf: [new ozpIwc.policyAuth.AnyOf({
            allOf: [new ozpIwc.policyAuth.AllOf()]
        })]
    });
};