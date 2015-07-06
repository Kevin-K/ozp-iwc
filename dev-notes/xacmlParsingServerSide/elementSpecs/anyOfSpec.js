describe("XACML AnyOf",function() {

    var Obj = ozpIwc.policyAuth.AnyOf;

    describe("Attributes",function(){
        it('has no required Attributes',function(){
            expect(Obj.prototype.requiredAttributes.length).toEqual(0);
        });
    });

    describe("Nodes",function(){
        it('requires AllOf elements',function(){
            expect(Obj.prototype.requiredNodes.indexOf('AllOf')).toBeGreaterThan(-1);
        });
    });
});