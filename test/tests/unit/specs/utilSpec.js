describe("Event",function() {
	var event;
	
	beforeEach(function() {
		event=new ozpIwc.Event();
	});
	
	afterEach(function() {
		event=null;
	});
	
    it("sets the BUS_ROOT",function() {
        expect(ozpIwc.BUS_ROOT).toMatch("/$");
        expect(ozpIwc.BUS_ROOT).not.toMatch(".html?");
    });
    
	it("single handlers gets event", function() {
		var hits=0;
		event.on("1",function() {
			hits++;
		});		
		event.trigger("1");
		expect(hits).toEqual(1);
	});
	
	it("multiple handlers gets event", function() {
		// how many registrations we want, gets
		// counted down be each listener
		var hits=0;
        var hitsFn = function() {
            hits++;
        };
		for(var i=0; i< 10; ++i) {
			event.on("1", hitsFn);
		}
		event.trigger("1");		
		
		expect(hits).toEqual(10);
	});
	
	it("unregisters handlers", function() {
		var hits=0;
        var hitsFn = function() {
            hits++;
        };
		event.on("1",hitsFn);
		event.trigger("1");		
		expect(hits).toEqual(1);		

		event.off("1",hitsFn);
		event.trigger("1");		
		expect(hits).toEqual(1);		
	});
	
	it("unregisters one of many handlers", function() {
		var hits=0;
        var hitsFn = function() {
            hits++;
        };
		for(var i=0; i< 10; ++i) {
			event.on("1", hitsFn);
		}
		var handler=function() { hits++;};
		// 11 handlers at this point
		event.on("1",handler);		
		event.trigger("1");		
		expect(hits).toEqual(11);		

		event.off("1",handler);
		event.trigger("1");		
		expect(hits).toEqual(21);		
	});
	
	it("triggers only on the proper event",function() {
		var hits1=0,hits2=0;
		event.on("1",function() { hits1++;});
		event.on("2",function() { hits2++;});
		
		event.trigger("1");
		expect(hits1).toEqual(1);
		expect(hits2).toEqual(0);
		
		event.trigger("2");
		expect(hits1).toEqual(1);
		expect(hits2).toEqual(1);
	});
		
	it("passes single argument to the handler",function() {
		event.on("1",function(event) {
			expect(event.foo).toEqual("bar");
		});
		event.trigger("1",{foo:"bar"});
	});
	
	describe("trigger returns boolean",function() {
		var hits;
		beforeEach(function() {
			hits=0;
			event.on("1",function() {hits++;});
		});
		
		it("returns false from trigger by default",function() {
			expect(event.trigger("1").canceled).toEqual(false);	
		});

		it("returns false from trigger if the cancelable event is not canceled",function() {
			expect(event.trigger("1",new ozpIwc.CancelableEvent()).canceled).toEqual(false);
		});

		it("returns true from trigger if the event is canceled",function() {
			event.on("1",function(event) { event.cancel();});
			expect(event.trigger("1",new ozpIwc.CancelableEvent()).canceled).toEqual(true);
		});

	});
	describe("Allows 'this' parameter",function() {
		it("calls handlers with a 'this' pointer",function() {
			var obj={x:10};
			event.on("1",function() {	this.x++;	},obj);
			event.trigger("1");

			expect(obj.x).toEqual(11);
		});

		it("calls handles with arguments",function() {
			var obj={x:10};
			event.on("1",function(e) { this.x+=e.v;	},obj);
			event.trigger("1",{v:5});

			expect(obj.x).toEqual(15);
		});
		
		it("unregisters handlers",function() {
			var obj={x:10};
			var handler=function() {	this.x++;	};
			event.on("1",handler,obj);
			event.trigger("1");
			expect(obj.x).toEqual(11);
			
			event.off("1",handler);
			event.trigger("1");
			expect(obj.x).toEqual(11);
		});
		
		it("mixes in on() and off() functions to an object",function() {
			var obj={bar:1};

			event.mixinOnOff(obj);
			expect(event.on).toBeDefined();
			expect(event.off).toBeDefined();
		});
		
		it("delegates on() and off() mixins to the event",function() {
			var obj={bar:1};
			var count=0;
			event.mixinOnOff(obj);
			
			var callback=obj.on("1",function() { count++;});
			event.trigger("1");
			expect(count).toEqual(1);

			obj.off("1",callback);
			event.trigger("1");
			expect(count).toEqual(1);
			
		});
	});
});


