describe("Client Participant",function() {
    var fakeRouter,participant,sentPackets;

    var makeParticipant = function(router) {
        var l = new ozpIwc.ClientParticipant({
            router: router
        });
        return l;

    };

    beforeEach(function () {
        ozpIwc.metrics=new ozpIwc.MetricsRegistry();
        fakeRouter= new FakeRouter();
        participant = makeParticipant(fakeRouter);
        ozpIwc.util.setImmediate = function(fn){
            fn.apply(arguments);
        };
        sentPackets = participant.sentPacketsMeter.get().count;
    });
    describe("api Mappings", function() {

        it("has its apiMap at construction based on the ozpIwc.apiMap", function() {
            expect(participant.apiMap['data.api']).not.toBeUndefined();
            expect(participant.apiMap['data.api'].functionName).toEqual('data');
            expect(participant.apiMap['data.api'].address).toEqual('data.api');
            expect(participant.apiMap['data.api'].actions.length).toBeGreaterThan(0);

            expect(participant.apiMap['names.api']).not.toBeUndefined();
            expect(participant.apiMap['names.api'].functionName).toEqual('names');
            expect(participant.apiMap['names.api'].address).toEqual('names.api');
            expect(participant.apiMap['names.api'].actions.length).toBeGreaterThan(0);

            expect(participant.apiMap['intents.api']).not.toBeUndefined();
            expect(participant.apiMap['intents.api'].functionName).toEqual('intents');
            expect(participant.apiMap['intents.api'].address).toEqual('intents.api');
            expect(participant.apiMap['intents.api'].actions.length).toBeGreaterThan(0);

            expect(participant.apiMap['system.api']).not.toBeUndefined();
            expect(participant.apiMap['system.api'].functionName).toEqual('system');
            expect(participant.apiMap['system.api'].address).toEqual('system.api');
            expect(participant.apiMap['system.api'].actions.length).toBeGreaterThan(0);
        });

        it("can use the api function.",function(){
            expect(participant.api).toEqual(jasmine.any(Function));
        });

        it("creates api function calls on creation", function() {
            expect(participant.data).not.toBeUndefined();
            expect(participant.names).not.toBeUndefined();
            expect(participant.system).not.toBeUndefined();
            expect(participant.intents).not.toBeUndefined();

            expect(participant.data()).toEqual(participant.api('data.api'));
            expect(participant.names()).toEqual(participant.api('names.api'));
            expect(participant.system()).toEqual(participant.api('system.api'));
            expect(participant.intents()).toEqual(participant.api('intents.api'));
        });
    });

    describe("Send Promise Structure",function(){

        it("has its sendImpl called when it sends a packet.",function(){
            spyOn(participant,'sendImpl');
            participant.data().get("/");
            expect(participant.sendImpl).toHaveBeenCalled();
        });

        it("resolves its send promises on response.",function(done){

            var packet = participant.fixPacket({
                'dst': participant.address,
                'msgId': "p:1"
            });
            var packetContext = new TestPacketContext({packet: packet});
            participant.send(packet).then(function(resp){
                expect(resp.replyTo).toEqual(packet.msgId);
                done();
            });

            // fake the return message;
            var response = {packet: packetContext.makeReplyTo({response: "ok"})};
            participant.receiveFromRouter(response);
        });


        it("resolves its api promises on response.",function(done){
            var packet = participant.fixPacket({
                'dst': participant.address,
                'msgId': "p:1"
            });
            var packetContext = new TestPacketContext({packet: packet});
            participant.data().get("/").then(function(resp){
                expect(resp.replyTo).toEqual(packet.msgId);
                done();
            });

            // fake the return message;
            var response = {packet: packetContext.makeReplyTo({response: "ok"})};
            participant.receiveFromRouter(response);
        });

        it("handles send function watch responses.",function(done){
            var packet = participant.fixPacket({
                'dst': "data.api",
                'resource': "/foo",
                'action': "watch",
                'msgId': "p:1"
            });
            var packetContext = new TestPacketContext({packet: packet});
            participant.send(packet,function(resp,cancelCB){
                expect(resp.replyTo).toEqual(packet.msgId);
                done();
            });

            // fake the return message;
            var response = {packet: packetContext.makeReplyTo({response: "changed"})};
            participant.receiveFromRouter(response);
        });

        it("handles api function watch responses.",function(done){
            var packet = participant.fixPacket({
                'dst': "data.api",
                'resource': "/foo",
                'action': "watch",
                'msgId': "p:1"
            });
            var packetContext = new TestPacketContext({packet: packet});
            participant.data().watch("/foo",function(resp,cancelCB){
                expect(resp.replyTo).toEqual(packet.msgId);
                done();
            });

            // fake the return message;
            var response = {packet: packetContext.makeReplyTo({response: "changed"})};
            participant.receiveFromRouter(response);
        });

    });


    describe("Security",function(){
        it("permits receiving packets that have a destination matching the receiveAs Attribute", function() {
            var packet =  new TestPacketContext({
                'packet': {
                    'dst': participant.address
                }
            });
            participant.receiveFromRouter(packet);
            expect(participant.receivedPacketsMeter.get().count).toEqual(1);
        });

        it("denies receiving packets that don't have a destination matching the receiveAs Attribute", function() {
            var packet =  new TestPacketContext({
                'packet': {
                    'dst': participant.address+1
                }
            });
            participant.receiveFromRouter(packet);
            expect(participant.forbiddenPacketsMeter.get().count).toEqual(1);
        });

        it("permits sending packets that have a source matching the sendAs Attribute", function() {
            participant.send({
                'src': participant.address
            });
            expect(participant.sentPacketsMeter.get().count).toEqual(sentPackets + 1);
        });

        it("denies sending packets that don't have a source matching the sendAs Attribute", function() {
            participant.send({
                'src': participant.address+1
            });
            expect(participant.sentPacketsMeter.get().count).toEqual(sentPackets);
        });
    });
});