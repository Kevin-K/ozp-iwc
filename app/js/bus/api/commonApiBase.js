/**
 * @submodule bus.api.Type
 */

/**
 * The Common API Base implements the API Common Conventions.  It is intended to be subclassed by
 * the specific API implementations.
 * @class CommonApiBase
 * @namespace ozpIwc
 * @constructor
 * @param {Object} config
 * @params {Participant} config.participant  the participant used for the Api communication
 */
ozpIwc.CommonApiBase = function(config) {
    config = config || {};

    /**
     * The participant used for the Api communication on the bus.
     * @property participant
     * @type Participant
     * @default {}
     */
    this.participant=config.participant;
    this.participant.on("receiveApiPacket",this.routePacket,this);
    this.participant.on("becameLeaderEvent", this.becameLeader,this);
    this.participant.on("newLeaderEvent", this.newLeader,this);
    this.participant.on("startElection", this.startElection,this);
    this.participant.on("receiveEventChannelPacket",this.routeEventChannel,this);
    this.participant.on("receivedState", this.receiveState,this);
   /**
    * An events module for the API.
    * @property events
    * @type Event
    */
	this.events = new ozpIwc.Event();
    this.events.mixinOnOff(this);

    /**
     * Api nodes that are updated based on other api nodes. Used for keeping dynamic lists of related resources.
     * @property dynamicNodes
     * @type Array
     * @default []
     */
    this.dynamicNodes=[];

    /**
     * Key value storage for the API. each element of the object is a node of the API.
     * @property data
     * @type Object
     * @default {}
     */
    this.data={};

    /**
     * A count for the recursive gathering of server data. Keeps track of the number of expected branches to traverse
     * through the HAL data. Set to 1 at the start of
     * {{#crossLink "ozpIwc.CommonApiBase/loadFromEndpoint:method"}}{{/crossLink}}
     * @private
     * @type Number
     * @default 1
     */
    this.expectedBranches = 1;

    /**
     * A count for the recursive gathering of server data. Keeps track of the number of branches that have been fully
     * retrieved in the HAL data. Set to 0 at the start of
     * {{#crossLink "ozpIwc.CommonApiBase/loadFromEndpoint:method"}}{{/crossLink}}
     * @private
     * @type Number
     * @default 0
     */
    this.retrievedBranches = 0;

    this.endpointUrls=[];
};
ozpIwc.CommonApiBase.prototype.receiveState = function (state) {
    state = state || this.participant.stateStore;
    this.setState(state);
};


/**
 * Finds or creates the corresponding node to store a server loaded resource.
 *
 * @method findNodeForServerResource
 * @param {ozpIwc.TransportPacket} serverObject The object to be stored.
 * @param {String} objectPath The full path resource of the object including it's root path.
 * @param {String} rootPath The root path resource of the object.
 *
 * @returns {ozpIwc.CommonApiValue} The node that is now holding the data provided in the serverObject parameter.
 */
ozpIwc.CommonApiBase.prototype.findNodeForServerResource=function(object,objectPath,endpoint) {
    var resource = '/';
    //Temporarily hard-code prefix. Will derive this from the server response eventually
    switch (endpoint.name) {
        case ozpIwc.linkRelPrefix + ':intent' :
            if (object.type) {
                resource += object.type;
                if (object.action) {
                    resource += '/' + object.action;
                    if (object.handler) {
                        resource += '/' + object.handler;
                    }
                }
            }
            break;
        case ozpIwc.linkRelPrefix + ':application':
            if (object.id) {
                resource += 'application/' + object.id;
            }
            break;
        case ozpIwc.linkRelPrefix + ':system':
            resource += 'system';
            break;
        case ozpIwc.linkRelPrefix + ':user':
            resource += 'user';
            break;
        case ozpIwc.linkRelPrefix + ':user-data':
            if (object.key) {
                resource += object.key;
            }
            break;
        default:
            resource+= 'FIXME_UNKNOWN_ENDPOINT_' + endpoint.name;
    }

    if (resource === '/') {
        return null;
    }

    return this.findOrMakeValue({
        'resource': resource,
        'entity': {},
        'contentType': object.contentType,
        'children': object.children // for data.api only
    });
};

/**
 * Loads api data from the server.  Intended to be overrided by subclasses to load data
 * when this instance becomes a leader without receiving data from the previous leader.
 *
 * @method loadFromServer
 */
ozpIwc.CommonApiBase.prototype.loadFromServer=function() {
    // Do nothing by default, resolve to prevent clashing with overridden promise implementations.
    return new Promise(function(resolve,reject){
        resolve();
    });
};

