/**
 * @submodule bus.service.Value
 */

/**
 * @class DataNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.DataNode=ozpIwc.util.extend(ozpIwc.ApiNode,function(config) {
   ozpIwc.ApiNode.apply(this, arguments);
    this.lifespan = new ozpIwc.Lifespan.Persistent();
});

/**
 * @property uriTemplate
 * @type {string}
 */
ozpIwc.DataNode.prototype.uriTemplate="ozp:data-item";

/**
 * Serializes the node for persistence to the server.
 *
 * @method serializedEntity
 * @returns {String}
 */
ozpIwc.DataNode.prototype.serializedEntity=function() {
    return JSON.stringify({
        key: this.resource,
        entity: this.entity,
        collection: this.collection,
        pattern: this.pattern,
        contentType: this.contentType,
        permissions: this.permissions,
        version: this.version,
        _links: {
            self: {
                href: this.self
            }
        }
    });
};

/**
 * The content type of the data returned by serializedEntity()
 *
 * @method serializedContentType
 * @returns {string}
 */
ozpIwc.DataNode.prototype.serializedContentType=function() {
    return "application/vnd.ozp-iwc-data-object+json";
};

/**
 * Sets the api node from the serialized form.
 *
 * @method deserializedEntity
 * @param {String} serializedForm
 * @param {String} contentType
 */
ozpIwc.DataNode.prototype.deserializedEntity=function(serializedForm,contentType) {
    var data;
    if(typeof(serializedForm.entity) === "string") {
        data=JSON.parse(serializedForm.entity);
    } else {
        data = serializedForm.entity;
    }

    this.entity=data.entity;
    this.collection=data.collection;
    this.pattern = data.pattern;
    this.contentType=data.contentType;
    this.permissions=data.permissions;
    this.version=data.version;
    data._links = data._links || {};
    if(data._links.self) {
        this.self=data._links.self.href;
    }

    if (!this.resource) {
        if (data._links["ozp:iwcSelf"]) {
            this.resource = data._links["ozp:iwcSelf"].href.replace(/web\+ozp:\/\/[^/]+/, "");
        } else {
            this.resource = this.resourceFallback(data);
        }
    }
};

/**
 * If a resource path isn't given, this takes the best guess at assigning it.
 * @override
 * @method resourceFallback
 * @param {Object} serializedForm
 * @returns {String}
 */
ozpIwc.DataNode.prototype.resourceFallback = function(serializedForm) {
    if(serializedForm.key) {
       return ((serializedForm.key.charAt(0) === "/") ? "" : "/") + serializedForm.key;
    }
};