describe("ApiNode",function() {
	var apiNode;
    beforeEach(function() {
       apiNode=new ozpIwc.ApiNode({
            resource: "/foo",
            version: 50,        
            self: "https://example.com/iwc/foo",
            contentType: "text/plain",
            entity: {
							msg:"hello world",
							_links: {
								self: {href: "https://example.com/iwc/foo"},
								"ozp:iwcSelf": {href: "web+ozp://test.api/foo"}
							}
						}
       });
	});
    
    it("fails if constructed without a resource",function() {
        expect(function() {
            new ozpIwc.ApiNode();
        }).toThrow();
    });
    it("deserializes and serializes live data with the same outcome",function() {
        var serialized=apiNode.serializeLive();
        var node2=new ozpIwc.ApiNode({resource:"/foo"});
        node2.deserializeLive(serialized);
        expect(node2).toEqual(apiNode);     
    });
    
    it("a set with etag properly updates the version",function() {
        apiNode.set({
           entity: "goodbye world",
           eTag: 100
        });
        expect(apiNode.entity).toEqual("goodbye world");
        expect(apiNode.version).toEqual(100);
    });
    var serializedFields=["entity","resource","self"];
    it("deserializes and serializes persisted data with the same outcome",function() {
        var node2=new ozpIwc.ApiNode({resource:"/foo"});
        node2.deserializedEntity(apiNode.serializedEntity(),apiNode.serializedContentType());
        serializedFields.forEach(function(k) {
					expect(node2[k]).toEqual(apiNode[k]);
				});
				
    });
    
    it("deserializes and serializes persisted data with the same outcome using the constructor",function() {
        var node2=new ozpIwc.ApiNode({
            serializedEntity: apiNode.serializedEntity(),
            serializedContentType: apiNode.serializedContentType()
        });
        serializedFields.forEach(function(k) {
					expect(node2[k]).toEqual(apiNode[k]);
				});
    });
    
    it("deserializes and serializes persisted data with the same outcome using the constructor without content type",function() {
        var node2=new ozpIwc.ApiNode({
            serializedEntity: apiNode.serializedEntity()
        });
        serializedFields.forEach(function(k) {
					expect(node2[k]).toEqual(apiNode[k]);
				});
    });
    it("sets up it's uri from a template",function(){
			// only defined if initEndpoints is called, so we define it here
			// rather than spyOn()
			ozpIwc.uriTemplate=function() {
				return "http://example.com/{+resource}";
			};
			var node=new ozpIwc.ApiNode({
					resource: "/foo",
					version: 50,
					uriTemplate:"doesn't matter since it's mocked",
					contentType: "text/plain",
					entity: "hello world"
			});
			
			expect(node.self).toBeUndefined();
			expect(node.getSelfUri()).toEqual("http://example.com/foo");
			expect(node.self).toEqual("http://example.com/foo");
		});
});