/**
 * TO BE DEPRECATED - This is the recursive tree scanning approach.  Replaced by iterative loadFromEndpointIterative.
 * Loads api data from a specific endpoint.
 *
 * @method loadFromEndpoint
 * @param {String} endpointName The name of the endpoint to load from the server.
 * @param [Object] requestHeaders
 * @param {String} requestHeaders.name
 * @param {String} requestHeaders.value
 *
 */
ozpIwc.CommonApiBase.prototype.loadFromEndpoint=function(endpointName, requestHeaders) {
    this.expectedBranches = 1;
    this.retrievedBranches = 0;

    // fetch the base endpoint. it should be a HAL Json object that all of the
    // resources and keys in it
    var endpoint=ozpIwc.endpoint(endpointName);
    var resolveLoad, rejectLoad;

    var p = new Promise(function(resolve,reject){
        resolveLoad = resolve;
        rejectLoad = reject;
    });

    var self=this;
    endpoint.get("/")
        .then(function(data) {
            var payload = data.response;
            var responseHeader = data.header;
            self.loadLinkedObjectsFromServer(endpoint,payload,resolveLoad, requestHeaders,responseHeader);
            self.updateResourceFromServer(payload,payload._links.self.href,endpoint,resolveLoad,responseHeader);
            // update all the collection values
            self.dynamicNodes.forEach(function(resource) {
                self.updateDynamicNode(self.data[resource]);
            });
        })['catch'](function(e) {
            ozpIwc.log.error("Could not load from api (" + endpointName + "): " + e.message,e);
            rejectLoad("Could not load from api (" + endpointName + "): " + e.message + e);
        });
    return p;
};

/*
 * REPLACES loadFromEndpoint with an iterative approach
 * 
 * Loads api data from a specific endpoint.
 *
 * @method loadFromEndpointIterative
 * @param {String} endpointName The name of the endpoint to load from the server.
 * @param [Object] requestHeaders
 * @param {String} requestHeaders.name
 * @param {String} requestHeaders.value
 *
 */
ozpIwc.CommonApiBase.prototype.loadFromEndpointIterative=function(endpointName, requestHeaders) {
    // fetch the base endpoint. it should be a HAL Json object with all of the
    // resources and keys in it
    var endpoint=ozpIwc.endpoint(endpointName);

	var self=this;
    return endpoint.get("/")
        .then(function(data) {
			var embeddedList = {};
			var unresolvedLinks = [];
			// if any embedded items exist, convert them to a list (primarily to cover the single element case
			if (data.response._embedded && data.response._embedded.item) {
				var items = ozpIwc.util.ensureArray(data.response._embedded.item);
				for (var i in items) {
					if (items[i]._links && items[i]._links.self && items[i]._links.self.href) {
						embeddedList[items[i]._links.self.href] = items[i];
					} else {
						ozpIwc.log.info("Unable to load embedded item " + JSON.stringify(items[i]));
					}
				}
				
				for (var path in embeddedList) {
					self.updateResourceFromServerIterative(embeddedList[path], path, endpoint, requestHeaders);
				}
			}
			
			// Follow up here with loop on _links section, creating a promise to load each link if it is not in the _embedded section
			// At end, return promise.all to activate when all outstanding loads are completed.
			if (data.response._links && data.response._links.item) {
				var links = ozpIwc.util.ensureArray(data.response._links.item);
				// scan the list of links.  If there is no href match to an embedded item, push a promise to load the link into the list
				links.forEach(function(link) {
					if (embeddedList[link.href] === undefined) {  // if undefined
						unresolvedLinks.push(
							endpoint.get(link.href, requestHeaders)
								.then(function(data){
									if (!data || !data.header || !data.response) {
										ozpIwc.log.info("Unable to load link item " + link.href);
										return null;
									}
									return data;
								})
						);
					}
				});
			}
			return Promise.all(unresolvedLinks);
		}).then(function(unresolvedLinks) {
			unresolvedLinks.forEach(function(payload) {
				if (payload !== null) {
					var header = payload.header;
					var response = payload.response;
					self.updateResourceFromServerIterative(response, response._links.self.href, endpoint, header);
				}
			});

			// update all the collection values
			self.dynamicNodes.forEach(function(resource) {
				self.updateDynamicNode(self.data[resource]);
			});
		});
};
					
/**
 * Updates an Api node with server loaded HAL data.  (Was updateResourceFromServer, modified to be iterative, not recursive)
 *
 * @method updateResourceFromServerIterative
 * @param {ozpIwc.TransportPacket} object The object retrieved from the server to store.
 * @param {String} path The path of the resource retrieved.
 * @param {ozpIwc.Endpoint} endpoint the endpoint of the HAL data.
 */
