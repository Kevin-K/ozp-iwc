/** @namespace **/

/**
 * Classes related to security aspects of the IWC.
 * @module bus
 * @submodule bus.network
 */

/**
 * <p>This link connects peers using the HTML5 localstorage API.  It is a second generation version of
 * the localStorageLink that bypasses most of the garbage collection issues.
 *
 * <p> When a packet is sent, this link turns it to a string, creates a key with that value, and
 * immediately deletes it.  This still sends the storage event containing the packet as the key.
 * This completely eliminates the need to garbage collect the localstorage space, with the associated
 * mutex contention and full-buffer issues.
 *
 * @todo Compress the key
 *
 * @class KeyBroadcastLocalStorageLink
 * @namespace ozpIwc
 * @constructor
 *
 * @param {Object} [config] Configuration for this link
 * @param {ozpIwc.Peer} [config.peer=ozpIwc.defaultPeer] The peer to connect to.
 * @param {String} [config.prefix='ozpIwc'] Namespace for communicating, must be the same for all peers on the same network.
 * @param {String} [config.selfId] Unique name within the peer network.  Defaults to the peer id.
 * @param {Number} [config.maxRetries] Number of times packet transmission will retry if failed. Defaults to 6.
 * @param {Number} [config.queueSize] Number of packets allowed to be queued at one time. Defaults to 1024.
 * @param {Number} [config.fragmentSize] Size in bytes of which any TransportPacket exceeds will be sent in FragmentPackets.
 * @param {Number} [config.fragmentTime] Time in milliseconds after a fragment is received and additional expected
 * fragments are not received that the message is dropped.
 */
