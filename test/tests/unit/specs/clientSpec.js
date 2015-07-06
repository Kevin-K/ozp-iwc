describe("Client",function() {
    describe("stringification of messages",function() {
        var isStructuredClonesSupported;
        var client;
        var receiveData=function(event) {
            var data=event.message.data;
            if (!isStructuredClonesSupported) {
                expect(typeof(data)==="string");
            } else {
                expect(typeof(data)==="object" || (data instanceof File && typeof(ozpIwc.util.getPostMessagePayload(data)) === 'string'));
            }
        };

        beforeEach(function() {
            isStructuredClonesSupported=ozpIwc.util.structuredCloneSupport();
            client=new ozpIwc.Client({peerUrl:"http://" + window.location.hostname + ":13000"});
            client.on("message",receiveData);
        });

        afterEach(function() {
            client=null;
        });

        it("sends an object via postMessage and does not stringify unless necessary ",function() {
            client.send({});
        });
    });

    describe("launch parameters",function() {
        var client;

        beforeEach(function() {
            window.name="";
            client=new ozpIwc.Client({peerUrl:"http://" + window.location.hostname + ":13000"});
        });
        afterEach(function() {
            client.disconnect();
            client=null;
        });

        var parserTest=function(string,result) {
            it("parses " + string + " as a launch param",function() {
                client.readLaunchParams(string);
                expect(client.launchParams).toEqual(result);
            });
        };

        parserTest("#ozpIwc.test=123", { 'test': 123});
        parserTest("?ozpIwc.test=123", { 'test': 123});
        parserTest("?ozpIwc.test=123&x=1&y=3", { 'test': 123});
        parserTest("?z=5&ozpIwc.test=%22%26foo%22&x=1&y=3", { 'test': "&foo"});

        it("merges multiple launch params",function() {
            client.readLaunchParams("#ozpIwc.test=123");
            client.readLaunchParams("?ozpIwc.test2=456");
            expect(client.launchParams).toEqual({
                test: 123,
                test2: 456
            });
        });
        it("merges multiple launch params in the same string",function() {
            client.readLaunchParams("#ozpIwc.test=123&ozpIwc.test2=456");
            expect(client.launchParams).toEqual({
                test: 123,
                test2: 456
            });
        });
        it("doesn't break on bad variables",function() {
            client.readLaunchParams("#ozpIwc.test=123&ozpIwc.te[]st2=8910&ozpIwc.test2=456");
            expect(client.launchParams).toEqual({
                test: 123,
                test2: 456
            });
        });
    });
});