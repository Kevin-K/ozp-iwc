describe("XACML AttributeDesignator",function() {

    var Obj = ozpIwc.policyAuth.AttributeDesignator;

    describe("Attributes", function () {
        it('requires a category', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('Category')).toBeGreaterThan(-1);
        });
        it('requires an attributeId', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('AttributeId')).toBeGreaterThan(-1);
        });
        it('requires a dataType', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('DataType')).toBeGreaterThan(-1);
        });
        it('requires a mustBePresent', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('MustBePresent')).toBeGreaterThan(-1);
        });
    });

    describe("Nodes", function () {
        it('has no required Nodes', function () {
            expect(Obj.prototype.requiredNodes.length).toEqual(0);
        });
    });
});