describe("Common API Base class",function() {

	var apiBase;
    var simpleNode;
    
	beforeEach(function() {	

		apiBase=new ozpIwc.CommonApiBase({
			'participant': new TestParticipant()
		});
		apiBase.makeValue=function(packet) {
			return new ozpIwc.CommonApiValue(packet);
		};
        simpleNode=new ozpIwc.CommonApiValue({
            'resource': "/node",
            'entity' : { 'foo':1 },
            'contentType' : "application/json",
            'version' : 1
        });
	});
	
	afterEach(function() {
		apiBase=null;
	});

    it("responds to a root level list action", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'action': "list"
            }
        });
        
        // possibly brittle, if CommonApiBase changes how it stores the
        // keys and values
        
        apiBase.data["/node"]=simpleNode;
        
		apiBase.rootHandleList(null,packetContext);

		expect(packetContext.responses[0])
            .toEqual(jasmine.objectContaining({
                'response':"ok",
                'entity': ["/node"]
            }));
	});
    
	it("responds to a get", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "get"
            }
        });
        
		apiBase.handleGet(simpleNode,packetContext);

		expect(packetContext.responses[0])
            .toEqual(jasmine.objectContaining({
                'response':"ok",
                'entity': { 'foo' : 1 }
            }));
	});

	it("responds to a bulk get with no data", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "bulkGet"
            }
        });
        
		apiBase.handleBulkget(simpleNode,packetContext);

		expect(packetContext.responses[0])
            .toEqual(jasmine.objectContaining({
                'response':"ok",
                'entity': []
            }));
	});

	it("responds to a bulk get with no matching entities", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/nomatch",
                'action': "bulkGet"
            }
        });
        var packetOne={'resource': "/family", 'action': "set", 'entity': "value1"};
		
		apiBase.findOrMakeValue(packetOne);
		
		apiBase.handleBulkget(simpleNode,packetContext);

		expect(packetContext.responses[0])
            .toEqual(jasmine.objectContaining({ 
				"response": "ok", 
				"entity": []
			}));
	});

	it("responds to a bulk get with correctly matching entities", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/family",
                'action': "bulkGet"
            }
        });
        var packetOne={'resource': "/family", 'entity': "value1"};
        var packetTwo={'resource': "/family_a", 'entity': "value2"};
        var packetThree={'resource': "/family_b", 'entity': "value3"};
        var packetFour={'resource': "/notfamily", 'entity': "value4"};
		
		apiBase.findOrMakeValue(packetOne);
		apiBase.findOrMakeValue(packetTwo);
		apiBase.findOrMakeValue(packetThree);
		apiBase.findOrMakeValue(packetFour);
		
		apiBase.handleBulkget(simpleNode,packetContext);

		expect(packetContext.responses[0].response).toEqual("ok");
		expect(packetContext.responses[0].entity.length).toEqual(3);
		expect(packetContext.responses[0].entity[0]).toEqual(jasmine.objectContaining(packetOne));
		expect(packetContext.responses[0].entity[1]).toEqual(jasmine.objectContaining(packetTwo));
		expect(packetContext.responses[0].entity[2]).toEqual(jasmine.objectContaining(packetThree));
	});
	
	it("responds to a bulk get with varied content types", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/family",
                'action': "bulkGet"
            }
        });
		
		var packetOne={'resource': "/familyOne", 'entity': "value1", 'contentType':"application/fake+a+json"};
        var packetTwo={'resource': "/familyTwo", 'entity': "value2", 'contentType':"application/fake+b+json"};
        var packetThree={'resource': "/familyThree", 'entity': "value3", 'contentType':"application/fake+c+json"};
		
		apiBase.findOrMakeValue(packetOne);
		apiBase.findOrMakeValue(packetTwo);
		apiBase.findOrMakeValue(packetThree);
		
        apiBase.handleBulkget(simpleNode,packetContext);

		expect(packetContext.responses[0].response).toEqual("ok");
		expect(packetContext.responses[0].entity.length).toEqual(3);
		expect(packetContext.responses[0].entity[0]).toEqual(jasmine.objectContaining(packetOne));
		expect(packetContext.responses[0].entity[1]).toEqual(jasmine.objectContaining(packetTwo));
		expect(packetContext.responses[0].entity[2]).toEqual(jasmine.objectContaining(packetThree));
	});
	
	it("sets data", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "set",
                'entity': {
                    'bar':2
                },
                'contentType': "application/fake+json"
            }
        });
		
        apiBase.handleSet(simpleNode,packetContext);

		expect(packetContext.responses[0])
            .toEqual(jasmine.objectContaining({
                'response':"ok"
            }));
        expect(simpleNode.entity).toEqual({'bar':2});
        expect(simpleNode.contentType).toEqual("application/fake+json");
	});

	it("deletes data", function() {
        var packetContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "set"
            }
        });
		apiBase.handleDelete(simpleNode,packetContext);

        expect(simpleNode.entity).toBeUndefined();
        expect(simpleNode.contentType).toBeUndefined();
        expect(simpleNode.version).toEqual(0);
	});

    it("a watch applies to a node",function() {
        var watchPacketContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "watch",
                'msgId' : "1234",
                'src' : "srcParticipant"
            }
        });

        apiBase.handleWatch(simpleNode,watchPacketContext);

        expect(watchPacketContext.responses[0])
            .toEqual(jasmine.objectContaining({
                'response':"ok"
            }));
        expect(simpleNode.watchers[0])
            .toEqual(jasmine.objectContaining({
                'msgId':"1234",
                'src': "srcParticipant"
            }));
    });

    it("can unregister a watch",function() {
        var watchPacketContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "watch",
                'msgId' : "1234",
                'src' : "srcParticipant"
            }
        });

        apiBase.handleWatch(simpleNode,watchPacketContext);
        expect(simpleNode.watchers[0])
            .toEqual(jasmine.objectContaining({
                'msgId':"1234",
                'src': "srcParticipant"
            }));
        var unWatchPacketContext=new TestPacketContext({
            'packet': {
                'resource': "/node",
                'action': "unWatch",
                'replyTo' : "1234",
                'src' : "srcParticipant"
            }
        });
        apiBase.handleUnwatch(simpleNode,unWatchPacketContext);

        expect(unWatchPacketContext.responses[0])
            .toEqual(jasmine.objectContaining({
                'response':"ok"
            }));

        expect(simpleNode.watchers.length).toEqual(0);
    });

    describe("Endpoint loads ",function() {
		var apiBase;
		var originalEndpoint;
		var originalEndpointGet;

		beforeEach(function() {
			apiBase = new ozpIwc.CommonApiBase({
				'participant': new TestParticipant()
			});
			apiBase.makeValue = function(packet) {
				return new ozpIwc.CommonApiValue({resource: packet.resource});
			};
			originalEndpoint = ozpIwc.endpoint;
			originalEndpointGet = ozpIwc.Endpoint.prototype.get;
            ozpIwc.endpoint = function(name) {
				var newEndpoint = new ozpIwc.Endpoint(null);
				newEndpoint.name = name;
				return newEndpoint;
			};
		});

		afterEach(function() {
			// reset and cleanup parts of the endpoint api we clobbered for this test
			ozpIwc.endpoint = originalEndpoint;
			ozpIwc.Endpoint.prototype.get = originalEndpointGet;
			apiBase = null;
		});
       
        it("with both links and embedded", function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/pizza"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"},
										{"href": "/api/profile/v1/exampleUser/data/parent/5678"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/pizza"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "pizza",
											"entity": {
												"entity": "pepperoni"
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/theme"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "theme",
											"entity": {
												"entity": "dark"
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent",
											"entity": {
												"children": ["/parent/1234", "/parent/5678"]
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent/1234"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent/1234",
											"entity": {
												"entity": "I am child 1234 of parent."
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent/5678"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent/5678",
											"entity": {
												"entity": "I am child 5678 of parent."
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem",
								"entity": {
									"entity": {
										"some": "data for linkItem"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(9);
						expect(apiBase.makeValue.calls.count()).toEqual(9);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/pizza"].entity.entity.entity).toBe("pepperoni");
						expect(apiBase.data["/theme"].resource).toBe("/theme");
						expect(apiBase.data["/parent"].entity.entity.children[1]).toBe("/parent/5678");
						expect(apiBase.data["/parent"].entity.contentType).toBe("application/vnd.ozp-data-object-v1+json");
						expect(apiBase.data["/someResource"].entity.key).toBe("someResource");
						expect(apiBase.data["/theme"]).toEqual(jasmine.objectContaining({
							"resource":"/theme",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"theme",
								"entity":{"entity":"dark"}
							}
						}));
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).toEqual(jasmine.objectContaining({
							"resource":"/bigData.json",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"bigData.json",
								"entity":{"entity":{"some": "data for bigData"}}
							}
						}));
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));

						done();
					});
        });
		
		it("with no links or embedded",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				return new Promise(function(resolve, reject) {
					resolve({
						header: {'Content-Type': "application/json"},
						response: {
							"_links": {
								"self": {"href": "/api/profile/v1/exampleUser/data"},
								"curies": [{
										"name": "ozp",
										"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
										"templated": true
									}],
								"item": [
								]
							},
							"_embedded": {
							}
						}
					});
				});
			};
			
			spyOn(apiBase,"loadFromEndpointIterative").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(0);
						expect(apiBase.loadFromEndpointIterative).toHaveBeenCalled();
						expect(apiBase.loadFromEndpointIterative).not.toThrow();
						done();
					});
        });
		
		it("with one link and no embedded",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"_embedded": {
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(1);
						expect(apiBase.makeValue.calls.count()).toEqual(1);
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).toEqual(jasmine.objectContaining({
							"resource":"/bigData.json",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"bigData.json",
								"entity":{"entity":{"some": "data for bigData"}}
							}
						}));
						done();
					});
        });
		
		it("with no link and one embedded",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}]
								},
								"_embedded": {
									"item": {
										"_links": {
											"self": {"href": "/api/profile/v1/exampleUser/data/theme"}
										},
										"contentType": "application/vnd.ozp-data-object-v1+json",
										"key": "theme",
										"entity": {
											"entity": "dark"
										}
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(1);
						expect(apiBase.makeValue.calls.count()).toEqual(1);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/theme"]).toEqual(jasmine.objectContaining({
							"resource":"/theme",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"theme",
								"entity":{"entity":"dark"}
							}
						}));
						done();
					});
		});
		
		it("with no link and many embedded",function(done) {
						ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/pizza"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "pizza",
											"entity": {
												"entity": "pepperoni"
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/theme"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "theme",
											"entity": {
												"entity": "dark"
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent",
											"entity": {
												"children": ["/parent/1234", "/parent/5678"]
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent/1234"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent/1234",
											"entity": {
												"entity": "I am child 1234 of parent."
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent/5678"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent/5678",
											"entity": {
												"entity": "I am child 5678 of parent."
											}
										}
									]
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(6);
						expect(apiBase.makeValue.calls.count()).toEqual(6);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/pizza"].entity.entity.entity).toBe("pepperoni");
						expect(apiBase.data["/theme"].resource).toBe("/theme");
						expect(apiBase.data["/parent"].entity.entity.children[1]).toBe("/parent/5678");
						expect(apiBase.data["/parent"].entity.contentType).toBe("application/vnd.ozp-data-object-v1+json");
						expect(apiBase.data["/someResource"].entity.key).toBe("someResource");
						expect(apiBase.data["/theme"]).toEqual(jasmine.objectContaining({
							"resource":"/theme",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"theme",
								"entity":{"entity":"dark"}
							}
						}));
						done();
					});

		});
		
		it("with many links and no embedded",function(done) {
						ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
									]
								},
								"_embedded": {
									"item": [
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem",
								"entity": {
									"entity": {
										"some": "data for linkItem"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(3);
						expect(apiBase.makeValue.calls.count()).toEqual(3);
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).toEqual(jasmine.objectContaining({
							"resource":"/bigData.json",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"bigData.json",
								"entity":{"entity":{"some": "data for bigData"}}
							}
						}));
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));

						done();
					});
		});
		
		it("with one link and many embedded",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/pizza"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"},
										{"href": "/api/profile/v1/exampleUser/data/parent/5678"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/pizza"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "pizza",
											"entity": {
												"entity": "pepperoni"
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/theme"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "theme",
											"entity": {
												"entity": "dark"
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent",
											"entity": {
												"children": ["/parent/1234", "/parent/5678"]
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent/1234"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent/1234",
											"entity": {
												"entity": "I am child 1234 of parent."
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent/5678"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent/5678",
											"entity": {
												"entity": "I am child 5678 of parent."
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
				return new Promise(function(resolve, reject) {
					resolve();
				});
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(7);
						expect(apiBase.makeValue.calls.count()).toEqual(7);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/pizza"].entity.entity.entity).toBe("pepperoni");
						expect(apiBase.data["/theme"].resource).toBe("/theme");
						expect(apiBase.data["/parent"].entity.entity.children[1]).toBe("/parent/5678");
						expect(apiBase.data["/parent"].entity.contentType).toBe("application/vnd.ozp-data-object-v1+json");
						expect(apiBase.data["/someResource"].entity.key).toBe("someResource");
						expect(apiBase.data["/theme"]).toEqual(jasmine.objectContaining({
							"resource":"/theme",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"theme",
								"entity":{"entity":"dark"}
							}
						}));
						// verify some link data nodes
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));
						done();
					});
		});
		
		it("with bad links",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/pizza"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"},
										{"href": "/api/profile/v1/exampleUser/data/parent/5678"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
				return new Promise(function(resolve, reject) {
					resolve();
				});
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(2);
						expect(apiBase.makeValue.calls.count()).toEqual(2);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/someResource"].entity.key).toBe("someResource");
						// verify some link data nodes
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));
						done();
					});
		});

		it("with many links and one embedded",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent",
											"entity": {
												"children": ["/parent/1234", "/parent/5678"]
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem",
								"entity": {
									"entity": {
										"some": "data for linkItem"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(4);
						expect(apiBase.makeValue.calls.count()).toEqual(4);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/parent"].entity.entity.children[1]).toBe("/parent/5678");
						expect(apiBase.data["/parent"].entity.contentType).toBe("application/vnd.ozp-data-object-v1+json");
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).toEqual(jasmine.objectContaining({
							"resource":"/bigData.json",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"bigData.json",
								"entity":{"entity":{"some": "data for bigData"}}
							}
						}));
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));
						done();
					});
		});

		it("despite missing header data",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							//header: {},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/parent"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "parent",
											"entity": {
												"children": ["/parent/1234", "/parent/5678"]
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(2);
						expect(apiBase.makeValue.calls.count()).toEqual(2);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/parent"].entity.entity.children[1]).toBe("/parent/5678");
						expect(apiBase.data["/parent"].entity.contentType).toBe("application/vnd.ozp-data-object-v1+json");
						// verify some link data nodes
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));
						done();
					});
		});

		it("with bad data in embedded",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": "bad data here",
											"contentType": {"not":"valid contenttype"},
											//"key": "parent",  // key missing
											"entity": "blah"
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:user-data", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(1);
						expect(apiBase.makeValue.calls.count()).toEqual(1);
						// verify a representative collection of the embedded data
						// verify some link data nodes
						expect(apiBase.data["/linkItem/2222"]).toEqual(jasmine.objectContaining({
							"resource":"/linkItem/2222",
							"entity":{
								"contentType":"application/vnd.ozp-data-object-v1+json",
								"key":"linkItem/2222",
								"entity":{"entity":{"some": "data for linkItem/2222"}}
							}
						}));
						done();
					});
		});

		it("with system api data",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/theme"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "theme",
											"entity": {
												"entity": "dark"
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem",
								"entity": {
									"entity": {
										"some": "data for linkItem"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:system", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(4);
						expect(apiBase.makeValue.calls.count()).toEqual(1);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/pizza"]).not.toBeDefined();
						expect(apiBase.data["/someResource"]).not.toBeDefined();
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).not.toBeDefined();
						expect(apiBase.data["/linkItem"]).not.toBeDefined();
						
						expect(apiBase.data["/system"]).toBeDefined();

						done();
					});
		});

		it("with intent api data",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/pizza"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "pizza",
											"entity": {
												"entity": "pepperoni"
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem",
								"entity": {
									"entity": {
										"some": "data for linkItem"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:intent", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(4);
						expect(apiBase.makeValue.calls.count()).toEqual(0);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/pizza"]).not.toBeDefined();
						expect(apiBase.data["/someResource"]).not.toBeDefined();
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).not.toBeDefined();
						expect(apiBase.data["/linkItem"]).not.toBeDefined();

						done();
					});
		});
		
		it("with application api data",function(done) {
			ozpIwc.Endpoint.prototype.get = function(resource) {
				if (resource === "/") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data"},
									"curies": [{
											"name": "ozp",
											"href": "/api/profile/v1/exampleUser/data/rels/{rel}",
											"templated": true
										}],
									"item": [
										{"href": "/api/profile/v1/exampleUser/data/bigData.json"},
										{"href": "/api/profile/v1/exampleUser/data/linkItem"}
									]
								},
								"_embedded": {
									"item": [
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/someResource"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "someResource",
											"entity": {
												"entity": {
													"some": "data"
												}
											}
										},
										{
											"_links": {
												"self": {"href": "/api/profile/v1/exampleUser/data/pizza"}
											},
											"contentType": "application/vnd.ozp-data-object-v1+json",
											"key": "pizza",
											"entity": {
												"entity": "pepperoni"
											}
										}
									]
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/bigData.json") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/bigData.json"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "bigData.json",
								"entity": {
									"entity": {
										"some": "data for bigData"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem",
								"entity": {
									"entity": {
										"some": "data for linkItem"
									}
								}
							}
						});
					});
				}
				if (resource === "/api/profile/v1/exampleUser/data/linkItem/2222") {
					return new Promise(function(resolve, reject) {
						resolve({
							header: {'Content-Type': "application/json"},
							response: {
								"_links": {
									"self": {"href": "/api/profile/v1/exampleUser/data/linkItem/2222"}
								},
								"contentType": "application/vnd.ozp-data-object-v1+json",
								"key": "linkItem/2222",
								"entity": {
									"entity": {
										"some": "data for linkItem/2222"
									}
								}
							}
						});
					});
				}
			};
			
			spyOn(apiBase,"makeValue").and.callThrough();
			spyOn(apiBase,"updateResourceFromServerIterative").and.callThrough();
			
			var requestHandlers = "";
			apiBase.loadFromEndpointIterative("ozp:application", requestHandlers)
					.then (function() {
						// check correct number of calls for given data set
						expect(apiBase.updateResourceFromServerIterative.calls.count()).toEqual(4);
						expect(apiBase.makeValue.calls.count()).toEqual(0);
						// verify a representative collection of the embedded data
						expect(apiBase.data["/pizza"]).not.toBeDefined();
						expect(apiBase.data["/someResource"]).not.toBeDefined();
						// verify some link data nodes
						expect(apiBase.data["/bigData.json"]).not.toBeDefined();
						expect(apiBase.data["/linkItem"]).not.toBeDefined();

						done();
					});
		});
	});

    describe("CommonAPI Packet Routing",function() {
        beforeEach(function() {
            apiBase.data['/node']=simpleNode;
			apiBase.participant.sentPacketObjs = [];
        });
        
        it("routes packets to invokeHandler based upon the action",function() {
            spyOn(apiBase,"handleGet");
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);
            expect(apiBase.handleGet).toHaveBeenCalled();
        });

        it("routes packets without an action to the rootHandleAction",function() {
            apiBase.defaultHandler=jasmine.createSpy('defaultHandler');
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);
            expect(apiBase.defaultHandler).toHaveBeenCalled();
        });

        it("finds the right node to send to invokeHandler",function() {
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);
            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'resource': "/node",
                'response': "ok",
                'replyTo' : "1234",
                'entity' : { 'foo':1}
            }));
        });
        

        
        it("returns a badAction packet for unsupported actions",function() {
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "OMG NO SUCH ACTION",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);
            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'response': "badAction"
            }));

        });
        
        it("returns a noPerm response if the action is not permitted",function() {
            apiBase.data['/node'].permissions.pushIfNotExist('ozp:iwc:haxed','totally');
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant",
                    'permissions': {
                        'ozp:iwc:haxed' : 'no'
                    }
                }
            });

            apiBase.routePacket(context);
            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'response': "noPerm"
            }));
        });
        it("returns noMatch response if the validatePreconditions returns false",function() {
           var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "get",
                    'ifTag': 1234,
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);
            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'response': "noMatch"
            }));
        });
        it("returns badResource if an invalid resource is used",function() {
            spyOn(apiBase,'validateResource').and.throwError(new ozpIwc.ApiError("noMatch","blah"));
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);
            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'response': "noMatch"
            }));
        });

        it("notifies watchers if the node changed",function() {
            simpleNode.watch({'src': "watcher",'msgId': 5678});
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "set",
                    'msgId' : "1234",
                    'src' : "srcParticipant",
                    'entity': { 'bar': 2}
                }
            });

            apiBase.routePacket(context);

            expect(apiBase.participant.sentPacketObjs.length).toEqual(1);
            var changePacket=apiBase.participant.sentPacketObjs[0];
            expect(changePacket).toBeDefined();
            expect(changePacket.response).toEqual("changed");
            expect(changePacket.entity.newValue).toEqual({'bar':2});
            expect(changePacket.entity.oldValue).toEqual({'foo':1});
        });
        it("does not notify watchers on a get",function() {
                        simpleNode.watch({'src': "watcher",'msgId': 5678});
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/node",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);

            expect(apiBase.participant.sentPacketObjs.length).toEqual(0);
            expect(apiBase.participant.sentPacketObjs[0]).toBeUndefined();
        });
        it("responds to a root level list action", function() {
            // possibly brittle, if CommonApiBase changes how it stores the
            // keys and values
            apiBase.data["/node"]=simpleNode;

            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'action': "list",
                    'msgId' : "1234",
                    'src' : "srcParticipant",
                    'entity': { 'bar': 2}
                }
            });

            apiBase.routePacket(context);

            expect(context.responses.length).toEqual(1);

            var packet=context.responses[0];
            expect(packet.response).toEqual("ok");
            expect(packet.entity).toEqual(["/node"]);
        });
    });
    describe("Collection values",function() {
        var collectionNode=new ozpIwc.CommonApiCollectionValue({
                resource: "/foo",
                pattern: /^\/foo\/.*$/
            });
        beforeEach(function() {
            apiBase.data["/foo/1"]=new ozpIwc.CommonApiValue({
                'resource': "/foo/1",
                'entity' : { 'foo':1 },
                'contentType' : "application/json",
                'version' : 1
            });
            apiBase.data["/foo/2"]=new ozpIwc.CommonApiValue({
                'resource': "/foo/2",
                'entity' : { 'foo':2 },
                'contentType' : "application/json",
                'version' : 1
            });
            apiBase.data["/foo/3"]=new ozpIwc.CommonApiValue({
                'resource': "/foo/3",
                'entity' : { 'foo':3 },
                'contentType' : "application/json",
                'version' : 1
            });
            apiBase.addDynamicNode(collectionNode);
			apiBase.participant.sentPacketObjs = [];
        });
    
        it("get on collection nodes list their contents",function() {
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/foo",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });

            apiBase.routePacket(context);

            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'response': "ok",
                'resource': "/foo",
                'entity': ["/foo/1","/foo/2","/foo/3"]
            }));
        });
       
        it("set on collection nodes update their contents",function() {

            apiBase.routePacket(new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/foo/4",
                    'action': "set",
                    'msgId' : "1234",
                    'src' : "srcParticipant",
                    'entity': {'foo': 4}
                }
            }));
            var context=new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/foo",
                    'action': "get",
                    'msgId' : "1234",
                    'src' : "srcParticipant"
                }
            });
            apiBase.routePacket(context);
            expect(context.responses[0]).toEqual(jasmine.objectContaining({
                'dst': "srcParticipant",
                'response': "ok",
                'entity': ["/foo/1","/foo/2","/foo/3","/foo/4"]
            }));

        });     
        
        it("notifies watchers if the collection node changed",function() {
            collectionNode.watch({'src': "watcher",'msgId': 5678});
            apiBase.routePacket(new TestPacketContext({
                'leaderState': "leader",
                'packet': {
                    'resource': "/foo/4",
                    'action': "set",
                    'msgId' : "1234",
                    'src' : "srcParticipant",
                    'entity': {'foo': 4}
                }
            }));

            expect(apiBase.participant.sentPacketObjs.length).toEqual(1);
            var changePacket=apiBase.participant.sentPacketObjs[0];
            expect(changePacket.response).toEqual("changed");
            expect(changePacket.entity.newValue).toEqual([ "/foo/1", "/foo/2", "/foo/3", "/foo/4" ]);
            expect(changePacket.entity.oldValue).toEqual([ "/foo/1", "/foo/2", "/foo/3"]);
        });
        
    });

});