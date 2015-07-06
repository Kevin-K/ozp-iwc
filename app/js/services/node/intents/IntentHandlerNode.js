/**
 * @class IntentsInFlightNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.IntentHandlerNode = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    // Take the supplied data for anything that matches in the super class,
    // such as resource.
    ozpIwc.ApiNode.apply(this, arguments);
    /**
     * @property lifespan
     * @type {ozpIwc.Lifespan.Bound}
     */
    this.lifespan = new ozpIwc.Lifespan.Bound({
        'addresses': [config.src]
    });
    /**
     * @property entity
     * @type {Object}
     */
    this.entity = config.entity || {};

});

/**
 * Handles writing new data to the handler node.
 * @override
 * @method set
 * @param {Object} packet
 */
ozpIwc.IntentHandlerNode.prototype.set=function(packet) {
    var dst=packet.src;
    if(packet.entity && packet.entity.invokeIntent && packet.entity.invokeIntent.dst) {
        dst=packet.entity.invokeIntent.dst;
    }
    if(!dst) {
        ozpIwc.log.error("Handler lacks a invokeIntent.dst",packet);
        throw new ozpIwc.BadContentError("Intent handler must supply invokeIntent.dst");
    }
    
    ozpIwc.ApiNode.prototype.set.apply(this, arguments);
    this.entity.invokeIntent=this.entity.invokeIntent || {};
    this.entity.invokeIntent.dst=dst;

    //We need to know what callback to call on the client.
    this.replyTo = packet.msgId;
};

/**
 * If a resource path isn't given, this takes the best guess at assigning it.
 * @override
 * @method resourceFallback
 * @param serializedForm
 * @returns String
 */
ozpIwc.IntentHandlerNode.prototype.resourceFallback = function(serializedForm) {
    switch(this.contentType){
        case "application/vnd.ozp-intents-v1+json":
            return "/" + serializedForm.intent.type + "/" + serializedForm.intent.action;
    }
};