describe("Async Action",function() {
	var action;
	beforeEach(function() {
		action=new ozpIwc.AsyncAction();
	});
	
	it("resolve calls the handler",function() {
		var called=0;
		action.when("success",function(result) {
			expect(result).toEqual({foo:1});
			called++; 
		});
		expect(called).toEqual(0);
		action.resolve("success",{foo:1});
		expect(called).toEqual(1);
	});

	it("resolve calls the right handler",function() {
		var called=0;
		action.when("success",function(result) {
			expect("Should not have succeeded").toEqual("but it did");
		}).when("failure",function(result) {
			expect(result).toEqual({foo:1});
			called++; 
		});
		
		action.resolve("failure",{foo:1});
		expect(called).toEqual(1);
	});
	
	it("has candy grammar",function() {
		var called=0;
		action.success(function(result) {
			expect("Should not have succeeded").toEqual("but it did");
		}).failure(function(result) {
			expect(result).toEqual({foo:1});
			called++; 
		});
		
		action.resolve("failure",{foo:1});
		expect(called).toEqual(1);
	});
	
	it("calls a handler immediately if it has already been resolved",function() {
		var called=0;
		action.resolve("failure",{foo:1});

		action.failure(function(result) {
			expect(result).toEqual({foo:1});
			called++; 
		});
		
		expect(called).toEqual(1);
	});

	it("throws an exception if it's already resolved",function() {
		action.resolve("failure",{foo:1});

		try {
			action.resolve("failure",{foo:1});
			expect("Exception should prevent this from being run").toEqual("but it didn't");
		} catch(e) {
			// success!
		}
	});

    it("can determine if an object is an AsyncAction",function(){
        var foo = {
            a: true
        };
        expect(ozpIwc.AsyncAction.isAnAction(action)).toEqual(true);
        expect(ozpIwc.AsyncAction.isAnAction(foo)).toEqual(false);
    });

    describe('All functionality', function(){
        it("can resolve an AsyncAction immediately if a group of actions have resolved",function() {
            var tempAction1 = new ozpIwc.AsyncAction().resolve('success',{foo:1});
            var tempAction2 = new ozpIwc.AsyncAction().resolve('success',{foo:2});
            ozpIwc.AsyncAction.all([tempAction1,tempAction2])
                .success(function(results){
                    expect(results.length).toEqual(2);
                    expect(results[0]).toEqual({foo:1});
                    expect(results[1]).toEqual({foo:2});
                })
                .failure(function(err){
                    expect("this").toEqual("not happen.");
                });
        });
        it("can reject an AsyncAction immediately if any action in a group of actions rejects",function() {
            var tempAction1 = new ozpIwc.AsyncAction().resolve('failure',"I dropped my ice cream.");
            var tempAction2 = new ozpIwc.AsyncAction().resolve('success',{foo:2});
            ozpIwc.AsyncAction.all([tempAction1,tempAction2])
                .success(function(results){
                    expect("this").toEqual("not happen.");
                })
                .failure(function(err){
                    expect(err).toEqual("I dropped my ice cream.");
                });
        });

        it("can resolve an AsyncAction asynchronously if a group of actions have resolved",function(done) {
            var tempAction1 = new ozpIwc.AsyncAction();
            var tempAction2 = new ozpIwc.AsyncAction();
            ozpIwc.AsyncAction.all([tempAction1,tempAction2])
                .success(function(results){
                    expect(results.length).toEqual(2);
                    expect(results[0]).toEqual({foo:1});
                    expect(results[1]).toEqual({foo:2});
                    done();
                });
            tempAction1.resolve('success',{foo:1});
            tempAction2.resolve('success',{foo:2});
        });
        it("can reject an AsyncAction asynchronously if any action in a group of actions rejects",function(done) {
            var tempAction1 = new ozpIwc.AsyncAction();
            var tempAction2 = new ozpIwc.AsyncAction();
            ozpIwc.AsyncAction.all([tempAction1,tempAction2])
                .success(function(results){
                    expect("this").toEqual("not happen.");
                })
                .failure(function(err){
                    expect(err).toEqual("I dropped my ice cream.");
                    done();
                });
            tempAction1.resolve('failure',"I dropped my ice cream.");
            tempAction2.resolve('success',"wont resolve.");
        });

        it('can resolve all with a mixture of AsyncAction and non-AsyncAction objects immediately',function(){
            var tempAction1 = new ozpIwc.AsyncAction().resolve('success',{foo:1});
            var tempAction2 = new ozpIwc.AsyncAction().resolve('success',{foo:2});
            ozpIwc.AsyncAction.all([tempAction1,true,"works",action.resolve('success',1),2,tempAction2])
                .success(function(results){
                    expect(results[0]).toEqual({foo:1});
                    expect(results[1]).toEqual(true);
                    expect(results[2]).toEqual("works");
                    expect(results[3]).toEqual(1);
                    expect(results[4]).toEqual(2);
                    expect(results[5]).toEqual({foo:2});
                });
        });

        it('can reject all with a mixture of AsyncAction and non-AsyncAction objects immediately',function(){
            var tempAction1 = new ozpIwc.AsyncAction().resolve('success',{foo:1});
            var tempAction2 = new ozpIwc.AsyncAction().resolve('success',{foo:2});
            ozpIwc.AsyncAction.all([tempAction1,true,"works",action.resolve('failure',"test"),2,tempAction2])
                .success(function(results){
                    expect("this").toEqual('not to happen.');
                })
                .failure(function(err){
                    expect(err).toEqual("test");
                });
        });

        it('can resolve all with a mixture of AsyncAction and non-AsyncAction objects asynchronously',function(done){
            var tempAction1 = new ozpIwc.AsyncAction().resolve('success',{foo:1});
            var tempAction2 = new ozpIwc.AsyncAction().resolve('success',{foo:2});
            ozpIwc.AsyncAction.all([tempAction1,true,"works",action,2,tempAction2])
                .success(function(results){
                    expect(results[0]).toEqual({foo:1});
                    expect(results[1]).toEqual(true);
                    expect(results[2]).toEqual("works");
                    expect(results[3]).toEqual(1);
                    expect(results[4]).toEqual(2);
                    expect(results[5]).toEqual({foo:2});
                    done();
                });
            action.resolve('success',1);
        });
        it('can reject all with a mixture of AsyncAction and non-AsyncAction objects asynchronously',function(done){
            var tempAction1 = new ozpIwc.AsyncAction().resolve('success',{foo:1});
            var tempAction2 = new ozpIwc.AsyncAction().resolve('success',{foo:2});
            ozpIwc.AsyncAction.all([tempAction1,true,"works",action,2,tempAction2])
                .success(function(results){
                    expect("this").toEqual('not to happen.');
                })
                .failure(function(err){
                    expect(err).toEqual("test");
                    done();
                });
            action.resolve('failure',"test");
        });

        it('will call a resolved callback immediately if the action had previously resolved', function(done){
            var action = new ozpIwc.AsyncAction().resolve('success',{foo:1});
            action.success(function(val){
                expect(val).toEqual({foo:1});
                done();
            });
        });
    });
});

