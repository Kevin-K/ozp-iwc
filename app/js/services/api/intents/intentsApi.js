/**
 * @submodule bus.service.Type
 */

/**
 * The Intents Api.
 * Subclasses the {{#crossLink "ozpIwc.ApiBase"}}{{/crossLink}}.
 *
 * @class IntentsApi
 * @namespace ozpIwc
 * @extends ozpIwc.ApiBase
 * @constructor
 */
ozpIwc.IntentsApi = ozpIwc.createApi(function(config) {
    /**
     * @property persistenceQueue
     * @type {ozpIwc.AjaxPersistenceQueue|*}
     */
    this.persistenceQueue = config.persistenceQueue || new ozpIwc.AjaxPersistenceQueue();

    /**
     * @property endpoints
     * @type {Object[]}
     */
    this.endpoints=[
        {
            link: ozpIwc.linkRelPrefix+":intent",
            headers: []
        }
    ];
});

// turn on bulkGet and list for everything
ozpIwc.IntentsApi.useDefaultRoute(["bulkGet", "list"]);

//====================================================================
// Intent Invocation Endpoints
//====================================================================

ozpIwc.IntentsApi.useDefaultRoute([ "watch", "unwatch", "delete"], "/inFlightIntent/{id}");

/**
 * A handler for invoke calls. Creates an inFlight-intent node and kicks off the inflight state machine.
 *
 * @method invokeIntentHandler
 * @param {Object} packet
 * @param {String} type
 * @param {String} action
 * @param {Object[]} handlers
 * @param {String} pattern
 * @returns {Promise}
 */
ozpIwc.IntentsApi.prototype.invokeIntentHandler=function(packet,type,action,handlers,pattern) {
    var inflightNode = new ozpIwc.IntentsInFlightNode({
        resource: this.createKey("/inFlightIntent/"),
        src:packet.src,
        invokePacket: packet,
        type: type,
        action: action,
        handlerChoices: handlers,
        pattern: pattern
    });
    
    this.data[inflightNode.resource] = inflightNode;
    this.addCollector(inflightNode);
    this.addWatcher(inflightNode.resource,{src:packet.src,replyTo:packet.msgId});
    return this.handleInflightIntentState(inflightNode).then(function() {
        return {
            entity: {
                inFlightIntent: inflightNode.resource
            }
        };
    });
};

/**
 * Handles the current state of the state machine.
 * If "choosing", the intent chooser will open.
 * If "delivering", the api will send the intent to the chosen handler
 * If "complete", the api will send the intent handler's reply back to the invoker and mark the inflight intent as deleted.
 * @param {Object} inflightNode
 * @returns {*}
 */
ozpIwc.IntentsApi.prototype.handleInflightIntentState=function(inflightNode) {
    var self=this;
    var packet;
    switch(inflightNode.entity.state){
        case "choosing":
            var showChooser=function(err) {
                console.log("Picking chooser because",err);
                ozpIwc.util.openWindow(ozpIwc.intentsChooserUri, {
                    "ozpIwc.peer": ozpIwc.BUS_ROOT,
                    "ozpIwc.intentSelection": "intents.api" + inflightNode.resource
                },ozpIwc.INTENT_CHOOSER_FEATURES);
            };
            return this.getPreference(inflightNode.entity.intent.type+"/"+inflightNode.entity.intent.action).then(function(handlerResource) {
                if(handlerResource in self.data) {
                    inflightNode.setHandlerResource({
                        'state': "delivering",
                        'handlerChosen' : {
                            'resource': handlerResource,
                            'reason': "remembered"
                        }
                    });
                } else {
                    showChooser();
                }
            }).catch(showChooser);
        case "delivering":
            var handlerNode=this.data[inflightNode.entity.handlerChosen.resource];

            packet = ozpIwc.util.clone(handlerNode.entity.invokeIntent);
            packet.entity = packet.entity || {};
            packet.replyTo = handlerNode.replyTo;
            packet.entity.inFlightIntent = inflightNode.resource;
            packet.entity.inFlightIntentEntity= inflightNode.entity;
            console.log(this.logPrefix+"delivering intent:",packet);
            // TODO: packet permissions
            this.send(packet);
            break;
        case "complete":
            if(inflightNode.entity.invokePacket && inflightNode.entity.invokePacket.src && inflightNode.entity.reply) {
                packet ={
                    dst: inflightNode.entity.invokePacket.src,
                    replyTo: inflightNode.entity.invokePacket.msgId,
                    contentType: inflightNode.entity.reply.contentType,
                    response: "complete",
                    entity: inflightNode.entity.reply.entity
                };
                this.send(packet);
            }
            inflightNode.markAsDeleted();
            break;
        default:
            break;
    }
    return Promise.resolve();
};

