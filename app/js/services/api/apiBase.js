

/**
 * Service API classes of the bus.
 * @module bus.service
 * @submodule bus.service.Type
 */

/**
 * The base class for APIs. Use {{#crossLink "ozpIwc.createApi"}}{{/crossLink}} to subclass
 * this.
 * 
 * Leader State Management
 * =======================
 * The base API uses locks.api to always have a single leader at a time.  An api instance goes
 * through a linear series of states:  member -> loading -> leader
 * * __member__ does not service requests
 * * __loading__ is a transitory state between acquiring the leader lock and being ready to serve requests
 * * __leader__ actively serves requests and broadcasts a death scream upon shutdown
 *
 * The member state has two substates-- ready and dormant
 *  * __ready__ queues requests in case it has to become leader.  switches back to dormant on discovering a leader
 *  * __dormant__ silently drops requests.  Upon hearing a deathScream, it switches to ready.

 * @class ApiBase
 * @module ozpIwc
 * @namespace ozpIwc
 * @constructor
 * @param {Object} config
 * @param {String} config.name The api address (e.g. "names.api")
 * @param {ozpIwc.ClientMixin} [config.participant] The connection to use for communication
 * @param {ozpIwc.Router} [config.router=ozpIwc.defaultRouter] The router to connect to
 */
ozpIwc.ApiBase=function(config) {
	if(!config.name) {
        throw Error("API must be configured with a name");
    }
    this.participant=config.participant || new ozpIwc.ClientParticipant({internal:true});

    this.name=config.name;
    this.coordinationAddress="coord." + this.name;
    
    
    this.events = new ozpIwc.Event();
    this.events.mixinOnOff(this);

    this.endpoints=[];
    this.data={};
    this.watchers={};
    this.collectors=[];
    this.changeList={};
    this.leaderState="member";

    
    var router=config.router || ozpIwc.defaultRouter;
    router.registerParticipant(this.participant);
    router.registerMulticast(this.participant,[this.name,this.coordinationAddress]);

    var self=this;
    this.participant.on("receive",function(packetContext) {
        self.receivePacketContext(packetContext);
    });

    this.transitionToMemberReady();

    this.logPrefix="[" + this.name + "/" + this.participant.address +"] ";
    
    this.leaderPromise=this.participant.send({
        dst: "locks.api",
        resource: "/mutex/"+this.name,
        action: "lock"
    }).then(function(pkt) {
        var resolve;

        // Delay loading for deathScreams to flow in.
        var delayed = new Promise(function(res,rej){
            resolve = res;
        });

        window.setTimeout(function(){
            resolve();
        },1000);

        return delayed;
    }).then(function(){
        self.transitionToLoading();
    });
    
    this.leaderPromise.catch(function(e) {
        console.error("Error registering for leader mutex [address="+self.participant.address+",api="+self.name+"]",e);
    });

    ozpIwc.util.addEventListener("beforeunload",function(){
        self.shutdown();
    });
};


/**
 * Generates a unique key with the given prefix.
 * @param {String} prefix
 * @returns {String}
 */
ozpIwc.ApiBase.prototype.createKey = function(prefix) {
    prefix = prefix || "";
    var key;
    do {
        key = prefix + ozpIwc.util.generateId();
    } while (key in this.data);
    return key;
};

/**
 * A handler function for when a node is created. Can be overridden by inherited APIs.
 * @method createdHandler
 * @param node
 */
ozpIwc.ApiBase.prototype.createdHandler=function(node){
    //Whenever a node is created update the collector's lists.
    this.updateCollections();
};

/**
 * A handler function called after a node is changed but before it's watchers are notified.
 * @method changedHandler
 * @param {Object} node
 * @param {Object} entity
 * @param {Object} packetContext
 */
ozpIwc.ApiBase.prototype.changedHandler =function(node,entity,packetContext) {
    //var culprit = packetContext.src;
    var lifespanFns = ozpIwc.Lifespan.getLifespan(node.lifespan);
    if(lifespanFns.shouldPersist()) {
        this.persistenceQueue.queueNode(this.name + "/" + node.resource, node);
    }
};

/**
 * A handler function called when an instance of this API has disconnected from the bus.
 * @method disconnectHandler
 * @param {String} address
 */
