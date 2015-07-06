describe("DataNode",function() {
	var dataNode;
    beforeEach(function() {
       dataNode=new ozpIwc.DataNode({
            resource: "/foo",
            version: 50,        
            self: "https://example.com/iwc/foo",
            contentType: "text/plain",
            entity: "hello world"
       });
	});
    it("fails if constructed without a resource",function() {
        expect(function() {
            new ozpIwc.DataNode();
        }).toThrow();
    });
    it("deserializes and serializes live data with the same outcome",function() {
        var serialized=dataNode.serializeLive();
        var node2=new ozpIwc.DataNode({resource:"/foo"});
        node2.deserializeLive(serialized);
        expect(node2).toEqual(dataNode);     
    });
    
    it("a set with etag properly updates the version",function() {
        dataNode.set({
           entity: "goodbye world",
           eTag: 100
        });
        expect(dataNode.entity).toEqual("goodbye world");
        expect(dataNode.version).toEqual(100);
    });
    
    it("deserializes and serializes persisted data with the same outcome",function() {
        var node2=new ozpIwc.DataNode({resource:"/foo"});
        var serialized = { entity: dataNode.serializedEntity() };
        node2.deserializedEntity(serialized,dataNode.serializedContentType());
        expect(node2).toEqual(dataNode);
    });
    
    it("deserializes and serializes persisted data with the same outcome using the constructor",function() {
        var serialized = { entity: dataNode.serializedEntity() };
        var node2=new ozpIwc.DataNode({
            serializedEntity:serialized,
            serializedContentType: dataNode.serializedContentType()
        });
        expect(node2).toEqual(dataNode);
    });
    
    it("deserializes and serializes persisted data with the same outcome using the constructor without content type",function() {
        var serialized = { entity: dataNode.serializedEntity() };
        var node2=new ozpIwc.DataNode({
            serializedEntity:serialized
        });
        expect(node2).toEqual(dataNode);
    });
    
});