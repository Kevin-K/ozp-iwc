describe("PBAC Request Element",function() {

    var request;
    beforeEach(function(){
        request = new ozpIwc.policyAuth.Request();
    });
    it("Adds attributes to the request",function(){
        request.addAttribute("a",{
            'attributeId': 'b',
            'value': 'd'
        });
        expect(request.attributes[0].category).toEqual("a");
        expect(request.attributes[0].attribute.length).toEqual(1);
        expect(request.attributes[0].attribute[0].attributeId).toEqual('b');
        expect(request.attributes[0].attribute[0].value).toEqual('d');
    });

    it("Doesn't add improper attribute formats", function(){
        request.addAttribute("a","b");
        expect(request.attributes).toEqual([]);
    });

    it("Assigns default categories for subject attributes",function(){
        request.addSubject({
            'attributeId': 'b',
            'dataType': 'c',
            'value': 'd'
        });
        expect(request.attributes[0].category).toEqual(request.defaultSubjectCategory);
    });

    it("Assigns default categories for resource attributes",function(){
        request.addResource({
            'attributeId': 'b',
            'dataType': 'c',
            'value': 'd'
        });
        expect(request.attributes[0].category).toEqual(request.defaultResourceCategory);
    });

    it("Assigns default categories for action attributes",function(){
        request.addAction({
            'attributeId': 'b',
            'dataType': 'c',
            'value': 'd'
        });
        expect(request.attributes[0].category).toEqual(request.defaultActionCategory);
    });

    it("Assigns a default attributeId for subject attributes",function(){
        request.addSubject({
            'dataType': 'c',
            'value': 'd'
        });
        expect(request.attributes[0].attribute[0].attributeId).toEqual(request.defaultSubjectId);
    });

    it("Assigns a default attributeId for resource attributes",function(){
        request.addResource({
            'dataType': 'c',
            'value': 'd'
        });
        expect(request.attributes[0].attribute[0].attributeId).toEqual(request.defaultResourceId);
    });

    it("Assigns a default attributeId for action attributes",function(){
        request.addAction({
            'dataType': 'c',
            'value': 'd'
        });
        expect(request.attributes[0].attribute[0].attributeId).toEqual(request.defaultActionId);
    });
});