ozpIwc.IntentsApi.declareRoute({
    action: "set",
    resource: "/inFlightIntent/{id}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentsInFlightNode)
}, function(packet, context, pathParams) {
    context.node.set(packet);
    return this.handleInflightIntentState(context.node).then(function() {
        return {response: "ok"};
    });
});

//====================================================================
// Handler endpoints
//====================================================================
ozpIwc.IntentsApi.useDefaultRoute(["get","delete", "watch", "unwatch"], "/{major}/{minor}/{action}/{handlerId}");

/**
 * A route for intent handler invocations.
 * Invokes a specific handler directly
 */
ozpIwc.IntentsApi.declareRoute({
    action: "invoke",
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: []
}, function(packet, context, pathParams) {
    return this.invokeIntentHandler(
        packet, 
        pathParams.major+"/"+pathParams.minor,
        pathParams.action,
        [context.node]
    );
});
ozpIwc.IntentsApi.declareRoute({
    action: "set",
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: ozpIwc.standardApiFilters.setFilters(ozpIwc.IntentHandlerNode, "application/vnd.ozp-iwc-intent-handler-v1+json")
}, function(packet, context, pathParams) {
    context.node.set(packet);
    return {"response": "ok"};
});

//====================================================================
// Action endpoints
//====================================================================
/**
 * A route filter for creating an intent definition (/{major}/{minor}/{action}) if it does not exist.
 * @method registerDefinitionFilter
 * @param {String} nodeType
 * @param {String} contentType
 * @returns {*}
 */
ozpIwc.IntentsApi.registerDefinitionFilter = function(nodeType,contentType){
    var setDefinition = function(packet,context,pathParams,next){
        // Only set to the definition if not already set.
        if(!context.node.entity){
            context.node.set({
                entity: {
                    "type": pathParams.major + "/" + pathParams.minor,
                    "action": pathParams.action
                }
            });
        }

        return next();
    };

    var filters = ozpIwc.standardApiFilters.setFilters(nodeType,contentType);
    filters.unshift(ozpIwc.apiFilter.fixPattern());
    filters.push(setDefinition);

    return filters;
};

/**
 * A route filter for creating an intent definition node (/{major}/{minor}/{action}) if it does not exist, then creates
 * an intent handler node with the specified handlerId ({major}/{minor}/{action}/{handlerId})
 * @method registerHandlerFilter
 * @param {String} nodeType
 * @param {String} contentType
 * @returns {*}
 */
ozpIwc.IntentsApi.registerHandlerFilter = function(nodeType,contentType){
    var generateDefinitionResource = function(packet,context,pathParams,next){
        packet.resource = "/"+pathParams.major + "/" + pathParams.minor + "/" + pathParams.action;
        context.node = this.data[packet.resource];
        return next();
    };

    var generateHandlerResource = function(packet,context,pathParams,next){
        packet.resource = "/"+pathParams.major + "/" + pathParams.minor + "/" + pathParams.action + "/" +
            pathParams.handlerId;
        context.node = this.data[packet.resource];
        return next();
    };

    var definitionFilter = ozpIwc.IntentsApi.registerDefinitionFilter(null, "application/vnd.ozp-iwc-intent-handler-v1+json");
    definitionFilter.unshift(generateDefinitionResource);

    var handlerFilter = ozpIwc.standardApiFilters.setFilters(nodeType,contentType);
    handlerFilter.unshift(generateHandlerResource);

    // Concat the two filters together, run through the definition then the handler.
    definitionFilter.push.apply(definitionFilter,handlerFilter);

    return definitionFilter;
};

