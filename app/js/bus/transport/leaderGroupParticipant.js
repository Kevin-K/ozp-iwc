/**
 * @submodule bus.transport
 */

/**
 * Baseclass for APIs that need leader election.  Uses the Bully algorithm for leader election.
 *
 * Implementer is responsible for handling two events:
 *    <li> <b>"becameLeaderEvent"</b> - participant has finished its election process and is to become the leader. Handle
 *    any logic necessary above the LeaderGroupParticipant and then trigger the participant's event <b>"becameLeader"</b>
 *    <i>(ex. participant.events.trigger("becameLeader")</i></li>
 *    <li> <b>"newLeaderEvent"</b> - participant has finished its election process and is to become a member. Handle any logic necessary above
 *    the LeaderGroupParticipant then trigger the participant's event <b>"newLeader"</b>
 *    <i>(ex. participant.events.trigger("newLeader")</i></li>
 *
 * @class LeaderGroupParticipant
 * @namespace ozpIwc
 * @extends ozpIwc.InternalParticipant
 * @constructor
 *
 * @param {Object} config
 * @param {String} config.name
 *        The name of this API.
 * @param {String} [config.electionAddress=config.name+".election"]
 *        The multicast channel for running elections.  
 *        The leader will register to receive multicast on this channel.
 * @param {Number} [config.priority=Math.Random]
 *        How strongly this node feels it should be leader.
 * @param {Function} [config.priorityLessThan]
 *        Function that provides a strict total ordering on the priority.  Default is "<".
 * @param {Number} [config.electionTimeout=250]
 *        Number of milliseconds to wait before declaring victory on an election. 
 * @param {number} [config.electionTimeout=250]
 *        Number of milliseconds to wait before declaring victory on an election.
 * @param {Object} config.states  State machine states the participant will register and react to given their assigned category.
 *        Default states listed are always applied and need not be passed in configuration.
 * @param {Object} [config.states.leader=['leader']]
 *        Any state that the participant should deem itself the leader of its group.
 * @param {Object} [config.states.member=['member']]
 *        Any state that the participant should deem itself a member (not leader) of its group.
 * @param {Object} [config.states.election=['election']]
 *        Any state that the participant should deem itself in an election with its group.
 * @param {Object} [config.states.queueing=['connecting','election']]
 *        Any state that the participant should block non-election messages until not in a queueing state
 */
