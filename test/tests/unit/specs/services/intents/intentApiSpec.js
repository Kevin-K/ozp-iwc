describe("Intent API Class", function () {

    var apiBase;
    var endpoint;

    // mock data for the endpoints
    var data={
        "http://example.com/intents/1": {response: {
            _links: {
                self: {href:"http://example.com/intents/1"}
            }             
        }}
    };
    data["/"]={ response: {
        _links: {item: Object.keys(data).map(function(k) { return {href:k};})},
        _embedded: { item: [] }             
    }};

    beforeEach(function () {
        apiBase = new ozpIwc.IntentsApi({
            'participant': new TestClientParticipant(),
            'name': "testIntents.api",
            'router': new FakeRouter()
        });
        apiBase.isRequestQueueing=false;
        apiBase.leaderState = "leader";

        endpoint=jasmine.createSpyObj('endpoint',['get','put','delete']);
//        ozpIwc.endpoint=function() { return endpoint; };
        ozpIwc.endpoint=jasmine.createSpy("ozpIwc.endpoint");
        ozpIwc.endpoint.and.returnValue(endpoint);
        spyOn(ozpIwc.util,"openWindow");
        
        endpoint.get.and.callFake(function(url) {
            return Promise.resolve(data[url]);
         });
    });
    
    pit("fetches data from the server",function() {
        apiBase.leaderState = "member";
        return apiBase.transitionToLoading().then(function() {
            expect(endpoint.get).toHaveBeenCalledWith("/");
            expect(endpoint.get).toHaveBeenCalledWith("http://example.com/intents/1",[]);
        });
    });
    pit("registers handlers",function() {
        var testPacket=new TestPacketContext({
            'packet': {
                'resource': "/text/plain/view",
                'action': "register",
                'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                'entity': {
                    'bar':2,
                    'invokeIntent': {
                        'dst': "fakeAddress.unitTest"
                    }
                }
            },
            'leaderState': "leader"
        });
        return apiBase.receivePacketContext(testPacket).then(function(){
            expect(testPacket.responses[0]).toEqual(jasmine.objectContaining({
                response: "ok"
            }));
            expect(testPacket.responses[0].entity.resource).toMatch(/text\/plain\/view\/.*/);
        });
    });

    describe("invocation workflow",function() {
        var handlerResource="/text/plain/view/1234";
         
        var makeInvocationPacket=function(resource) {
            return new TestPacketContext({
                'packet': {
                    'resource': resource,
                    'action': "invoke",
                    'contentType' : "text/plain",
                    'entity': "Some Text"
                },
                'leaderState': "leader"
            });
        };

        var makeRegistrationPacket=function(resource) {
            return new TestPacketContext({
                'packet': {
                    'resource': handlerResource,
                    'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                    'action': "register",
                    'entity': {
                        'type': "text/plain",
                        'action' : "view",
                        'invokeIntent': {
                            dst: "system.api",
                            resource: "/intentHandler",
                            action: "view"
                        }
                    }
                },
                'leaderState': "leader"
            });
        };
        beforeEach(function() {
            apiBase.receivePacketContext(makeRegistrationPacket(handlerResource));
            apiBase.receivePacketContext(new TestPacketContext({
                'packet': {
                    'resource': "/text/plain/view/7890",
                    'contentType' : "application/vnd.ozp-iwc-intent-handler-v1+json",
                    'action': "register",
                    'entity': {
                        'type': "text/plain",
                        'action' : "view",
                        'invokeIntent': {
                            dst: "someApplication",
                            resource: "/intentHandler",
                            action: "view"
                        }
                    }
                },
                'leaderState': "leader"
            }));

            // act as if there are no saved preferences by default
            apiBase.getPreference=function() {return Promise.reject();};
        });
        
        pit("invokes handlers directly",function() {
            var invocationPacket=makeInvocationPacket(handlerResource);
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(inflightNode.entity.state).toEqual("delivering");
            });
        });
        pit("sends the delivery packet on a direct invocation",function() {
            var invocationPacket=makeInvocationPacket(handlerResource);
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(apiBase.participant).toHaveSent({
                    dst: "system.api",
                    resource: "/intentHandler",
                    action: "view",
                    entity: jasmine.objectContaining({
                        inFlightIntent: inflightNode.resource,
                        inFlightIntentEntity: inflightNode.entity
                    })
                });
            });
        });
     
        pit("presents the chooser when there are multiple choices",function() {
            var invocationPacket=makeInvocationPacket("/text/plain/view");
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(inflightNode.entity.state).toEqual("choosing");
                expect(ozpIwc.util.openWindow)
                    .toHaveBeenCalledWith(ozpIwc.intentsChooserUri,jasmine.objectContaining({
                        "ozpIwc.peer": ozpIwc.BUS_ROOT,
                        "ozpIwc.intentSelection": "intents.api"+inflightNode.resource
                    }),ozpIwc.INTENT_CHOOSER_FEATURES);
            });
        });
        pit("uses a saved preference when one exists",function() {
            var invocationPacket=makeInvocationPacket("/text/plain/view");
            apiBase.getPreference=function() {return Promise.resolve(handlerResource);};
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(inflightNode.entity.state).toEqual("delivering");
                expect(ozpIwc.util.openWindow)
                    .not.toHaveBeenCalled();
            });
        });
        pit("ignores a saved preference that's not valid",function() {
            var invocationPacket=makeInvocationPacket("/text/plain/view");
            apiBase.getPreference=function() {return Promise.resolve("/invalid/handler");};
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                expect(invocationPacket).toHaveSent({
                    dst: invocationPacket.packet.src,
                    response: "ok"
                });
                var inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                expect(inflightNode.entity.state).toEqual("choosing");
                expect(ozpIwc.util.openWindow)
                    .toHaveBeenCalledWith(ozpIwc.intentsChooserUri,jasmine.objectContaining({
                        "ozpIwc.peer": ozpIwc.BUS_ROOT,
                        "ozpIwc.intentSelection": "intents.api"+inflightNode.resource
                    }),ozpIwc.INTENT_CHOOSER_FEATURES);
            });
        });
        
        pit("marks the invocation as running when it receives a running packet",function() {
            var invocationPacket=makeInvocationPacket(handlerResource);
            var inflightNode=null;
            return apiBase.receivePacketContext(invocationPacket).then(function() {
                inflightNode=apiBase.data[invocationPacket.responses[0].entity.inFlightIntent];
                var runningPacket=new TestPacketContext({'packet': {
                    'resource': inflightNode.resource,
                    'action': "set",
                    'contentType': "application/vnd.ozp-iwc-intent-invocation-v1+json",
                    'entity': {
                        'state': "running",
                        'handler': {
                           'address': "someAddress",
                           'resource': "/intentReceiver"
                       }
                    }
                }});
                return apiBase.receivePacketContext(runningPacket);
            }).then(function() {
                expect(inflightNode.entity.state).toEqual("running");
            });
        });
    });
});