ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Obligations> element SHALL contain a set of <Obligation> elements.
 *
 * The <Obligations> element is of ObligationsType complexType.
 *
 * @class Obligations
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Obligations = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    /**
     * A sequence of obligations.  See Section 5.34.
     * @property obligations
     * @type {Array<ozpIwc.policyAuth.Obligation>}
     * @default null
     */
    this.obligations = config.obligations
});

/**
 * The <AttributeValue> element SHALL contain a literal attribute value.
 *
 * The <AttributeValue> element is of AttributeValueType complex type.
 *
 * @class AttributeValue
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.AttributeValue = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {
    config = config || {};
    /**
     * The data-type of the attribute value.
     * @property dataType
     * @type String
     * @default null
     */
    this.dataType = config.dataType;
    this.value = config.value;
    if(config.element){
        this.construct(config.element);
        //@TODO this is stringed, parse?
        this.value = config.element.textContent.trim();
    }
});

ozpIwc.policyAuth.AttributeValue.prototype.requiredAttributes = ['DataType'];