describe("General Utilities", function() {
    var modulusEquality=function(a,b) {
        return a%3 === b%3;
    };
    describe("arrayContainsAll",function() {
        it("trivially matches",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1],
                   [1]
           )).toEqual(true);
        });
        it("trivially doesn't match",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1],
                   [2]
           )).toEqual(false);
        });
        it("matches a subset",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1,2],
                   [1]
           )).toEqual(true);
        });
        it("doesn't match a superset",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1],
                   [1,2]
           )).toEqual(false);
        });
        it("trivially matches with custom equality",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1],
                   [4],
                   modulusEquality
           )).toEqual(true);
        });
        it("trivially doesn't match with custom equality",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1],
                   [5],
                   modulusEquality
           )).toEqual(false);
        });
        it("matches a subset with custom equality",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1,2],
                   [4],
                   modulusEquality
           )).toEqual(true);
        });
        it("doesn't match a superset with custom equality",function() {
           expect(ozpIwc.util.arrayContainsAll(
                   [1],
                   [4,5],
                   modulusEquality
           )).toEqual(false);
        });
    });

    describe("objectContainsAll",function() {
        it("trivially matches",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'a':1}
           )).toEqual(true);
        });
        it("trivially doesn't match with different values",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'a':2}
           )).toEqual(false);
        });
        it("trivially doesn't match with different attributes",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'b':1}
           )).toEqual(false);
        });
        it("matches a subset",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1,'b':2},
                   {'a':1}
           )).toEqual(true);
        });
        it("doesn't match a superset",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'a':1,'b':2}
           )).toEqual(false);
        });
        it("trivially matches with custom equality",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'a':4},
                   modulusEquality
           )).toEqual(true);
        });
        it("trivially doesn't match with custom equality",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'a':5},
                   modulusEquality
           )).toEqual(false);
        });
        it("matches a subset with custom equality",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':4,'b':5},
                   {'a':4},
                   modulusEquality
           )).toEqual(true);
        });
        it("doesn't match a superset with custom equality",function() {
           expect(ozpIwc.util.objectContainsAll(
                   {'a':1},
                   {'a':4,'b':5},
                   modulusEquality
           )).toEqual(false);
        });
        
    });
    
    describe("OZP Url Parser",function() {
       var cases={
           "web+ozp://data.api/foo/bar": {'dst':"data.api",'resource':"/foo/bar", 'action':"get"},
           "ozp://data.api/foo/bar": {'dst':"data.api",'resource':"/foo/bar", 'action':"get"},
           "data.api/foo/bar": {'dst':"data.api",'resource':"/foo/bar", 'action':"get"},
           "data.api/foo/bar?1234": {'dst':"data.api",'resource':"/foo/bar", 'action':"get"},
           "data.api/foo/bar#1234": {'dst':"data.api",'resource':"/foo/bar", 'action':"get"},
           "data.api/foo/bar?1234#blay": {'dst':"data.api",'resource':"/foo/bar", 'action':"get"}
        }; 
       var rejectedCases=[
           "http://data.api/foo/bar",
           "/data.api/foo/bar",
           "http://ozp://data.api/foo/bar"
       ];
           
       Object.keys(cases).forEach(function(c) {
           it("parses " + c, function() {
               expect(ozpIwc.util.parseOzpUrl(c)).toEqual(cases[c]);
           });
       });
       rejectedCases.forEach(function(c) {
           it("fails to parse " + c, function() {
               expect(ozpIwc.util.parseOzpUrl(c)).toBeNull();
           });
       });        
    });
    
    describe("ozpIwc.util.determineOrigin",function() {
        var cases={
            "http://example.com" : "http://example.com",
            "http://example.com:80" : "http://example.com",
            "http://example.com:443" : "http://example.com:443",
            "https://example.com" : "https://example.com",
            "https://example.com:80" : "https://example.com:80",
            "https://example.com:443" : "https://example.com"
        };
       Object.keys(cases).forEach(function(c) {
           it("for " + c, function() {
               expect(ozpIwc.util.determineOrigin(c)).toEqual(cases[c]);
           });
       });
    });
	
	describe("ensureArray", function() {
		it("handles null", function() {
			expect(ozpIwc.util.ensureArray(null)).toEqual([null]);
		});
		it("handles empty list", function() {
			expect(ozpIwc.util.ensureArray([])).toEqual([]);
		});
		it("handles empty obj", function() {
			expect(ozpIwc.util.ensureArray({})).toEqual([{}]);
		});
		it("handles obj", function() {
			var testobj = {test: "value"};
			expect(ozpIwc.util.ensureArray(testobj)).toEqual([testobj]); // array wrapper added
		});
		it("handles array", function() {
			var testlist = [{a: 1}, {b: 2}, {c: 3}];
			expect(ozpIwc.util.ensureArray(testlist)).toEqual(testlist);
		});
	});
  describe("URI Template",function() {
		var scenarios={
			"http://example.com/{foo}": {
				"http://example.com/foo": { foo: "foo" },
				"http://example.com/foo2": { foo: "foo2",bar: "bar" },
				"http://example.com/bar": { foo: "bar" },
				"http://example.com/foo%2Fbar": { foo: "foo/bar" }
			},
			"http://example.com/{+foo}": {
				"http://example.com/foo": { foo: "foo" },
				"http://example.com/foo2": { foo: "foo2",bar: "bar" },
				"http://example.com/bar": { foo: "bar" },
				"http://example.com/foo/bar": { foo: "foo/bar" }
			}
		};
		ozpIwc.object.eachEntry(scenarios,function(template,tests){
			ozpIwc.object.eachEntry(tests,function(answer,args){
				it("Processes "+ template +" into " + answer,function(){
					expect(ozpIwc.util.resolveUriTemplate(template,args)).toEqual(answer);
				});
			});
		});
		
		it("Removes double // in the path",function() {
			var uri=ozpIwc.util.resolveUriTemplate(
					"http://example.com/{+foo}",
					{foo:"/foo"}
			);
			expect(uri).toEqual("http://example.com/foo");
		});
	});
	
    describe("addQueryParams", function() {
        var queryObj = {
            "a": true,
            "b": 123
        };
        var queryString = "?a=true&b=123";
        var queryArray = ["a=true","b=123"];
        var url;
        beforeEach(function(){
            url = "www.test.com";
        });

        it("expects the url to be a string", function(){
            try{
                ozpIwc.util.addQueryParams({},queryObj);
            }catch (e){
                expect(e.message).toEqual("url should be a string.");
            }

        });

        it("adds the query string '?' if needed",function(){
            url = ozpIwc.util.addQueryParams(url,queryObj);
            expect(url).toEqual("www.test.com?a=true&b=123");
        });

        it("turns objects into query parameters",function(){
            url = ozpIwc.util.addQueryParams(url,queryObj);
            expect(url).toEqual("www.test.com?a=true&b=123");
        });

        it("accepts preformed query strings", function() {
            url = ozpIwc.util.addQueryParams(url,queryString);
            expect(url).toEqual("www.test.com?a=true&b=123");
        });

        it("accepts an array of query parameters ", function() {
            url = ozpIwc.util.addQueryParams(url,queryArray);
            expect(url).toEqual("www.test.com?a=true&b=123");
        });

        it("returns the original url if no query params given",function(){
            url = ozpIwc.util.addQueryParams(url,{});
            expect(url).toEqual("www.test.com");
            url = ozpIwc.util.addQueryParams(url,"");
            expect(url).toEqual("www.test.com");
            url = ozpIwc.util.addQueryParams(url,[]);
            expect(url).toEqual("www.test.com");
            url = ozpIwc.util.addQueryParams(url);
            expect(url).toEqual("www.test.com");
        });

        it("retains the urls hash", function(){
            url = "www.test.com#test-hash";
            url = ozpIwc.util.addQueryParams(url,queryObj);
            expect(url).toEqual("www.test.com?a=true&b=123#test-hash");
            url = "www.test.com#test-hash";
            url = ozpIwc.util.addQueryParams(url,{});
            expect(url).toEqual("www.test.com#test-hash");

        });
    });

});
