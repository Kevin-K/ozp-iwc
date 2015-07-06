/**
 * @class Endpoint
 * @namespace ozpIwc
 * @param {ozpIwc.EndpointRegistry} endpointRegistry Endpoint name
 * @constructor
 */
ozpIwc.Endpoint=function(endpointRegistry) {

    /**
     * @property endpointRegistry
     * @type ozpIwc.EndpointRegistry
     */
	this.endpointRegistry=endpointRegistry;
};

/**
 * Performs an AJAX request of GET for specified resource href.
 *
 * @method get
 * @param {String} resource
 * @param [Object] requestHeaders
 * @param {String} requestHeaders.name
 * @param {String} requestHeaders.value
 *
 * @returns {Promise}
 */
ozpIwc.Endpoint.prototype.get=function(resource, requestHeaders) {
    var self=this;
    resource = resource || '';
    return this.endpointRegistry.loadPromise.then(function() {
        if(!self.endpointRegistry.loaded){
            throw Error("Endpoint " + self.endpointRegistry.apiRoot + " could not be reached. Skipping GET of " + resource);
        }

        if (resource === '/' || resource === '' ) {
            resource=self.baseUrl;
        }

        return ozpIwc.util.ajax({
            href:  resource,
            method: 'GET',
            headers: requestHeaders
        });
    });
};

/**
 *
 * Performs an AJAX request of PUT for specified resource href.
 *
 * @method put
 * @param {String} resource
 * @param {Object} data\
 * @param [Object] requestHeaders
 * @param {String} requestHeaders.name
 * @param {String} requestHeaders.value
 *
 * @returns {Promise}
 */
ozpIwc.Endpoint.prototype.put=function(resource, data, requestHeaders) {
    var self=this;

    return this.endpointRegistry.loadPromise.then(function() {
        if(resource.indexOf(self.baseUrl)!==0) {
            resource=self.baseUrl + resource;
        }
        return ozpIwc.util.ajax({
            href:  resource,
            method: 'PUT',
			data: data,
            headers: requestHeaders
        });
    });
};

/**
 *
 * Performs an AJAX request of DELETE for specified resource href.
 *
 * @method put
 * @param {String} resource
 * @param [Object] requestHeaders
 * @param {String} requestHeaders.name
 * @param {String} requestHeaders.value
 *
 * @returns {Promise}
 */
ozpIwc.Endpoint.prototype.delete=function(resource, data, requestHeaders) {
    var self=this;

    return this.endpointRegistry.loadPromise.then(function() {
        if(!self.baseUrl) {
            throw Error("The server did not define a relation of type " + this.name + " for retrivieving " + resource);
        }
        if(resource.indexOf(self.baseUrl)!==0) {
            resource=self.baseUrl + resource;
        }
        return ozpIwc.util.ajax({
            href:  resource,
            method: 'DELETE',
            headers: requestHeaders
        });
    });
};

/**
 * Sends AJAX requests to PUT the specified nodes into the endpoint.
 * @todo PUTs each node individually. Currently sends to a fixed api point switch to using the node.self endpoint and remove fixed resource
 * @method saveNodes
 * @param {ozpIwc.CommonApiValue[]} nodes
 */
ozpIwc.Endpoint.prototype.saveNodes=function(nodes) {
    var resource = "/data";
    for (var node in nodes) {
        var nodejson = JSON.stringify(nodes[node]);
        this.put((nodes[node].self || resource), nodejson);
    }
};

/**
 * @class EndpointRegistry
 * @namespace ozpIwc
 * @constructor
 *
 * @param {Object} config
 * @param {String} config.apiRoot the root of the api path.
 */
ozpIwc.EndpointRegistry=function(config) {
    config=config || {};
    var apiRoot=config.apiRoot || '/api';

    /**
     * The root path of the specified apis
     * @property apiRoot
     * @type String
     * @default '/api'
     */
    this.apiRoot = apiRoot;

    /**
     * The collection of api endpoints
     * @property endPoints
     * @type Object
     * @default {}
     */
    this.endPoints={};

    /**
     * The collection of uri templates for endpoints.
     * @property template
     * @type Object
     * @default {}
     */
    this.template={};
		
    var self=this;

    /**
     * An AJAX GET request fired at the creation of the Endpoint Registry to gather endpoint data.
     * @property loadPromise
     * @type Promise
     */
    this.loadPromise=ozpIwc.util.ajax({
        href: apiRoot,
        method: 'GET'
    }).then(function(data) {
        self.loaded = true;
        var payload = data.response || {};
        payload._links = payload._links || {};
        payload._embedded = payload._embedded || {};

        for (var linkEp in payload._links) {
            if (linkEp !== 'self') {
                var link = payload._links[linkEp];
                if(Array.isArray(payload._links[linkEp])) {
                    link=payload._links[linkEp][0].href;
                }
                if(link.templated) {
                    self.template[linkEp]=link.href;
                } else {
                    self.endpoint(linkEp).baseUrl = link.href;
                }
            }
        }
        for (var embEp in payload._embedded) {
            var embLink = payload._embedded[embEp]._links.self.href;
            self.endpoint(embEp).baseUrl = embLink;
        }
        // UGLY HAX
        if(!self.template["ozp:data-item"]) {
            self.template["ozp:data-item"]=self.endpoint("ozp:user-data").baseUrl+"/{+resource}";
        }
        //END HUGLY HAX
    })['catch'](function(err){
        ozpIwc.log.debug(Error("Endpoint " + self.apiRoot + " " + err.statusText + ". Status: " +  err.status));
        self.loaded = false;
    });
};

/**
 * Finds or creates an input with the given name.
 *
 * @method endpoint
 * @param {String} name
 * @returns {ozpIwc.Endpoint}
 */
ozpIwc.EndpointRegistry.prototype.endpoint=function(name) {
    var endpoint=this.endPoints[name];
    if(!endpoint) {
        endpoint=this.endPoints[name]=new ozpIwc.Endpoint(this);
        endpoint.name=name;
    }
    return endpoint;
};

/**
 * Initializes the Endpoint Registry with the api root path.
 *
 * @method initEndpoints
 * @param {String} apiRoot
 */
ozpIwc.initEndpoints=function(apiRoot) {
    var registry=new ozpIwc.EndpointRegistry({'apiRoot':apiRoot});
    ozpIwc.endpoint=function(name) {
        return registry.endpoint(name);
    };
    ozpIwc.uriTemplate=function(name) {
        return registry.template[name];
    };
};