ozpIwc.KeyBroadcastLocalStorageLink = function (config) {
    config = config || {};

    /**
     * Namespace for communicating, must be the same for all peers on the same network.
     * @property prefix
     * @type String
     * @default "ozpIwc"
     */
    this.prefix = config.prefix || 'ozpIwc';

    /**
     * The peer this link will connect to.
     * @property peer
     * @type ozpIwc.Peer
     * @default ozpIwc.defaultPeer
     */
    this.peer = config.peer || ozpIwc.defaultPeer;

    /**
     * Unique name within the peer network.  Defaults to the peer id.
     * @property selfId
     * @type String
     * @default ozpIwc.defaultPeer.selfId
     */
    this.selfId = config.selfId || this.peer.selfId;

    this.metricsPrefix="keyBroadcastLocalStorageLink."+this.selfId;
    this.droppedFragmentsCounter=ozpIwc.metrics.counter(this.metricsPrefix,'fragmentsDropped');
    this.fragmentsReceivedCounter=ozpIwc.metrics.counter(this.metricsPrefix,'fragmentsReceived');

    this.packetsSentCounter=ozpIwc.metrics.counter(this.metricsPrefix,'packetsSent');
    this.packetsReceivedCounter=ozpIwc.metrics.counter(this.metricsPrefix,'packetsReceived');
    this.packetParseErrorCounter=ozpIwc.metrics.counter(this.metricsPrefix,'packetsParseError');
    this.packetsFailedCounter=ozpIwc.metrics.counter(this.metricsPrefix,'packetsFailed');
    
    this.latencyInTimer=ozpIwc.metrics.timer(this.metricsPrefix,'latencyIn');
    this.latencyOutTimer=ozpIwc.metrics.timer(this.metricsPrefix,'latencyOut');
    /**
     * Milliseconds to wait before deleting this link's keys
     * @todo UNUSUED
     * @property myKeysTimeout
     * @type Number
     * @default 5000
     */
    this.myKeysTimeout = config.myKeysTimeout || 5000; // 5 seconds

    /**
     * Milliseconds to wait before deleting other link's keys
     * @todo UNUSUED
     * @property otherKeysTimeout
     * @type Number
     * @default 120000
     */
    this.otherKeysTimeout = config.otherKeysTimeout || 2 * 60000; // 2 minutes


    /**
     * The maximum number of retries the link will take to send a package. A timeout of
     * max(1, 2^( <retry count> -1) - 1) milliseconds occurs between send attempts.
     * @property maxRetries
     * @type Number
     * @default 6
     */
    this.maxRetries = config.maxRetries || 6;

    /**
     * Maximum number of packets that can be in the send queue at any given time.
     * @property queueSize
     * @type Number
     * @default 1024
     */
    this.queueSize = config.queueSize || 1024;

    /**
     * A queue for outgoing packets. If this queue is full further packets will not be added.
     * @property sendQueue
     * @type Array[]
     * @default []
     */
    this.sendQueue = this.sendQueue || [];

    /**
     * An array of temporarily held received packet fragments indexed by their message key.
     * @type Array[]
     * @default []
     */
    this.fragments = this.fragments || [];

    /**
     * Minimum size in bytes that a packet will broken into fragments.
     * @property fragmentSize
     * @type Number
     * @default 1310720
     */
    this.fragmentSize = config.fragmentSize || (5 * 1024 * 1024) / 2 / 2; //50% of 5mb, divide by 2 for utf-16 characters

    /**
     * The amount of time allotted to the Link to wait between expected fragment packets. If an expected fragment
     * is not received within this timeout the packet is dropped.
     * @property fragmentTimeout
     * @type Number
     * @default 1000
     */
    this.fragmentTimeout = config.fragmentTimeout || 1000; // 1 second

    //Add fragmenting capabilities
    String.prototype.chunk = function (size) {
        var res = [];
        for (var i = 0; i < this.length; i += size) {
            res.push(this.slice(i, i + size));
        }
        return res;
    };

    // Hook into the system
    var self = this;
    var packet;
    var receiveStorageEvent = function (event) {
        if(event.newValue) {
            try {
                packet = JSON.parse(event.newValue);
            } catch (e) {
                ozpIwc.log.log("Parse error on " + event.newValue);
                self.packetParseErrorCounter.inc();
                return;
            }
            if (packet.data.fragment) {
                self.handleFragment(packet);
            } else {
                self.forwardToPeer(packet);
            }
        }
    };
    if(ozpIwc.util.getInternetExplorerVersion() >= 0) {
        // IE can keep storage events between refreshes.  If we give it a second, it'll
        // dump all of them on the floor
        window.setTimeout(function () {
            ozpIwc.util.addEventListener('storage', receiveStorageEvent);
        }, 500);
    } else {
        ozpIwc.util.addEventListener('storage', receiveStorageEvent);
    }

    this.peer.on("send", function (event) {
        self.send(event.packet);
    });

    this.peer.on("beforeShutdown", function () {
        ozpIwc.util.removeEventListener('storage', receiveStorageEvent);
    }, this);

};

ozpIwc.KeyBroadcastLocalStorageLink.prototype.forwardToPeer=function(packet) {
    this.peer.receive(this.linkId, packet);
    this.packetsReceivedCounter.inc();
    if(packet.data.time) {
        this.latencyInTimer.mark(ozpIwc.util.now() - packet.data.time);
    }
};

