ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Attributes> element specifies attributes of a subject, resource, action, environment or another category by
 * listing a sequence of <Attribute> elements associated with the category.
 *
 * The <Attributes> element is of AttributesType complex type.
 *
 * @Class Attributes
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Attributes = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * This attribute indicates which attribute category the contained attributes belong to. The Category attribute is
     * used to differentiate between attributes of subject, resource, action, environment or other categories.
     *
     * @property category
     * @type {String}
     */
    this.category = config.category;

    /**
     * This attribute provides a unique identifier for this <Attributes> element. See [XMLid] It is primarily
     * intended to be referenced in multiple requests. See [Multi].
     *
     * @property xml:id
     * @type {String}
     */
    this['xml:id'] = config['xml:id'];

    /**
     * Specifies additional sources of attributes in free form XML document format which can be referenced using
     * <AttributeSelector> elements.
     *
     * @property content
     * @type {ozpIwc.policyAuth.Content}
     */
    this.content = config.content;

    /**
     * A sequence of attributes that apply to the category of the request.
     * @property attributes
     * @type {Array<ozpIwc.policyAuth.Attribute>}
     */
    this.attributes = config.attributes;
});