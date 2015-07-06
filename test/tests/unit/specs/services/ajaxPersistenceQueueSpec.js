describe("Ajax Persistence Queue",function() {

describe("with one pool", function() {
    var queue;

    beforeEach(function() {
        queue=new ozpIwc.AjaxPersistenceQueue({poolSize:1});
        spyOn(ozpIwc.util,"ajax").and.callFake(function() {
            return Promise.resolve();
        });
    });

    pit("enqueues a persistence request",function() {
        var exampleNode=new ozpIwc.ApiNode({
            resource: "/foo/bar",
            self: "https://example.com/data/api/foo/bar"
        });
        return queue.queueNode("data.api/foo/bar",exampleNode).then(function() {
            expect(ozpIwc.util.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
                href: exampleNode.self,
                headers: {
                    "Content-Type": exampleNode.serializedContentType()
                }
            }));
        });
    });
		pit("creates the URI for a node without self",function() {
				ozpIwc.uriTemplate=function() {
					return "http://example.com/{+resource}";
				};
        var exampleNode=new ozpIwc.DataNode({
            resource: "/foo/bar",
						entity: {"foo":1}            
        });
        return queue.queueNode("data.api/foo/bar",exampleNode).then(function() {
            return Promise.all(queue.syncPool);
				}).then(function() {
						expect(ozpIwc.util.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
                href: "http://example.com/foo/bar",
                headers: {
                    "Content-Type": exampleNode.serializedContentType()
                }
            }));
        });
    });
    pit("saves nodes in the order that they are enqueued",function() {
        for(var i=0;i<10;++i) {
            queue.queueNode("data.api/"+i,new ozpIwc.ApiNode({
                resource: "/foo/bar",
                self: "https://example.com/"+i
            }));
        }
        
        return Promise.all(queue.syncPool).then(function() {
            expect(ozpIwc.util.ajax.calls.count()).toEqual(10);
            for(var i=0;i<10;++i) {
                expect(ozpIwc.util.ajax.calls.argsFor(i)[0].href)
                    .toEqual("https://example.com/"+i);
            }
        });
    });
    pit("only saves a node once, even if queued multiple times",function() {
        for(var i=0;i<10;++i) {
            queue.queueNode("data.api/"+i,new ozpIwc.ApiNode({
                resource: "/foo/bar",
                self: "https://example.com/"+i
            }));
            queue.queueNode("data.api/"+i,new ozpIwc.ApiNode({
                resource: "/foo/bar",
                self: "https://example.com/"+i
            }));
        }
        
        return Promise.all(queue.syncPool).then(function() {
            expect(ozpIwc.util.ajax.calls.count()).toEqual(10);
            for(var i=0;i<10;++i) {
                expect(ozpIwc.util.ajax.calls.argsFor(i)[0].href)
                    .toEqual("https://example.com/"+i);
            }
        });
    });
    
    pit("intermingles saves and deletes",function() {
        for(var i=0;i<10;++i) {
            var n=new ozpIwc.ApiNode({
                resource: "/foo/bar",
                self: "https://example.com/"+i
            });
            n.deleted=(i%2===0);
            queue.queueNode("data.api/"+i,n);
        }
        
        return Promise.all(queue.syncPool).then(function() {
            expect(ozpIwc.util.ajax.calls.count()).toEqual(10);
            for(var i=0;i<10;++i) {
                expect(ozpIwc.util.ajax.calls.argsFor(i)[0].href)
                    .toEqual("https://example.com/"+i);
                expect(ozpIwc.util.ajax.calls.argsFor(i)[0].method)
                    .toEqual((i%2===0)?"DELETE":"PUT");
            }
        });
    });

});
it("requeues a node to be saved if queue is called while the node is in-flight",function(done) {
    var queue=new ozpIwc.AjaxPersistenceQueue({poolSize:1});
    var firstCall=true;
    var exampleNode=new ozpIwc.ApiNode({
        resource: "/foo/bar",
        self: "https://example.com/data/api/foo/bar"
    });
    spyOn(ozpIwc.util,"ajax").and.callFake(function() {
        if(firstCall) {
            firstCall=false;
            console.log("Queuing from inside of ajax call");
            
            queue.queueNode("data.api/foo/bar",exampleNode).then(function() {
                expect(ozpIwc.util.ajax.calls.count()).toEqual(2);    
                expect(ozpIwc.util.ajax.calls.argsFor(0)[0].href).toEqual(exampleNode.self);
                expect(ozpIwc.util.ajax.calls.argsFor(1)[0].href).toEqual(exampleNode.self);
            }).catch(function(error) {
                expect(error).toNotHaveHappended();
            }).then(done);
        } 
        return Promise.resolve();
    });
    
    
    queue.queueNode("data.api/foo/bar",exampleNode);
    
});
describe("with multiple pools", function() {
    var queue;

    beforeEach(function() {
        queue=new ozpIwc.AjaxPersistenceQueue({poolSize:4});
        spyOn(ozpIwc.util,"ajax").and.callFake(function() {
            return Promise.resolve();
        });
    });
    
    pit("only saves a node once, even if queued multiple times",function() {
        var min=10,max=30;
        var expectedUrls=[];
        for(var i=min;i<max;++i) {
            expectedUrls.push("https://example.com/"+i);
            queue.queueNode("data.api/"+i,new ozpIwc.ApiNode({
                resource: "/foo/bar",
                self: "https://example.com/"+i
            }));
            queue.queueNode("data.api/"+i,new ozpIwc.ApiNode({
                resource: "/foo/bar",
                self: "https://example.com/"+i
            }));
        }
        
        return Promise.all(queue.syncPool).then(function() {
            expect(ozpIwc.util.ajax.calls.count()).toEqual(max-min);
            
            var urls=ozpIwc.util.ajax.calls.allArgs().map(function(a) { 
                return a[0].href;
            }).sort().join();
            
            expect(urls).toEqual(expectedUrls.sort().join());
            
        });
    });
});
});