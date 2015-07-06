/**
 * Network Integration
 */


describe("Names API", function () {
    var client;
    var participant;
    
    beforeEach(function(done) {
        client=new ozpIwc.Client({
            peerUrl: "http://" + window.location.hostname + ":14002"
        });
        participant=new ozpIwc.test.MockParticipant({
            clientUrl: "http://" + window.location.hostname + ":14001",
            'client': client
        });
        
        var gate=ozpIwc.testUtil.doneSemaphore(2,done);
//        window.setTimeout(done,10);

        participant.on("connected",gate);
        client.connect().then(gate,gate);
    });
    
    afterEach(function() {
        client.disconnect();
        participant.close();
    });

//
//    describe("/address resources", function() {
//        xit("returns info about myself via get /address/${client.address}",function(done) {
//            
//        });
//
//        xit("uses the /me alias for get /address/${client.address}",function(done) {
//            
//        });    
//        xit("returns limited info about another client",function(done) {
//            
//        });
//        xit("returns metrics information about me at /address/${client.address}/metrics",function(done) {
//            
//        });
//
//        xit("set action is noPerm",function(done) {
//            
//        });
//        xit("delete action is noPerm",function(done) {
//            
//        });
//
//    });
//    describe("/multicast resources",function() {
//        xit("adds client to the group with an addChild action on /multicast/${name}",function(done) {
//            
//        });    
//        xit("returns multicast group info for /multicast/${name}",function(done) {
//            
//        });
//
//        xit("returns the group members for /multicast/${name} for members",function(done) {
//            
//        });
//        xit("returns metrics information about the multicast group at /multicast/${name}/metrics",function(done) {
//            
//        });
//        
//        xit("set action is noPerm",function(done) {
//            
//        });
//        xit("delete action is noPerm",function(done) {
//            
//        });
//
//    });
//    
//    describe("/api resources",function() {
//        xit("returns a list of APIs at /api",function(done) {
//            
//        });
//        xit("returns a descriptor at /api/data.api",function(done) {
//            
//        });
//        xit("returns API metrics at /api/data.api/metrics",function(done) {
//            
//        });
//        
//        xit("set action is noPerm",function(done) {
//            
//        });
//        xit("delete action is noPerm",function(done) {
//            
//        });
//    });


    describe("Legacy integration tests",function() {
        var testId="/address/testAddress";

        var testFragment = {
            entity: {
                name: 'testName',
                address: 'testAddress',
                participantType: 'testType'
            },
            contentType: 'application/vnd.ozp-iwc-address-v1+json'
        };

        pAfterEach(function() {
            return client.api('names.api').delete(testId,testFragment);
        });


        pit('Client sets values', function() {
            console.log("[NamesApiSpec] Sending names.api set");
            var rv=client.api('names.api').set(testId,testFragment)
                .then(function(reply) {
                    console.log("[NamesApiSpec] Set succeeded with",reply);
                    expect(reply.response).toEqual('ok');
                });
            rv.catch(function(e) {
                console.log("[NamesApiSpec] Set failed with ",e);
            });
            return rv;
        });


        pit('Client gets values', function () {
            return client.api('names.api').set(testId,testFragment).then(function(reply) {
                return client.api('names.api').get(testId, {});
            }).then(function(reply) {
                expect(reply.entity).toEqual(testFragment.entity);
            });
        });

        pit('Client deletes values', function () {
            return client.api('names.api').delete(testId,{'contentType': testFragment.contentType})
                .then(function(reply) {
                        expect(reply.response).toEqual('ok');
                });
        });

    });
});