ozpIwc.CommonApiBase.prototype.updateResourceFromServerIterative=function(item,path,endpoint,requestHeaders) {
    //TODO where should we get content-type?
    var header = requestHeaders || {};
    item.contentType = item.contentType || header['Content-Type'] || 'application/json';

    var parseEntity;
    if(typeof item.entity === "string"){
        try{
            parseEntity = JSON.parse(item.entity);
            item.entity = parseEntity;
        }catch(e){
            // fail silently for now
        }
    }
    var node = this.findNodeForServerResource(item,path,endpoint);

    if (node) {
        var snapshot = node.snapshot();

        var halLess = ozpIwc.util.clone(item);
        delete halLess._links;
        delete halLess._embedded;
        node.deserialize(this.formatServerData(halLess));

        this.notifyWatchers(node, node.changesSince(snapshot));
    }
};

/**
 * Updates an Api node with server loaded HAL data.
 *
 * @method updateResourceFromServer
 * @param {ozpIwc.TransportPacket} object The object retrieved from the server to store.
 * @param {String} path The path of the resource retrieved.
 * @param {ozpIwc.Endpoint} endpoint the endpoint of the HAL data.
 */
ozpIwc.CommonApiBase.prototype.updateResourceFromServer=function(object,path,endpoint,res,header) {
    //TODO where should we get content-type?
    var lheader = header || {};
    object.contentType = object.contentType || lheader['Content-Type'] || 'application/json';

    var parseEntity;
    if(typeof object.entity === "string"){
        try{
            parseEntity = JSON.parse(object.entity);
            object.entity = parseEntity;
        }catch(e){
            // fail silently for now
        }
    }
    var node = this.findNodeForServerResource(object,path,endpoint);

    if (node) {
        var snapshot = node.snapshot();

        var halLess = ozpIwc.util.clone(object);
        delete halLess._links;
        delete halLess._embedded;
        node.deserialize(this.formatServerData(halLess));

        this.notifyWatchers(node, node.changesSince(snapshot));
        this.loadLinkedObjectsFromServer(endpoint, object, res);
    }
};

/**
 * A middleware function used to format server data to be deserialized into Api nodes
 *
 * @method formatServerData
 * @param {Object} the data to format.
 * @returns {{entity: object}}
 */
ozpIwc.CommonApiBase.prototype.formatServerData = function(object){
    return {
        entity: object
    };
};

/**
 * Traverses through HAL data from the server and updates api resources based on the data it finds.
 *
 * @method loadLinkedObjectsFromServer
 * @param {ozpIwc.Endpoint} endpoint the endpoint of the HAL data.
 * @param data the HAL data.
 * @parm [Object] headers
 * @param {String} headers.name
 * @param {String} headers.value
 */
ozpIwc.CommonApiBase.prototype.loadLinkedObjectsFromServer=function(endpoint,data,res, requestHeaders) {
    // fetch the base endpoint. it should be a HAL Json object that all of the 
    // resources and keys in it
    if(!data) {
        return;
    }

    var self=this;
    var noEmbedded = true;
    var noLinks = true;
    var branchesFound = 0;
    var itemLength = 0;

    if(data._embedded && data._embedded.item) {
        data._embedded.item = ozpIwc.util.ensureArray(data._embedded.item);
        noEmbedded = false;
        if (Array.isArray(data._embedded.item)) {
            itemLength=data._embedded.item.length;
        } else {
            itemLength=1;
        }
        branchesFound+=itemLength;
    }

    if(data._links && data._links.item) {
        data._links.item = ozpIwc.util.ensureArray(data._links.item);
        noLinks = false;
        if (Array.isArray(data._links.item)) {
            itemLength=data._links.item.length;
        } else {
            itemLength=1;
        }
        branchesFound+=itemLength;
    }

    if(noEmbedded && noLinks) {
        this.retrievedBranches++;
        if(this.retrievedBranches >= this.expectedBranches){
            res("RESOLVING");
        }
    } else {

        this.expectedBranches += branchesFound - 1;

        //TODO should we parse objects from _links and _embedded not wrapped in an item object?

        if(data._embedded && data._embedded.item) {
            var object = {};

            if (Array.isArray(data._embedded.item)) {
                for (var i in data._embedded.item) {
                    object = data._embedded.item[i];
                    this.updateResourceFromServer(object, object._links.self.href, endpoint, res);
                }
            } else {
                object = data._embedded.item;
                this.updateResourceFromServer(object, object._links.self.href, endpoint, res);
            }
        }

        if(data._links && data._links.item) {

            if (Array.isArray(data._links.item)) {
                data._links.item.forEach(function (object) {
                    var href = object.href;
                    endpoint.get(href, requestHeaders).then(function (objectResource) {
                        var payload = objectResource.response;
                        var header = objectResource.header;
                        self.updateResourceFromServer(payload, href, endpoint, res,header);
                    })['catch'](function (error) {
                        ozpIwc.log.info("unable to load " + object.href + " because: ", error);
                    });
                });
            } else {
                var href = data._links.item.href;
                endpoint.get(href, requestHeaders).then(function (objectResource) {
                    var payload = objectResource.response;
                    var header = objectResource.header;
                    self.updateResourceFromServer(payload, href, endpoint, res,header);
                })['catch'](function (error) {
                    ozpIwc.log.info("unable to load " + object.href + " because: ", error);
                });
            }
        }
    }
};


