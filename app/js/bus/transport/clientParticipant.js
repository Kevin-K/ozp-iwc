/**
 * Classes related to transport aspects of the IWC.
 * @module bus
 * @submodule bus.transport
 */

/**
 * A participant for the client's communication needs.
 * @class ClientParticipant
 * @namespace ozpIwc
 *
 * @constructor
 * @extends ozpIwc.Participant
 * @uses ozpIwc.ClientMixin
 * @param {Object} config
 * @param {String} config.name The name of the participant.
 */
ozpIwc.ClientParticipant=ozpIwc.util.extend(ozpIwc.Participant,function(config) {
    config=config || {};
    ozpIwc.Participant.apply(this,arguments);
    /**
     * The type of the participant.
     * @property participantType
     * @type {String}
     * @default "internal"
     */
    this.participantType="internalClient";

    /**
     * Notes if this is a client participant internal to the bus.
     * @property internal
     * @type {Boolean}
     * @default false
     */
    this.internal = config.internal || false;
    /**
     * The name of the participant.
     * @property name
     * @type {String}
     * @default ""
     */
    this.name=config.name;

    /**
     * The router to connect to.
     * @property router
     * @type {*|ozpIwc.defaultRouter}
     */
    this.router=config.router || ozpIwc.defaultRouter;
    var self = this;
    this.on("connectedToRouter",function() {
        self.permissions.pushIfNotExist('ozp:iwc:address', self.address);
        self.permissions.pushIfNotExist('ozp:iwc:sendAs',self.address);
        self.permissions.pushIfNotExist('ozp:iwc:receiveAs', self.address);

        ozpIwc.metrics.gauge(self.metricRoot,"registeredCallbacks").set(function() {
            if (!self.replyCallbacks || !Object.keys(self.replyCallbacks)) {
                return 0;
            }
            return Object.keys(self.replyCallbacks).length;
        });
    });

    ozpIwc.ApiPromiseMixin(this,config.autoConnect);
});


/**
 * Connects the client from the IWC bus.
 * Fires:
 *     - {{#crossLink "ozpIwc.Client/#connected"}}{{/crossLink}}
 *
 * @method connect
 */
ozpIwc.ClientParticipant.prototype.connect = function(){

    if(!this.connectPromise) {
        var self = this;
        /**
         * Promise to chain off of for client connection asynchronous actions.
         * @property connectPromise
         *
         * @type Promise
         */
        this.connectPromise = new Promise(function(resolve,reject){
            resolve(self.router.registerParticipant(self));
        }).then(function(addr){
            return self.afterConnected(addr);
        });
    }

    return this.connectPromise;
};
/**
 * Send functionality for the clientParticipant type Participant.
 *
 * @method sendImpl
 * @param {ozpIwc.TransportPacket} packet
 */
ozpIwc.ClientParticipant.prototype.sendImpl=ozpIwc.Participant.prototype.send;