/**
 * Registration handler when a handlerId is not specified
 */
ozpIwc.IntentsApi.declareRoute({
    action: "register",
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.IntentsApi.registerDefinitionFilter(null, "application/vnd.ozp-iwc-intent-handler-v1+json")
}, function(packet, context, pathParams) {

    var childNode = this.createNode({
        'resource': this.createKey(context.node.resource + "/"),
        'src': packet.src
    }, ozpIwc.IntentHandlerNode);
    childNode.set(packet);

    ozpIwc.log.debug(this.logPrefix+" registered ",context.node);
    return {
        'response': 'ok',
        'entity': {
            'resource': childNode.resource
        }
    };
});

/**
 * Registration handler when a handlerId is specified
 */
ozpIwc.IntentsApi.declareRoute({
    action: "register",
    resource: "/{major}/{minor}/{action}/{handlerId}",
    filters: ozpIwc.IntentsApi.registerHandlerFilter(null, "application/vnd.ozp-iwc-intent-handler-v1+json")
}, function(packet, context, pathParams) {
    context.node.set(packet);

    ozpIwc.log.debug(this.logPrefix+" registered ",context.node);
    return {
        'response': 'ok',
        'entity': {
            'resource': context.node.resource
        }
    };
});

/**
 * A route for intent action invocations.
 * Will launch direct for user input if multiple options.
 */
ozpIwc.IntentsApi.declareRoute({
    action: "invoke",
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.standardApiFilters.getFilters()
}, function(packet, context, pathParams) {
    return this.invokeIntentHandler(
        packet, 
        pathParams.major+"/"+pathParams.minor,
        pathParams.action,
        this.matchingNodes(context.node.pattern),
        context.node.pattern
    );
});

/**
 * A route for the following actions not handled by other routes: bulkGet, list, delete, watch, and unwatch.
 * Default route used.
 */
ozpIwc.IntentsApi.useDefaultRoute(["delete", "watch", "unwatch", "get"],"/{major}/{minor}/{action}");

//====================================================================
// Content Type endpoints
//====================================================================
ozpIwc.IntentsApi.declareRoute({
    action: ["set", "delete"],
    resource: "/{major}/{minor}",
    filters: []
}, function(packet, context, pathParams) {
    throw new ozpIwc.NoPermissionError(packet);
});

ozpIwc.IntentsApi.declareRoute({
    action: "get",
    resource: "/{major}/{minor}",
    filters: []
}, function(packet, context, pathParams) {
    if (context.node) {
        // the following needs to be included, possibly via override of toPacket();
        //'invokeIntent': childNode
        return context.node.toPacket();
    } else {
        return {
            response: "ok",
            entity: {
                "type": pathParams.major + "/" + pathParams.minor,
                "actions": this.matchingNodes(packet.resource).map(function(n) {
                    return n.entity.action;
                })
            }
        };
    }
});


ozpIwc.IntentsApi.declareRoute({
    action: "broadcast",
    resource: "/{major}/{minor}/{action}",
    filters: ozpIwc.standardApiFilters.getFilters()
}, function(packet, context, pathParams) {
    for(var i  in context.node.collection) {
        this.invokeIntentHandler(
            packet,
            pathParams.major + "/" + pathParams.minor,
            pathParams.action,
            this.matchingNodes(context.node.collection[i]),
            context.node.collection[i]
        );
    }

    return {
        response: "ok",
        entity: {
            handlers: context.node.collection
        }
    };
});

