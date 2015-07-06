/* jshint unused:false */
var ozpIwc = ozpIwc || {};
ozpIwc.testUtil = ozpIwc.testUtil || {};

ozpIwc.testUtil.customMatchers={
	toBeInstanceOf: function(util, customEqualityTesters) { return {
		compare: function(actual,expected) {
			var result={ pass: actual instanceof expected };
			if(result.pass) {
				result.message="Expected " + actual + " to NOT be an instance of " + expected;
			} else {
				result.message="Expected " + actual + " to be an instance of " + expected;
			}
			return result;
		}
	};},
	toBeApproximately: function(util, customEqualityTesters) { return {
		compare: function(actual,expected,epsilon) {
			if(typeof(epsilon) !== "number") {
				epsilon=1e-5;
			}
			return {pass: Math.abs(actual-expected) <= epsilon * Math.abs(expected)};
		}
	};},
    toBeWithinRange: function(util, customEqualityTesters) { return {
        //compares epsilon against the range-scaled absolute error
        compare: function(actual,expected,range,epsilon) {
            if(typeof(epsilon) !== "number") {
                epsilon=1e-5;
            }
            return {pass: Math.abs(actual-expected)/ Math.abs(range) <= epsilon};
        }
    };},
	toContainAll: function(util, customEqualityTesters) { return {
		compare: function(actual,expected) {
			var missing=[];
			
			for(var i=0; i < expected.length;++i) {
				if(!util.contains(actual,expected[i],customEqualityTesters)) {
					missing.push(expected[i]);
				}
			}
			
			if(missing.length === 0) {
				return {
					pass: true,
					message: "Expected " + actual + " to not contain [" + expected.join(",") + "]"
				};
			} else {
				return {
					pass: false,
					message: "Expected " + actual + " to contain [" + missing.join(",") + "]"
				};
			}
		}
	};},
    toNotHappen: function(util, customEqualityTesters) { return {
        compare: function(actual) {
            var m="";            
            if(actual instanceof Error) {
                m=actual.message;
                m+=actual.stack?("\n"+actual.stack):"";
            } else {
                m="Did not expect this: " + JSON.stringify(actual);
            }
            return { 
                pass: false,
                message: m
            };
        }
    };}
};

beforeEach(function() {
    jasmine.addMatchers(ozpIwc.testUtil.customMatchers);
});

/**
 * Creates a function that calls another function after being invoked count times.
 * Effectively, this is Promise.all() for things that don't use promises. This is 
 * useful for tests that have multiple asynchronous paths.
 * @param {type} count - Number of times the returned function must be invoked.
 * @param {type} done - Function to call when count reaches zero
 * @returns {function}
 */
ozpIwc.testUtil.doneSemaphore=function(count,done) {
    return function() { 
        if(--count === 0) {
            done();
        }
    };
};


ozpIwc.testUtil.dataGenerator = function (size) {
    var result = "";
    var chars = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < size; i++) {
        result += chars.substr(Math.floor(Math.random() * 26), 1);
    }
    return result;
};

ozpIwc.testUtil.transportPacketGenerator = function (entity) {
    return {
        msgId: ozpIwc.util.generateId(),
        entity: entity
    };
};

ozpIwc.testUtil.networkPacketGenerator = function (link,transportPacket) {
    return {
        sequence: link.peer.sequenceCounter++,
        srcPeer: ozpIwc.util.generateId(),
        data: transportPacket,
        ver:0,
        src: "testSrc",
        dst: "testDst",
        msgId: "i:0"
    };
};
ozpIwc.testUtil.testPacket = function(link,size){
    return ozpIwc.testUtil.networkPacketGenerator(link,
        ozpIwc.testUtil.transportPacketGenerator(ozpIwc.testUtil.dataGenerator(size)));
};
