/**
 * Network Integration
 */


describe("System API", function() {
    var client;
    var participant;
    beforeEach(function(done) {
        client = new ozpIwc.Client({
            peerUrl: "http://" + window.location.hostname + ":14002",
						params: {"log":"DEBUG"}
        });
        participant = new ozpIwc.test.MockParticipant({
            clientUrl: "http://localhost:14001",
            'client': client
        });

        var gate = ozpIwc.testUtil.doneSemaphore(3, done);
        participant.on("connected", gate);
        client.connect().then(gate, gate);
				
				// wait for the systemAPI to be available
				client.api("system.api").list("/").then(gate,gate);
    });

    afterEach(function() {
        client.disconnect();
        participant.close();
    });

    pit("has pretty name and email in /user", function() {
        return client.api("system.api").get("/user")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity).toBeDefined();
            });
    });
    pit("has system version in /system", function() {
        return client.api("system.api").get("/system")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity).toBeDefined();
            });

    });
		pit("lists the sampleData applications at /application", function() {
        return client.api("system.api").get("/application")
            .then(function(reply) {
                expect(reply.response).toEqual("ok");
                expect(reply.entity).toContain("/application/23456");
                expect(reply.entity).toContain("/application/34567");
                expect(reply.entity).toContain("/application/45678");
                expect(reply.entity).toContain("/application/56789");
                expect(reply.entity).toContain("/application/67890");
            });

    });

    ["/application/1234", "/user", "/system"].forEach(function(resource) {
        pit("denies set on " + resource, function() {
            return client.api("system.api").set(resource, {entity: "blah"})
                .then(function(reply) {
                  return Promise.reject(reply);
                }).catch(function(error) {
									expect(error.response).toEqual("badAction");
								});
        });

        pit("denies delete on " + resource, function() {
            return client.api("system.api").delete(resource, {entity: "blah"})
                .then(function(reply) {
                    return Promise.rject(reply);
                })['catch'](function(error) {
                    expect(error.response).toEqual("badAction");
                });
        });
    });
    
    pit("registers for the intent run /application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",function() {
        return client.api("intents.api").get("/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api")
				.then(function(reply) {
						console.log("Received ",reply);
						expect(reply.response).toEqual("ok");
						expect(reply.entity.invokeIntent).toBeDefined();
						expect(reply.entity.invokeIntent.action).toEqual("invoke");
						expect(reply.entity.invokeIntent.dst).toEqual("system.api");
        });
    });
    pit("launch on system.api invokes the intent run /application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",function() {
        // hijack the system.api's intent registration so that we get it
       return client.api("intents.api").set("/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",{
            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
            resource: "/application/vnd.ozp-iwc-launch-data-v1+json/run/system.api",
            entity: {
                label: "Launch in New Window",
                invokeIntent: {
                    dst: client.address,
                    action: "invoke",
                    resource: ""
                }
            }
        }).then(function(reply) {
            expect(reply.response).toEqual("ok");
            return Promise.all([
                client.api("system.api").launch("/application/23456",{
                    entity: { "foo": 123 }
                }),
                new Promise(function(resolve,reject) {
                    client.on("receive",function(packet) {
                        if(packet.src==="intents.api" && packet.resource==="") {
                            resolve(packet);
                        }
                    });
                })
            ]);
        }).then(function(replies) {
            var intentsPacket=replies[1];
            expect(intentsPacket.entity.inFlightIntent).toBeDefined();
            return client.api("intents.api").get(intentsPacket.entity.inFlightIntent);
        }).then(function(reply) {
            expect(reply.entity).toEqual(jasmine.objectContaining({
                "entity": { 
                    'url': 'http://localhost:15001/?color=green',
                    'applicationId': '/application/23456',
                    'launchData': Object({ foo: 123 }),
                    'id': '25a3d034-31f1-4dbe-b9b4-03c8dad7b5f8' 
                }
            }));
        });
    });
});
