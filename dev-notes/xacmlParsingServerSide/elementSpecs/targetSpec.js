describe("XACML Target",function() {

    var Obj = ozpIwc.policyAuth.Target;

    describe("Attributes",function(){
        it('has no required Attributes',function(){
            expect(Obj.prototype.requiredAttributes.length).toEqual(0);
        });
    });

    describe("Nodes",function(){
        it('has no required Nodes',function(){
            expect(Obj.prototype.requiredNodes.length).toEqual(0);
        });
    });

});