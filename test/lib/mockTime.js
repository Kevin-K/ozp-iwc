//================================================
// Time-advancement for IWC objects that use time
//================================================
var ozpIwc = ozpIwc || {};
ozpIwc.testUtil = ozpIwc.testUtil || {};

ozpIwc.testUtil.clockOffset=0;

ozpIwc.testUtil.tick=function(t) { 
	ozpIwc.testUtil.clockOffset+=t;
	try {
		jasmine.clock().tick(t);
	} catch (e) {
		// do nothing
	}
};

// mock out the now function to let us fast forward time
ozpIwc.util.now=function() {
	return new Date().getTime() + ozpIwc.testUtil.clockOffset;
};