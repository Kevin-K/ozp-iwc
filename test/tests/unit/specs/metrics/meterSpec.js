describe("Metrics: Meter",function() {
	var meter;
	
	
	beforeEach(function() {
		meter=new ozpIwc.metricTypes.Meter();
	});
	
	
	it("starts at zero",function() {
		expect(meter.get().count).toEqual(0);
	});
	it("counts up",function() {
		meter.mark(5);
		meter.mark(1);
		var v=meter.get();
		expect(v.count).toBe(6);
	});
	
	it("calculates a reasonable one minute rate",function() {
		var step=0.1;
		for(var i=0;i<60;i+=step) {
			ozpIwc.testUtil.tick(1000 * step);
			meter.mark(1000 * step);
		}
		// 60000/60 seconds = 1000/sec 
		// use fairly loose tolerances because this test is 
		
		var v=meter.get();
		expect(v.rate1m).toBeApproximately(1000,0.1);
		expect(v.rate5m).toBeApproximately(1000,0.1);
		expect(v.rate15m).toBeApproximately(1000,0.1);
		expect(v.rateMean).toBeApproximately(1000,0.1);
	});
});