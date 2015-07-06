ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <AttributeDesignator> element retrieves a bag of values for a named attribute from the request context.
 * A named attribute SHALL be considered present if there is at least one attribute that matches the
 * criteria set out below.
 *
 * The <AttributeDesignator> element SHALL return a bag containing all the attribute values that are matched by the
 * named attribute. In the event that no matching attribute is present in the context, the MustBePresent attribute
 * governs whether this element returns an empty bag or “Indeterminate”.  See Section 7.3.5.
 *
 * The <AttributeDesignator> MAY appear in the <Match> element and MAY be passed to the <Apply> element as an argument.
 *
 * The <AttributeDesignator> element is of the AttributeDesignatorType complex type.
 *
 *
 * @class AttributeDesignator
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AttributeDesignator = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * This attribute SHALL specify the Category with which to match the attribute.
     *  type='xs:anyURI'
     *
     * @property category
     * @type {String}
     */
    this.category = config.category;

    /**
     * This attribute SHALL specify the AttributeId with which to match the attribute.
     *  type='xs:anyURI'
     *
     * @property attributeId
     * @type {String}
     */
    this.attributeId = config.attributeId;

    /**
     * The bag returned by the <AttributeDesignator> element SHALL contain values of this data-type.
     *  type='xs:anyURI'
     *
     * @property dataType
     * @type {String}
     */
    this.dataType = config.dataType;

    /**
     * This attribute, if supplied, SHALL specify the Issuer with which to match the attribute.
     *  type='xs:anyURI'
     *
     * @property category
     * @type {String}
     */
    this.issuer = config.issuer;

    /**
     * This attribute governs whether the element returns “Indeterminate” or an empty bag in the event the named
     * attribute is absent from the request context.  See Section 7.3.5.  Also see Sections 7.19.2 and 7.19.3.
     *
     * @property category
     * @type {Boolean}
     */
    this.mustBePresent = config.mustBePresent;

    if(config.element){
        this.construct(config.element);
    }
});

/**
 * A named attribute SHALL match an attribute if the values of their respective Category, AttributeId, DataType and
 * Issuer attributes match. The attribute designator’s Category MUST match, by identifier equality, the Category of
 * the <Attributes> element in which the attribute is present. The attribute designator’s AttributeId MUST match, by
 * identifier equality, the AttributeId of the attribute.  The attribute designator’s DataType MUST match, by
 * identifier equality, the DataType of the same attribute.
 *
 * @method designate
 * @param {Object}request
 * @returns {Array}
 */
ozpIwc.policyAuth.AttributeDesignator.prototype.designate = function(request){
    if(!request.attributes){
        return [];
    }
    var bag = [];
    for(var i in request.attributes){
        if(request.attributes[i].category === this.category){
            for(var j in request.attributes[i].attribute){
                if(request.attributes[i].attribute[j].attributeId === this.attributeId &&
                   request.attributes[i].attribute[j].dataType === this.dataType &&
                   request.attributes[i].attribute[j].issuer === this.issuer){
                    bag.push(request.attributes[i].attribute[j]);
                }
            }
        }
    }
    return bag;

}
ozpIwc.policyAuth.AttributeDesignator.prototype.requiredAttributes = ['Category', 'AttributeId',
                                                                      'DataType','MustBePresent'];
ozpIwc.policyAuth.AttributeDesignator.prototype.optionalAttributes = ['Issuer'];