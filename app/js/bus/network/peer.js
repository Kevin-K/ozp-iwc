
/**
 * The peer handles low-level broadcast communications between multiple browser contexts.
 * Links do the actual work of moving the packet to other browser contexts.  The links
 * call {{#crossLink "ozpIwc.Peer/receive:method"}}{{/crossLink}} when they need to deliver a packet to this peer and
 * hook the {{#crossLink "ozpIwc.Peer/send:method"}}{{/crossLink}} event in order to send packets.
 * @class Peer
 * @namespace ozpIwc
 * @constructor
 * @mixin ozpIwc.Events
 */
ozpIwc.Peer=function() {


    /**
     * A generated random 4 byte id
     * @property selfId
     * @type String
     * @default {{#crossLink "ozpIwc.util/generateId:method"}}{{/crossLink}}
     */
    this.selfId=ozpIwc.util.generateId();

    this.metricPrefix="peer."+this.selfId;

    /**
     * @TODO (DOC)
     * @property sequenceCounter
     * @type Number
     * @default 0
     */
    this.sequenceCounter=0;

    /**
     * A history of packets seen from each peer. Each key is a peer name, each value is an array of the last 50 packet
     * ids seen.
     * @property packetsSeen
     * @type Object
     * @default {}
     */
    this.packetsSeen={};

    /**
     * @property knownPeers
     * @type Object
     * @default {}
     */
    this.knownPeers={};

    /**
     * Eventing module for the Peer.
     * @property events
     * @type ozpIwc.Event
     * @default ozpIwc.Event
     */
    this.events=new ozpIwc.Event();
    this.events.mixinOnOff(this);

    var self=this;

    // Shutdown handling
    this.unloadListener=function() {
        self.shutdown();
    };
    ozpIwc.util.addEventListener('beforeunload',this.unloadListener);

};

/**
 * The peer has received a packet from other peers.
 * @event #receive
 *
 * @param {ozpIwc.NetworkPacket} packet
 * @param {String} linkId
 */


/**
 * A cancelable event that allows listeners to override the forwarding of
 * a given packet to other peers.
 * @event #preSend
 * @extends ozpIwc.CancelableEvent
 *
 * @param {ozpIwc.NetworkPacket} packet
 */

/**
 * Notifies that a packet is being sent to other peers.  Links should use this
 * event to forward packets to other peers.
 * @event #send
 *
 * @param {ozpIwc.NetworkPacket} packet
 */

/**
 * Fires when the peer is being explicitly or implicitly shut down.
 * @event #beforeShutdown
 */

/**
 * Number of sequence Id's held in an entry of {{#crossLink "ozpIwc.Peer/packetsSeen:property"}}{{/crossLink}}
 * @property maxSeqIdPerSource
 * @static
 * @type Number
 * @default 500
 */
ozpIwc.Peer.maxSeqIdPerSource=500;

/**
 * Determine if the peer has already seen the packet in question.
 *
 * @method haveSeen
 * @param {ozpIwc.NetworkPacket} packet
 *
 * @returns {Boolean}
 */
ozpIwc.Peer.prototype.haveSeen=function(packet) {
    // don't forward our own packets
    if (packet.srcPeer === this.selfId) {
        ozpIwc.metrics.counter(this.metricPrefix,'droppedOwnPacket').inc();
        return true;
    }
    var seen = this.packetsSeen[packet.srcPeer];
    if (!seen) {
        seen = this.packetsSeen[packet.srcPeer] = [];
    }

    // abort if we've seen the packet before
    if (seen.indexOf(packet.sequence) >= 0) {
        return true;
    }

    //remove oldest array members when truncate needed
    seen.unshift(packet.sequence);
    if (seen.length >= ozpIwc.Peer.maxSeqIdPerSource) {
        seen.length = ozpIwc.Peer.maxSeqIdPerSource;
    }
    return false;
};

