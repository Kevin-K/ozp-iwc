/**
 * @submodule bus.transport
 */

/**
 * @class ozpIwc.TransportPacket
 */

/**
 * The participant address that sent this packet.
 * @property src
 * @type String
 */

/**
 * The intended recipient of this packet.
 * @property dst
 * @type String
 */

/**
 * Protocol Version.  Should be 1.
 * @property ver
 * @type Number
 */

/**
 * A unique id for this packet.
 * @property msgId
 * @type Number
 */

/**
 * The payload of this packet.
 * @property entity
 * @type Object
 */

/**
 * Permissions required to see the payload of this packet.
 * @property [permissions]
 * @type Object
 */

/**
 * The time in milliseconds since epoch that this packet was created.
 * @property [time]
 * @type Number
 */

/**
 * Reference to the msgId that this is in reply to.
 * @property [replyTo]
 * @type Number
 */

/**
 * Action to be performed.
 * @property [action]
 * @type String
 */

/**
 * Resource to perform the action upon.
 * @property [resource]
 * @type String
 */

/**
 * Marker for test packets.
 * @property [test]
 * @type Boolean
*/

/**
 * @class TransportPacketContext
 * @namespace ozpIwc
 * @param {Object} config
 * @param {ozpIwc.TransportPacket} config.packet
 * @param {ozpIwc.Router} config.router
 * @param {ozpIwc.Participant} [config.srcParticpant]
 * @param {ozpIwc.Participant} [config.dstParticpant]
 */
ozpIwc.TransportPacketContext=function(config) {
    /**
     * @property packet
     * @type ozpIwc.TransportPacket
     */

    /**
     * @property router
     * @type ozpIwc.Router
     */

    /**
     * @property [srcParticipant]
     * @type ozpIwc.Participant
     */

    /**
     * @property [dstParticipant]
     * @type ozpIwc.Participant
     */
    for(var i in config) {
        this[i]=config[i];
    }
};

/**
 * Formats a response packet,
 *
 * method makeReplyTo
 * @param {Object} response
 * @param {Number} [response.ver]
 * @param {Number} [response.time]
 * @param {String} [response.replyTo]
 * @param {String} [response.src]
 * @param {String} [response.dst]
 * @returns {Object}
 */
ozpIwc.TransportPacketContext.prototype.makeReplyTo=function(response){
    var now=new Date().getTime();
    response.ver = response.ver || 1;
    response.time = response.time || now;
    response.replyTo=response.replyTo || this.packet.msgId;
    response.src=response.src || this.packet.dst;
    response.dst=response.dst || this.packet.src;
    return response;
};

/**
 * Sends the given response to the sender of this context.
 * @method replyTo
 * @param {ozpIwc.TransportPacket} response
 *
 * @returns {ozpIwc.TransportPacket} the packet that was sent
 */
ozpIwc.TransportPacketContext.prototype.replyTo=function(response) {
    response=this.makeReplyTo(response);
    if(this.dstParticipant) {
        this.dstParticipant.send(response);
    } else{
        response.msgId = response.msgId || ozpIwc.util.now();
        this.router.send(response);
    }
    return response;
};


/**
 * @class Router
 * @namespace ozpIwc
 * @constructor
 * @param {Object} [config]
 * @param {ozpIwc.Peer} [config.peer=ozpIwc.defaultPeer]
 */
/**
 * @event ozpIwc.Router#preRegisterParticipant
 * @mixes ozpIwc.CancelableEvent
 * @param {ozpIwc.TransportPacket} [packet] - The packet to be delivered
 * @param {object} registration - Information provided by the participant about it's registration
 * @param {ozpIwc.Participant} participant - The participant that will receive the packet
 */

/**
 * @event ozpIwc.Router#preSend
 * @mixes ozpIwc.CancelableEvent
 * @param {ozpIwc.TransportPacket} packet - The packet to be sent
 * @param {ozpIwc.Participant} participant - The participant that sent the packet
 */

/**
 * @event ozpIwc.Router#preDeliver
 * @mixes ozpIwc.CancelableEvent
 * @param {ozpIwc.TransportPacket} packet - The packet to be delivered
 * @param {ozpIwc.Participant} participant - The participant that will receive the packet
 */

/**
 * @event ozpIwc.Router#send
 * @param {ozpIwc.TransportPacket} packet - The packet to be delivered
 */