ozpIwc.ApiBase.prototype.disconnectHandler =function(address) {
    var self = this;
    ozpIwc.object.eachEntry(self.data,function(resource,node) {
        var lifespanFns = ozpIwc.Lifespan.getLifespan(node.lifespan);
        if(lifespanFns.shouldDelete(node.lifespan,address)){
            self.markForChange(node);
            node.markAsDeleted();
        }
    });
    self.resolveChangedNodes();
};
//===============================================================
// Default methods that can be overridden by subclasses
//===============================================================
/**
 * Create the data that needs to be handed off to the new leader.
 *
 * __Intended to be overridden by subclasses__
 * 
 * Subsclasses can override this if they need to add additional
 * handoff data.  This MUST be a synchronous call that returns immediately.
 *
 * @method createDeathScream
 * @return {Object} the data that will be passed to the new leader
 */
ozpIwc.ApiBase.prototype.createDeathScream=function() {
    return {
        watchers: this.watchers,
        collectors: this.collectors,
        data: ozpIwc.object.eachEntry(this.data,function(k,v) {
            return v.serializeLive();
        })
    };
};

/**
 * Gathers the desired preference from the data API.
 * @method getPreference
 * @param {String} prefName
 * @returns {Promise}
 */
ozpIwc.ApiBase.prototype.getPreference=function(prefName) {
    return this.participant.send({
        dst: "data.api",
        resource: "/ozp/iwc/"+this.name+"/"+prefName,
        action: "get"
    }).then(function(reply) {
        return reply.entity;
    });
};

/**
 * Called when the API has become the leader, but before it starts
 * serving data.  Receives the deathScream of the previous leader
 * if available, otherwise undefined.
 * 
 * __Intended to be overridden by subclasses__
 * 
 * Subsclasses can override this to load data from the server.
 *  
 * @method initializeData
 * @param {object} deathScream
 * @return {Promise} a promise that resolves when all data is loaded.
 */
ozpIwc.ApiBase.prototype.initializeData=function(deathScream) {
    deathScream=deathScream || { watchers: {}, collectors: [], data: []};
    this.watchers=deathScream.watchers;
    this.collectors = deathScream.collectors;
    deathScream.data.forEach(function(packet) {
        this.createNode({resource: packet.resource}).deserializeLive(packet);
    },this);

    this.updateCollections();
    if(this.endpoints) {
        var self=this;
        return Promise.all(this.endpoints.map(function(u) {
          var e=ozpIwc.endpoint(u.link) ;
          return self.loadFromEndpoint(e,u.headers).catch(function(e) {
              ozpIwc.log.error(self.logPrefix,"load from endpoint ",e," failed: ",e);
          });
        }));
    } else {
        return Promise.resolve();
    }
};

/**
 * Creates a node appropriate for the given config, puts it into this.data,
 * and fires off the right events.
 *  
 * @method createNode
 * @param {Object} config The ApiNode configuration.
 * @return {ozpIwc.ApiNode}
 */
ozpIwc.ApiBase.prototype.createNode=function(config,NodeType) {
    var n=this.createNodeObject(config,NodeType);
		this.data[n.resource]=n;
		this.events.trigger("createdNode",n);
		return n;
};



/**
 * Creates a node appropriate for the given config.  This does
 * NOT add the node to this.data.  Default implementation returns
 * a plain ozpIwc.ApiNode.
 * 
 * __Intended to be overridden by subclasses__
 * 
 * Subsclasses can override this for custom node types that may vary
 * from resource to resource.
 * 
 * @method createNodeObject
 * @param {Object} config The ApiNode configuration.
 * @param {Function} NodeType The contructor call for the given node type to be created.
 * @return {ozpIwc.ApiNode}
 */
ozpIwc.ApiBase.prototype.createNodeObject=function(config,NodeType) {
    if(NodeType) {
        return new NodeType(config);
    } else {
        return new ozpIwc.ApiNode(config);
    }
};

//===============================================================
// Leader state management
//===============================================================

/**
 * @method transitionToLoading
 * @private
 * @return {Promise} a promise that resolves when all data is loaded.
 */
ozpIwc.ApiBase.prototype.transitionToLoading=function() {
    var self=this;
    if(this.leaderState !== "member") {
				ozpIwc.log.error(this.logPrefix+"transition to loading called in an invalide state:",this.leaderState);
        return Promise.reject(this.logPrefix+"transition to loading called in an invalide state:",this.leaderState);
    }
		ozpIwc.log.debug(this.logPrefix+"transitioning to loading");
    this.leaderState="loading";
    return this.initializeData(this.deathScream)
        .then(function() {
             self.transitionToLeader();
        },function(e) {
            ozpIwc.log.error(self.logPrefix+"Failed to load data due to ",e);
            self.shutdown();
        });
};

