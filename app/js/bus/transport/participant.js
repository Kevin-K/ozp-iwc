/**
 * @submodule bus.transport
 */

/**
 * @class Participant
 * @namespace ozpIwc
 * @constructor
 * @mixes ozpIwc.security.Actor
 * @property {String} address The assigned address to this address.
 * @property {ozpIwc.policyAuth.SecurityAttribute} permissions The security attributes for this participant.
 */
ozpIwc.Participant=function() {


    /**
     * An events module for the participant.
     * @property events
     * @type Event
     */
    this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);

    /**
     * A key value store of the security attributes assigned to the participant.
     * @property permissions
     * @type Object
     * @default {}
     */
	this.permissions= new ozpIwc.policyAuth.SecurityAttribute();

    /**
     * The message id assigned to the next packet if a packet msgId is not specified.
     * @property msgId
     * @type {Number}
     */
    this.msgId=0;

    /**
     * A Metrics meter for packets sent from the participant.
     * @property sentPacketsmeter
     * @type ozpIwc.metricTypes.Meter
     */
    this.sentPacketsMeter=new ozpIwc.metricTypes.Meter();

    /**
     * A Metrics meter for packets received by the participant.
     * @property receivedPacketMeter
     * @type ozpIwc.metricTypes.Meter
     */
    this.receivedPacketsMeter=new ozpIwc.metricTypes.Meter();

    /**
     * A Metrics meter for packets sent to the participant that did not pass authorization.
     * @property forbiddenPacketMeter
     * @type ozpIwc.metricTypes.Meter
     */
    this.forbiddenPacketsMeter=new ozpIwc.metricTypes.Meter();
    this.latencyInTimer=new ozpIwc.metricTypes.Meter();
    this.latencyOutTimer=new ozpIwc.metricTypes.Meter();

    /**
     * The type of the participant.
     * @property participantType
     * @type String
     */
    this.participantType=this.constructor.name;

    /**
     * Content type for the Participant's heartbeat status packets.
     * @property heartBeatContentType
     * @type String
     * @default "application/vnd.ozp-iwc-address-v1+json"
     */
    this.heartBeatContentType="application/vnd.ozp-iwc-address-v1+json";

    /**
     * The heartbeat status packet of the participant.
     * @property heartBeatStatus
     * @type Object
     */
    this.heartBeatStatus={
        name: this.name,
        type: this.participantType || this.constructor.name
    };

    this.replyCallbacks = {};

    // Handle leaving Event Channel
    var self=this;
    ozpIwc.util.addEventListener("beforeunload",function() {
        // Unload events can't use setTimeout's. Therefore make all sending happen with normal execution
        self.send = function(originalPacket,callback) {
            var packet=this.fixPacket(originalPacket);
            if(callback) {
                self.replyCallbacks[packet.msgId]=callback;
            }
            ozpIwc.Participant.prototype.send.call(self,packet);

            return packet;
        };
        self.leaveEventChannel();
    });
};

/**
 * Processes packets sent from the router to the participant. If a packet does not pass authorization it is marked
 * forbidden.
 *
 * @method receiveFromRouter
 * @param {ozpIwc.PacketContext} packetContext
 * @returns {Boolean} true if this packet could have additional recipients
 */
ozpIwc.Participant.prototype.receiveFromRouter=function(packetContext) {
    var self = this;

    var request = {
        'subject': this.permissions.getAll(),
        'resource': {'ozp:iwc:receiveAs': packetContext.packet.dst},
        'action': {'ozp:iwc:action': 'receiveAs'},
        'policies': ozpIwc.authorization.policySets.receiveAsSet
    };

    var onError = function(err){
        self.forbiddenPacketsMeter.mark();
        /** @todo do we send a "denied" message to the destination?  drop?  who knows? */
        ozpIwc.metrics.counter("transport.packets.forbidden").inc();
        console.error("failure",err);
    };

    ozpIwc.authorization.isPermitted(request,this)
        .success(function() {
            ozpIwc.authorization.formatCategory(packetContext.packet.permissions)
                .success(function(permissions) {
                    var request = {
                        'subject': self.permissions.getAll(),
                        'resource':permissions || {},
                        'action': {'ozp:iwc:action': 'read'},
                        'policies': ozpIwc.authorization.policySets.readSet
                    };

                    ozpIwc.authorization.isPermitted(request, self)
                        .success(function (resolution) {
                            self.receivedPacketsMeter.mark();
                            if(packetContext.packet.time) {
                                self.latencyInTimer.mark(ozpIwc.util.now() - packetContext.packet.time);
                            }

                            self.receiveFromRouterImpl(packetContext);
                        }).failure(onError);
                }).failure(onError);
        }).failure(onError);
};

/**
 * Overridden by inherited Participants.
 *
 * @override
 * @method receiveFromRouterImple
 * @param packetContext
 * @returns {Boolean}
 */
