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
ozpIwc.policyAuth.AttributeSelector = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * This attribute SHALL specify the Category with which to match the attribute.
     *  type='xs:anyURI'
     *
     * @property category
     * @type {String}
     */
    this.category = config.category;

    /**
     * This attribute refers to the attribute (by its AttributeId) in the request context in the category given by the
     * Category attribute. The referenced attribute MUST have data type
     * urn:oasis:names:tc:xacml:3.0:data-type:xpathExpression, and must select a single node in the <Content> element.
     * The XPathCategory attribute of the referenced attribute MUST be equal to the Category attribute of the
     * attribute selector.
     *
     * @property contextSelectorId
     * @type {String}
     * @default null
     */
    this.contextSelectorId = config.contextSelectorId;


    /**
     * The bag returned by the <AttributeDesignator> element SHALL contain values of this data-type.
     *  type='xs:anyURI'
     *
     * @property dataType
     * @type {String}
     */
    this.dataType = config.dataType;


    /**
     * This attribute SHALL contain an XPath expression to be evaluated against the specified XML content.
     * See Section 7.3.7 for details of the XPath evaluation during <AttributeSelector> processing.
     *
     * @property path
     * @type {String}
     * @default null
     */
    this.path = config.path;

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

ozpIwc.policyAuth.AttributeSelector.prototype.requiredAttributes = ['Category', 'Path',
                                                                      'DataType','MustBePresent'];
ozpIwc.policyAuth.AttributeSelector.prototype.optionalAttributes = ['ContextSelectorId'];