var ozpIwc=ozpIwc || {};

/**
 * Client-side functionality of the IWC. This is the API for widget use.
 * @module client
 */

/**
 * This class will be heavily modified in the future.
 * @class Client
 * @namespace ozpIwc
 * @constructor
 * @uses ozpIwc.ApiPromiseMixin
 * @todo accept a list of peer URLs that are searched in order of preference
 * @param {Object} config
 * @param {String} config.peerUrl - Base URL of the peer server
 * @param {Object} config.params - Parameters that will be passed to the bus.
 * @param {String} config.params.log - The IWC bus logging level.  One of "NONE","DEFAULT","ERROR","INFO","DEBUG", or "ALL"
 * @param {Boolean} [config.autoConnect=true] - Whether to automatically find and connect to a peer
 */
ozpIwc.Client=function(config) {
    config=config || {};

    ozpIwc.util.addEventListener('beforeunload',this.disconnect);
    this.genPeerUrlCheck(config.peerUrl);
    ozpIwc.ApiPromiseMixin(this,config.autoConnect);
};

/**
 * Generates the Peer URL checking logic based on the data type received.
 * @method genPeerUrlCheck
 * @property {String|Array|Function} configUrl the url(s) to connect the client on. If function, the output of the
 *                                   function will be used.
 */
ozpIwc.Client.prototype.genPeerUrlCheck = function(configUrl){
    if(typeof(configUrl) === "string") {
        this.peerUrlCheck=function(url,resolve) {
            if(typeof url !== 'undefined'){
                resolve(url);
            } else {
                resolve(configUrl);
            }

        };
    } else if(Array.isArray(configUrl)) {
        this.peerUrlCheck=function(url,resolve) {
            if(configUrl.indexOf(url) >= 0) {
                resolve(url);
            }
            resolve(configUrl[0]);
        };
    } else if(typeof(configUrl) === "function") {
        /**
         * @property peerUrlCheck
         * @type String
         */
        this.peerUrlCheck=configUrl;
    } else {
        throw new Error("PeerUrl must be a string, array of strings, or function");
    }
};

/**
 * Disconnects the client from the IWC bus.
 *
 * @method disconnect
 */
ozpIwc.Client.prototype.disconnect=function() {
    this.events.trigger("disconnect");
    
    if(this.iframe) {
        this.iframe.src = "about:blank";
        var self = this;
        window.setTimeout(function(){
            self.iframe.remove();
            self.iframe = null;
        },0);
    }
};


/**
 * Connects the client from the IWC bus.
 * Fires:
 *     - {{#crossLink "ozpIwc.Client/#connected"}}{{/crossLink}}
 *
 * @method connect
 */
ozpIwc.Client.prototype.connect=function() {
    if(!this.connectPromise) {
        var self=this;

        /**
         * Promise to chain off of for client connection asynchronous actions.
         * @property connectPromise
         * @type Promise
         */
        this.connectPromise=new Promise(function(resolve) {
            self.peerUrlCheck(self.launchParams.peer,resolve);
        }).then(function(url) {
            // now that we know the url to connect to, find a peer element
            // currently, this is only via creating an iframe.
            self.peerUrl=url;
            self.peerOrigin=ozpIwc.util.determineOrigin(url);
            return self.createIframePeer();
        }).then(function() {
            // start listening to the bus and ask for an address
            self.postMessageHandler = function (event) {
                if (event.origin !== self.peerOrigin) {
                    return;
                }
                try {
                    var message = event.data;
                    if (typeof(message) === 'string') {
                        message = JSON.parse(event.data);
                    }
                    // Calls APIPromiseMixin receive handler
                    self.receiveFromRouterImpl(message);
                    self.receivedBytes += (event.data.length * 2);
                    self.receivedPackets++;
                } catch (e) {
                    // ignore!
                }
            };
            // receive postmessage events
            ozpIwc.util.addEventListener("message", self.postMessageHandler);
            return self.send({dst: "$transport"});
        }).then(function(message) {
            self.address = message.dst;

            /**
             * Fired when the client receives its address.
             * @event #gotAddress
             */
            self.events.trigger("gotAddress", self);

            return self.afterConnected();
        });
    }
    return this.connectPromise;
};

/**
 * Creates an invisible iFrame Peer for IWC bus communication.
 *
 * @method createIframePeer
 */
ozpIwc.Client.prototype.createIframePeer=function() {
    var self=this;
    return new Promise(function(resolve,reject) {
        var createIframeShim=function() {
            self.iframe = document.createElement("iframe");
            self.iframe.addEventListener("load",function() {
                resolve();
            });
						var url=self.peerUrl+"/iframe_peer.html";
						if(self.launchParams.log) {
							url+="?log="+self.launchParams.log;
						}
            self.iframe.src=url;
            self.iframe.height=1;
            self.iframe.width=1;
            self.iframe.setAttribute("area-hidden",true);
            self.iframe.setAttribute("hidden",true);
            self.iframe.style.setProperty ("display", "none", "important");
            document.body.appendChild(self.iframe);
            self.peer=self.iframe.contentWindow;
            

        };
        // need at least the body tag to be loaded, so wait until it's loaded
        if(document.readyState === 'complete' ) {
            createIframeShim();
        } else {
            ozpIwc.util.addEventListener("load",createIframeShim);
        }
    });
};

ozpIwc.Client.prototype.sendImpl = function(packet){
    ozpIwc.util.safePostMessage(this.peer, packet, '*');
};