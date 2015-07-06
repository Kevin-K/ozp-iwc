
describe("ozpIwc.testUtil.customMatchers",function() {
	describe("toBeInstanceOf", function() {
		var toBeInstanceOf;
		
		var Base=function() {};
		var DerivedA=ozpIwc.util.extend(Base,function(){});
		var DerivedB=ozpIwc.util.extend(Base,function(){});
		var DerivedFromA=ozpIwc.util.extend(DerivedA,function(){});

		
		beforeEach(function() {
			toBeInstanceOf= ozpIwc.testUtil.customMatchers.toBeInstanceOf();
		});
		
		it("matches a class on it's own", function() {
			var result=toBeInstanceOf.compare(new Base(),Base);
			expect(result.pass).toBe(true);
		});
		
		it("matches a straight subclass", function() {
			var result=toBeInstanceOf.compare(new DerivedA(),Base);
			expect(result.pass).toBe(true);
		});

		it("matches a grandchildren", function() {
			var result=toBeInstanceOf.compare(new DerivedFromA(),Base);
			expect(result.pass).toBe(true);
		});		
		
		it("does not match a base instance against a derived class", function() {
			var result=toBeInstanceOf.compare(new Base(),DerivedA);
			expect(result.pass).toBe(false);
		});
		
		it("does not match a instance against a sibling class", function() {
			var result=toBeInstanceOf.compare(new DerivedB(),DerivedA);
			expect(result.pass).toBe(false);
		});
	});
	
	
	describe("toContainAll", function() {
		var toContainAll;

		beforeEach(function() {
			var util = {
				contains: function(actual,expected) {
					return actual.indexOf(expected) !== -1;
				}
			};
			toContainAll= ozpIwc.testUtil.customMatchers.toContainAll(util);
		});
		
		it("works on single value number arrays", function() {
			var result=toContainAll.compare([1],[1]);
			expect(result.pass).toBe(true);
		});
		
		it("works on longer arrays", function() {
			var result=toContainAll.compare([1,2,3],[1,2,3]);
			expect(result.pass).toBe(true);
		});

		it("works when order doesn't match", function() {
			var result=toContainAll.compare([3,1,2],[1,2,3]);
			expect(result.pass).toBe(true);
		});		

		it("allows additional elements in the actual value", function() {
			var result=toContainAll.compare([3,1,2,123,4],[1,2,3]);
			expect(result.pass).toBe(true);
		});
		
		it("fails on single value number arrays", function() {
			var result=toContainAll.compare([1],[2]);
			expect(result.pass).toBe(false);
		});
		
		it("fails on longer arrays", function() {
			var result=toContainAll.compare([11,12,13],[1,2,3]);
			expect(result.pass).toBe(false);
		});	

		it("fails on partial match", function() {
			var result=toContainAll.compare([3,1,2],[1,2,3,123,4]);
			expect(result.pass).toBe(false);
		});		
		
		it("describes missing members on partial match", function() {
			var result=toContainAll.compare([3,1,2],[1,2,3,123,4]);
			expect(result.message).toContain("[123,4]");
		});		
	});

});