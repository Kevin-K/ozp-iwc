/* global ozpIwc */

/**
 * @submodule bus.service.Type
 */

/**
 * The Data Api. 
 * Subclasses the {{#crossLink "ozpIwc.ApiBase"}}{{/crossLink}}.
 *
 * @class DataApi
 * @namespace ozpIwc
 * @extends ozpIwc.ApiBase
 * @constructor
 */
ozpIwc.DataApi = ozpIwc.createApi(function(config) {
    this.persistenceQueue=config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();
    this.endpoints=[
        {
            link: ozpIwc.linkRelPrefix+":user-data",
            headers: []
        }
    ];

});

/**
 * Override the default node type to be a DataNode.
 * @override
 * @method createNodeObject
 * @param {type} config
 * @returns {ozpIwc.DataNode}
 */
ozpIwc.DataApi.prototype.createNodeObject=function(config) {
    return new ozpIwc.DataNode(config);
};

// Default handlers are fine anything
ozpIwc.DataApi.useDefaultRoute(ozpIwc.ApiBase.allActions);

//============================================
// Add/Remove Child:
//============================================
/**
 * A filter for adding children nodes to the data api. assigns the parent node a pattern & sets it as a collector.
 * @method addChildFilters
 * @static
 * @returns {function[]}
 */
ozpIwc.DataApi.addChildFilters = function(){
    var childsPattern;
    var filters = ozpIwc.standardApiFilters.createAndCollectFilters(ozpIwc.DataNode);

    //Stash the child's pattern for now and create the parent.
    filters.unshift(function(packet,context,pathParams,next) {
        childsPattern = packet.pattern;
        packet.pattern = null;
        return next();
    });
    //Make sure the parent node has it's pattern set then replace the childs pattern at the end of the filter chain
    filters.push(function(packet,context,pathParams,next) {
        context.node.set({
            pattern: packet.pattern
        });
        packet.pattern = childsPattern;
        return next();
    });
    return filters;
};

ozpIwc.DataApi.declareRoute({
    action: ["addChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.DataApi.addChildFilters()
}, function(packet, context, pathParams) {
    var key = this.createKey(context.node.pattern);
    packet.resource = key;
    packet.pattern =  packet.pattern || key + "/";
    var childNode = this.createNode({resource: key}, ozpIwc.DataNode);
    this.markForChange(childNode);
    childNode.set(packet);

    return {
        response: "ok",
        entity: {
            resource: childNode.resource
        }
    };
});

ozpIwc.DataApi.declareRoute({
    action: ["removeChild"],
    resource: "{resource:.*}",
    filters: ozpIwc.standardApiFilters.deleteFilters()
}, function(packet, context, pathParams) {
    if (packet.entity && packet.entity.resource) {
        packet.resource = packet.entity.resource;
        context.node = this.data[packet.resource];
        if (context.node) {
            this.markForChange(context.node);
            context.node.markAsDeleted(packet);
        }
    }
    return {response: "ok"};
});