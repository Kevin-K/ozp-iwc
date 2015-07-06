/**
 *
 * @class packetRouter
 * @namespace ozpIwc
 * @static
 */
ozpIwc.packetRouter = ozpIwc.packetRouter || {};

/**
 * Generates a template function to deserialize a uri string based on the RegExp pattern provided.
 *
 * @method uriTemplate
 * @static
 * @param {String} pattern
 * @returns {Function} If the uri does not meet the template criteria, null will be returned when the returned
 *                     function is invoked.
 */
ozpIwc.packetRouter.uriTemplate=function(pattern) {
  var fields=[];
  var modifiedPattern="^"+pattern.replace(/\{.+?\}|[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, function(match) {
      if(match.length===1) {
          return "\\"+match;
      }
      var colon=match.indexOf(":");
      
      if(colon > 0) {
          fields.push(match.slice(1,colon));
          return "("+match.slice(colon+1,-1)+")";
      } else {
        fields.push(match.slice(1,-1));
        return "([^\/]+)";
      }
  })+"$";
  var regex=new RegExp(modifiedPattern);
  
  return function(input) {
     var results=regex.exec(input);
     if(!results) {
         return null;
     }
     var obj={};
     for(var i=1;i<results.length;++i) {
         obj[fields[i-1]]=results[i];
     }
     return obj;
  };
    
};

/**
 * A routing module for packet controlling via template matching and filtering.
 * @class PacketRouter
 * @namespace ozpIwc
 */
ozpIwc.PacketRouter=function() {
    /**
     * The key on this table is the route action.
     * The value is an array of config objects of the form:
     *    action: from the route declaration
     *    resource: from the route declaration
     *    handler: the function from the route declaration
     *    uriTemplate: uriTemplate function
     * @property routes
     * @type {Object}
     */
    this.routes={};

    /**
     * The route that matches all packet handling requests. Should defined route be able to handle a packet, this route
     * is called. Can be changed using the declareDefaultRoute method.
     *
     * @property defaultRoute
     * @returns {*}
     */
    this.defaultRoute=function() { return false; };

    /**
     * The default scope of the router.
     * @type {PacketRouter}
     */
    this.defaultSelf=this;
};


/**
 * Assigns a route to the Packet Router for the specific action. This route is taken by a packet if its resource matches
 * the routes resource template, passes any assigned filters. Additionally, a packet may only take one route, if
 * multiple possible routes are possible, the route which was declared earliest will handle the packet.
 *
 * @method declareRoute
 * @param {Object} config
 * @param {String} config.action The action this route is defined to (ex. "get", "set", "list", ...)
 * @param {String} config.resource The serialized uri template definition pertaining to the route (ex. "/foo", "/{id:\\d+}", "/{param1}/{param2}")
 * @param {Array} config.filters Any filters that better isolate the packet routing based on the context and packet properties
 * @param {Function} handler The resulting action to be taken should this route handle a packet.
 * @param {Object}handlerSelf The scope of the handler, the PacketRouter object holds the default scope if none is provided.
 *
 * @returns {ozpIwc.PacketRouter}
 */
ozpIwc.PacketRouter.prototype.declareRoute=function(config,handler,handlerSelf) {
    if(!config || !config.action || !config.resource) {
        throw new Error("Bad route declaration: "+JSON.stringify(config,null,2));
    }
    config.handler=handler;
    config.filters=config.filters || [];
    config.handlerSelf=handlerSelf;
    config.uriTemplate=ozpIwc.packetRouter.uriTemplate(config.resource);
    
    // @TODO FIXME var actions=ozpIwc.util.ensureArray(config.action);
    var actions=ozpIwc.util.ensureArray(config.action);
    
    actions.forEach(function(a) {
        if(!this.routes.hasOwnProperty(a)) {
            this.routes[a]=[];
        }
    
        this.routes[a].push(config);
    },this);
    return this;
};

/**
 * Recursively passes through all filters for the packet, calling the handler only if all filters pass.
 *
 * @method filterChain
 * @param {Object} packet
 * @param {Object} context
 * @param {Object} pathParams
 * @param {Object} routeSpec
 * @param {Array} filters
 * @returns {Function|null} The handler function should all filters pass.
 */
ozpIwc.PacketRouter.prototype.filterChain=function(packet,context,pathParams,routeSpec,thisPointer,filters) {
  // if there's no more filters to call, just short-circuit the filter chain
  if(!filters.length) {
    return routeSpec.handler.call(thisPointer,packet,context,pathParams);
  }
  // otherwise, chop off the next filter in queue and return it.
  var currentFilter=filters.shift();
  var self=this;
  var filterCalled=false;
  var returnValue=currentFilter.call(thisPointer,packet,context,pathParams,function() {
      filterCalled=true;
      return self.filterChain(packet,context,pathParams,routeSpec,thisPointer,filters);
  });
  if(!filterCalled) {
      ozpIwc.log.info("Filter did not call next() and did not throw an exception",currentFilter);
  } else {
      ozpIwc.log.debug("Filter returned ", returnValue);
  }
  return returnValue;  
};

/**
 * Routes the given packet based on the context provided.
 *
 * @method routePacket
 * @param {Object} packet
 * @param {Object} context
 * @param {Object} routeOverrides - if it exists, this to determine the route instead of the packet
 * @returns {*} The output of the route's handler. If the specified action does not have any routes false is
 *                    returned. If the specified action does not have a matching route the default route is applied
 */
ozpIwc.PacketRouter.prototype.routePacket=function(packet,context,thisPointer,routeOverrides) {
    routeOverrides = routeOverrides || {};    
    var action=routeOverrides.action || packet.action;
    var resource=routeOverrides.resource || packet.resource;
    
    if(!action || !resource) {
        context.defaultRouteCause="nonRoutablePacket";
        return this.defaultRoute.call(thisPointer,packet,context,{});                
    }
    
    context=context || {};
    thisPointer=thisPointer || this.defaultSelf;
    if(!this.routes.hasOwnProperty(action)) {
        context.defaultRouteCause="noAction";
        return this.defaultRoute.call(thisPointer,packet,context,{});
    }
    var actionRoutes=this.routes[action];
    for(var i=0;i<actionRoutes.length;++i) {
        var route=actionRoutes[i];
        if(!route) {
            continue;
        }
        var pathParams=route.uriTemplate(resource);
        if(pathParams) {
            thisPointer=route.handlerSelf || thisPointer;
            var filterList=route.filters.slice();
            return this.filterChain(packet,context,pathParams,route,thisPointer,filterList);
        }
    }
    // if we made it this far, then we know about the action, but there are no resources for it
    context.defaultRouteCause="noResource";
    return this.defaultRoute.call(thisPointer,packet,context,{});        
    
};

/**
 * Assigns the default route for the Packet Router
 *
 * @param {Function} handler
 */
ozpIwc.PacketRouter.prototype.declareDefaultRoute=function(handler) {
    this.defaultRoute=handler;
};


/**
 * Augments the provided class with a class-level router
 * and routing functions on the prototype.  This allows the use of
 * "declareRoute" on the class to create routes for all instances of
 * that class.  All filters and handlers are evaluated using the
 * instance as "this".
 * 
 * Defines:
 *    classToAugment.declareRoute(routeConfig,handler)
 *    classToAugment.prototype.routePacket(packet,context);
 * 
 * If the instance has a "defaultRoute" member, it will be used as the
 * default route for packets.
 * 
 * Example:
 *    ozpIwc.PacketRouter.mixin(MyClass);
 *    
 *    MyClass.declareRoute({
 *       action: "get",
 *       resource: "/foo/{id}"
 *    },function (packet,context,pathParams) {
 *       console.log("Foo handler",packet,context,pathParams);     
 *       return "foo handler";
 *    });
 * 
 *    MyClass.prototype.defaultRoute=function(packet,context) {
 *      console.log("Default handler",packet,context,pathParams);
 *      return "default!";
 *    };
 * 
 *    var instance=new MyClass();
 *
 *    var packet1={ resource: "/foo/123", action: "get", ...}
 *    var rv=instance.routePacket(packet1,{ bar: 2});
 *    // console output: Foo handler, packet1, {bar:2}, {id: 123}
 *    // rv === "foo handler"
 *    
 *    var packet2={ resource: "/dne/123", action: "get", ...}
 *    rv=instance.routePacket(packet2,{ bar: 3});
 *    // console output: Default handler, packet2, {bar:3}
 *    // rv === "default!"
 * 
 * @param {type} classToAugment
 * @returns {undefined}
 */
ozpIwc.PacketRouter.mixin=function(classToAugment) {
    var packetRouter=new ozpIwc.PacketRouter();
    
    var superClass=Object.getPrototypeOf(classToAugment.prototype);
    if(superClass && superClass.routePacket) {
        packetRouter.defaultRoute=function(packet,context) {
            return superClass.routePacket.apply(this,arguments);
        };
    } else {
        packetRouter.defaultRoute=function(packet,context) {
            if(this.defaultRoute) {
                return this.defaultRoute.apply(this,arguments);
            } else {
                return false;
            }
        };
    }
    classToAugment.declareRoute=function(config,handler) {
        packetRouter.declareRoute(config,handler);
    };
    
    classToAugment.prototype.routePacket=function(packet,context) {
        return packetRouter.routePacket(packet,context,this);  
    };
};