ozpIwc.LeaderGroupParticipant=ozpIwc.util.extend(ozpIwc.InternalParticipant,function(config) {
	ozpIwc.InternalParticipant.apply(this,arguments);
    config.states = config.states || {};
    this.getStateData = config.getStateData || function(){return{}; };


	if(!config.name) {
		throw "Config must contain a name value";
	}


	// Networking info
    /**
     * The name of the participant.
     * @property name
     * @type String
     * @default ""
     */
	this.name=config.name;

    /**
     * The election address for common LeaderGroupParticipant's on the IWC bus.
     * @property electionAddress
     * @type String
     * @default ".election"
     */
	this.electionAddress=config.electionAddress || (this.name + ".election");


	// Election times and how to score them
    /**
     * A numeric value to determine who the leader of the group should be.
     * @property priority
     * @type Number
     * @default {{#crossLink "ozpIwc.util/now:method"}}-ozpIwc.util.now(){{/crossLink}}
     */
	this.priority = config.priority || ozpIwc.defaultLeaderPriority || -ozpIwc.util.now();

    /**
     * Function to determine the lower value amongst two priorities.
     * @property priorityLessThan
     * @type Function
     * @default function( l, r) { return l < r };
     */
	this.priorityLessThan = config.priorityLessThan || function(l,r) { return l < r; };


    /**
     * How long a participant partakes in an election.
     * @property electionTimeout
     * @type Number
     * @default 250
     */
	this.electionTimeout=config.electionTimeout || 1000; // quarter second

    /**
     * The current state of the participant.
     *
     * The leaderGroupParticipant has the following states:
     *   - connecting
     *   - queueing
     *   - election
     *   - leader
     *   - member
     *
     * @property leaderState
     * @type String
     * @default "connecting"
     */
	this.leaderState="connecting";

    /**
     * Packets received from the router that are not pertinent to the election. They will be processed post election
     * if this participant becomes the leader.
     * @property electionQueue
     * @type ozpIwc.NetworkPacket[]
     * @default []
     */
	this.electionQueue=[];

    /**
     * A registry of sub-states of the Election State Machine. While leaderGroupParticipant operates on states "leader",
     * "member", "queueing", and "election", it can fire events for those states should a substate change.
     * @property states
     * @type {states|*|Object|{}}
     */
    this.states = config.states;

    /**
     * Leader sub-states of the State Machine.
     * @property states.leader
     * @type {String[]}
     * @default ["leader"]
     */
    this.states.leader = this.states.leader || [];
    this.states.leader = this.states.leader.concat(["leader"]);

    /**
     * Member sub-states of the State Machine.
     * @property states.member
     * @type {String[]}
     * @default ["member"]
     */
    this.states.member = this.states.member || [];
    this.states.member = this.states.member.concat(["member"]);

    /**
     * Election sub-states of the State Machine.
     * @property states.election
     * @type {String[]}
     * @default ["election"]
     */
    this.states.election = this.states.election || [];
    this.states.election = this.states.election.concat(["election"]);

    /**
     * Queueing sub-states of the State Machine.
     * @property states.queueing
     * @type {String[]}
     * @default ["connecting", "election"]
     */
    this.states.queueing = this.states.queueing || [];
    this.states.queueing = this.states.queueing.concat(["connecting", "election"]);

    /**
     * A snapshot of the current active states of the participant.
     * @propery activeStates
     * @type {Object}
     */
    this.activeStates = config.activeStates || {
        'leader': false,
        'member': false,
        'election': false,
        'queueing': true
    };

    this.changeState("connecting");


	// tracking the current leader
    /**
     * The address of the current leader.
     * @property leader
     * @type String
     * @default null
     */
	this.leader=null;

    /**
     * The priority of the current leader.
     * @property leaderPriority
     * @type Number
     * @default null
     */
	this.leaderPriority=null;

    /**
     * The type of the participant.
     * @property participantType
     * @type String
     * @default "leaderGroup"
     */
	this.participantType="leaderGroup";

    /**
     * The name of the participant.
     * @property name
     * @type String
     * @default ""
     */
	this.name=config.name;


    /**
     * An internal flag used to debounce invalid leadership attempts due to high network traffic.
     * @property toggleDrop
     * @type Boolean
     * @default false
     */
    this.toggleDrop = false;

    this.victoryTS = -Number.MAX_VALUE;
    /**
     * Fires when the participant enters an election.
     * @event #startElection
     */
	this.on("startElection",function() {
        this.toggleDrop = false;
	},this);

    /**
     * Fires when this participant becomes the leader.
     * @event #becameLeader
     *
     */
	this.on("becameLeader",function() {
        this.leader = this.address;
        this.leaderPriority = this.priority;
		this.electionQueue.forEach(function(p) {
			this.forwardToTarget(p);
		},this);
		this.electionQueue=[];
	},this);

    /**
     * Fires when a leader has been assigned and this participant is not it.
     * @event #newLeader
     */
	this.on("newLeader",function() {
		this.electionQueue=[];
	},this);



    // Handle passing of state on unload
    var self=this;
    ozpIwc.util.addEventListener("beforeunload",function() {
        //Priority has to be the minimum possible
        self.priority=-Number.MAX_VALUE;

        if(self.activeStates.leader) {
            for (var part in self.router.participants) {
                var participant = self.router.participants[part];

                // Each leaderParticipant should report out what participants are on
                // the router so that higher level elements can clean up soon to be dead references before passing on state.
                if (participant.address) {
                    self.events.trigger("receive", {
                        packet: self.fixPacket({
                            dst: "$bus.multicast",
                            action: "disconnect",
                            entity: {
                                address: participant.address,
                                participantType: participant.participantType,
                                namesResource: participant.namesResource
                            }
                        })
                    });
                }
            }
        }

        self.events.trigger("unloadState");
    });


    // Connect Metrics
    ozpIwc.metrics.gauge('transport.leaderGroup.election').set(function() {
        var queue = self.getElectionQueue();
        return {'queue': queue ? queue.length : 0};
    });

    /**
     * Fires when the participant has connected to its router.
     * @event #connectedToRouter
     */
	this.on("connectedToRouter",function() {
        this.router.registerMulticast(this,[this.electionAddress,this.name]);
        var self = this;
        ozpIwc.util.setImmediate(function(){
            self.startElection();
        });

    },this);

    this.on("receive",this.routePacket,this);
});