/**
 * @method transitionToLeader
 * @private
 */
ozpIwc.ApiBase.prototype.transitionToLeader=function() {
    if(this.leaderState !== "loading") {
            ozpIwc.log.error(this.logPrefix+"transition to leader called in an invalid state:",this.leaderState);
            return;
    }
    ozpIwc.log.debug(this.logPrefix+"transitioning to leader");
    this.leaderState = "leader";
    this.broadcastLeaderReady();
    this.deliverRequestQueue();

    this.on("createdNode",this.createdHandler,this);
    this.on("changed",this.changedHandler,this);
    this.on("addressDisconnects",this.disconnectHandler,this);
};

/**
 * Shuts down the api, issuing a deathscream and releasing the lock, if possible.
 * @method shutdown
 * @return 
 */
ozpIwc.ApiBase.prototype.shutdown=function() {
    if(this.leaderState === "leader") {
        this.broadcastDeathScream(this.createDeathScream());
    }
    
    this.participant.send({
        dst: "locks.api",
        resource: "/mutex/"+this.name,
        action: "unlock"
    });
};

/**
 * @method transitionToMemberReady
 * @private
 * @param {Object} deathScream
 * @return {Promise}
 */
ozpIwc.ApiBase.prototype.transitionToMemberReady=function(deathScream) {
    if(this.leaderState !== "member") {
        return;
    }
    this.deathScream=deathScream;
    this.off("createdNode",this.createdHandler);
    this.off("changed",this.changedHandler);
    this.off("addressDisconnects",this.disconnectHandler);
    this.enableRequestQueue();
    return Promise.resolve();
};

/**
 * @method transitionToMemberDormant
 * @private
 * @return {Promise}
 */
ozpIwc.ApiBase.prototype.transitionToMemberDormant=function() {
    if(this.leaderState !== "member") {
        return;
    }
    this.deathScream=null;
    this.flushRequestQueue();
    return Promise.resolve();
};

//===============================================================
// Data Management
//===============================================================

/**
 * Authorize the request for the given node.
 *  
 * @method checkAuthorization
 * @param {ozpIwc.ApiNode} node
 * @param {Object} context
 * @param {ozpIwc.TransportPacket} packet
 * @param {String} action
 * @return {undefined}
 */
ozpIwc.ApiBase.prototype.checkAuthorization=function(node,context,packet,action) {
    //@TODO: actually implement checking the authorization...
    return true;
};

/**
 * Returns a list of nodes that start with the given prefix.
 *  
 * @method matchingNodes
 * @param {String} prefix
 * @return {ozpIwc.ApiNode[]} a promise that resolves when all data is loaded.
 */
ozpIwc.ApiBase.prototype.matchingNodes=function(prefix) {
    return ozpIwc.object.values(this.data, function(k,node) { 
        return node.resource.indexOf(prefix) ===0 && !node.deleted;
    });
};


//===============================================================
// Watches
//===============================================================

/**
 * Marks that a node has changed and that change notices may need to 
 * be sent out after the request completes.
 *  
 * @method markForChange
 * @param {ApiNode} nodes...
 */
ozpIwc.ApiBase.prototype.markForChange=function(/*varargs*/) {
    for(var i=0;i<arguments.length;++i) {
        if(Array.isArray(arguments[i])) {
            this.markForChange(arguments[i]);
        } else {
            var resource=arguments[i].resource || ""+arguments[i];
            // if it's already marked, skip it
            if(this.changeList.hasOwnProperty(resource)) {
                continue;
            }
            
            var n=this.data[resource];

            this.changeList[resource]=n?n.snapshot():{};
        }
    }
};

/**
 * Marks that a node has changed and that change notices may need to
 * be sent out after the request completes.
 *
 * @method addWatcher
 * @param {String} resource name of the resource to watch
 * @param {Object} watcher
 * @param {String} watcher.resource name of the resource to watch
 * @param {String} watcher.src Address of the watcher
 * @param {String | Number} watcher.replyTo The conversation id that change notices will go to
 */
