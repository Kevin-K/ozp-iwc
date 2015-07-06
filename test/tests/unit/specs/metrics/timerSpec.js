describe("Metrics: Timer",function() {
	var timer;
	
	beforeEach(function() {
		timer=new ozpIwc.metricTypes.Timer();
	});
	
	it("starts at zero",function() {
		expect(timer.get().count).toEqual(0);
	});

	it("records data with time()",function() {
        var i;
        var tickFn = function() {
				ozpIwc.testUtil.tick(i);
        };
		for(i=1; i <= 10; ++i) {
			timer.time(tickFn);
		}
		var v=timer.get();
		expect(v.count).toBe(10);
	});
	
	it("records data with start()",function() {
		for(var i=1; i <= 10; ++i) {
			var done=timer.start();
			ozpIwc.testUtil.tick(1000);
			done();
		}
		var v=timer.get();
		expect(v.count).toBe(10);
	});
});