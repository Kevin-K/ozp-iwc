/**
 * @submodule bus.api.Type
 */

/**
 * The Data Api. Provides key value storage and app state-sharing through the IWC. Subclasses the
 * {{#crossLink "CommonApiBase"}}{{/crossLink}}. Utilizes the {{#crossLink "DataApiValue"}}{{/crossLink}} which
 * subclasses the {{#crossLink "CommonApiValue"}}{{/crossLink}}.
 *
 * @class DataApi
 * @namespace ozpIwc
 * @extends ozpIwc.CommonApiBase
 *
 * @constructor
 * @uses DataApiValue
 * @type {Function}
 * @params {Object} config
 * @params {ozpIwc.Participant} config.participant - the participant used for the Api communication
 */
ozpIwc.DataApi = ozpIwc.util.extend(ozpIwc.CommonApiBase,function(config) {
    ozpIwc.CommonApiBase.apply(this,arguments);
    this.endpointUrl=ozpIwc.linkRelPrefix+":user-data";
    this.endpointUrls.push(ozpIwc.linkRelPrefix+":user-data");
});

/**
 * Loads data from the server.
 *
 * @method loadFromServer
 */
ozpIwc.DataApi.prototype.loadFromServer=function() {
	return this.loadFromEndpointIterative(this.endpointUrl)
			.then("Load complete from " + this.endpointUrl);
};

/**
 * Creates a DataApiValue from the given packet.
 *
 * @method makeValue
 * @param {ozpIwc.TransportPacket} packet The packet used to create an api value
 *
 * @returns {ozpIwc.DataApiValue}
 */
ozpIwc.DataApi.prototype.makeValue = function(packet){
    return new ozpIwc.DataApiValue(packet);
};

/**
 * A middleware function used to format server data to be deserialized into Api nodes
 *
 * @method formatServerData
 * @param object
 * @returns {{object}}
 */
ozpIwc.DataApi.prototype.formatServerData = function(object){
    return object.entity;
};
/**
 * Creates a child node of a given Data Api node. The child's key will be automatically generated based on its
 * parents key.
 *
 * @method createChild
 * @private
 * @param {ozpIwc.DataApiValue} node  The node of the Api to create a child of.
 * @param {ozpIwc.TransportPacketContext} packetContext The TransportPacketContext
 * containing information to build the child node.
 *
 * @returns {ozpIwc.DataApiValue} The childNode created.
 */
ozpIwc.DataApi.prototype.createChild=function(node,packetContext) {
    var key=this.createKey(node.resource+"/");

    // save the new child
    var childNode=this.findOrMakeValue({'resource':key});
    childNode.set(packetContext.packet);
    return childNode;
};

/**
 * Sends a list of children of the specified node to the sender of the packet context.
 *
 * The sender of the packet context will receive a responding message with the following parameters:
 * ```
 * {
 *     response: 'ok',
 *     entity: [ <array of child node resources (String)> ]
 * }
 * ```
 * @method handleList
 * @param {ozpIwc.DataApiValue} node The node containing children to list.
 * @param {ozpIwc.TransportPacketContext} packetContext Packet context of the list request.
 */
ozpIwc.DataApi.prototype.handleList=function(node,packetContext) {
    packetContext.replyTo({
        'response': 'ok',
        'entity': node.listChildren()
    });
};

/**
 * Creates a child node of the given Data Api node. Creates a reference to the child node in the parent node's children
 * property.
 *
 *
 * A responding message is sent back to the sender of the packet context with the following parameters:
 * ```
 * {
 *     response: 'ok',
 *     entity: {
 *        resource: <resource(String) of the new child node>
 *     }
 * }
 * ```
 *
 * @method handleAddchild
 * @param {ozpIwc.DataApiValue} node - The parent node to add a child node to.
 * @param {ozpIwc.TransportPacketContext} packetContext - The packet context of which the child is constructed from.
 */