/**
 * Handles fragmented packets received from the router. When all fragments of a message have been received,
 * the resulting packet will be passed on to the
 * {{#crossLink "ozpIwc.KeyBroadcastLocalStorageLink/peer:property"}}registered peer{{/crossLink}}.
 *
 * @method handleFragment
 * @param {ozpIwc.NetworkPacket} packet NetworkPacket containing an ozpIwc.FragmentPacket as its data property
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.handleFragment = function (packet) {
    // Check to make sure the packet is a fragment and we haven't seen it
    if (this.peer.haveSeen(packet)) {
        return;
    }

    var key = packet.data.msgId;

    this.storeFragment(packet);

    var defragmentedPacket = this.defragmentPacket(this.fragments[key]);

    if (defragmentedPacket) {

        // clear the fragment timeout
        window.clearTimeout(this.fragments[key].fragmentTimer);

        // Remove the last sequence from the known packets to reuse it for the defragmented packet
        var packetIndex = this.peer.packetsSeen[defragmentedPacket.srcPeer].indexOf(defragmentedPacket.sequence);
        delete this.peer.packetsSeen[defragmentedPacket.srcPeer][packetIndex];

        this.forwardToPeer(defragmentedPacket);

        delete this.fragments[key];
    }
};

/**
 *  Stores a received fragment. When the first fragment of a message is received, a timer is set to destroy the storage
 *  of the message fragments should not all messages be received.
 *
 * @method storeFragment
 * @param {ozpIwc.NetworkPacket} packet NetworkPacket containing an {{#crossLink "ozpIwc.FragmentPacket"}}{{/crossLink}} as its data property
 *
 * @returns {Boolean} result true if successful.
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.storeFragment = function (packet) {
    if (!packet.data.fragment) {
        return null;
    }

    // NetworkPacket properties
    var sequence = packet.sequence;
    var srcPeer = packet.srcPeer;
    // FragmentPacket Properties
    var key = packet.data.msgId;
    var id = packet.data.id;
    var chunk = packet.data.chunk;
    var total = packet.data.total;

    if (key === undefined || id === undefined) {
        return null;
    }

    // If this is the first fragment of a message, add the storage object
    if (!this.fragments[key]) {
        this.fragments[key] = {};
        this.fragments[key].chunks = [];

        var self = this;
        self.key = key;
        self.total = total ;

        // Add a timeout to destroy the fragment should the whole message not be received.
        this.fragments[key].timeoutFunc = function () {
            self.droppedFragmentsCounter.inc(self.total);
            delete self.fragments[self.key];
        };
    }

    // Restart the fragment drop countdown
    window.clearTimeout(this.fragments[key].fragmentTimer);
    this.fragments[key].fragmentTimer = window.setTimeout(this.fragments[key].timeoutFunc, this.fragmentTimeout);

    // keep a copy of properties needed for defragmenting, the last sequence & srcPeer received will be
    // reused in the defragmented packet
    this.fragments[key].total = total || this.fragments[key].total ;
    this.fragments[key].sequence = (sequence !== undefined) ? sequence : this.fragments[key].sequence;
    this.fragments[key].srcPeer = srcPeer || this.fragments[key].srcPeer;
    this.fragments[key].chunks[id] = chunk;

    // If the necessary properties for defragmenting aren't set the storage fails
    if (this.fragments[key].total === undefined || this.fragments[key].sequence === undefined ||
        this.fragments[key].srcPeer === undefined) {
        return null;
    } else {
        this.fragmentsReceivedCounter.inc();
        return true;
    }
};

/**
 * Rebuilds the original packet sent across the keyBroadcastLocalStorageLink from the fragments it was broken up into.
 *
 * @method defragmentPacket
 * @param {ozpIwc.FragmentStore} fragments the grouping of fragments to reconstruct
 *
 * @returns {ozpIwc.NetworkPacket} result the reconstructed NetworkPacket with TransportPacket as its data property.
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.defragmentPacket = function (fragments) {
    if (fragments.total !== fragments.chunks.length) {
        return null;
    }
    try {
        var result = JSON.parse(fragments.chunks.join(''));
        return {
            defragmented: true,
            sequence: fragments.sequence,
            srcPeer: fragments.srcPeer,
            data: result
        };
    } catch (e) {
        return null;
    }
};

/**
 * Publishes a packet to other peers. If the sendQueue is full the send will not occur. If the TransportPacket is larger
 * than the {{#crossLink "ozpIwc.KeyBroadcastLocalStorageLink/fragmentSize:property"}}{{/crossLink}}, an
 * {{#crossLink "ozpIwc.FragmentPacket"}}{{/crossLink}} will be sent instead.
 *
 * @method send
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.send = function (packet) {
    var str;
    try {
       str = JSON.stringify(packet.data);
    } catch (e){
        this.packetsFailedCounter.inc();
        var msgId = packet.msgId || "unknown";
        ozpIwc.log.error("Failed to write packet(msgId=" + msgId+ "):" + e.message);
        return;
    }

    if (str.length < this.fragmentSize) {
        this.queueSend(packet);
    } else {
        var fragments = str.chunk(this.fragmentSize);

        // Use the original packet as a template, delete the data and
        // generate new packets.
        var self = this;
        self.data= packet.data;
        delete packet.data;

        var fragmentGen = function (chunk, template) {

            template.sequence = self.peer.sequenceCounter++;
            template.data = {
                fragment: true,
                msgId: self.data.msgId,
                id: i,
                total: fragments.length,
                chunk: chunk
            };
            return template;
        };

        // Generate & queue the fragments
        for (var i = 0; i < fragments.length; i++) {
            this.queueSend(fragmentGen(fragments[i], packet));
        }
    }
};

/**
 * Places a packet in the {{#crossLink "ozpIwc.KeyBroadcastLocalStorageLink/sendQueue:property"}}{{/crossLink}}
 * if it does not already hold {{#crossLink "ozpIwc.KeyBroadcastLocalStorageLink/queueSize:property"}}{{/crossLink}}
 * amount of packets.
 *
 * @method queueSend
 * @param packet
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.queueSend = function (packet) {
    if (this.sendQueue.length < this.queueSize) {
        this.sendQueue = this.sendQueue.concat(packet);
        while (this.sendQueue.length > 0) {
            this.attemptSend(this.sendQueue.shift());
        }
    } else {
        this.packetsFailedCounter.inc();
        ozpIwc.log.error("Failed to write packet(len=" + packet.length + "):" + " Send queue full.");
    }
};

/**
 * Recursively tries sending the packet
 * {{#crossLink "ozpIwc.KeyBroadcastLocalStorageLink/maxRetries:property"}}{{/crossLink}} times.
 * The packet is dropped and the send fails after reaching max attempts.
 *
 * @method attemptSend
 * @param {ozpIwc.NetworkPacket} packet
 * @param {Number} [attemptCount] number of times attempted to send packet.
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.attemptSend = function (packet, retryCount) {

    var sendStatus = this.sendImpl(packet);
    if (sendStatus) {
        var self = this;
        retryCount = retryCount || 0;
        var timeOut = Math.max(1, Math.pow(2, (retryCount - 1))) - 1;

        if (retryCount < self.maxRetries) {
            retryCount++;
            // Call again but back off for an exponential amount of time.
            window.setTimeout(function () {
                self.attemptSend(packet, retryCount);
            }, timeOut);
        } else {
            this.packetsFailedCounter.inc();
            ozpIwc.log.error("Failed to write packet(len=" + packet.length + "):" + sendStatus);
            return sendStatus;
        }
    }
};

/**
 * Implementation of publishing packets to peers through localStorage. If the localStorage is full or a write collision
 * occurs, the send will not occur. Returns status of localStorage write, null if success.
 *
 * @todo move counter.inc() out of the impl and handle in attemptSend?
 * @method sendImpl
 * @param {ozpIwc.NetworkPacket} packet
 */
ozpIwc.KeyBroadcastLocalStorageLink.prototype.sendImpl = function (packet) {
    var sendStatus;
    try {
        var p = JSON.stringify(packet);
        localStorage.setItem("x", p);
        this.packetsSentCounter.inc();
        if(packet.data.time) {
            this.latencyOutTimer.mark(ozpIwc.util.now() - packet.data.time);
        }
        localStorage.removeItem("x");
        sendStatus = null;
    }
    catch (e) {
        if(e.message === "localStorage is null"){
            // Firefox about:config dom.storage.enabled = false : no mitigation with current links
            ozpIwc.util.alert("Cannot locate localStorage. Contact your system administrator.", e);
        } else if(e.code === 18){
            // cookies disabled : no mitigation with current links
            ozpIwc.util.alert("Ozone requires your browser to accept cookies. Contact your system administrator.", e);
        } else {
            // If the error can't be mitigated, bubble it up
            sendStatus = e;
        }
    }
    finally {
        return sendStatus;
    }
};
