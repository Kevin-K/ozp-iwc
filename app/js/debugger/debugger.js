var debuggerModule=angular.module("ozpIwc.debugger",[
    'ui.bootstrap',
    'ui.grid',
    'ui.grid.selection',
    'ui.router'
]).config(function($stateProvider, $urlRouterProvider) {
      // For any unmatched url, redirect to General
      $urlRouterProvider.otherwise("/general");

      $stateProvider
        .state('general', {
            url: "/general",
            templateUrl: "templates/generalState.tpl.html"
        })
        .state('metrics', {
            url: "/metrics",
            templateUrl: "templates/metricsState.tpl.html"
        })
        .state('traffic-snooper', {
            url: "/traffic-snooper",
            templateUrl: "templates/trafficSnooperState.tpl.html"
        })
        .state('elections', {
            url: "/elections",
            templateUrl: "templates/electionsState.tpl.html"
        })
        .state('system-api', {
            url: "/system-api",
            templateUrl: "templates/systemApiState.tpl.html"
        })
        .state('data-api', {
            url: "/data-api",
            templateUrl: "templates/dataApiState.tpl.html"
        })
        .state('intents-api', {
            url: "/intents-api",
            templateUrl: "templates/intentsApiState.tpl.html"
        })
        .state('names-api', {
            url: "/names-api",
            templateUrl: "templates/namesApiState.tpl.html"
        })
        .state('hal-browser', {
            url: "/hal-browser/:url",
            templateUrl: "templates/halBrowserState.tpl.html"
        });
});


debuggerModule.factory("iwcClient",function() {
    return new ozpIwc.ClientParticipant({name: "debuggerClient"});
});
        
        
debuggerModule.controller("debuggerController",["$scope","iwcClient",function(scope,client) {
    scope.ozpIwc = ozpIwc;
    scope.apiRootUrl = ozpIwc.apiRootUrl;
    scope.tab = 'general';
    client.connect().then(function(){
        scope.address = client.address;
    });
}]);
debuggerModule.service("apiSettingService",function(){
    this.apis={
        'data.api' : {
            'address': "data.api",
        },
        'intents.api': {
            'address': "intents.api",
            'actions': [{
                action: "invoke",
                contentTypes: ['application/vnd.ozp-iwc-intent-definition-v1+json',
                    'application/vnd.ozp-iwc-intent-handler-v1+json']
            },{
                action: "broadcast",
                contentTypes: ['application/vnd.ozp-iwc-intent-definition-v1+json',
                    'application/vnd.ozp-iwc-intent-handler-v1+json']
            }]
        },
        'system.api': {
            'address': "system.api",
            'actions': [{
                action: "launch",
                contentTypes: ['application/vnd.ozp-application-v1+json']
            }]
        },
        'names.api': {
            'address': "names.api"
        }
    };
});