/**
 * @event ozpIwc.Router#prePeerReceive
 * @mixes ozpIwc.CancelableEvent
 * @param {ozpIwc.TransportPacket} packet
 * @param {ozpIwc.NetworkPacket} rawPacket
 */

ozpIwc.Router=function(config) {
    config=config || {};

    /**
     * @property peer
     * @type ozpIwc.Peer
     */
    this.peer=config.peer || ozpIwc.defaultPeer;

//	this.nobodyAddress="$nobody";
//	this.routerControlAddress='$transport';
	var self=this;

    /**
     * @property selfId
     * @type String
     */
	this.selfId=ozpIwc.util.generateId();
	
    /**
     * A key value store of all participants local to the router.
     * @property participants
     * @type Object
     * @default {}
     */
	this.participants={};
	
	ozpIwc.metrics.gauge("transport.participants").set(function() {
		return Object.keys(self.participants).length;
	});


    /**
     * Eventing module for the router.
     * @property events
     * @type ozpIwc.Event
     * @default ozpIwc.Event
     */
	this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
	
	// Wire up to the peer
	this.peer.on("receive",function(event) {
		self.receiveFromPeer(event.packet);
	});
	
	var checkFormat=function(event) {
		var message=event.packet;
		if(message.ver !== 1) {
			event.cancel("badVersion");
		}
		if(!message.src) {
			event.cancel("nullSource");
		}
		if(!message.dst) {
			event.cancel("nullDestination");
		}
		if(event.canceled) {
			ozpIwc.metrics.counter("transport.packets.invalidFormat").inc();
		}
	};
	this.events.on("preSend",checkFormat);

    if(!config.disableBus){
        this.participants["$bus.multicast"]=new ozpIwc.MulticastParticipant("$bus.multicast");
    }
    /**
     * @property watchdog
     * @type ozpIwc.RouterWatchdog
     */
	this.watchdog=new ozpIwc.RouterWatchdog({
        router: this,
        heartbeatFrequency: config.heartbeatFrequency
    });
	this.registerParticipant(this.watchdog);
    this.recursionDepth=0;
    ozpIwc.metrics.gauge('transport.router.participants').set(function() {
        return self.getParticipantCount();
    });
};

/**
 * Gets the count of participants who have registered with the router.
 * @method getParticipantCount
 *
 * @returns {Number} the number of registered participants
 */
ozpIwc.Router.prototype.getParticipantCount=function() {
    if (!this.participants || !Object.keys(this.participants)) {
        return 0;
    }
    return Object.keys(this.participants).length;

};

/**
 * @method shutdown
 */
ozpIwc.Router.prototype.shutdown=function() {
    this.watchdog.shutdown();
};

/**
 * Allows a listener to add a new participant.
 *
 * Fires:
 *     - {{#crossLink "ozpIwc.Router/#registerParticipant:event"}}{{/crossLink}}
 *
 * @method registerParticipant
 * @param {Object} participant the participant object that contains a send() function.
 * @param {Object} packet The handshake requesting registration.
 *
 * @returns {String} returns participant id
 */
ozpIwc.Router.prototype.registerParticipant=function(participant,packet) {
    packet = packet || {};
    var address;
    do {
        address=ozpIwc.util.generateId()+"."+this.selfId;
    } while(this.participants.hasOwnProperty(address));

    var registerEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'registration': packet.entity,
        'participant': participant
    });
    this.events.trigger("preRegisterParticipant",registerEvent);

    if(registerEvent.canceled){
        // someone vetoed this participant
        ozpIwc.log.log("registeredParticipant[DENIED] origin:"+participant.origin+
            " because " + registerEvent.cancelReason);
        return null;
    }

    this.participants[address] = participant;
     participant.connectToRouter(this,address);
    var registeredEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'participant': participant
    });
    this.events.trigger("registeredParticipant",registeredEvent);

//	ozpIwc.log.log("registeredParticipant["+participant_id+"] origin:"+participant.origin);
    return address;
};

/**
 * Fires:
 *     - {{#crossLink "ozpIwc.Router/#preDeliver:event"}}{{/crossLink}}
 *
 * @method deliverLocal
 * @param {ozpIwc.TransportPacket} packet
 * @param {ozpIwc.Participant} sendingParticipant
 */