/**
 * Creates a new value for the given packet's request.  Subclasses must override this
 * function to return the proper value based upon the packet's resource, content type, or
 * other parameters.
 *
 * @method makeValue
 * @abstract
 * @param {ozpIwc.TransportPacket} packet
 *
 * @returns {CommonApiValue} an object implementing the commonApiValue interfaces
 */
ozpIwc.CommonApiBase.prototype.makeValue=function(/*packet*/) {
    throw new Error("Subclasses of CommonApiBase must implement the makeValue(packet) function.");
};

/**
 * Determines whether the action implied by the packet is permitted to occur on
 * node in question.
 *
 * @todo the refactoring of security to allow action-level permissions
 * @todo make the packetContext have the srcSubject inside of it
 *
 * @method isPermitted
 * @param {ozpIwc.TransportPacketContext} packetContext The packet of which permission is in question.
 * @param {ozpIwc.CommonApiValue} node The node of the api that permission is being checked against
 *
 * @returns {ozpIwc.AsyncAction} An asynchronous response, the response will call either success or failure depending on
 * the result of the check.
 *
 * @example
 * ```
 * foo.isPermitted(node,packetContext)
 *      .success(function(){
 *          ...
 *      }).failure(function(){
 *          ...
 *      });
 * ```
 */
ozpIwc.CommonApiBase.prototype.isPermitted=function(packetContext,node) {
    var asyncAction = new ozpIwc.AsyncAction();

    ozpIwc.authorization.formatCategory(packetContext.packet.permissions)
        .success(function(permissions) {
            var request = {
                'subject': node.permissions.getAll(),
                'resource': permissions || {},
                'action': {'ozp:iwc:action': 'access'},
                'policies': ozpIwc.authorization.policySets.apiSet
            };

            ozpIwc.authorization.isPermitted(request, node)
                .success(function (resolution) {
                        asyncAction.resolve("success",resolution);
                }).failure(function (err) {
                    console.error("Api could not perform action:", err);
                    asyncAction.resolve("failure",err);
                });
        }).failure(function(err){
            console.error("Api could not format permission check on packet", err);
            asyncAction.resolve("failure",err);
        });

    return asyncAction;
};


/**
 * Turn an event into a list of change packets to be sent to the watchers.
 *
 * @method notifyWatchers
 * @param {ozpIwc.CommonApiValue} node The node being changed.
 * @param {Object} changes The changes to the node.
 */
ozpIwc.CommonApiBase.prototype.notifyWatchers=function(node,changes) {

    if(!this.participant.activeStates.leader)	{
        // if not leader, just drop it.
        return;
    }
    if(!changes) {
        return;
    }
    this.events.trigger("changedNode",node,changes);
    node.eachWatcher(function(watcher) {
        // @TODO check that the recipient has permission to both the new and old values
        var reply={
            'dst'   : watcher.src,
            'src'   : this.participant.name,
            'replyTo' : watcher.msgId,
            'response': 'changed',
            'resource': node.resource,
            'permissions': node.permissions.getAll(),
            'entity': changes
        };

        this.participant.send(reply);
    },this);
};

/**
 * For a given packet, return the value if it already exists, otherwise create the value
 * using makeValue()
 *
 * @method findOrMakeValue
 * @protected
 * @param {ozpIwc.TransportPacket} packet The data that will be used to either find or create the api node.
 */
ozpIwc.CommonApiBase.prototype.findOrMakeValue=function(packet) {
    if(packet.resource === null || packet.resource === undefined) {
        // return a throw-away value
        return new ozpIwc.CommonApiValue();
    }
    var node=this.data[packet.resource];

    if(!node) {
        node=this.data[packet.resource]=this.makeValue(packet);
    }
    return node;
};

/**
 *
 * Determines if the given resource exists.
 *
 * @method hasKey
 * @param {String} resource The path of the resource in question.
 * @returns {Boolean} Returns true if there is a node with a corresponding resource in the api.
 */
ozpIwc.CommonApiBase.prototype.hasKey=function(resource) {
    return resource in this.data;
};

