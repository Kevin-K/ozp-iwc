/* global debuggerModule */

debuggerModule.controller('ElectionCtrl',['$scope',function($scope){
    $scope.enableOrNot = false;
    $scope.recvToggle = false;
    $scope.ELECTION_TIME = ozpIwc.ELECTION_TIMEOUT;

    function isNewestPacket(packet,api){
        { return api.lastElectionTS < packet.time; }
    }
    function outOfElectionWindow(packet,api){
        { return api.lastElectionTS +  $scope.ELECTION_TIME < Date.now(); }

    }

    $scope.graphData= {
        value: 'locks.api',
        title: 'locks Api',
        elections: new vis.DataSet(),
        electionGroups: new vis.DataSet(),
        packets: {},
        storageEvents: {},
        lastElectionTS: -Number.MAX_VALUE
    };

    $scope.selectedElection = $scope.graphData;

    $scope.clear = function(){
        $scope.graphData.elections = new vis.DataSet();
        $scope.graphData.electionGroups = new vis.DataSet();
        $scope.graphData.packets = {};
        $scope.graphData.storageEvents = {};
    };

    function genTimelineData(packet){
        var state = (packet.action === "election" && typeof(packet.entity.state) !== 'undefined' && Object.keys(packet.entity.state).length > 0);
        var timelineData = {
            id: packet.time,
            content: 'Election',
            start: new Date(packet.debuggerTime),
            end: new Date(packet.time + $scope.ELECTION_TIME),
            group: packet.src,
            subgroup: "actual"
        };

        if (packet.entity.priority === -Number.MAX_VALUE){
            timelineData.style = "background-color: gray";
            timelineData.content += '<label> Quitting </label> ';
        }

        switch(packet.action){
            case "leaderQuery":
                timelineData.style = "background-color: purple";
                timelineData.content = "<label>Leader Query</label>";
                break;
            case "leaderResponse":
                timelineData.style = "background-color: purple";
                timelineData.content = "<label>Leader Response</label>";
                timelineData.end = null;
                break;
            case "victory":
                timelineData.style = "background-color: green";
                timelineData.content = "<label> Victory </label>";
                break;
        }

        if(state){
            timelineData.style = "background-color: orange";
            timelineData.content += '</br><label> Contains State </label>';
        }
        if(packet.src === packet.entity.previousLeader){
            timelineData.content += '</br><label> Was Leader </label>';

        }
        return timelineData;
    }

    function genTimelineOOS(packet){
        return {
            id: packet.time,
            content: ' Out of Sync',
            start: new Date(packet.debuggerTime),
            end: new Date(packet.time + $scope.ELECTION_TIME),
            group: packet.src,
            style: "background-color: yellow",
            subgroup: "actual"
        };
    }
    function genTimelineDrop(packet){
        return {
            id: packet.time,
            content: ' Out of Election Window',
            start: new Date(packet.debuggerTime),
            end: new Date(packet.time + $scope.ELECTION_TIME),
            group: packet.src,
            style: "background-color: red",
            subgroup: "actual"
        };
    }

    function updateApiTimeline(packet,api){
        var timelineGroup = {
            id: packet.src,
            content: packet.src
        };


        var packetData = {
            id: packet.time,
            data: packet
        };

        api.electionGroups.update(timelineGroup);

        if(isNewestPacket(packet,api)) {
            //api.elections.add(genTimelineDelta(packet));
            api.elections.add(genTimelineData(packet));
        } else if(outOfElectionWindow(packet,api)){
            //api.elections.add(genTimelineDelta(packet));
            api.elections.add(genTimelineDrop(packet));
        } else {
            //api.elections.add(genTimelineDelta(packet));
            api.elections.add(genTimelineOOS(packet));
        }
        if(packet.action === 'victory'){
            api.lastElectionTS = packet.time;
        }
        api.packets[packetData.id] = packetData.data;
    }

    function logPacket(msg) {
        if($scope.enableOrNot === "disabled") {
            return;
        }
        var packet = msg.packet.data;
        packet.debuggerTime = Date.now();
        var actions = ['election','victory','leaderQuery','leaderResponse'];
        if(actions.indexOf(packet.action) < 0) {
            return;
        }

        if(packet.dst === "locks.api.election" || packet.src === "locks.api.election") {
            $scope.$apply(function() {
                updateApiTimeline(packet,$scope.graphData);
            });
        }
    }

    var storeEvt =  function(event){
        if(event.newValue && $scope.recvToggle && $scope.enableOrNot){
            var date = Date.now();
            var id = date +'_'+ Math.floor(Math.random() * 10000);
            var packet = JSON.parse(event.newValue);
            $scope.graphData.electionGroups.update({
                id: 'storageEvent',
                content: 'storageEvent'
            });
            $scope.graphData.elections.add({
                id: id,
                content: packet.data.action || packet.data.response,
                style: (packet.data.action) ? "" : "background-color: yellow",
                start: date,
                group: 'storageEvent'
            });
            $scope.graphData.storageEvents[id] =packet;
        }
    };

    $scope.evtListener = null;

    $scope.toggle = function(){
        $scope.enableOrNot = !$scope.enableOrNot;
        if ($scope.enableOrNot){
            $scope.evtListener = ozpIwc.util.addEventListener("storage",storeEvt);
        } else {
            ozpIwc.util.removeEventListener("storage",$scope.evtListener);
        }
        ozpIwc.defaultPeer.on("receive",logPacket);
        ozpIwc.defaultPeer.on("send",logPacket);
    };
}]);

debuggerModule.directive( "elections", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/elections.tpl.html'
    };
}]);

debuggerModule.directive( "electionsContent", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/electionsContent.tpl.html'
    };
}]);

debuggerModule.directive( "electionsToolbar", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/electionsToolbar.tpl.html'
    };
}]);
