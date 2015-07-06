ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AllOf> element SHALL contain a conjunctive sequence of <Match> elements.
 *
 * The <AllOf> element is of AllOfType complex type.
 *
 * @class AllOf
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AllOf = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    config = config || {};
    /**
     * A conjunctive sequence of individual matches of the attributes in the request context and the embedded
     * attribute values
     *
     * @property allOf
     * @type {Array<ozpIwc.policyAuth.Match>}
     */
    this.match = config.match || [];
    if(config.element){
        this.construct(config.element);
    }
});

/**
 * Determines if the request meets the criteria of this AllOf element.
 * Returns true IF AND ONLY IF all match tests return true.
 *
 * @method all
 * @param {Object} request
 * @returns {Boolean}
 */
ozpIwc.policyAuth.AllOf.prototype.all = function(request){
    if(this.match.length === 0){
        return true;
    }
    for(var i in this.match){
        if(!this.match[i].match(request)){
            return false;
        }
    }
    return true;
};

ozpIwc.policyAuth.AllOf.prototype.optionalNodes = ['Match'];