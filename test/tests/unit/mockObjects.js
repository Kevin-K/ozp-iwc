/* jshint unused:false */
// TestParticipant, FakePeer, and FakeRouter are used elsewhere.

//========================================================
// Fake peer that just stores the packets that it receives
//========================================================
var FakePeer = function() {
    this.events = new ozpIwc.Event();

    this.events.mixinOnOff(this);

    this.packets = [];
    this.send = function(packet) {
        this.packets.push(packet);
    };
};

//========================================================
// TestParticipant for connecting to a router
//========================================================
var TestParticipant = ozpIwc.util.extend(ozpIwc.ClientParticipant, function(config) {
    config = config || {};
    this.sentPacketObjs = [];
    this.packets = [];
    this.activeStates = config.activeStates || {
        'leader': true,
        'member': false,
        'election': false,
        'queueing': false
    };


    ozpIwc.ClientParticipant.apply(this, arguments);
    config = config || {};
    this.origin = config.origin || "foo.com";
    this.address = config.staticAddress;
    // since we aren't connecting to a router, mock these out, too
    this.metricRoot = "testparticipant";
    this.participantType="testParticipant";
    this.sentPacketsMeter = ozpIwc.metrics.meter(this.metricRoot, "sentPackets");
    this.receivedPacketsMeter = ozpIwc.metrics.meter(this.metricRoot, "receivedPackets");
    this.forbiddenPacketsMeter = ozpIwc.metrics.meter(this.metricRoot, "forbiddenPackets");

    // mock common permission attributes (that would be assigned on router/multicast connections)
    this.events.trigger('connectedToRouter');


    this.router = {
        'send': function() {
        }
    };
});

TestParticipant.prototype.receiveFromRouter = function(packet) {
    this.packets.push(packet);
    return ozpIwc.ClientParticipant.prototype.receiveFromRouter.call(this, packet);
};

TestParticipant.prototype.sendImpl = function(packet, callback) {
    this.sentPacketObjs.push(packet);
    try {
        packet = ozpIwc.ClientParticipant.prototype.send.call(this, packet, callback);
    } catch (e) {
        packet=e;
    }
    // tick to trigger the async send
    ozpIwc.testUtil.tick(0);
};

TestParticipant.prototype.reply = function(originalPacket, packet, callback) {
    packet.ver = packet.ver || originalPacket.ver || 1;
    packet.src = packet.src || originalPacket.dst || this.address;
    packet.dst = packet.dst || originalPacket.src;// || config.dst;
    packet.msgId = packet.msgId || this.messageId++;
    packet.time = packet.time || new Date().getTime();

    packet.replyTo = originalPacket.msgId;

    packet.action = packet.action || originalPacket.action;
    packet.resource = packet.resource || originalPacket.resource;

    this.sentPacketObjs.push(packet);

    if (callback) {
        this.callbacks[packet.msgId] = callback;
    }
    if (this.router) {
        this.router.send(packet, this);
    }
    return packet;
};


var TestClientParticipant=ozpIwc.util.extend(TestParticipant,function() {
    TestParticipant.apply(this,arguments);
    this.participantType="testClientParticipant";
});


//================================================
// Packetbuilders for testing API classes
//================================================
var TestPacketContext = ozpIwc.util.extend(ozpIwc.TransportPacketContext, function() {
    ozpIwc.TransportPacketContext.apply(this, arguments);
    var self = this;
    this.responses = [];
    this.router = {
        send: function(packet) {
            self.responses.push(packet);
        }
    };
});
//================================================
// Fake Router
//================================================
var FakeRouter = function() {
    this.jitter = 0;
    this.events = new ozpIwc.Event();
    this.events.mixinOnOff(this);
    this.packetQueue=[];
    this.participants=[];
    this.send = function(packet) {
//        				console.log("Sending(" + packet.src + "): ",packet);

        if (this.packetQueue.length === 0 || Math.random() > this.jitter) {
            this.packetQueue.push(packet);
        } else {
//				console.log("JITTER!");
            this.packetQueue.splice(-1, 0, packet);
        }

    };
    this.registerParticipant = function(p) {
        p.connectToRouter(this, (this.participants.length + 1) + ".fake");
        this.participants.push(p);
    };
    this.pump = function() {
        var processed = 0;
        var recvFn = function(participants,packet) {
            participants.forEach(function(l){
                if (l.address !== packet.src) {
                    l.receiveFromRouter(new TestPacketContext({'packet': packet}));
                }
            });
        };
        while (this.packetQueue.length) {
            processed++;
            var packet = this.packetQueue.shift();
//				console.log("PACKET(" + packet.src + "): ",packet);
            recvFn(this.participants,packet);
            }
        return processed;
    };
    this.createMessage = function(m) {
        return m;
    };
    this.registerMulticast = function(participant,groups) {
        groups.forEach(function(groupName){
            participant.permissions.pushIfNotExist('ozp:iwc:sendAs', groupName);
            participant.permissions.pushIfNotExist('ozp:iwc:receiveAs', groupName);
        });
    };
};

ozpIwc.testUtil.customMatchers.toHaveSent=function(util, customEqualityTesters) { return { compare: function(participant,expected) {
    if(!((participant instanceof TestParticipant) || (participant instanceof TestPacketContext)) ) {
        return {
            pass: false,
            message: "Expected " + participant + " to be a TestParticipant"
        };
    }

    var sentPackets=participant.sentPacketObjs || participant.responses;

    var contains=util.contains(sentPackets,jasmine.objectContaining(expected),customEqualityTesters);
    return {
        pass: contains,
        message: "Expected the participant to " + (contains?"NOT ":"") + "have sent " +
            JSON.stringify(expected,null,2) +
            ", but it sent packets " +
            JSON.stringify(sentPackets,null,2)
    };
}};};