ozpIwc.ApiBase.prototype.addWatcher=function(resource,watcher) {
    var watchList=this.watchers[resource];
    if(!Array.isArray(watchList)) {
        watchList=this.watchers[resource]=[];
    }

    watchList.push(watcher);
};

/**
 * Removes mark that a node has changed and that change notices may need to
 * be sent out after the request completes.
 *
 * @method removeWatcher
 * @param {String} resource name of the resource to unwatch
 * @param {Object} watcher
 * @param {String} watcher.src Address of the watcher
 * @param {String | Number} watcher.replyTo The conversation id that change notices will go to
 */
ozpIwc.ApiBase.prototype.removeWatcher=function(resource,watcher) {
    var watchList=this.watchers[resource];
    if(watchList) {
        this.watchers[resource]=watchList.filter(function(watch) {
            return watch.src === watcher.src && watch.replyTo === watcher.msgId;
        });
    }
};


/**
 * Adds the given node to the collector list. It's collection list will be updated on api data changes.
 * @method addCollector
 * @param {Object} node
 */
ozpIwc.ApiBase.prototype.addCollector=function(node){
    function isCollector(obj){
        return (obj && obj.pattern && obj.collection);
    }

    if(isCollector(node)) {
        var index = this.collectors.indexOf(node.resource);
        if(index < 0){
            this.collectors.push(node.resource);
            this.updateCollectionNode(node);
        }
    }
};


/**
 * Removes the given node from the collector list. It's collection list will no longer be updated on api data changes.
 * @method removeCollector
 * @param {Object} node
 */
ozpIwc.ApiBase.prototype.removeCollector=function(node){
    var index = this.collectors.indexOf(node.resource);
    if(index > -1) {
        this.collectors.splice(index, 1);
    }
};

/**
 * Notifies watchers of changes of the resource since the given snapshot.
 * @method resolveChangedNode
 * @param {String} resource
 * @param {Object} snapshot
 * @param {Object} packetContext
 */
ozpIwc.ApiBase.prototype.resolveChangedNode=function(resource,snapshot,packetContext) {
    var node=this.data[resource];
    var watcherList=this.watchers[resource] || [];

    if(!node) {
        return;
    }

    var changes=node.changesSince(snapshot);
    if(!changes) {
        return;
    }

    var permissions=ozpIwc.authorization.pip.attributeUnion(
        changes.oldValue.permissions,
        changes.newValue.permissions
    );

    var entity={
        oldValue: changes.oldValue.entity,
        newValue: changes.newValue.entity,
        oldCollection: changes.oldValue.collection,
        newCollection: changes.newValue.collection,
        deleted: node.deleted
    };

    this.events.trigger("changed",node,entity,packetContext);

    watcherList.forEach(function(watcher) {
        // @TODO allow watchers to changes notifications if they have permission to either the old or new, not just both
        this.participant.send({
            'src'   : this.participant.name,
            'dst'   : watcher.src,
            'replyTo' : watcher.replyTo,
            'response': 'changed',
            'resource': node.resource,
            'permissions': permissions,
            'contentType': node.contentType,
            'entity': entity
        });
    },this);
};

/**
 * Called after the request is complete to send out change notices.
 *  
 * @method resolveChangedNodes
 * @param {Object} packetContext the packet that caused this change.
 * @private
 */
ozpIwc.ApiBase.prototype.resolveChangedNodes=function(packetContext) {
    this.updateCollections();
    ozpIwc.object.eachEntry(this.changeList,function(resource,snapshot){
        this.resolveChangedNode(resource,snapshot,packetContext);
    },this);
    this.changeList={};
};

/**
 * Itterates over all collectors of the API for updates
 * @method updateCollections
 */
ozpIwc.ApiBase.prototype.updateCollections = function(){
    for(var i in this.collectors){
        var collectorNode = this.data[this.collectors[i]];
        this.updateCollectionNode(collectorNode);
    }
};

/**
 * Removes the collector node resource from the collectors list if deleted. Removes references to nodes in the given
 * collectors collection property if said referenced node is deleted. Adds newly created nodes to the collection
 * property if said node's resource matches the collection nodes pattern property.
 *
 * @method updateCollectionNode
 * @param {Object} cNode the collector node to update
 */
