/**
 * @submodule bus.consensus
 */

ozpIwc.consensus = ozpIwc.consensus || {};

/**
 * A base-class for consensus modules.
 * 
 * @class BaseConsensus
 * @namespace ozpIwc.consensus
 * @param {Object}config
 * @constructor
 */
ozpIwc.consensus.BaseConsensus = function(config){
    config = config || {};
    var self = this;
    if(!config.name) { throw "Consensus module expects a name.";}
    /**
     * name of the consensus module
     * @property name
     * @type {String}
     */
    this.name = config.name;

    /**
     * The communication module of this consensus module.
     * @property participant
     * @tyope {Object}
     */
    this.participant = config.participant ||  new ozpIwc.ClientParticipant(config);

    /**
     * The messaging address common among all matching modules.
     * @property consensusAddress
     * @type {String}
     */
    this.consensusAddress = config.consensusAddress || this.name + ".consensus";

    /**
     * The router for which this modules participant communicates over
     * @property router
     */
    this.router = config.router || ozpIwc.defaultRouter;

    /**
     * An eventing module.
     * @property events
     * @type {ozpIwc.Event}
     */
    this.events = new ozpIwc.Event();
    this.events.mixinOnOff(this);

    /**
     * The state of the module. (coordinator/member)
     * @property state
     * @type {string}
     */
    this.state = "unknown";
    this.participant.on("connectedToRouter",function() {
        self.participant.permissions.pushIfNotExist('ozp:iwc:address', [self.participant.address,self.consensusAddress]);
        self.participant.permissions.pushIfNotExist('ozp:iwc:sendAs',[self.participant.address,self.consensusAddress]);
        self.participant.permissions.pushIfNotExist('ozp:iwc:receiveAs',[self.participant.address,self.consensusAddress]);
    });

    this.router.registerMulticast(this.participant,[this.consensusAddress]);
    this.participant.on("receive",this.routePacket,this);
};

/**
 * Packet routing functionality of the consensus module. Expected to be overridden by subclass.
 *
 * @method routePacket
 * @param {Object} packetContext
 */
//ozpIwc.consensus.BaseConsensus.prototype.routePacket= function(packetContext){
//   throw "routePacket is to be overridden by consensus implementation";
//};


/**
 * Module becoming coordinator handler for the consensus module. Expected to be overridden by subclass.
 *
 * @method onBecomeCoordinator
 */
ozpIwc.consensus.BaseConsensus.prototype.onBecomeCoordinator = function(){
    throw "onBecomeCoordinator is to be overridden by consensus implementation";
};


/**
 * Module becoming member handler for the consensus module. Expected to be overridden by subclass.
 *
 * @method onBecomeMember
 */
ozpIwc.consensus.BaseConsensus.prototype.onBecomeMember = function(){
    throw "onBecomeMember is to be overridden by consensus implementation";
};

/**
 * Changes state of the consensus module. Triggers "changedState" event.
 *
 * @method changeState
 */
ozpIwc.consensus.BaseConsensus.prototype.changeState = function(state){
    if (this.state !== state){
        this.state = state;
        this.events.trigger("changedState",this.state);
    }
};