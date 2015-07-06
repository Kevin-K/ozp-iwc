/**
 * A collection of filter generation functions.
 *
 * @class apiFilter
 * @namespace ozpIwc
 * @static
 */

/**
 * @class ozpIwc.apiFilter.Function
 * @type {Function}
 * @param {type} packet
 * @param {type} context
 * @param {type} pathParams
 * @param {type} next
 * @returns {Function} a call to the next filter
 */

ozpIwc.apiFilter={
    /**
     * Returns a filter function with the following features:
     * Stores the resource in context.node, creating it via the api's
     * @method createResource
     * @returns {ozpIwc.apiFilter.Function}
     */
    createResource: function(NodeType) {
        if(NodeType) {
            return function(packet,context,pathParams,next) {
                if(!context.node) {
                    context.node=this.data[packet.resource]=new NodeType({
                        resource: packet.resource,
                        pattern: packet.pattern,
                        src: packet.src
                    });
                }
                return next();
            };
        } else {
            return function(packet,context,pathParams,next) {
                if(!context.node) {
                    context.node=this.createNode({
                        resource: packet.resource,
                        pattern: packet.pattern,
                        src: packet.src
                    });
                }
                return next();
            };
        }
    },
    /**
     * Returns a filter function with the following features:
     * Adds the resource as a collector to the API, it will now get updates based on its pattern property.
     * @method markAsCollector
     * @returns {Function}
     */
    markAsCollector: function(){

        return function(packet,context,pathParams,next) {
            this.addCollector(context.node);
            return next();
        };
    },

    /**
     * Returns a filter function with the following features:
     * Stores the resource in context.node or throws NoResourceError if it does not exist.
     * @method requireResource
     * @returns {ozpIwc.apiFilter.Function}
     */
    requireResource: function() {
        return function(packet,context,pathParams,next) {
            if(!context.node || context.node.deleted) {
                throw new ozpIwc.NoResourceError(packet);
            }
            return next();
        };
    },

    /**
     * Returns a filter function with the following features:
     * Checks that the subject within the context is authorized for the action on the resource node.
     * @method checkAuthorization
     * @returns {ozpIwc.apiFilter.Function}
     */
    checkAuthorization: function(action) {
        return function(packet,context,pathParams,next) {
            this.checkAuthorization(context.node,context,packet,action || packet.action);
            return next();
        };
    },

    /**
     * An empty filter
     *
     * @method nullFilter
     * @param packet
     * @param context
     * @param pathParams
     * @param next
     * @returns {Function} a call to the next filter
     */
    nullFilter: function(packet,context,pathParams,next) {
        return next();
    },

    /**
     * Returns a filter function with the following features:
     * Checks that the content type is one that is authorized for the api resource.
     * @method checkContentType
     * @returns {ozpIwc.apiFilter.Function}
     */
    checkContentType: function(contentType) {
        if(!contentType) {
            return ozpIwc.apiFilter.nullFilter;
        }
        contentType=ozpIwc.util.ensureArray(contentType);
        return function(packet,context,pathParams,next) {
            if(!contentType.some(function(t) {
                return t===packet.contentType ||
                    (Object.prototype.toString.call(contentType) === '[object RegExp]' && 
                    t.test(packet.contentType));
                })
            ) {
                throw new ozpIwc.BadContentError({
                    'provided': packet.contentType,
                    'allowedTypes': contentType
                });
            }
            return next();
        };
    },

    /**
     * Returns a filter function with the following features:
     * Marks the resource as changed.
     * @method markResourceAsChanged
     * @returns {ozpIwc.apiFilter.Function}
     */
    markResourceAsChanged: function() { 
        return function(packet,context,pathParams,next) {
            this.markForChange(packet);
            return next();
        };
    },

    /**
     * Returns a filter function with the following features:
     * If the packet does not contain a pattern property create one from the packet resource + "/". This filter is to
     * be used only in node creation as it can overwrite the nodes pattern property if different than resource + "/".
     * @method fixPattern
     * @returns {Function}
     */
    fixPattern: function(){
        return function(packet,context,pathParams,next) {
            var pattern;
            if(context.node){
                pattern = context.node.pattern;
            }
            if(packet.resource) {
                packet.pattern = packet.pattern || pattern || packet.resource + "/";
            }
            return next();
        };
    },

    /**
     * Returns a filter function with the following features:
     * Checks the version of the packet against the context.
     * @method checkVersion
     * @returns {ozpIwc.apiFilter.Function}
     */
    checkVersion: function() { 
        return function(packet,context,pathParams,next) {
        // if there is no resource node, then let the request through
        if(packet.ifTag && packet.ifTag!==context.node.version) {
            throw new ozpIwc.NoMatchError({
                expectedVersion: packet.ifTag,
                actualVersion: context.node.version
            });
        }
        return next();
    };}
};

/**
 * Wrappers that return the list of filters for a standard action
 *
 * @class standardApiFilters
 * @namespace ozpIwc
 * @static
 */
ozpIwc.standardApiFilters={
    /**
     * Returns the filter collection generator for the given action.
     * @method forAction
     * @param {String} a
     * @returns {Function}
     */
    forAction: function(a) {
        return ozpIwc.standardApiFilters[a+"Filters"];
    },

    /**
     * Filters for the set action.
     * @method setFilters
     * @param nodeType
     * @param contentType
     * @returns {Function[]} array of filters
     */
    setFilters: function(nodeType,contentType) {
        return [
            ozpIwc.apiFilter.createResource(nodeType),
            ozpIwc.apiFilter.checkAuthorization(),
            ozpIwc.apiFilter.checkContentType(contentType),
            ozpIwc.apiFilter.checkVersion(),
            ozpIwc.apiFilter.markResourceAsChanged()
        ];
    },

    /**
     * Filters for the delete action.
     * @method deleteFilters
     * @returns {Function[]} array of filters
     */
    deleteFilters: function() {
        return [
            ozpIwc.apiFilter.checkAuthorization(),
            ozpIwc.apiFilter.checkVersion(),
            ozpIwc.apiFilter.markResourceAsChanged()
        ];
    },

    /**
     * Filters for the get action.
     * @method getFilters
     * @returns {Function[]} array of filters
     */
    getFilters: function() {
        return [
            ozpIwc.apiFilter.requireResource(),
            ozpIwc.apiFilter.checkAuthorization()
        ];
    },

    /**
     * Filters for set-like actions that need to mark the resource as a collector.
     * @method getFilters
     * @returns {Function[]} array of filters
     */
    createAndCollectFilters: function(nodeType,contentType) {
        return [
            ozpIwc.apiFilter.fixPattern(),
            ozpIwc.apiFilter.createResource(nodeType),
            ozpIwc.apiFilter.checkAuthorization(),
            ozpIwc.apiFilter.checkContentType(contentType),
            ozpIwc.apiFilter.checkVersion()
        ];
    }
};