ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AnyOf> element SHALL contain a disjunctive sequence of <AllOf> elements.
 *
 * The <AnyOf> element is of AnyOfType complex type.
 *
 * @class AnyOf
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AnyOf = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The <AllOf> element SHALL contain a conjunctive sequence of <Match> elements.
     * @property allOf
     * @type {Array<ozpIwc.policyAuth.AllOf>}
     */
    this.allOf = config.allOf || [];
    if(config.element){
        this.construct(config.element);
    }
});

ozpIwc.policyAuth.AnyOf.prototype.any = function(request){
    //@TODO : is True if no allOf's? Is that a global all?
    if(this.allOf.length === 0 ){
        return true;
    }
    var any = false;
    for(var i in this.allOf){
        if(this.allOf[i].all(request)){
            any = true;
        }
    }
    return any;
};

ozpIwc.policyAuth.AnyOf.prototype.requiredNodes = ['AllOf'];