/**
 * Retrieve the election queue. Called by closures which need access to the queue as it grows
 *
 * @method getElectionQueue
 *
 * @returns {Array} the election queue
 */
ozpIwc.LeaderGroupParticipant.prototype.getElectionQueue=function() {
    return this.electionQueue;
};


/**
 * Checks to see if the leadership group is in an election
 *
 * @method inElection
 *
 * @returns {Boolean} True if in an election state, otherwise false
 */
ozpIwc.LeaderGroupParticipant.prototype.inElection=function() {
    return !!this.electionTimer || this.activeStates.election;
};


/**
 * Checks to see if this instance is the leader of it's group.
 *
 * @method isLeader
 *
 * @returns {Boolean} True if leader.
 */
ozpIwc.LeaderGroupParticipant.prototype.isLeader=function() {
    return this.leader === this.address;
};


/**
 * Sends an election message to the leadership group.
 *
 * @method sendElectionMessage
 * @private
 * @param {String} type The type of message -- "election" or "victory"
 */
ozpIwc.LeaderGroupParticipant.prototype.sendElectionMessage=function(type, config, callback) {
    config = config || {};
    var state = config.state || {};
    var previousLeader = config.previousLeader || this.leader;
    var opponent = config.opponent || "";
    // TODO: no state should have circular references, this will eventually go away.
    try {
        JSON.stringify(state);
    } catch (ex) {
        ozpIwc.log.error(this.name,this.address,"failed to send state.", ex);
        state = {};
    }

    this.send({
		'src': this.address,
		'dst': this.electionAddress,
		'action': type,
		'entity': {
			'priority': this.priority,
            'state': state,
            'previousLeader': previousLeader,
            'opponent': opponent
		}
	},callback);
};


/**
 * Sends a message to the leadership group stating victory in the current election. LeaderGroupParticipant.priority
 * included to allow rebuttal. Will only send if participant's current state is in one of the following state categories:
 *      <li>leader</li>
 *      <li>election</li>
 * @returns {ozpIwc.TransportPacket} Packet returned if valid request, else false.
 */
ozpIwc.LeaderGroupParticipant.prototype.sendVictoryMessage = function(){
    if(this.activeStates.leader || this.activeStates.election) {
        return this.send({
            'src': this.address,
            'dst': this.electionAddress,
            'action': 'victory',
            'entity': {
                'priority': this.priority
            }
        });
    } else {
        return false;
    }
};

ozpIwc.LeaderGroupParticipant.prototype.leaderQuery=function(config){
    if(this.inElection()){
        return;
    }
    this.leaderQueryTimer = window.setTimeout(function(){
        self.cancelElection();
        self.startElection();
    },this.electionTimeout);

    var self = this;
    this.sendElectionMessage("leaderQuery",{},function(response){
        window.clearTimeout(self.leaderQueryTimer);

        if(response.entity.priority > self.priority) {
            this.leader = response.src;
            this.leaderPriority = response.entity.priority;
            this.victoryTS = response.time;
            self.events.trigger("newLeaderEvent");
            this.stateStore = {};
        }
    });
};

