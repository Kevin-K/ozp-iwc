describe("Locks API Value", function() {
    var queueEntry=function(address,msgId) {
        msgId = msgId || "i:1";
        return {
            src: address,
            msgId: msgId
        };
    };
    
    var lock;
    
    beforeEach(function() {
        lock=new ozpIwc.LocksApiValue();
    });
    
    it("returns a new lock owner from the first lock(), but not subsequent queuing",function() {
        expect(lock.lock(queueEntry("12345"))).toEqual(queueEntry("12345"));
        expect(lock.lock(queueEntry("12346"))).toBeNull();
        expect(lock.lock(queueEntry("12347"))).toBeNull();
    });

    it("returns the owner and FIFO queue as the entity",function() {
        lock.lock(queueEntry("12345"));
        lock.lock(queueEntry("12346"));
        lock.lock(queueEntry("12347"));
        
        expect(lock.toPacket().entity).toEqual({
            owner: queueEntry("12345"),
            queue: [
                queueEntry("12345"),
                queueEntry("12346"),
                queueEntry("12347")
            ]
        });
    });

    it("passes the lock down the queue when the owner unlocks",function() {
        lock.lock(queueEntry("12345"));
        lock.lock(queueEntry("12346"));
        lock.lock(queueEntry("12347"));
        
        expect(lock.unlock(queueEntry("12345"))).toEqual(queueEntry("12346"));
        
        expect(lock.toPacket().entity).toEqual({
            owner: queueEntry("12346"),
            queue: [
                queueEntry("12346"),
                queueEntry("12347")
            ]
        });
    });
    
    it("does not change the state of the lock on arbitrary unlocks",function() {
        lock.lock(queueEntry("12345"));
        lock.lock(queueEntry("12346"));
        lock.lock(queueEntry("12347"));
        
        expect(lock.unlock(queueEntry("54321"))).toBeNull();
        
        expect(lock.toPacket().entity).toEqual({
            owner: queueEntry("12345"),
            queue: [
                queueEntry("12345"),
                queueEntry("12346"),
                queueEntry("12347")
            ]
        });
    });    
    it("removes a queued holder upon unlock, but doesn't change owner",function() {
        lock.lock(queueEntry("12345"));
        lock.lock(queueEntry("12346"));
        lock.lock(queueEntry("12347"));
        
        expect(lock.unlock(queueEntry("12346"))).toBeNull();
        
        expect(lock.toPacket().entity).toEqual({
            owner: queueEntry("12345"),
            queue: [
                queueEntry("12345"),
                queueEntry("12347")
            ]
        });
    });    
    it("removes multiple queued holders if passed a partial match",function() {
        lock.lock(queueEntry("12345"));
        lock.lock(queueEntry("12346"));
        lock.lock(queueEntry("12347"));
        lock.lock(queueEntry("12346","i:2"));
        lock.lock(queueEntry("12346","i:3"));
        
        expect(lock.unlock({src:"12346"})).toBeNull();
        
        expect(lock.toPacket().entity).toEqual({
            owner: queueEntry("12345"),
            queue: [
                queueEntry("12345"),
                queueEntry("12347")
            ]
        });
    });  
});