/**
 * Used by routers to broadcast a packet to network.
 *
 * Fires:
 *   - {{#crossLink "ozpIwc.Peer/#preSend:event"}}{{/crossLink}}
 *   - {{#crossLink "ozpIwc.Peer/#send:event"}}{{/crossLink}}
 *
 * @method send
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.Peer.prototype.send= function(packet) {
    var networkPacket={
        srcPeer: this.selfId,
        sequence: this.sequenceCounter++,
        data: packet
    };

    var preSendEvent=new ozpIwc.CancelableEvent({'packet': networkPacket});

    this.events.trigger("preSend",preSendEvent);
    if(!preSendEvent.canceled) {
        ozpIwc.metrics.counter(this.metricPrefix,'sent').inc();
        if(packet.time) {
            ozpIwc.metrics.timer(this.metricPrefix,'latencyOut').mark(ozpIwc.util.now() - packet.time);
        }
        this.events.trigger("send",{'packet':networkPacket});
    } else {
        ozpIwc.metrics.counter(this.metricPrefix,'sendRejected').inc();
    }
};

/**
 * Called by the links when a new packet is received.
 *
 * Fires:
 *   - {{#crossLink "ozpIwc.Peer/#receive:event"}}{{/crossLink}}
 *
 * @method receive
 * @param {String} linkId
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.Peer.prototype.receive=function(linkId,packet) {
    // drop it if we've seen it before
    if(this.haveSeen(packet)) {
        ozpIwc.metrics.counter(this.metricPrefix,'dropped').inc();
        return;
    }
    ozpIwc.metrics.counter(this.metricPrefix,'received').inc();
    if(packet.data.time) {
        ozpIwc.metrics.timer(this.metricPrefix,'latencyIn').mark(ozpIwc.util.now() - packet.data.time);
    }

    this.events.trigger("receive",{'packet':packet,'linkId': linkId});
};

/**
 * Explicitly shuts down the peer.
 *
 * Fires:
 *   - {{#crossLink "ozpIwc.Peer/#receive:event"}}{{/crossLink}}
 *
 * @method shutdown
 */
ozpIwc.Peer.prototype.shutdown=function() {
    this.events.trigger("beforeShutdown");
    ozpIwc.util.removeEventListener('beforeunload',this.unloadListener);
};


/**
 * Various packet definitions for the network aspects of the IWC. These are not instantiable, rather guidelines for
 * conforming to classes that use them.
 * @module bus.network
 * @submodule bus.network.packets
 */

/**
 * Network Packets
 * @class NetworkPacket
 * @namespace ozpIwc
 */

/**
 * The id of the peer who broadcast this packet.
 * @property srcPeer
 * @type String
 */

/**
 * A monotonically increasing, unique identifier for this packet.
 * @property sequence
 * @type String
 */

/**
 * The payload of this packet.
 * @property data
 * @type Object
 */


/**
 * Packet format for the data property of ozpIwc.NetworkPacket when working with fragmented packets.
 * @class FragmentPacket
 * @namespace ozpIwc
 */

/**
 * Flag for knowing this is a fragment packet. Should be true.
 * @property fragment
 * @type boolean
 */

/**
 * The msgId from the TransportPacket broken up into fragments.
 * @property msgId
 * @type Number
 */

/**
 * The position amongst other fragments of the TransportPacket.
 * @property id
 * @type Number
 */

/**
 * Total number of fragments of the TransportPacket expected.
 * @property total
 * @type Number
 */

/**
 * A segment of the TransportPacket in string form.
 * @property chunk
 * @type String
 */

/**
 * Storage for Fragment Packets
 * @class ozpIwc.FragmentStore
 */

/**
 *  The sequence of the latest fragment received.
 * @property sequence
 * @type Number
 */

/**
 * The total number of fragments expected.
 * @property total
 * @type Number
 */

/**
 * The srcPeer of the fragments expected.
 * @property srcPeer
 * @type String
 */

/**
 * String segments of the TransportPacket.
 * @property chunks
 * @type Array[String]
 */
