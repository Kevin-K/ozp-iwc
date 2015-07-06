var ozpIwc=ozpIwc || {};
ozpIwc.version = "0.2";
ozpIwc.log.threshold = 6;
ozpIwc.ELECTION_TIMEOUT = 1000;
ozpIwc.apiRootUrl = ozpIwc.apiRootUrl || "/api";
ozpIwc.policyRootUrl = ozpIwc.policyRootUrl || "/policy";
ozpIwc.basicAuthUsername= ozpIwc.basicAuthUsername || '';
ozpIwc.basicAuthPassword= ozpIwc.basicAuthPassword || '';
ozpIwc.linkRelPrefix = ozpIwc.linkRelPrefix || "ozp";

ozpIwc.intentsChooserUri = "intentsChooser.html";

(function() {
	var params=ozpIwc.util.parseQueryParams();
	if(params.log) {
		try{
			console.log("Setting log level to ",params.log);
			ozpIwc.log.setThreshold(ozpIwc.log[params.log.toUpperCase()]);
		}catch(e) {
			// just ignore it and leave the default level
		}
	}
})();

ozpIwc.authorization = new ozpIwc.policyAuth.PDP({
    'pip': new ozpIwc.policyAuth.PIP(),
    'prp': new ozpIwc.policyAuth.PRP(),
    'setsEndpoint': ozpIwc.policyRootUrl
});

if(typeof ozpIwc.enableDefault === "undefined" || ozpIwc.enableDefault) {
    ozpIwc.initEndpoints(ozpIwc.apiRootUrl || "api");

    ozpIwc.defaultPeer = new ozpIwc.Peer();
    ozpIwc.defaultLocalStorageLink = new ozpIwc.KeyBroadcastLocalStorageLink({
        peer: ozpIwc.defaultPeer
    });

    ozpIwc.heartBeatFrequency = 10000; // 10 seconds
    ozpIwc.defaultRouter = new ozpIwc.Router({
        peer: ozpIwc.defaultPeer,
        heartbeatFrequency: ozpIwc.heartBeatFrequency
    });


    if (typeof ozpIwc.runApis === "undefined" || ozpIwc.runApis) {
        ozpIwc.defaultLeadershipStates = function () {
            return {
                'leader': ['actingLeader'],
                'election': ['leaderSync', 'actingLeader'],
                'queueing': ['leaderSync'],
                'member': []
            };
        };

        ozpIwc.locksApi = new ozpIwc.LocksApi({
            'participant': new ozpIwc.LeaderGroupParticipant({
                'name': "locks.api",
                'states': ozpIwc.defaultLeadershipStates(),
                electionTimeout: ozpIwc.ELECTION_TIMEOUT,
                getStateData: function(){
                    var foo = {};
                    foo.data=ozpIwc.locksApi.data;
                    return foo;
                }
            })
        });
        ozpIwc.defaultRouter.registerParticipant(ozpIwc.locksApi.participant);

        ozpIwc.namesApi = new ozpIwc.NamesApi({'name': "names.api"});
        ozpIwc.dataApi = new ozpIwc.DataApi({'name': "data.api"});
        ozpIwc.intentsApi = new ozpIwc.IntentsApi({'name': "intents.api"});
        ozpIwc.systemApi = new ozpIwc.SystemApi({'name': "system.api"});
    }
    if (typeof ozpIwc.acceptPostMessageParticipants === "undefined" ||
        ozpIwc.acceptPostMessageParticipants
        ) {
        ozpIwc.defaultPostMessageParticipantListener = new ozpIwc.PostMessageParticipantListener({
            router: ozpIwc.defaultRouter
        });
    }
}