ozpIwc.DataApi.prototype.handleAddchild=function(node,packetContext) {
    var childNode=this.createChild(node,packetContext);
    if (childNode && childNode.entity && childNode.entity.persist) {
        this.persistNode(childNode);
    }

    node.addChild(childNode.resource);

    if (node && packetContext.packet.entity.persist) {
        this.persistNode(node);
    }

    packetContext.replyTo({
        'response':'ok',
        'entity' : {
            'resource': childNode.resource
        }
    });
};

/**
 * Removes a child node from a given parent node.
 *
 * A responding message is sent back to the sender of the packet context with the following parameters:
 * ```
 * {
 *     response: 'ok'
 * }
 * ```
 * @method handleRemovechild
 * @param {ozpIwc.DataApiValue} node - The parent node of which to remove the child node.
 * @param {ozpIwc.TransportPacketContext} packetContext - The packet context containing the child node's resource in
 * its entity.
 */
ozpIwc.DataApi.prototype.handleRemovechild=function(node,packetContext) {
    node.removeChild(packetContext.packet.entity.resource);
    if (node && packetContext.packet.entity.persist) {
        this.persistNode(node);
    }
    var childNode=this.findOrMakeValue(packetContext.packet.entity);
    if (childNode && childNode.entity && childNode.entity.persist) {
        this.deleteNode(childNode);
    }

    // delegate to the handleGet call
    packetContext.replyTo({
        'response':'ok'
    });
};


/**
 * Overrides the implementation of ozpIwc.CommonApiBase.handleSet
 * to add a node to persistent storage after setting it's value.
 *
 * @method handleSet
 * @param {ozpIwc.DataApiValue} node
 * @param {ozpIwc.PacketContext} packetContext
 */
ozpIwc.DataApi.prototype.handleSet=function(node,packetContext) {
    ozpIwc.CommonApiBase.prototype.handleSet.apply(this,arguments);
    if (node && packetContext.packet.entity && packetContext.packet.entity.persist) {
        this.persistNode(node);
    }
};

/**
 * Overrides the implementation of ozpIwc.CommonApiBase.handleDelete
 * to delete a node from persistent storage before deleting it's value.
 *
 * @method handleDelete
 * @param {ozpIwc.DataApiValue} node
 */
ozpIwc.DataApi.prototype.handleDelete=function(node,packetContext) {
    if (node.entity && node.entity.persist) {
        this.deleteNode(node);
    }
    ozpIwc.CommonApiBase.prototype.handleDelete.apply(this,arguments);
};

/**
 * 	Saves an individual node to the persistent data store
 *
 * 	@method persistNode
 * 	@param {ozpIwc.DataApiValue} node
 */
ozpIwc.DataApi.prototype.persistNode=function(node) {
    var endpointref= ozpIwc.endpoint(this.endpointUrl);
    var persistNode = node.serialize();

    //Watchers don't need persistence they are run time.
    delete persistNode.watchers;

    endpointref.put(node.resource, JSON.stringify(persistNode));
};

/**
 * 	Deletes an individual node from the persistent data store
 *
 * 	@method deleteNode
 * 	@param {ozpIwc.DataApiValue} node
 */
ozpIwc.DataApi.prototype.deleteNode=function(node) {
    var endpointref= ozpIwc.endpoint(this.endpointUrl);
    endpointref.delete(node.resource);
};

/**
 * 	Collect list of nodes to persist, send to server, reset persist flag.
 * 	Currently sends every dirty node with a separate ajax call.
 *
 * 	@method persistNodes
 */
ozpIwc.DataApi.prototype.persistNodes=function() {
    // collect list of nodes to persist, send to server, reset persist flag
    var nodes=[];
    for (var node in this.data) {
        if ((this.data[node].dirty === true) &&
            (this.data[node].persist === true)) {
            nodes[nodes.length]=this.data[node].serialize();
            this.data[node].dirty = false;
        }
    }
    // send list of objects to endpoint ajax call
    if (nodes) {
        var endpointref= ozpIwc.EndpointRegistry.endpoint(this.endpointUrl);
        endpointref.saveNodes(nodes);
    }
};