/**
 * Generates a key name that does not already exist and starts with a given prefix.
 *
 * @method createKey
 * @param {String} prefix The prefix resource string.
 * @returns {String} The prefix resource string with an appended generated Id that is not already in use.
 */
ozpIwc.CommonApiBase.prototype.createKey=function(prefix) {
    prefix=prefix || "";
    var key;
    do {
        key=prefix + ozpIwc.util.generateId();
    } while(this.hasKey(key));
    return key;
};


/**
 * Returns true if this API instance is a leader.
 * @method isLeader
 * @returns {Boolean}
 */
ozpIwc.CommonApiBase.prototype.isLeader=function(){
    return this.participant.activeStates.leader;
};
/**
 * Route a packet to the appropriate handler.  The routing path is based upon
 * the action and whether a resource is defined. If the handler does not exist, it is routed
 * to defaultHandler(node,packetContext)
 *
 * Has Resource: handleAction(node,packetContext)
 *
 * No resource: rootHandleAction(node,packetContext)
 *
 * Where "Action" is replaced with the packet's action, lowercase with first letter capitalized
 * (e.g. "doSomething" invokes "handleDosomething")
 * Note that node will usually be null for the rootHandlerAction calls.
 * <ul>
 * <li> Pre-routing checks	<ul>
 *		<li> Permission check</li>
 *		<li> ACL Checks (todo)</li>
 *		<li> Precondition checks</li>
 * </ul></li>
 * <li> Post-routing actions <ul>
 *		<li> Reply to requester </li>
 *		<li> If node version changed, notify all watchers </li>
 * </ul></li>
 *
 * @method routePacket
 * @param {ozpIwc.TransportPacketContext} packetContext The packet to route.
 *
 */
ozpIwc.CommonApiBase.prototype.routePacket=function(packetContext) {
    var packet=packetContext.packet;
    this.events.trigger("receive",packetContext);
    var self=this;
    var errorWrap=function(f) {
        try {
            f.apply(self);
        } catch(e) {
            if(!e.errorAction) {
                ozpIwc.log.error("Unexpected error:",e);
            }

            // If not the leader, don't reply.
            if(self.isLeader()) {
                packetContext.replyTo({
                    'response': e.errorAction || "unknownError",
                    'entity': e.message
                });
            }
        }
    };

    if(packet.response && !packet.action) {
        //TODO create a metric for this instead of logging to console
        //ozpIwc.log.log(this.participant.name + " dropping response packet ",packet);
        // if it's a response packet that didn't wire an explicit handler, drop the sucker
        return;
    }
    var node;

    errorWrap(function() {
        var handler=this.findHandler(packetContext);
        this.validateResource(node,packetContext);
        node=this.findOrMakeValue(packetContext.packet);

        this.isPermitted(packetContext,node)
            .success(function() {
                errorWrap(function() {
                    this.validatePreconditions(node,packetContext);
                    var snapshot=node.snapshot();
                    handler.call(this,node,packetContext);
                    this.notifyWatchers(node, node.changesSince(snapshot));

                // update all the collection values
                    this.dynamicNodes.forEach(function(resource) {
                        this.updateDynamicNode(this.data[resource]);
                    },this);
                });
            },this)
            .failure(function(err) {
                packetContext.replyTo({'response':'noPerm'});
                console.log("failure");
            });
    });
};

/**
 * Routes event channel messages.
 *
 * @method routeEventChannel
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.routeEventChannel = function(packetContext) {
    var packet = packetContext.packet;
    switch (packet.action) {
        case "connect":
            this.handleEventChannelConnect(packetContext);
            break;
        case "disconnect":
            this.handleEventChannelDisconnect(packetContext);
            break;
        default:
            ozpIwc.log.error(this.participant.name, "No handler found for corresponding event channel action: ", packet.action);
            break;
    }
};

/**
 * Handles disconnect messages received over the $bus.multicast group.
 *
 * @method handleEventChannelDisconnect
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleEventChannelDisconnect = function(packetContext) {
    for(var node in this.data){
        for(var j in this.data[node].watchers) {
            if (this.data[node].watchers[j].src === packetContext.packet.entity.address) {
                this.data[node].watchers.splice(j,1);
            }
        }
    }
    this.handleEventChannelDisconnectImpl(packetContext);
};

/**
 * Handles connect messages received over the $bus.multicast group.
 *
 * @method handleEventChannelConnect
* @param {ozpIwc.TransportPacketContext} packetContext
*/
ozpIwc.CommonApiBase.prototype.handleEventChannelConnect = function(packetContext) {
    this.handleEventChannelConnectImpl(packetContext);
};