ozpIwc.ApiBase.prototype.updateCollectionNode = function(cNode){

    //If the collection node is deleted, stop collecting for it.
    if(cNode.deleted){
        this.removeCollector(cNode);
        return;
    }


    var updatedCollection = this.matchingNodes(cNode.pattern).filter(function(node){
        return !node.deleted;
    }).map(function(node) {
        return node.resource;
    });

    if(!ozpIwc.util.arrayContainsAll(cNode.collection,updatedCollection) || !ozpIwc.util.arrayContainsAll(updatedCollection,cNode.collection)) {
        this.markForChange(cNode);
        cNode.collection = updatedCollection;
        cNode.version++;
    }
};

//===============================================================
// Packet Routing
//===============================================================
/**
 * Sends packets of data from this API to other parts of the IWC bus.
 *
 * @param {Object} fragment
 * @returns {Promise}
 */
ozpIwc.ApiBase.prototype.send=function(fragment) {
    fragment.src=this.name;
    return this.participant.send(fragment);
};

/**
 * Routes a packet received from the participant.
 *  
 * @method receivePacketContext
 * @property {Object} packetContext
 * @private
 */
ozpIwc.ApiBase.prototype.receivePacketContext=function(packetContext) {
    if(packetContext.packet.src===this.participant.address) {
        // drop our own packets
        return Promise.resolve();
    }

    if(packetContext.packet.dst===this.coordinationAddress) {
        return this.receiveCoordinationPacket(packetContext);
    } else if (packetContext.packet.dst === "$bus.multicast"){
        return this.receiveBusPacket(packetContext);
    } else {
        return this.receiveRequestPacket(packetContext);
    }
};

/**
 * Handles packets received with a destination of "$bus.multicast".
 *
 * @method receiveBusPacket
 * @param {Object} packetContext
 * @returns {*}
 */
ozpIwc.ApiBase.prototype.receiveBusPacket=function(packetContext) {
    var packet=packetContext.packet;
    switch(packet.action) {
        case "connect":
            this.events.trigger("addressConnects",packet.entity.address,packet);
            break;
        case "disconnect":
            this.removeDeadWatchers(packet.entity.address);
            this.events.trigger("addressDisconnects",packet.entity.address,packet);
            break;
    }
    return Promise.resolve();
};

/**
 * If the the given address is watching a resource, it will be removed from the watch list. Router addresses will
 * remove all of its participants watch registrations.
 *
 * @method removeDeadWatchers
 * @param {String} address
 */
ozpIwc.ApiBase.prototype.removeDeadWatchers = function(address){
    var len=address.length;
    ozpIwc.object.eachEntry(this.watchers,function(resource,array) {
        for(var i in array) {
            if (array[i].src.substr(-len) === address) {
                array.splice(i, 1);
            }
        }
    });
};

//===============================================================
// API Request Handling
//===============================================================

/**
 * Routes a request to the proper handler and takes care of overhead
 * such as change requests.
 *  
 * @method receivePacketContext
 * @property {Object} packetContext
 * @private
 */
ozpIwc.ApiBase.prototype.receiveRequestPacket=function(packetContext) {
    var packet=packetContext.packet;

    if(this.isRequestQueueing) {
        this.requestQueue.push(packetContext);
        return Promise.resolve();
    }
    if(this.leaderState !== "leader"){
        return Promise.resolve();
    }
    
    var self=this;
    return new Promise(function(resolve,reject) {
        try {
            packetContext.node=self.data[packet.resource];
            resolve(self.routePacket(packet,packetContext));
        } catch(e) {
            reject(e);
        }
    }).then(function(packetFragment) {
        if(packetFragment) {
            packetFragment.response = packetFragment.response || "ok";
            packetContext.replyTo(packetFragment);
        }
        self.resolveChangedNodes(packetContext);
    },function(e) {
        if(!e || !e.errorAction) {
            ozpIwc.log.error(self.logPrefix,"Unexpected error: ",e," packet= ",packet);
        }
        var packetFragment={
            'src': self.name,
            'response': e.errorAction || "errorUnknown",
            'entity': e.message
        };
        packetContext.replyTo(packetFragment);
    });

};

/**
 * Any request packet that does not match a route ends up here.  By default,
 * it replies with BadAction, BadResource, or BadRequest, as appropriate.
 *  
 * @method receivePacketContext
 * @param {ozpIwc.TransportPacket} packet
 * @param {ozpIwc.TransportPacketContext} context
 */
