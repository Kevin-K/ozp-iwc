describe("Locks API",function() {

	var locksApi;
    var sentPacketObjs;
    
	beforeEach(function() {
		locksApi=new ozpIwc.LocksApi({
			'participant': new TestParticipant()
		});
        locksApi.participant.name="locks.api";
        sentPacketObjs=locksApi.participant.sentPacketObjs = [];
	});
    
    var queueEntry=function(address,msgId) {
        msgId = msgId || "i:1";
        return {
            src: address,
            msgId: msgId
        };
    };

    var testPacket=function(src,action,msgId,resource) {
        msgId=msgId || "i:1";
        resource=resource || "/mutex/example";
        return new TestPacketContext({
            'leaderState': "leader",
            'packet': {
                'resource': resource,
                'action': action,
                'msgId': msgId,
                'src': src
            }
        });
    };
    var lockPacket=function(src,msgId,resource) { return testPacket(src,"lock",msgId,resource);};
    var unlockPacket=function(src,msgId,resource) { return testPacket(src,"unlock",msgId,resource);};
    var getPacket=function(src,msgId,resource) { return testPacket(src,"get",msgId,resource);};
    
    var ownerNotification=function(src,msgId) {
        msgId=msgId || "i:1";
        return jasmine.objectContaining({
            response: "ok",
            dst: src,
            replyTo: msgId
        });
    };

    it("gives the lock to the first requester",function() {
        locksApi.routePacket(lockPacket("12345"));

        expect(sentPacketObjs[0]).toEqual(ownerNotification("12345"));
    });

    it("passes the lock down the queue when the owner unlocks",function() {
        locksApi.routePacket(lockPacket("12345"));
        locksApi.routePacket(lockPacket("12346"));
        locksApi.routePacket(lockPacket("12347"));

        locksApi.routePacket(unlockPacket("12345"));

        expect(sentPacketObjs.length).toEqual(2);
        expect(sentPacketObjs[0]).toEqual(ownerNotification("12345"));
        expect(sentPacketObjs[1]).toEqual(ownerNotification("12346"));
    });

    
    it("removes a queued holder upon unlock, but doesn't change owner",function() {
        locksApi.routePacket(lockPacket("12345"));
        locksApi.routePacket(lockPacket("12346"));
        locksApi.routePacket(lockPacket("12347"));

        locksApi.routePacket(unlockPacket("12346"));
        
        var context = getPacket("unitTest","i:300");
        locksApi.routePacket(context);
        
        expect(context.responses[0].entity).toEqual({
            owner: queueEntry("12345"),
            queue: [
                queueEntry("12345"),
                queueEntry("12347")
            ]
        });
    });    
    it("removes an address from the queue upon disconnect",function() {
        locksApi.routePacket(lockPacket("12345"));
        locksApi.routePacket(lockPacket("12346"));
        locksApi.routePacket(lockPacket("12347"));
        locksApi.routePacket(lockPacket("12346","i:10"));
        locksApi.routePacket(lockPacket("12346","i:20"));

        //locksApi.routePacket(unlockPacket("12346"));
        locksApi.handleEventChannelDisconnectImpl({
            packet: {
                dst: "$bus.multicast",
                action: "disconnect",
                entity: {
                    address: "12346",
                    participantType: "testParticipant",
                    namesResource: "/address/12346"
                }
            }
        });
        var context = getPacket("unitTest","i:300");
        locksApi.routePacket(context);
        
        expect(context.responses[0].entity).toEqual({
            owner: queueEntry("12345"),
            queue: [
                queueEntry("12345"),
                queueEntry("12347")
            ]
        });
    });  
    
    it("passes down the lock when the leader disconnects",function() {
        locksApi.routePacket(lockPacket("12345"));
        locksApi.routePacket(lockPacket("12346"));
        locksApi.routePacket(lockPacket("12347"));


        //locksApi.routePacket(unlockPacket("12346"));
        locksApi.handleEventChannelDisconnectImpl({
            packet: {
                dst: "$bus.multicast",
                action: "disconnect",
                entity: {
                    address: "12345",
                    participantType: "testParticipant",
                    namesResource: "/address/12345"
                }
            }
        });
        
        
        var context = getPacket("unitTest","i:300");
        locksApi.routePacket(context);
        
        expect(sentPacketObjs.length).toEqual(2);
        expect(sentPacketObjs[1]).toEqual(ownerNotification("12346"));
    });
    
    it("removes an address from ALL lock queues upon disconnect",function() {
        locksApi.routePacket(lockPacket("12345","i:1","/mutex/1"));
        locksApi.routePacket(lockPacket("12346","i:1","/mutex/1"));
        locksApi.routePacket(lockPacket("12347","i:1","/mutex/1"));
        locksApi.routePacket(lockPacket("12346","i:10","i:1","/mutex/1"));
        locksApi.routePacket(lockPacket("12346","i:20","i:1","/mutex/1"));

        locksApi.routePacket(lockPacket("12346","i:2","/mutex/2"));
        locksApi.routePacket(lockPacket("12349","i:2","/mutex/2"));
        locksApi.routePacket(lockPacket("12347","i:2","/mutex/2"));

        //locksApi.routePacket(unlockPacket("12346"));
        locksApi.handleEventChannelDisconnectImpl({
            packet: {
                dst: "$bus.multicast",
                action: "disconnect",
                entity: {
                    address: "12346",
                    participantType: "testParticipant",
                    namesResource: "/address/12346"
                }
            }
        });
        
        var context1 = getPacket("unitTest","i:300","/mutex/1");
        locksApi.routePacket(context1);

        var context2 = getPacket("unitTest","i:300","/mutex/2");
        locksApi.routePacket(context2);
        
        expect(context1.responses[0].entity).toEqual({
            owner: queueEntry("12345","i:1"),
            queue: [
                queueEntry("12345","i:1"),
                queueEntry("12347","i:1")
            ]
        });

        expect(context2.responses[0].entity).toEqual({
            owner: queueEntry("12349","i:2"),
            queue: [
                queueEntry("12349","i:2"),
                queueEntry("12347","i:2")
            ]
        });
    });
    it("returns badAction on a set",function() {
        locksApi.routePacket(lockPacket("12345"));
        
        var context=testPacket("unitTest","set");
        locksApi.routePacket(context);

        expect(context.responses[0].response).toEqual("badAction");
    });
    
    it("returns badAction on a delete",function() {
        locksApi.routePacket(lockPacket("12345"));
        
        var context=testPacket("unitTest","delete");
        locksApi.routePacket(context);

        expect(context.responses[0].response).toEqual("badAction");
    });

});