/**
 * Intended to be overridden by subclass.
 *
 * @abstract
 * @method handleEventChannelDisconnectImpl
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleEventChannelDisconnectImpl = function(packetContext) {
};
/**
 * Intended to be overridden by subclass.
 *
 * @abstract
 * @method handleEventChannelDisconnectImpl
 * @param {ozpIwc.TransportPacketContext} packetContext
 */
ozpIwc.CommonApiBase.prototype.handleEventChannelConnectImpl = function(packetContext) {
};
/**
 * Determines which handler in the api is needed to process the given packet.
 *
 * @method findHandler
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context to find a proper handler for.
 *
 * @returns {Function} The handler for the given packet context.
 */
ozpIwc.CommonApiBase.prototype.findHandler=function(packetContext) {
    var action=packetContext.packet.action;
    var resource=packetContext.packet.resource;

    var handler;

    if(resource===null || resource===undefined) {
        handler="rootHandle";
    } else {
        handler="handle";
    }

    if(action) {
        handler+=action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    } else {
        handler="defaultHandler";
    }

    if(!handler || typeof(this[handler]) !== 'function') {
        handler="defaultHandler";
    }
    return this[handler];
};


/**
 * Checks that the given packet context's resource meets the requirements of the api. Subclasses should override this
 * method as it performs no check by default.
 *
 * @method validateResource
 * @param {CommonApiValue} node @TODO is a node needed to validate?
 * @param {ozpIwc.TransportPacketContext} packetContext The packetContext with the resource to be validated.
 *
 * @returns {Boolean} always returns true.
 */
ozpIwc.CommonApiBase.prototype.validateResource=function(/* node,packetContext */) {
    return true;
};

/**
 * Checks the given packet context's `ifTag` against the desired api node's `version`. Throws ApiError if ifTag exists
 * and doesn't match.
 *
 * @method validatePreconditions
 * @param node The api node being checked against.
 * @param packetContext The packet context to validate.
 *
 */
ozpIwc.CommonApiBase.prototype.validatePreconditions=function(node,packetContext) {
    if(packetContext.packet.ifTag && packetContext.packet.ifTag!==node.version) {
        throw new ozpIwc.ApiError('noMatch',"Latest version is " + node.version);
    }
};

/**
 * Checks that the given packet context's contextType meets the requirements of the api. Subclasses should override this
 * method as it performs no check by default.
 *
 * @method validateContextType
 * @param {CommonApiValue} node @TODO is a node needed to validate?
 * @param {ozpIwc.TransportPacketContext} packetContext The packetContext with the contextType to be validated.
 *
 * @returns {Boolean} - always returns true.
 */
ozpIwc.CommonApiBase.prototype.validateContentType=function(node,packetContext) {
    return true;
};

/**
 * @TODO (DOC)
 * @method updateDynamicNode
 * @param {ozpIwc.CommonApiValue} node @TODO (DOC)
 */
ozpIwc.CommonApiBase.prototype.updateDynamicNode=function(node) {
    if(!node) {
        return;
    }
    var ofInterest=[];

    for(var k in this.data) {
        if(node.isUpdateNeeded(this.data[k])){
            ofInterest.push(this.data[k]);
        }
    }

    if(ofInterest) {
        var snapshot=node.snapshot();
        node.updateContent(ofInterest);
        this.notifyWatchers(node,node.changesSince(snapshot));
    }
};

/**
 * @TODO (DOC)
 * @method addDynamicNode
 * @param {ozpIwc.CommonApiValue} node @TODO (DOC)
 */
ozpIwc.CommonApiBase.prototype.addDynamicNode=function(node) {
    this.data[node.resource]=node;
    this.dynamicNodes.push(node.resource);
    this.updateDynamicNode(node);
};

/**
 * The default handler for the api when receiving packets. This handler is called when no handler was found for the
 * given packet context's action.
 *
 *
 * @method defaultHandler
 * @param {ozpIwc.CommonApiValue} node @TODO is a node needed? or is this intended for subclass purposes
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context being handled.
 */
ozpIwc.CommonApiBase.prototype.defaultHandler=function(node,packetContext) {
    packetContext.replyTo({
        'response': 'badAction',
        'entity': {
            'action': packetContext.packet.action,
            'originalRequest' : packetContext.packet
        }
    });
};

/**
 * Common handler for packet contexts with `get` actions.
 *
 * @method handleGet
 * @param {ozpIwc.CommonApiValue} node The api node to retrieve.
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context containing the get action.
 */
ozpIwc.CommonApiBase.prototype.handleGet=function(node,packetContext) {
    if(this.isLeader()) {
        packetContext.replyTo(node.toPacket({'response': 'ok'}));
    }
};

/**
 * Common handler for packet contexts with `bulkGet` actions.
 *
 * @method handleBulkget
 * @param {ozpIwc.CommonApiValue} node The api node to retrieve.  (Not used, bulk get searches the api's data object instead)
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context containing the bulk get action.
 */