ozpIwc.ApiBase.prototype.defaultRoute=function(packet,context) {
    switch(context.defaultRouteCause) {
        case "nonRoutablePacket": // packet doesn't have an action/resource, so ignore it
            return;
        case "noAction": 
            throw new ozpIwc.BadActionError(packet);
        case "noResource":
            throw new ozpIwc.BadResourceError(packet);
        default:
            throw new ozpIwc.BadRequestError(packet);
    }
};

/**
 * Enables the API's request queue, all requests will be held until deliverRequestQueue or flushRequestQueue is called.
 * @method enableRequestQueue
 * @private
 */
ozpIwc.ApiBase.prototype.enableRequestQueue=function() {
    this.isRequestQueueing=true;
    this.requestQueue=[];
};

/**
 * Routes all queued packets and turns off request queueing.
 * @method deliverRequestQueue
 * @private
 */
ozpIwc.ApiBase.prototype.deliverRequestQueue=function() {
    this.isRequestQueueing=false;
    this.requestQueue.forEach(this.receiveRequestPacket,this);
    this.requestQueue=[];
};

/**
 * Empties the queue of requests without processing and turns off queuing.
 * @method flushRequestQueue
 * @private
 */
ozpIwc.ApiBase.prototype.flushRequestQueue=function() {
    this.isRequestQueueing=false;
    this.requestQueue=[];
};



//===============================================================
// API Coordination Handling
//===============================================================
/**
 * Broadcasts to other instances of this API on the bus that it is ready to lead.
 * @method broadcastLeaderReady
 */
ozpIwc.ApiBase.prototype.broadcastLeaderReady=function() {
    this.participant.send({
        dst: this.coordinationAddress,
        action: "announceLeader"
    });
};

/**
 * Broadcasts to other instances of this API on the bus this APIs state.
 * @method broadcastDeathScream
 * @param {Object} deathScream the state data to pass on.
 */
ozpIwc.ApiBase.prototype.broadcastDeathScream=function(deathScream) {
    this.participant.send({
        dst: this.coordinationAddress,
        action: "deathScream",
        entity: deathScream
    });
};

/**
 * Handles packets received regarding leadership actions.
 * @method receiveCoordinationPacket
 * @param {Object} packetContext
 * @returns {Promise}
 */
ozpIwc.ApiBase.prototype.receiveCoordinationPacket=function(packetContext) {
    var packet=packetContext.packet;
    switch(packet.action) {
        case "announceLeader":
            return this.transitionToMemberDormant();
        case "deathScream":
            return this.transitionToMemberReady(packet.entity);
        default:
            ozpIwc.log.error("Unknown coordination packet: ", packet);
            return Promise.reject(new Error("Unknown action: " + packet.action + " in " + JSON.stringify(packetContext)));
    }
};

//===============================================================
// Load data from the server
//===============================================================

/**
 * Loads data from the provided endpoint.  The endpoint must point to a HAL JSON document
 * that embeds or links to all resources for this api.
 * 
 * @method loadFromEndpoint
 * @param {ozpIwc.Endpoint} endpoint
 * @param {Array} headers
 * @return {Promise} resolved when all data has been loaded.
 */
ozpIwc.ApiBase.prototype.loadFromEndpoint=function(endpoint,headers) {
    var self=this;
		ozpIwc.log.debug(self.logPrefix+" loading from ",endpoint.name," -- ",endpoint.baseUrl);
    return endpoint.get("/").then(function(data) {

        var response=data.response;
        var embeddedItems=ozpIwc.util.ensureArray((response._embedded && response._embedded.item) || []);
        var linkedItems=ozpIwc.util.ensureArray((response._links && response._links.item) || []);

        // load all the embedded items
        embeddedItems.forEach(function(i) {
            self.createNode({
                serializedEntity: i
            });
        });
				ozpIwc.log.debug(self.logPrefix+" processed " + embeddedItems.length + " items embedded in the endoint");
        var unknownLinks=linkedItems.map(function(i) { return i.href;});
        unknownLinks=unknownLinks.filter(function(href) {
                return ozpIwc.object.values(self.data,function(k,node) {
                    return node.self === href;
                }).length === 0;
            });
				ozpIwc.log.debug(self.logPrefix+" loading " + unknownLinks.length + " linked items");

				// empty array resolves immediately, so no check needed
        return Promise.all(unknownLinks.map(function(l) {
            return endpoint.get(l,headers).then(function(data) {
                self.createNode({
                    serializedEntity: data.response,
                    serializedContentType: data.header['Content-Type']
                });
            }).catch(function(err) {
							ozpIwc.log.info(self.logPrefix+"Could not load from "+l+" -- ",err);
						});
        }));

    }).catch(function(err) {
			ozpIwc.log.info(self.logPrefix+" couldn't load from endpoint "+endpoint.name +" -- ",err);
		});
};