ozpIwc.Participant.prototype.receiveFromRouterImpl = function (packetContext) {
    // doesn't really do anything other than return a bool and prevent "unused param" warnings
    return !packetContext;
};

/**
 * Connects the participant to a given router.
 *
 * Fires:
 *     - {{#crossLink "ozpIwc.Participant/#connectedToRouter:event"}}{{/crossLink}}
 *
 * @method connectToRouter
 * @param {ozpIwc.Router} router The router to connect to
 * @param {String} address The address to assign to the participant.
 */
ozpIwc.Participant.prototype.connectToRouter=function(router,address) {
    this.address=address;
    this.router=router;
    this.msgId=0;
    if(this.name) {
        this.metricRoot="participants."+ this.name +"." + this.address.split(".").reverse().join(".");
    } else {
        this.metricRoot="participants."+ this.address.split(".").reverse().join(".");
    }
    this.sentPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"sentPackets").unit("packets");
    this.receivedPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"receivedPackets").unit("packets");
    this.forbiddenPacketsMeter=ozpIwc.metrics.meter(this.metricRoot,"forbiddenPackets").unit("packets");
    this.latencyInTimer=ozpIwc.metrics.timer(this.metricRoot,"latencyIn").unit("packets");
    this.latencyOutTimer=ozpIwc.metrics.timer(this.metricRoot,"latencyOut").unit("packets");
    
    this.namesResource="/address/"+this.address;
    this.heartBeatStatus.address=this.address;
    this.heartBeatStatus.name=this.name;
    this.heartBeatStatus.type=this.participantType || this.constructor.name;

    this.events.trigger("connectedToRouter");
    this.joinEventChannel();
};

/**
 * Populates fields relevant to this packet if they aren't already set:
 * src, ver, msgId, and time.
 *
 * @method fixPacket
 * @param {ozpIwc.TransportPacket} packet
 *
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.Participant.prototype.fixPacket=function(packet) {
    // clean up the packet a bit on behalf of the sender
    packet.src=packet.src || this.address;
    packet.ver = packet.ver || 1;

    // if the packet doesn't have a msgId, generate one
    packet.msgId = packet.msgId || this.generateMsgId();

    // might as well be helpful and set the time, too
    packet.time = packet.time || ozpIwc.util.now();
    return packet;
};

/**
 * Sends a packet to this participants router.  Calls fixPacket
 * before doing so.
 *
 * @method send
 * @param {ozpIwc.TransportPacket} packet
 *
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.Participant.prototype.send=function(packet) {
    var self = this;
    var request = {
        'subject': this.permissions.getAll(),
        'resource': {'ozp:iwc:sendAs': packet.src},
        'action': {'ozp:iwc:action': 'sendAs'},
        'policies': ozpIwc.authorization.policySets.sendAsSet
    };
    packet = self.fixPacket(packet);
    ozpIwc.authorization.isPermitted(request,self)
        .success(function(resolution) {
            self.sentPacketsMeter.mark();
            if(packet.time) {
                self.latencyOutTimer.mark(ozpIwc.util.now() - packet.time);
            }
            self.router.send(packet, self);
        }).failure(function(e){
            console.error("Participant " + self.address + " failed to send a packet:",e,packet);
        });
    return packet;
};

/**
 * Creates a message id for a packet by iterating {{#crossLink "ozpIwc.Participant.msgId"}}{{/crossLink}}
 *
 * @method generateMsgId
 * @returns {string}
 */
ozpIwc.Participant.prototype.generateMsgId=function() {
    return "i:" + this.msgId++;
};

/**
 * Sends a heartbeat packet to Participant's router.
 *
 * @method heartbeat
 */
ozpIwc.Participant.prototype.heartbeat=function() {
    if(this.router) {
        this.send({
            'dst': "names.api",
            'resource': this.namesResource,
            'action' : "set",
            'entity' : this.heartBeatStatus,
            'contentType' : this.heartBeatContentType
        });
    }
};

/**
 * Adds this participant to the $bus.multicast multicast group.
 *
 * @method joinEventChannel
 * @returns {boolean}
 */
ozpIwc.Participant.prototype.joinEventChannel = function() {
    if(this.router) {
        this.router.registerMulticast(this, ["$bus.multicast"]);
        this.send({
            dst: "$bus.multicast",
            action: "connect",
            entity: {
                address: this.address,
                participantType: this.participantType
            }
        });
        return true;
    } else {
        return false;
    }
};

/**
 * Remove this participant from the $bus.multicast multicast group.
 *
 * @method leaveEventChannel
 */
ozpIwc.Participant.prototype.leaveEventChannel = function() {
    if(this.router) {
        this.send({
            dst: "$bus.multicast",
            action: "disconnect",
            entity: {
                address: this.address,
                participantType: this.participantType,
                namesResource: this.namesResource
            }
        });
        //TODO not implemented
//        this.router.unregisterMulticast(this, ["$bus.multicast"]);
        return true;
    } else {
        return false;
    }

};