ozpIwc.CommonApiBase.prototype.handleBulkget=function(node,packetContext) {
    if(this.isLeader()) {
        // scan local data set for resource link(?) contains prefix
        // return list of nodes of matches
        var matchingNodes = [];

        if (this.data !== {}) {
            for (var i in this.data) {
                if (this.data[i].resource.indexOf(packetContext.packet.resource) === 0) {
                    matchingNodes.push(this.data[i].toPacket());
                }
            }
        }

        packetContext.replyTo({
            'response': 'ok',
            'entity': matchingNodes
        });
    }
};

/**
 * Common handler for packet contexts with `set` actions.
 *
 * @method handleSet
 * @param {ozpIwc.CommonApiValue} node The api node to store the packet contexts' data in.
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context containing the set action.
 */
ozpIwc.CommonApiBase.prototype.handleSet=function(node,packetContext) {
    node.set(packetContext.packet);
    if(this.isLeader()) {
        packetContext.replyTo({'response': 'ok'});
    }
};

/**
 * Common handler for packet contexts with `delete` actions.
 *
 * @TODO (DOC)
 * @method handleDelete
 * @param {ozpIwc.CommonApiValue} node @TODO (DOC)
 * @param {ozpIwc.TransportPacketContext} packetContext @TODO (DOC)
 */
ozpIwc.CommonApiBase.prototype.handleDelete=function(node,packetContext) {
    node.deleteData();
    if(this.isLeader()) {
        packetContext.replyTo({'response': 'ok'});
    }
};

/**
 * Common handler for packet contexts with `watch` actions.
 *
 * @method handleWatch
 * @param {ozpIwc.CommonApiValue} node The api node to register a watch on.
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context containing the watch action.
 */
ozpIwc.CommonApiBase.prototype.handleWatch=function(node,packetContext) {
    node.watch(packetContext.packet);
    if(this.isLeader()) {
        // @TODO: Reply with the entity? Immediately send a change notice to the new watcher?
        packetContext.replyTo({'response': 'ok'});
    }
};

/**
 * Common handler for packet contexts with `unwatch` actions.
 *
 * @method handleUnwatch
 * @param {ozpIwc.CommonApiValue} node The api node to remove a watch registration from.
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context containing the unwatch action.
 */
ozpIwc.CommonApiBase.prototype.handleUnwatch=function(node,packetContext) {
    node.unwatch(packetContext.packet);
    if(this.isLeader()) {
        packetContext.replyTo({'response': 'ok'});
    }
};

/**
 * Called when the leader participant fires its beforeUnload state. Releases the Api's data property
 * to be consumed by all, then used by the new leader.
 *
 * @method unloadState
 */
ozpIwc.CommonApiBase.prototype.unloadState = function(){
    if(this.isLeader()) {
        var serializedData = {};
        for(var  i in this.data){
            serializedData[i] = this.data[i].serialize();
        }
        this.participant.sendElectionMessage("election",{state: {
            data: serializedData,
            dynamicNodes: this.dynamicNodes
        }, previousLeader: this.participant.address});
        this.data = {};
    } else {
        this.participant.sendElectionMessage("election");
    }
};


/**
 * Sets the APIs data property. Removes current values, then constructs each API value anew.
 *
 * @method setState
 * @param {Object} state The object containing key value pairs to set as this api's state.
 */
ozpIwc.CommonApiBase.prototype.setState = function(state) {
    this.data = {};
    this.dynamicNodes = state.dynamicNodes || [];
    for (var key in state.data) {
        var dynIndex = this.dynamicNodes.indexOf(key);
        var node;
        if(dynIndex > -1){
             node = this.data[key] = new ozpIwc.CommonApiCollectionValue({
                resource: key
            });
            node.deserialize(state.data[key]);
            this.updateDynamicNode(node);
        } else {
            node = this.findOrMakeValue({
                resource: key,
                contentType: state.data[key].contentType
            });
            node.deserialize(state.data[key]);
        }
    }
    // update all the collection values
    this.dynamicNodes.forEach(function(resource) {
        this.updateDynamicNode(this.data[resource]);
    },this);
};

/**
 * Common handler for packet contexts with a `list` action but no resource.
 *
 * @method rootHandleList
 * @param {ozpIwc.CommonApiValue}node @TODO is a node needed? or is this intended for subclass purposes
 * @param {ozpIwc.TransportPacketContext} packetContext The packet context of the received request.
 */
ozpIwc.CommonApiBase.prototype.rootHandleList=function(node,packetContext) {
    if(this.isLeader()) {
        packetContext.replyTo({
            'response': 'ok',
            'entity': Object.keys(this.data)
        });
    }
};

