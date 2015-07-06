describe("Data API data loading",function() {
	var dataApi;
    var endpoint;
    
    var data={
        "http://example.com/data/1": {response: {
            _links: {
                self: {href:"http://example.com/data/1"}
            }             
        }},
        "http://example.com/data/2": {response: {
            _links: {
                self: {href:"http://example.com/data/2"}
            }
        }}
    };
    data["/"]={ response: {
        _links: {
            item: Object.keys(data).map(function(k) { return {href:k};})
        },
        _embedded: {
            item: []
        }             
    }};
    
	beforeEach(function() {
        dataApi=new ozpIwc.DataApi({
            'participant': new TestClientParticipant(),
            'name': "testData.api",
            'router': new FakeRouter()
        });
        dataApi.isRequestQueueing=false;

        endpoint=jasmine.createSpyObj('endpoint',['get','put','delete']);
        ozpIwc.endpoint=function() { return endpoint; };
        endpoint.get.and.callFake(function(url) {
            return Promise.resolve(data[url]);
         });

	});
    
    pit("fetches data from the server",function() {
        
        return dataApi.transitionToLoading().then(function() {
           expect(endpoint.get).toHaveBeenCalledWith("/");
           expect(endpoint.get).toHaveBeenCalledWith("http://example.com/data/1",[]);
           expect(endpoint.get).toHaveBeenCalledWith("http://example.com/data/2",[]);
        });
    });
});