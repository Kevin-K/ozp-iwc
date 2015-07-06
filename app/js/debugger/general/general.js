/* global debuggerModule */
debuggerModule.controller('GeneralCtrl',['$scope', '$state', 'iwcClient',function(scope, state, client){
    scope.ozpIwc = ozpIwc;
    scope.apis=[
        {'name': "Data API", 'obj': ozpIwc.dataApi},
        {'name': "Intents API", 'obj': ozpIwc.intentsApi},
        {'name': "System API", 'obj': ozpIwc.systemApi},
        {'name': "Names API", 'obj': ozpIwc.namesApi}
    ];

    scope.endpointClicked = function(endpoint) {
        state.go('hal-browser', {url: endpoint});
    };
    scope.endpointTabulated = [];
    client.connect().then(function() {
        scope.apis.forEach(function(api){
            api.endpoints = [];
            api.obj.endpoints.forEach(function(ep){
                var endpoint = ozpIwc.endpoint(ep.link);
                scope.$apply(function() {
                    scope.endpointTabulated.push({
                        'name': api.name,
                        'rel': endpoint.name,
                        'path': endpoint.baseUrl
                    });
                });
            });
        });
        return client.api('system.api').get('/user');
    }).then(function(data){
        scope.$apply(function() {
            scope.systemUser = data.entity;
        });
        return client.api('system.api').get('/system');
    }).then(function(data){
        scope.$apply(function(){
            scope.systemBuild = data.entity;
        });
    });
}]);

debuggerModule.directive( "general", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/general.tpl.html'
    };
}]);
debuggerModule.directive( "genEndpoints", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/genEndpoints.tpl.html'
    };
}]);
debuggerModule.directive( "genBuild", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/genBuild.tpl.html'
    };
}]);
debuggerModule.directive( "genUser", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/genUser.tpl.html'
    };
}]);
debuggerModule.directive( "genAbout", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/genAbout.tpl.html'
    };
}]);