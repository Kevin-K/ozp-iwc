describe("XACML Match",function() {

    var Obj = ozpIwc.policyAuth.Match;

    describe("Attributes", function () {
        it('requires a matchId', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('MatchId')).toBeGreaterThan(-1);
        });
    });

    describe("Nodes", function () {
        it('requires an AttributeValue', function () {
            expect(Obj.prototype.requiredAttributes.indexOf('AttributeValue')).toBeGreaterThan(-1);
        });
    });

});