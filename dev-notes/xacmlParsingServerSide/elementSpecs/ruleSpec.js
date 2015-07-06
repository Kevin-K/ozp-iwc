describe("XACML Rule",function() {

    var Obj = ozpIwc.policyAuth.Rule;

    describe("Attributes",function(){
        it('requires a ruleId',function(){
            expect(Obj.prototype.requiredAttributes.indexOf('RuleId')).toBeGreaterThan(-1);
        });
        it('requires an effect',function(){
            expect(Obj.prototype.requiredAttributes.indexOf('Effect')).toBeGreaterThan(-1);
        });
    });

    describe("Nodes",function(){
        it('has no required Nodes',function(){
            expect(Obj.prototype.requiredNodes.length).toEqual(0);
        });
    });

});