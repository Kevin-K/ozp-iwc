describe("XACML Policy",function() {

    var Obj = ozpIwc.policyAuth.Policy;

    describe("Attributes",function(){
        it('requires a policyId',function(){
            expect(Obj.prototype.requiredAttributes.indexOf('PolicyId')).toBeGreaterThan(-1);
        });
        it('requires a version',function(){
            expect(Obj.prototype.requiredAttributes.indexOf('Version')).toBeGreaterThan(-1);
        });
        it('requires a ruleCombingAlgId',function(){
            expect(Obj.prototype.requiredAttributes.indexOf('PolicyId')).toBeGreaterThan(-1);
        });
    });

    describe("Nodes",function(){
        it('requires a Target',function(){
            expect(Obj.prototype.requiredNodes.indexOf('Target')).toBeGreaterThan(-1);
        });
    });
});