/**
 * Attempt to start a new election.
 *
 * Fires:
 *     - {{#crossLink "ozpiwc.LeaderGroupParticipant/#startElection:event"}{{/crossLink}}
 *     - {{#crossLink "ozpiwc.LeaderGroupParticipant/#becameLeader:event"}{{/crossLink}}
 *
 * @method startElection
 * @param {Object} config
 * @param {Object} config.state
 * @protected
 *
 */
ozpIwc.LeaderGroupParticipant.prototype.startElection=function(config) {
    config = config || {};
    var state = config.state || {};
    var opponent = config.opponent || "";
	// don't start a new election if we are in one
	if(this.inElection()) {
		return;
	}
    this.events.trigger("startElection");

	var self=this;
	// if no one overrules us, declare victory
	this.electionTimer=window.setTimeout(function() {
		self.cancelElection();
        self.events.trigger("becameLeaderEvent");
	},this.electionTimeout);

	this.sendElectionMessage("election", {state: state, previousLeader: this.leader, opponent: opponent});
};


/**
 * Cancels participation in an in-progress election.
 *
 * Fires:
 *     - {{#crossLink "ozpiwc.LeaderGroupParticipant/#endElection:event"}{{/crossLink}}
 *
 * @method cancelElection
 *
 * @protected
 */
ozpIwc.LeaderGroupParticipant.prototype.cancelElection=function() {
	if(this.electionTimer) {
        window.clearTimeout(this.electionTimer);
        this.electionTimer=null;
        this.events.trigger("endElection");
	}
};


/**
 * Receives a packet on the election control group or forwards it to the target implementation of this leadership group.
 *
 * @method routePacket
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LeaderGroupParticipant.prototype.routePacket=function(packetContext) {
	var packet=packetContext.packet;
	packetContext.leaderState=this.leaderState;
    if(packet.src === this.address) {
        // drop our own packets that found their way here
        return;
    }
    if(packet.dst === this.electionAddress) {
        if(packet.src === this.address) {
			// even if we see our own messages, we shouldn't act upon them
			return;
		} else if(packet.action === "leaderQuery"){
            this.handleLeaderQueryMessage(packetContext);
        } else if(packet.action === "election") {
			this.handleElectionMessage(packet);
		} else if(packet.action === "victory") {
			this.handleVictoryMessage(packet);
        }
    } else {
        this.forwardToTarget(packetContext);
	}		
};

/**
 * Forwards received packets to the target implementation of the participant. If currently in an election, messages
 * are queued.
 *
 * Fires:
 *     - {{#crossLink "ozpiwc.LeaderGroupParticipant/#receiveApiPacket:event"}{{/crossLink}}
 *
 * @method forwardToTarget
 *
 * @param {ozpIwc.TransportPacket} packetContext
 */
ozpIwc.LeaderGroupParticipant.prototype.forwardToTarget=function(packetContext) {
    if(this.activeStates.queueing) {
		this.electionQueue.push(packetContext);
		return;
	}
	packetContext.leaderState=this.leaderState;
	this.events.trigger("receiveApiPacket",packetContext);
};


ozpIwc.LeaderGroupParticipant.prototype.handleLeaderQueryMessage=function(electionMessage){
    if(!this.activeStates.leader){
        return;
    }
    electionMessage.replyTo({
        action: "leaderResponse",
        entity: {
            priority: this.priority
        }
    });
};
	
/**
 * Respond to someone else starting an election.
 *
 * @method handleElectionMessage
 *
 * @private
 * @param {ozpIwc.TransportPacket} electionMessage
 */
