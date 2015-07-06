describe("Data API", function () {
    var client, participant, resolve, reject, promise;

    beforeEach(function(done) {
        client=new ozpIwc.Client({
            peerUrl: "http://" + window.location.hostname + ":14002"
        });
        participant=new ozpIwc.test.MockParticipant({
            clientUrl: "http://" + window.location.hostname + ":14001",
            'client': client
        });

        var gate=ozpIwc.testUtil.doneSemaphore(2,done);

        participant.on("connected",gate);
        client.on("connected",gate);

        promise = new Promise(function(res,rej){
            resolve=res;
            reject=rej;
        });
    });

    afterEach(function() {
        client.disconnect();
        participant.close();
    });

	pit("responds to a bulk get with matching entities", function() {
		var packetOne={'resource': "/family", 'entity': "value1"};
		var packetTwo={'resource': "/family_a", 'entity': "value2", 'contentType':"application/fake+b+json"};
        var packetThree={'resource': "/family_b", 'entity': "value3"};
        var packetFour={'resource': "/notfamily", 'entity': "value4"};

		return client.api('data.api').set(packetOne.resource,{entity:packetOne.entity})
			.then(function() {
				return client.api('data.api').set(packetTwo.resource,{'entity':packetTwo.entity,'contentType':packetTwo.contentType});
			}).then(function() {
				return client.api('data.api').set(packetThree.resource,{'entity':packetThree.entity});
			}).then(function() {
				return client.api('data.api').set(packetFour.resource,{'entity':packetFour.entity});
			}).then(function() {
				return client.api('data.api').bulkGet("/family");
			}).then(function(reply) {
				expect(reply.response).toEqual("ok");
				expect(reply.entity.length).toEqual(3);
				expect(reply.entity[0]).toEqual(jasmine.objectContaining(packetOne));
				expect(reply.entity[1]).toEqual(jasmine.objectContaining(packetTwo));
				expect(reply.entity[2]).toEqual(jasmine.objectContaining(packetThree));
			})['catch'](function(error) {
				expect(error).toEqual('not have happened');
			});
	});

    pit('sets a value visible to other clients',function() {
        var packet={
            'dst': "data.api",
            'resource': "/test",
            'action' : "set",
            'entity' : { 'foo' : 1 }
        };
        participant.send(packet,function() {
            resolve();
        });
        return promise.then(function(){
            return client.api('data.api').get(packet.resource).then(function (reply) {
                    expect(reply.entity).toEqual(packet.entity);
            });
        });
    });

    it('setting a value generates a change to other clients',function(done) {
        var packet={
            'dst': "data.api",
            'resource': "/test",
            'action' : "set",
            'entity' : { 'foo' : 1 }
        };
        client.api('data.api').watch(packet.resource,function(reply) {
            expect(reply.entity.newValue).toEqual(packet.entity);
            expect(reply.entity.oldValue).toBeUndefined();
            expect(reply.entity.newCollection).toEqual([]);
            expect(reply.entity.oldCollection).toEqual([]);
            done();
        }).then(function(reply) {
            expect(reply.response).toEqual("ok");
            expect(reply.collection).toBeUndefined();
            expect(reply.entity).toBeUndefined();
            participant.send(packet);
        });

    });
    pit('can get a value set by another participant',function(){
        participant.send({
            'dst': "data.api",
                'resource': "/test",
                'action' : "set",
                'entity' : { 'foo' : 2 }
        },function(response){
            resolve();
        });
        return promise.then(function(){
            return client.data().get('/test').then(function(reply){
                expect(reply.entity).toEqual({"foo":2});
            });
        });
    });
    pit("can delete a value set by someone else",function() {
        participant.send({
            'dst': "data.api",
            'resource': "/test",
            'action': "set",
            'entity': {'foo': 2}
        }, function (response) {
            resolve();
        });

        return promise.then(function() {
            return client.data().get('/test');
        }).then(function (reply) {
            expect(reply.entity).toEqual({"foo": 2});
            return client.data().delete('/test');
        }). then(function (reply) {
            expect(reply.response).toEqual("ok");
            return client.data().get('/test');
        })['catch'](function(error){
            expect(error.response).toEqual("noResource");
        });
    });

    pit('Integration bus cleans up after every run',function() {
        return client.data().get('/test')['catch'](function(error) {
            expect(error.response).toEqual("noResource");
        });
    });

    describe("Collections",function(){
        pBeforeEach(function(){
            return client.data().set("/tester",{entity:123}).then(function(r){
                console.log(r);

            }).catch(function(e){
                console.log(e);
            });
        });
        pit('Each resource has a collection property',function(){
            return client.data().get('/tester').then(function(response){
                expect(response.collection).toEqual([]);
            });
        });

        pit('Each resource updates its collection property if it has a child added to it',function(){
            var response;
            return client.data().addChild('/tester',{entity:456}).then(function(resp) {
                response = resp;
                return client.data().get('/tester');
            }).then(function(reply){
                expect(reply.collection.length).toEqual(1);
                expect(reply.collection).toEqual([response.entity.resource]);
            });
        });
        pit('Each resource updates its collection property if it has children added to it',function(){
            var response1,response2;
            return client.data().addChild('/tester',{entity:456}).then(function(resp) {
                response1 = resp;
                return client.data().addChild('/tester', {entity: 456});
            }).then(function(resp){
                response2 = resp;
                return client.data().get('/tester');
            }).then(function(reply){
                expect(reply.collection.length).toEqual(2);
                expect(reply.collection).toEqual([response1.entity.resource,response2.entity.resource]);
            });
        });

        pit('Each resource updates its collection property if it has children removed to it',function(){
            var response;
            return client.data().addChild('/tester',{entity:456}).then(function(resp) {
                response = resp;
                return client.data().get('/tester');
            }).then(function(reply){
                expect(reply.collection.length).toEqual(1);
                expect(reply.collection).toEqual([response.entity.resource]);
                return client.data().removeChild('/tester',{entity:{resource: response.entity.resource}});
            }).then(function(){
                return client.data().get('/tester');
            }).then(function(reply){
                expect(reply.collection).toEqual([]);
            });
        });

        pit('A resource only updates if a child was added not a subresource being set.',function(){
            return client.data().set('/tester/123', {entity:123}).then(function(){
                return client.data().get('/tester');
            }).then(function(reply){
                expect(reply.collection).toEqual([]);
            });
        });
        pit('A watched resource does not collect if it does not have a pattern',function(){
            var resolve,reject;
            var promise = new Promise(function(res,rej){
                resolve = res;
                reject = rej;
            });
            client.data().get('/tester').then(function(response){
                expect(response.pattern).toBeUndefined();
                return client.data().watch('/tester',function(reply){
                    reject(reply);
                });
            }).then(function(){
                client.data().set('/tester/123',{entity:123});
            });

            window.setTimeout(function(){
                expect(true).toEqual(true);
                resolve();
            },1000);
            return promise;


        });
        it('A watched resource collects if it has a pattern',function(done){
            var resource = '/tester/123';
            client.data().set('/tester',{pattern: '/tester/'}).then(function(response){
                return client.data().watch('/tester',function(reply){
                    expect(reply.entity.newCollection).toEqual([resource]);
                    expect(reply.entity.oldCollection).toEqual([]);
                    done();
                });
            }).then(function(){
                return client.data().set(resource,{entity:123});
            });
        });
    });
    xit('can list children added by another client',function(done) {

    });

    xit('can remove children added by another client',function(done){

    });

    xit('gets a change notice on a child being added by another client',function(done){

    });

    xit('gets a change notice on a child being removed by another client',function(done){

    });

    xit('permissions on the entity restrict access to the origin',function(done){

    });

    describe('Data load test', function() {

        pit ('Gets the contents of the data api', function() {
            return client.data().get('/dashboard/12345').then(function (packet) {
                    expect(packet.response).toEqual('ok');
            });
        });
    });

    describe('Legacy API Tests', function () {

        afterEach(function (done) {
            var called = false;
            client.api('data.api').delete('/test')
                .then(function (packet) {
                    expect(packet.response).toEqual('ok');
                })['catch'](function (error) {
                    expect(error).toEqual('');
                });
            if (!called) {
                called = true;
                done();
            }
        });


        pit('Client sets values', function () {
            return client.api('data.api').set('/test', { entity: "testData"}).then(function (packet) {
                    expect(packet.response).toEqual('ok');
            });
        });


        pit('Client gets values', function () {
            return client.api('data.api').set('/test', { entity: "testData"}).then(function (packet) {
                return client.api('data.api').get('/test', {});
            }).then(function (packet) {
                    expect(packet.entity).toEqual('testData');
            });
        });

        pit('Client deletes values', function () {
            return client.api('data.api').delete('/test').then(function (packet) {
                expect(packet.response).toEqual('ok');
            });
        });

//        xdescribe('Collection-like Actions', function () {
//
//            //TODO implement if needed
//        });
    });
});
