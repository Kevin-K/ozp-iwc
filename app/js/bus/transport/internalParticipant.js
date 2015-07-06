/**
 * @submodule bus.transport
 */

/**
 * @class InternalParticipant
 * @namespace ozpIwc
 * @constructor
 * @extends ozpIwc.Participant
 * @param {Object} config
 * @param {String} config.name The name of the participant.
 */
ozpIwc.InternalParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
    config=config || {};
	ozpIwc.Participant.apply(this,arguments);
    /**
     * @property replyCallbacks
     * @type {Object}
     */
	this.replyCallbacks={};

    /**
     * The type of the participant.
     * @property participantType
     * @type {String}
     * @default "internal"
     */
	this.participantType="internal";

    /**
     * The name of the participant.
     * @property name
     * @type {String}
     * @default ""
     */
	this.name=config.name;

    var self = this;
    this.on("connectedToRouter",function() {
        self.permissions.pushIfNotExist('ozp:iwc:address', self.address);
        self.permissions.pushIfNotExist('ozp:iwc:sendAs',self.address);
        self.permissions.pushIfNotExist('ozp:iwc:receiveAs', self.address);

        ozpIwc.metrics.gauge(self.metricRoot,"registeredCallbacks").set(function() {
            return self.getCallbackCount();
        });
    });
});

/**
 * Gets the count of the registered reply callbacks.
 *
 * @method getCallbackCount
 * @returns {Number} The number of registered callbacks.
 */
ozpIwc.InternalParticipant.prototype.getCallbackCount=function() {
    if (!this.replyCallbacks || !Object.keys(this.replyCallbacks)) {
        return 0;
    }
    return Object.keys(this.replyCallbacks).length;
};

/**
 * Handles packets received from the {{#crossLink "ozpIwc.Router"}}{{/crossLink}} the participant is registered to.
 *
 * Fires:
 *   - {{#crossLink "ozpIwc.Participant/#receive:event"}}{{/crossLink}}
 *
 * @method receiveFromRouterImpl
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.InternalParticipant.prototype.receiveFromRouterImpl=function(packetContext) {
	var packet=packetContext.packet;
	if(packet.replyTo && this.replyCallbacks[packet.replyTo]) {
        var cancel = false;
        var done=function() {
            cancel = true;
        };
        this.replyCallbacks[packet.replyTo](packet,done);
		if (cancel) {
            this.cancelCallback(packet.replyTo);
        }
	} else if (packet.dst === "$bus.multicast"){
        this.events.trigger("receiveEventChannelPacket",packetContext);
    } else {
		this.events.trigger("receive",packetContext);
	}
};

/**
 * Sends a packet to this participants router. Uses setImmediate to force messages out in queue order.
 *
 * @method send
 * @param originalPacket
 * @param callback
 *
 * @returns {ozpIwc.TransportPacket|*}
 */
ozpIwc.InternalParticipant.prototype.send=function(originalPacket,callback) {
    var packet=this.fixPacket(originalPacket);
	if(callback) {
		this.replyCallbacks[packet.msgId]=callback;
	}
    var self=this;
    var send = ozpIwc.Participant.prototype.send;
	ozpIwc.util.setImmediate(function() {
        send.call(self,packet);
    });

	return packet;
};

/**
 * Cancels the callback corresponding to the given msgId.
 *
 * @method cancelCallback
 * @param {Number} msgId
 *
 * @returns {Boolean} returns true if successful.
 */
ozpIwc.InternalParticipant.prototype.cancelCallback=function(msgId) {
    var success=false;
    if (msgId) {
        delete this.replyCallbacks[msgId];
        success=true;
    }
    return success;
};
