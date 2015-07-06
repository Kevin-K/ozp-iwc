ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <MissingAttributeDetail> element conveys information about attributes required for policy evaluation that were
 * missing from the request context.
 *
 * The <MissingAttributeDetail> element is of MissingAttributeDetailType complex type.
 *
 * @class MissingAttributeDetail
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.MissingAttributeDetail = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * The required value of the missing attribute.
     * @property attributeValue
     * @type {ozpIwc.policyAuth.AttributeValue}
     */
    this.attributeValue = config.attributeValue;

    /**
     * The category identifier of the missing attribute.
     * @property category
     * @type {String}
     */
    this.category = config.category;

    /**
     * The identifier of the missing attribute.
     * @property attributeId
     * @type {String}
     */
    this.attributeId = config.attributeId;

    /**
     * The data-type of the missing attribute.
     * @proeprty dataType
     * @type {String}
     */
    this.dataType = config.dataType;

    /**
     * This attribute, if supplied, SHALL specify the required Issuer of the missing attribute.
     * @property issuer
     * @type {String}
     */
    this.issuer = config.issuer;
});