ozpIwc.LeaderGroupParticipant.prototype.handleElectionMessage=function(electionMessage) {
    //If a state was received, store it case participant becomes the leader
    if(Object.keys(electionMessage.entity.state).length > 0){
        this.stateStore = electionMessage.entity.state;
        this.events.trigger("receivedState", electionMessage.entity.state);
    }

    // If knowledge of a previousLeader was received, store it case participant becomes the leader and requests state
    // from said participant.
    if(electionMessage.entity.previousLeader){
        if (electionMessage.entity.previousLeader !== this.address) {
            this.previousLeader = electionMessage.entity.previousLeader;
        }
    }


	// is the new election lower priority than us?
	if(this.priorityLessThan(electionMessage.entity.priority,this.priority) && this.victoryTS < electionMessage.time) {
        if(electionMessage.entity.priority === -Number.MAX_VALUE){
            this.cancelElection();
            this.activeStates.election = false;
        } else {
            if(!this.inElection()) {
                this.electionQueue = [];
            }
        }
        // Quell the rebellion!
        this.startElection({opponent: electionMessage.src, state: this.getStateData()});

    } else if(this.activeStates.leader) {
        // If this participant is currently the leader but will loose the election, it sends out notification that their
        // is currently a leader (for state retrieval purposes)
        this.sendElectionMessage("election", {previousLeader: this.address});

    } else {

        // Abandon dreams of leadership
        this.cancelElection();

        // If set, after canceling, the participant will force itself to a membership state. Used to debounce invalid
        // leadership attempts due to high network traffic.
        if(this.toggleDrop){
            this.toggleDrop = false;
            this.events.trigger("newLeaderEvent");
        }
	}

};


/**
 * Handle someone else declaring victory.
 *
 * Fires:
 *     - {{#crossLink "ozpiwc.LeaderGroupParticipant/#newLeader:event"}{{/crossLink}}
 *
 * @param {ozpIwc.TransportPacket} victoryMessage
 */
ozpIwc.LeaderGroupParticipant.prototype.handleVictoryMessage=function(victoryMessage) {
	if(this.priorityLessThan(victoryMessage.entity.priority,this.priority)) {
		// someone usurped our leadership! start an election!
            this.startElection({opponent: victoryMessage.src +"USURPER"});
	} else {
		// submit to the bully
		this.leader=victoryMessage.src;
		this.leaderPriority=victoryMessage.entity.priority;
        this.victoryTS = victoryMessage.time;
		this.cancelElection();
		this.events.trigger("newLeaderEvent");
        this.stateStore = {};
	}
};

/**
 * Returns the status of the participant.
 *
 * @method heartbeatStatus
 * @returns {Object}
 */
ozpIwc.LeaderGroupParticipant.prototype.heartbeatStatus=function() {
	var status= ozpIwc.Participant.prototype.heartbeatStatus.apply(this,arguments);
	status.leaderState=this.leaderState;
	status.leaderPriority=this.priority;
	return status;
};


/**
 * Changes the current state of the participant.
 * @param state {string} The state to change to.
 * @param config {object} properties to change in the participant should the state transition be valid
 * @returns {boolean}
 *      Will return true if a state transition occurred.
 *      Will not change state and return false if:
 *      <li>the new state was the current state</li>
 *      <li>the new state is not a registered state @see ozpIwc.LeaderGroupParticipant</li>
 */
ozpIwc.LeaderGroupParticipant.prototype.changeState=function(state,config) {
    if(state !== this.leaderState){
//        ozpIwc.log.log(this.address, this.leaderState, state);
        if(this._validateState(state)){
            for(var key in config){
                this[key] = config[key];
            }
            return true;
        }
    }
    return false;
};


/**
 *  Validates if the desired state transition is possible.
 *
 * @param state {string} The desired state to transition to.
 * @returns {boolean}
 *      Will return true if a state transition occured. </br>
 *      Will not change state and return false if:
 *      <li>the new state was the current state</li>
 *      <li>the new state is not a registered state</li>
 * @private
 */
ozpIwc.LeaderGroupParticipant.prototype._validateState = function(state){
    var newState = {};
    var validState = false;
    for(var x in this.states) {
        if(ozpIwc.util.arrayContainsAll(this.states[x], [state])){
            newState[x] = true;
            validState = true;
        } else {
            newState[x] = false;
        }
    }
    if(validState){
        this.activeStates = newState;
        this.leaderState = state;
        return true;
    } else {
        ozpIwc.log.error(this.address, this.name, "does not have state:", state);
        return false;
    }
};