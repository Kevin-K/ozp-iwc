/**
 * @submodule bus.api.Type
 */

/**
 * The Locks Api. Treats each node as an individual mutex, creating a queue to access/own the resource.
 * Subclasses the {{#crossLink "ozpIwc.CommonApiBase"}}{{/crossLink}}. Utilizes the
 * {{#crossLink "ozpIwc.LocksApiValue"}}{{/crossLink}} which subclasses the
 * {{#crossLink "ozpIwc.CommonApiValue"}}{{/crossLink}}.
 *
 * @class LocksApi
 * @namespace ozpIwc
 * @extends ozpIwc.CommonApiBase
 * @constructor
 *
 * @type {Function}
 */
ozpIwc.LocksApi = ozpIwc.util.extend(ozpIwc.CommonApiBase, function(config) {
    ozpIwc.CommonApiBase.apply(this, arguments);
});

/**
 * Checks that the given packet context's resource meets the requirements of the api. Throws exception if fails
 * validation
 *
 * @method validateResource
 * @param {CommonApiValue} node @TODO is a node needed to validate?
 * @param {ozpIwc.TransportPacketContext} packetContext The packetContext with the resource to be validated.
 */
ozpIwc.LocksApi.prototype.validateResource=function(node,packetContext) {
    if(packetContext.packet.resource && !packetContext.packet.resource.match(/^\/mutex/)){
        throw new ozpIwc.ApiError('badResource',"Invalid resource for locks.api: " + packetContext.packet.resource);
    }
};

/**
 * Makes a {{#crossLink "ozpIwc.LocksApiValue"}}{{/crossLink}} from the given packet.
 *
 * @method makeValue
 * @param {ozpIwc.TransportPacket} packet
 * @returns {ozpIwc.LocksApiValue}
 */
ozpIwc.LocksApi.prototype.makeValue = function(packet) {
    return new ozpIwc.LocksApiValue({
        resource: packet.resource
    });
};

/**
 * Notifies the owner of the node's lock/unlock.
 *
 * @method updateLock
 * @param {ozpIwc.LocksApiValue} node
 * @param {Object} newOwner
 */
ozpIwc.LocksApi.prototype.updateLock=function(node,newOwner) {
    if(newOwner && this.isLeader()) {
        //console.log("[locks.api] New lock owner on " + node.resource + ": ",newOwner);
        var pkt = {
            'dst': newOwner.src,
            'src': this.participant.name,
            'replyTo': newOwner.msgId,
            'response': 'ok',
            'resource': node.resource
        };

        this.participant.send(pkt);
    } else {
        //console.log("[locks.api] Unchanged lock " + node.resource + " queue is ", JSON.stringify(node.entity));
    }
};

/**
 * Adds the packet's sender to the given node's mutex queue. The sender will be notified when it takes ownership.
 *
 * @method handleLock
 * @param {ozpIwc.LocksApiValue} node
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LocksApi.prototype.handleLock=function(node,packetContext) {
    this.updateLock(node,node.lock({
        src: packetContext.packet.src,
        msgId: packetContext.packet.msgId
    }));
};

/**
 * Removes the packet's sender from the given node's mutex queue. The next leader (if exists) will be notified of its
 * ownership.
 *
 * @method handleUnlock
 * @param {ozpIwc.LocksApiValue} node
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LocksApi.prototype.handleUnlock=function(node,packetContext) {
	//console.log("Unlocking " + node.resource + " due to request " + packetContext.packet);
    this.updateLock(node,node.unlock({
        src: packetContext.packet.src,
        msgId: packetContext.packet.msgId
    }));
};

/**
 * Handles removing participant addresses from the names api.
 *
 * @method handleEventChannelDisconnectImpl
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LocksApi.prototype.handleEventChannelDisconnectImpl = function (packetContext) {
    for(var key in this.data) {
        var node=this.data[key];
        //console.log("Unlocking " + node.resource + " due to shutdown of " + packetContext.packet.entity.address,packetContext.packet);
        this.updateLock(node,node.unlock({
            src: packetContext.packet.entity.address
        }));
    }
};

/**
 * Handles the set action for the Locks Api. Locks Api does not allow set actions.
 *
 * @method handleSet
 * @param {ozpIwc.LocksApiValue} node
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LocksApi.prototype.handleSet = function(node,packetContext) {
    if(this.isLeader()) {
        packetContext.replyTo({
            'response': 'badAction',
            'entity': {
                'action': packetContext.packet.action,
                'originalRequest': packetContext.packet
            }
        });
    }
};

/**
 * Handles the delete action for the Locks Api. Locks Api does not allow delete actions.
 *
 * @method handleDelete
 * @param {ozpIwc.LocksApiValue} node
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LocksApi.prototype.handleDelete = function(node,packetContext) {
    if(this.isLeader()) {
        packetContext.replyTo({
            'response': 'badAction',
            'entity': {
                'action': packetContext.packet.action,
                'originalRequest': packetContext.packet
            }
        });
    }
};