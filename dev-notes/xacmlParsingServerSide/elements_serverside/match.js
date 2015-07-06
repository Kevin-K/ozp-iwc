ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Match> element SHALL identify a set of entities by matching attribute values in an <Attributes> element of the
 * request context with the embedded attribute value.
 *
 * The <Match> element is of MatchType complex type.
 *
 * @class Match
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Match = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * Specifies a matching function.  The value of this attribute MUST be of type xs:anyURI
     * @policy matchId
     * @type String
     * @default null
     */
    this.matchId = config.matchId;

    /**
     * Embedded attribute value
     * @policy attributeValue
     * @type *
     * @default null
     */
    this.attributeValue = config.attributeValue;

    /**
     * MAY be used to identify one or more attribute values in an <Attributes> element of the request context.
     * @policy attributeDesignator
     * @type *
     * @default null
     */
    this.attributeDesignator = config.attributeDesignator;

    /**
     * MAY be used to identify one or more attribute values in a <Content> element of the request context.
     * @policy attributeSelector
     * @type *
     * @default null
     */
    this.attributeSelector = config.attributeSelector;

    if(config.element){
        this.construct(config.element);
    }
});

/**
 * Evaluates the given match statement against the request object with this match element's matching function.
 *
 * @method evaluate
 * @param {Object}request
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Match.prototype.match = function(request){
    // If the matching function specified is not available force a failing match.
    // @TODO Determine if this is proper behavior.
    if(!ozpIwc.policyAuth.Functions[this.matchId]){
        return false;
    }
    var values = [];

    if(this.attributeDesignator){
        values = this.attributeDesignator.designate(request);
    }
    if(values.length === 0){
        return false;
    }
    for(var i in values){
        if(!ozpIwc.policyAuth.Functions[this.matchId](this.attributeValue.value,values[i].value)){
            return false;
        }
    }
    return true;
};

ozpIwc.policyAuth.Match.prototype.requiredAttributes = ['MatchId'];
ozpIwc.policyAuth.Match.prototype.requiredNodes = ['AttributeValue'];

//@TODO one of these 2 optional nodes must be present. how should we address this?
ozpIwc.policyAuth.Match.prototype.optionalNodes = ['AttributeDesignator', 'AttributeSelector'];