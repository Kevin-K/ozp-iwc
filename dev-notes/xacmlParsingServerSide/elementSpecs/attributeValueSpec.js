describe("XACML AttributeValue",function() {

    var Obj = ozpIwc.policyAuth.AttributeValue;

    describe("Attributes", function () {
        it('requires a dataType', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('DataType')).toBeGreaterThan(-1);
        });
    });

    describe("Nodes", function () {
        it('has no required Nodes', function () {
            expect(Obj.prototype.requiredNodes.length).toEqual(0);
        });
    });
});