ozpIwc.Router.prototype.deliverLocal=function(packet,sendingParticipant) {
    if(!packet) {
        throw "Cannot deliver a null packet!";
    }
    var localParticipant=this.participants[packet.dst];
    if(!localParticipant) {
        return;
    }
    this.recursionDepth++;
    if(this.recursionDepth > 10) {
        console.log("Recursing more than 10 levels deep on ",packet);
    }
    try {
        var packetContext=new ozpIwc.TransportPacketContext({
            'packet':packet,
            'router': this,
            'srcParticipant': sendingParticipant,
            'dstParticipant': localParticipant
        });
        
        var preDeliverEvent=new ozpIwc.CancelableEvent({
            'packet': packet,
            'dstParticipant': localParticipant,
            'srcParticipant': sendingParticipant
        });

        if(this.events.trigger("preDeliver",preDeliverEvent).canceled) {
            ozpIwc.metrics.counter("transport.packets.rejected").inc();
            return;
        }
        ozpIwc.metrics.counter("transport.packets.delivered").inc();
        localParticipant.receiveFromRouter(packetContext);
    } finally {
        this.recursionDepth--;
    }
};


/**
 * Registers a participant for a multicast group
 *
 * Fires:
 *     - {{#crossLink "ozpIwc.Router/#registerMulticast:event"}}{{/crossLink}}
 *
 * @method registerMulticast
 * @param {ozpIwc.Participant} participant
 * @param {String[]} multicastGroups
 */
ozpIwc.Router.prototype.registerMulticast=function(participant,multicastGroups) {
    var self=this;
    multicastGroups.forEach(function(groupName) {
        var g=self.participants[groupName];
        if(!g) {
            g=self.participants[groupName]=new ozpIwc.MulticastParticipant(groupName);
        }
        g.addMember(participant);
        if (participant.address) {
            var registeredEvent = new ozpIwc.CancelableEvent({
                'entity': {'group': groupName, 'address': participant.address}
            });
            participant.permissions.pushIfNotExist('ozp:iwc:sendAs', groupName);
            participant.permissions.pushIfNotExist('ozp:iwc:receiveAs', groupName);

            self.events.trigger("registeredMulticast", registeredEvent);
        } else {
            ozpIwc.log.log("no address for " +  participant.participantType + " " + participant.name + "with address " + participant.address + " for group " + groupName);
        }
        //ozpIwc.log.log("registered " + participant.participantType + " " + participant.name + "with address " + participant.address + " for group " + groupName);
    });
    return multicastGroups;
};

/**
 * Used by participant listeners to route a message to other participants.
 *
 * Fires:
 *     -{{#crossLink "ozpIwc.Router/#preSend:event"}}{{/crossLink}}
 *     -{{#crossLink "ozpIwc.Router/#send:event"}}{{/crossLink}}
 *
 * @method send
 * @param {ozpIwc.TransportPacket} packet The packet to route.
 * @param {ozpIwc.Participant} sendingParticipant Information about the participant that is attempting to send
 * the packet.
 */
ozpIwc.Router.prototype.send=function(packet,sendingParticipant) {

    var preSendEvent=new ozpIwc.CancelableEvent({
        'packet': packet,
        'participant': sendingParticipant
    });
    this.events.trigger("preSend",preSendEvent);

    if(preSendEvent.canceled) {
        ozpIwc.metrics.counter("transport.packets.sendCanceled");
        return;
    }
    ozpIwc.metrics.counter("transport.packets.sent").inc();
    this.deliverLocal(packet,sendingParticipant);
    this.events.trigger("send",{'packet': packet});
    this.peer.send(packet);
};

/**
 * Receive a packet from the peer.
 *
 * Fires:
 *     -{{#crossLink "ozpIwc.Router/#prePeerReceive:event"}}{{/crossLink}}
 *
 * @param packet {ozpIwc.TransportPacket} the packet to receive
 */
ozpIwc.Router.prototype.receiveFromPeer=function(packet) {
    ozpIwc.metrics.counter("transport.packets.receivedFromPeer").inc();
    var now = Date.now();
    ozpIwc.metrics.histogram("transport.packets.latency").mark(now-packet.data.time,now);
    var peerReceiveEvent=new ozpIwc.CancelableEvent({
        'packet' : packet.data,
        'rawPacket' : packet
    });
    this.events.trigger("prePeerReceive",peerReceiveEvent);

    if(!peerReceiveEvent.canceled){
        this.deliverLocal(packet.data);
    }
};

