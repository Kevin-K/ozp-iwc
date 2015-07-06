/**
 * @submodule bus.api.Value
 */

/**
 * @class LocksApiValue
 * @namespace ozpIwc
 * @extends ozpIwc.CommonApiValue
 *
 * @constructor
 * @param {Object} config
 * @param {String[]} config.allowedContentTypes a list of content types this Locs Api value will accept.
 */
ozpIwc.LocksApiValue = ozpIwc.util.extend(ozpIwc.CommonApiValue,function(config) {
	ozpIwc.CommonApiValue.apply(this,arguments);
    this.entity={
        owner: null,
        queue: []
    };
});

/**
 * Pushes the ozpIwc.TransportPacket onto the mutex queue. If it is the first element in the queue, the packet's sender
 * will take control of the node.
 *
 * @method lock
 * @param {ozpIwc.TransportPacket} packet
 * @returns {Object|null} should the lock action set a new owner it will be returned, else null will be returned.
 */
ozpIwc.LocksApiValue.prototype.lock=function(packet) {
    this.entity.queue.push(packet);
    if(this.entity.owner !== this.entity.queue[0]) {
        this.entity.owner=this.entity.queue[0];
        return this.entity.owner;
    }
    return null;
};

/**
 * Removes all ozpIwc.TransportPackets in the queue that match the given packet. Should this remove the owner of the
 * mutex, the next remaining packet's sender will take control.
 *
 * @method lock
 * @param {ozpIwc.TransportPacket} packet
 * @returns {Object|null} should the unlock action set a new owner it will be returned, else null will be returned.
 */
ozpIwc.LocksApiValue.prototype.unlock=function(packet) {
    this.entity.queue=this.entity.queue.filter(function(q) {
       return !ozpIwc.util.objectContainsAll(q,packet);
    });
    
    if(!ozpIwc.util.objectContainsAll(this.entity.owner,this.entity.queue[0])) {
        this.entity.owner=this.entity.queue[0];
        return this.entity.owner;
    }
    return null;
};

