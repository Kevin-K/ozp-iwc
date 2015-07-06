/**
 * Network Integration
 */
describe("Intents API", function() {
    var client;
    var participant;

    beforeEach(function(done) {
        client = new ozpIwc.Client({
            peerUrl: "http://" + window.location.hostname + ":14002"
        });
        participant = new ozpIwc.test.MockParticipant({
            clientUrl: "http://localhost:14001",
            'client': client
        });

        var gate = ozpIwc.testUtil.doneSemaphore(2, done);

        participant.on("connected", gate);
        client.connect().then(gate, gate);
    });

    afterEach(function() {
        client.disconnect();
        if (participant) {
            participant.close();
        }
    });

    var registerEntity = {
        type: "text/plain",
        action: "view",
        icon: "http://example.com/view-text-plain.png",
        label: "View Plain Text",
        invokeIntent: "system.api/application/123-412"
    };

    pit('registers handlers', function() {
        return client.api('intents.api').register('/text/plain/view', {
            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
            entity: registerEntity
        }).then(function(reply) {
            expect(reply.response).toEqual('ok');
            expect(reply.entity.resource).toMatch('/text/plain/view');
        });
    });

    pit('uses sane defaults to register handlers', function() {
        return client.api('intents.api').register('/text/plain/view', {
            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
            entity: {
                type: "text/plain",
                action: "view",
                icon: "http://example.com/view-text-plain.png",
                label: "View Plain Text"
            }
        }).then(function(reply) {
            expect(reply.response).toEqual('ok');
            expect(reply.entity.resource).toMatch('/text/plain/view');
            return client.api('intents.api').get(reply.entity.resource);
        }).then(function(reply) {
            expect(reply.response).toEqual("ok");
            // What is returned needs to be tested.
//            expect(reply.entity.invokeIntent).toBeDefined();
//            expect(reply.entity.invokeIntent.dst).toEqual(client.address);
//            expect(reply.entity.invokeIntent.resource).toMatch("/intents/text/plain/view");
//            expect(reply.entity.invokeIntent.replyTo).toBeDefined();
//            expect(reply.entity.invokeIntent.action).toEqual("invoke");
        }).catch(function(er){
            console.log(er);
        });
    });

    pit('deletes handlers', function() {
        return client.api('intents.api').register('/text/plain/view', {
            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
            entity: registerEntity
        }).then(function(reply) {
            return client.api('intents.api').delete(reply.entity.resource);
        }).then(function(reply) {
            expect(reply.response).toEqual('ok');
        });
    });

    pit('invokes handler directly', function() {
        return client.api('intents.api').register('/text/plain/view', {
            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
            entity: {
                type: "text/plain",
                action: "view",
                icon: "http://example.com/view-text-plain.png",
                label: "View Plain Text",
                invokeIntent: {
                    dst: client.address,
                    resource: "/text/plain/view",
                    action: "intentsInvocation"
                }
            }
        }, function(responce) {
            console.log("Handler received packet ", responce);
            expect(responce.entity).toEqual("This is some text");
            expect(responce.intent.type).toEqual("text/plain");
            expect(responce.handler.resource).toEqual("/text/plain/view");
        }).then(function(reply) {
            console.log("Handler is registered: ", reply);
            expect(reply.response).toEqual('ok');
            expect(reply.entity.resource).toMatch('/text/plain/view');

            return client.api('intents.api').invoke(reply.entity.resource, {
                contentType: "text/plain",
                entity: "This is some text"
            });
        });
    });

// This will need to be re-enabled when we actually support broadcast.  Right
// now, we don't, so no point in testing for it.
// 
//    pit('broadcasts to all handlers of a definition', function(done) {
//        var gate = ozpIwc.testUtil.doneSemaphore(2, done);
//
//        return client.api('intents.api').register('/text/plain/view', {
//            contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
//            entity: {
//                type: "text/plain",
//                action: "view",
//                icon: "http://example.com/view-text-plain.png",
//                label: "View Plain Text 1",
//                invokeIntent: {
//                    dst: client.address,
//                    resource: "/text/plain/view",
//                    action: "intentsInvocation"
//                }
//            }
//        }, function(response) {
//            console.log(response);
//            gate();
//        }).then(function() {
//            return client.api('intents.api').register('/text/plain/view', {
//                contentType: "application/vnd.ozp-iwc-intent-handler-v1+json",
//                entity: {
//                    type: "text/plain",
//                    action: "view",
//                    icon: "http://example.com/view-text-plain.png",
//                    label: "View Plain Text 2",
//                    invokeIntent: {
//                        dst: client.address,
//                        resource: "/text/plain/view",
//                        action: "intentsInvocation"
//                    }
//                }
//            }, function(response) {
//                console.log(response);
//                gate();
//            });
//        }).then(function() {
//            return client.api('intents.api').broadcast('/text/plain/view', {
//                contentType: "text/plain",
//                entity: "This is some text"
//            });
//        });
//    });
});
