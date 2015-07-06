
describe("Router", function() {
    var router;
    var fakePeer;

    beforeEach(function() {
        fakePeer = new ozpIwc.Event();
        fakePeer.packets = [];
        fakePeer.send = function(packet) {
            fakePeer.packets.push(packet);
        };

        router = new ozpIwc.Router({peer: fakePeer});
        });

    afterEach(function() {
        router.shutdown();
        router = null;
        fakePeer = {
            packets: [],
            send : function(){}
        };
    });

    describe("Participant registration", function() {
        var participant;
        beforeEach(function() {
            participant = new TestParticipant({origin: "foo.com"});
        });

        it("returns and assigns a participant id", function() {
            var participantId = router.registerParticipant(participant, {});
            expect(participantId).toBeDefined();
            expect(participant.address).toEqual(participantId);
        });

        it("assigns a participant id derived from the router id", function() {
            var participantId = router.registerParticipant(participant, {});

            expect(participantId).toMatch(new RegExp("(.*)\\." + router.selfId));
        });

        it("calls registration handlers", function() {
            var called = false;

            router.on("preRegisterParticipant", function(event) {
                expect(event.participant).toEqual(participant);
                called = true;
            });

            router.registerParticipant(participant, {});
            expect(called).toEqual(true);
        });

        it("blocks a participant if the handler cancels", function() {
            router.on("preRegisterParticipant", function(event) {
                if (event.participant.origin === "badguy.com") {
                    event.cancel("badguy");
                }
            });

            var badParticipant = new TestParticipant({origin: "badguy.com"});

            router.registerParticipant(participant, {});
            router.registerParticipant(badParticipant, {});

            expect(participant.address).not.toBeNull();
            expect(badParticipant.address).toBeUndefined();
        });
    });

    describe("Sending packets", function() {
        var participant;
        var participant2;

        beforeEach(function() {
            participant = new TestParticipant({origin: "foo.com"});
            participant2 = new TestParticipant({origin: "bar.com"});

            router.registerParticipant(participant);
            router.registerParticipant(participant2);
        });

        it("forwards connection packets",function(){
            expect(fakePeer.packets).toContain(jasmine.objectContaining({
                'action': "connect",
                'src': participant.address
            }));
            expect(fakePeer.packets).toContain(jasmine.objectContaining({
                'action': "connect",
                'src': participant2.address
            }));
        });

        it("forwards to peer", function() {
            var msg = participant.fixPacket({dst: "fakeName"});
            router.send(msg, participant);
            expect(fakePeer.packets).toContain(msg);
        });

        it("routes locally", function() {
            participant2.packets = [];
            var msg =  participant.fixPacket({dst: participant2.address});
            router.send(msg, participant);
            expect(participant2.packets[0].packet).toEqual(msg);
            expect(participant2.packets[0].srcParticipant).toBe(participant);
            expect(participant2.packets[0].dstParticipant).toBe(participant2);
        });
    });

    describe("Secure routing", function() {
        var participant;
        var participant2;

        beforeEach(function() {
            participant = new TestParticipant({origin: "foo.com"});
            participant2 = new TestParticipant({origin: "bar.com"});

            router.registerParticipant(participant);
            router.registerParticipant(participant2);
            participant.permissions.pushIfNotExist("ozp:iwc:perm",'shared');
            participant2.permissions.pushIfNotExist("ozp:iwc:perm",'shared');

            participant.permissions.pushIfNotExist("ozp:iwc:color",'blue');
            participant2.permissions.pushIfNotExist("ozp:iwc:color",'red');
        });

        it("allows receipt of shared permissions", function(done) {
            participant2.on("receive", function onreceive(packetContext) {
                expect(packetContext.packet.entity).toEqual({foo: "bar"});
                participant2.off("receive",onreceive);
                done();
            });
            participant.send({
                dst: participant2.address,
                permissions: {
                    'ozp:iwc:perm': "shared"
                },
                entity: {foo: "bar"}
            });
        });

        it("denies receipt of unshared permissions", function() {
            var msg = {
                dst: participant2.address,
                permissions: {'ozp:iwc:color': "blue"},
                entity: {foo: "bar"}
            };

            participant.send(msg);

            expect(participant2.packets).not.toContain(jasmine.objectContaining(msg));
        });

        it("denies if the recipient doesn't have all permissions", function() {
            var msg = {
                dst: participant2.address,
                permissions: {'ozp:iwc:perm': "shared", 'ozp:iwc:color': "blue"},
                entity: {foo: "bar"}
            };
            participant.send(msg);

            expect(participant2.packets).not.toContain(jasmine.objectContaining(msg));
        });

        it("allows a participant to send a packet to require permissions that it doesn't have, itself", function(done) {
            participant2.on("receive", function onreceive(packetContext) {
                expect(packetContext.packet.entity).toEqual({foo: "bar"});
                participant2.off("receive",onreceive);
                done();
            });
            participant.send({
                dst: participant2.address,
                permissions: {'ozp:iwc:color': "red"},
                entity: {'foo': "bar"}
            });

        });

    });

});