//===============================================================
// Default Routes and Subclass Helpers
//===============================================================
/**
 * Gathers the collection data for a node given its pattern only if it has a pattern.
 * @method getCollection
 * @param {String} pattern
 * @returns {Array}
 */
ozpIwc.ApiBase.prototype.getCollection = function(pattern){
    if(pattern) {
        return this.matchingNodes(pattern).filter(function (node) {
            return !node.deleted;
        }).map(function (node) {
            return node.resource;
        });
    } else {
        return [];
    }
};

/**
 * A collection of default action handlers for an API.
 * @property defaultHandler
 * @static
 * @type {Object}
 */
ozpIwc.ApiBase.defaultHandler={
    "get":function(packet,context,pathParams) {
        var p =  context.node.toPacket();
        p.collection = this.getCollection(p.pattern);
        return p;
    },
    "set":function(packet,context,pathParams) {
        context.node.set(packet);
        return { response: "ok" };
    },
    "delete": function(packet,context,pathParams) {
        if(context.node) {
            context.node.markAsDeleted(packet);
        }

        return { response: "ok" };
    },
    "list": function(packet,context,pathParams) {
        var entity=this.matchingNodes(packet.resource).filter(function(node){
            if(node.deleted) {
                return false;
            }
            return true;
        }).map(function(node) {
            return node.resource;
        });
        return {
            "contentType": "application/json",
            "entity": entity
        };
    },
    "bulkGet": function(packet,context,pathParams) {
        var self = this;
        var entity=this.matchingNodes(packet.resource).map(function(node) {
            var p =  node.toPacket();
            p.collection = self.getCollection(p.pattern);
            return p;
        });
        // TODO: roll up the permissions of the nodes, as well
        return {
            "contentType": "application/json",
            "entity": entity
        };
    },
    "watch": function(packet,context,pathParams) {
        this.addWatcher(packet.resource,{
            src: packet.src,
            replyTo: packet.msgId
        });

        //Only if the node has a pattern applied will it actually be added as a collector.
        this.addCollector(context.node);

        if(context.node) {
            var p =  context.node.toPacket();
            p.collection = this.getCollection(p.pattern);
            return p;
        } else {
            return { response: "ok"};
        }
    },
    "unwatch": function(packet,context,pathParams) {
        this.removeWatcher(packet.resource, packet);

        //If no one is watching the resource any more, remove its collector if it has one to speed things up.
        if(this.watchers[packet.resource] && this.watchers[packet.resource].length === 0){
            this.removeCollector(context.node);
        }

        return { response: "ok" };
    }
};

/**
 * A list of all of the default actions.
 * @property allActions
 * @static
 * @type {String[]}
 */
ozpIwc.ApiBase.allActions=Object.keys(ozpIwc.ApiBase.defaultHandler);

/**
 * Install the default handler and filters for the provided actions and resources.
 * @method useDefaultRoute
 * @static
 * @param {String | String[]} actions
 * @param {String} resource="{resource:.*}" The resource template to install the default handler on.
 */


/**
 * Creates a subclass of ApiBase and adds some static helper functions.
 *
 * @method createApi
 * @param {Function} init the constructor function for the class
 * @return {Object} A new API class that inherits from the ApiBase class.
 */
ozpIwc.createApi=function(init) {
    var api=ozpIwc.util.extend(ozpIwc.ApiBase,function() {
        ozpIwc.ApiBase.apply(this, arguments);
        return init.apply(this,arguments);
    });
    ozpIwc.PacketRouter.mixin(api);
    api.useDefaultRoute=function(actions,resource) {
        resource = resource || "{resource:.*}";
        actions=ozpIwc.util.ensureArray(actions);
        actions.forEach(function(a) {
            var filterFunc=ozpIwc.standardApiFilters.forAction(a);
            api.declareRoute({
                action: a,
                resource: resource,
                filters: (filterFunc?filterFunc():[])
            },ozpIwc.ApiBase.defaultHandler[a]
            );
        });
    };
    return api;
};