/**
 * Puts the API's participant into it's election state.
 *
 * @method startElection
 */
ozpIwc.CommonApiBase.prototype.startElection = function(){
    if (this.isLeader()) {
        this.participant.changeState("actingLeader");
    } else if(this.participant.leaderState === "leaderSync") {
        // do nothing.
    } else {
        this.participant.changeState("election");
    }
};


/**
 *  Handles taking over control of the API's participant group as the leader.
 *      <li>If this API instance's participant was the leader prior to election and won, normal functionality resumes.</li>
 *      <li>If this API instance's participant received state from a leaving leader participant, it will consume said participants state</li>
 *
 * @method becameLeader
 */
ozpIwc.CommonApiBase.prototype.becameLeader= function(){
    this.participant.sendElectionMessage("victory");

    // Was I the leader at the start of the election?
    if (this.participant.leaderState === "actingLeader" || this.participant.leaderState === "leader") {
        // Continue leading
        this.setToLeader();

    } else if (this.participant.leaderState === "election") {
        //If this is the initial state we need to wait till the endpoint data is ready
        this.leaderSync();
    }
};


/**
 * Handles a new leader being assigned to this API's participant group.
 *      <li>@TODO: If this API instance was leader prior to the election, its state will be sent off to the new leader.</li>
 *      <li>If this API instance wasn't the leader prior to the election it will resume normal functionality.</li>
 *
 * Fires:
 *   - {{#crossLink "ozpIwc.leaderGroupParticipant/#newLeader:event"}}{{/crossLink}}
 *
 * @method newLeader
 */
ozpIwc.CommonApiBase.prototype.newLeader = function() {
    // If this API was the leader, send its state to the new leader
    if (this.participant.leaderState === "actingLeader") {
        this.participant.sendElectionMessage("election", {previousLeader: this.participant.address, state: this.data});
    }
    this.participant.changeState("member");
    this.participant.events.trigger("newLeader");
};



/**
 * Handles setting the API's participant to the leader state.
 *
 * Fires:
 *   - {{#crossLink "ozpIwc.leaderGroupParticipant/#becameLeader:event"}}{{/crossLink}}
 *
 * @method setToLeader
 */
ozpIwc.CommonApiBase.prototype.setToLeader = function(){
    var self = this;
    ozpIwc.util.setImmediate(function() {
        self.participant.changeState("leader");
        self.participant.events.trigger("becameLeader");
    });
};


/**
 * Handles the syncronizing of API data from previous leaders.
 * <li> If this API's participant has a state stored from the election it is set </li>
 * <li> If no state present but expected, a listener is set to retrieve the state if acquired within 250ms </li>
 *
 * @method leaderSync
 */
ozpIwc.CommonApiBase.prototype.leaderSync = function () {
    this.participant.changeState("leaderSync",{toggleDrop: true});

    var self = this;
    ozpIwc.util.setImmediate(function() {

        // If the election synchronizing pushed this API out of leadership, don't try to become leader.
        if(self.participant.leaderState !== "leaderSync") {
            return;
        }

        // Previous leader sent out their state, it was stored in the participant
        if (self.participant.stateStore && Object.keys(self.participant.stateStore).length > 0) {
            self.setState(self.participant.stateStore);
            self.participant.stateStore = {};
            self.setToLeader();

        } else if (self.participant.previousLeader) {
            // There was a previous leader but we haven't seen their state. Wait for it.
            self.receiveStateTimer = null;

            self.receiveStateTimer = window.setTimeout(function () {
                if (self.participant.stateStore && Object.keys(self.participant.stateStore).length > 0) {
                    self.receiveState(self.participant.stateStore);
                } else {
                    self.loadFromServer();
                    ozpIwc.log.debug(self.participant.name, "New leader(",self.participant.address, ") failed to retrieve state from previous leader(", self.participant.previousLeader, "), so is loading data from server.");
                }

                self.setToLeader();
            }, 250);

        } else {
            // This is the first of the bus, winner doesn't obtain any previous state
            ozpIwc.log.debug(self.participant.name, "New leader(",self.participant.address, ") is loading data from server.");
            self.loadFromServer().then(function (data) {
                self.setToLeader();
            },function(err){
                ozpIwc.log.debug(self.participant.name, "New leader(",self.participant.address, ") could not load data from server. Error:", err);
                self.setToLeader();
            });
        }
    });
};

/**
 * @TODO DOC
 * @method persistNodes
 */
ozpIwc.CommonApiBase.prototype.persistNodes=function() {
	// throw not implemented error
	throw new ozpIwc.ApiError("noImplementation","Base class persistence call not implemented.  Use DataApi to persist nodes.");
};
