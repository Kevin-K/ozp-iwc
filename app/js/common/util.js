/**
 * @submodule common
 */

/**
 * @class util
 * @namespace ozpIwc
 * @static
 */
ozpIwc.util=ozpIwc.util || {};

/**
 * Used to get the current epoch time.  Tests overrides this
 * to allow a fast-forward on time-based actions.
 *
 * @method now
 * @returns {Number}
 */
ozpIwc.util.now=function() {
    return new Date().getTime();
};

/**
 * Applies the template using the supplied object for values
 *
 * @method resolveUriTemplate
 * @param {string} template The template to use
 * @param {Object} obj The object to get template paramters from
 * @param {Object} fallback A secondary object for parameters not contained by the first
 * @returns {Number}
 */
ozpIwc.util.resolveUriTemplate=function(template,obj,fallback) {
	var converters={
		"+": function(a) { return a;},
		"": function(a) { return encodeURIComponent(a);}
	};
	var t=template.replace(/\{([\+\#\.\/\;\?\&]?)(.+?)\}/g,function(match,type,name) {
			return converters[type](obj[name] || fallback[name]);
		});
	// look for the :// of the protocol
	var protocolOffset=t.indexOf("://");
	// if we found it, set the offset to the end.  otherwise, leave it
	// at -1 so that a leading "//" will be replaced, below
	if(protocolOffset >0) { protocolOffset+=3; }
	
	// remove double // that show up after the protocolOffset
	return t.replace(/\/\//g,function(m,offset){
			// only swap it after the protocol
			if(offset > protocolOffset) {
				return "/";
			} else {
				return m;
			}
		});
};

/**
 * A record of event listeners used in the given IWC context. Grouped by type.
 *
 * @property eventListeners
 * @static
 * @type {Object}
 */
ozpIwc.util.eventListeners={};

/**
 * Adds an event listener to the window and stores its listener in ozpIwc.util.eventListeners.
 *
 * @method addEventListener
 * @param {String} type the event to listen to
 * @param {Function} listener the callback to be used upon the event being emitted
 */
ozpIwc.util.addEventListener=function(type,listener) {
    var l=ozpIwc.util.eventListeners[type];
    if(!l) {
        l=ozpIwc.util.eventListeners[type]=[];
    }
    l.push(listener);
    window.addEventListener(type,listener);
};

/**
 * Removes an event listener from the window and from ozpIwc.util.eventListeners
 * @param {String} type the event to remove the listener from
 * @param {Function} listener the callback to unregister
 */
ozpIwc.util.removeEventListener=function(type,listener) {
    var l=ozpIwc.util.eventListeners[type];
    if(l) {
        ozpIwc.util.eventListeners[type]=l.filter(function(v) { return v!==listener;});
    }
    window.removeEventListener(type,listener);
};

/**
 * Removes all event listeners registered in ozpIwc.util.eventListeners
 * @param {String} type the event to remove the listener from
 * @param {Function} listener the callback to unregister
 * @param {Boolean} [useCapture] if true all events of the specified type will be dispatched to the registered listener
 *                             before being dispatched to any EventTarget beneath it in the DOM tree. Events which
 *                             are bubbling upward through the tree will not trigger a listener designated to use
 *                             capture.
 */
ozpIwc.util.purgeEventListeners=function() {
    ozpIwc.object.eachEntry(ozpIwc.util.eventListeners,function(type,listenerList) {
        listenerList.forEach(function(listener) {
            window.removeEventListener(type,listener);
        });
    });
    ozpIwc.util.eventListeners={};
};


/**
 * Create a class with the given parent in it's prototype chain.
 *
 * @method extend
 * @param {Function} baseClass The class being derived from.
 * @param {Function} newConstructor The new base class.
 *
 * @returns {Function} New Constructor with an augmented prototype.
 */
ozpIwc.util.extend=function(baseClass,newConstructor) {
    if(!baseClass || !baseClass.prototype) {
        ozpIwc.log.error("Cannot create a new class for ",newConstructor," due to invalid baseclass:",baseClass);
        throw new Error("Cannot create a new class due to invalid baseClass.  Dependency not loaded first?");
    }
    newConstructor.prototype = Object.create(baseClass.prototype);
    newConstructor.prototype.constructor = newConstructor;
    return newConstructor;
};

/**
 * Invoke postMessage on a given window in a safe manner. Test whether the browser
 * supports structured clones, and stringifies the message if not. Catches
 * errors (especially attempts to send non-cloneable objects), and tries to
 * send a stringified copy of the message asa fallback.
 *
 * @param window a window on which to invoke postMessage
 * @param msg the message to be sent
 * @param origin the target origin. The message will be sent only if it matches the origin of window.
 */
ozpIwc.util.safePostMessage = function(window,msg,origin) {
    try {
        var data = msg;
        if (!ozpIwc.util.structuredCloneSupport() && typeof data !== 'string') {
           data=JSON.stringify(msg);
        }
        window.postMessage(data, origin);
    } catch (e) {
        try {
            window.postMessage(JSON.stringify(msg), origin);
        } catch (e) {
            ozpIwc.log.debug("Invalid call to window.postMessage: " + e.message);
        }
    }
};

/**
 * Detect browser support for structured clones. Returns quickly since it
 * caches the result. This method only determines browser support for structured
 * clones. Clients are responsible, when accessing capabilities that rely on structured
 * cloning, to ensure that objects to be cloned meet the criteria of the structured clone
 * algorithm. (See ozpIwc.util.safePostMessage for a method which handles attempts to
 * clone an invalid object.). NB: a bug in FF will cause file objects to be treated as
 * non-cloneable, even in FF versions that support structured clones.
 * (see https://bugzilla.mozilla.org/show_bug.cgi?id=722126).
 *
 * @private
 *
 * @method structuredCloneSupport
 *
 * @returns {Boolean} True if structured clones are supported, false otherwise.
 */
ozpIwc.util.structuredCloneSupport=function() {
    ozpIwc.util = ozpIwc.util || {};
    if (ozpIwc.util.structuredCloneSupportCache !== undefined) {
        return ozpIwc.util.structuredCloneSupportCache;
    }
    var cloneSupport = 'postMessage' in window;
    //If the browser doesn't support structured clones, it will call toString() on the object passed to postMessage.
    try {
        window.postMessage({
            toString: function () {
                cloneSupport = false;
            }
        }, "*");
    } catch (e) {
        //exception expected: objects with methods can't be cloned
        //e.DATA_CLONE_ERR will exist only for browsers with structured clone support, which can be used as an additional check if needed
    }
    ozpIwc.util.structuredCloneSupportCache=cloneSupport;
    return ozpIwc.util.structuredCloneSupportCache;
};

ozpIwc.util.structuredCloneSupport.cache=undefined;

/**
 * Does a deep clone of a serializable object.  Note that this will not
 * clone unserializable objects like DOM elements, Date, RegExp, etc.
 *
 * @method clone
 * @param {Array|Object} value The value to be cloned.
 * @returns {Array|Object}  a deep copy of the object
 */
ozpIwc.util.clone=function(value) {
	if(Array.isArray(value) || typeof(value) === 'object') {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            ozpIwc.log.log(e);
        }
	} else {
		return value;
	}
};

/**
 * A regex method to parse query parameters.
 *
 * @method parseQueryParams
 * @param {String} query
 *
 */
ozpIwc.util.parseQueryParams=function(query) {
    query = query || window.location.search;
    var params={};
	var regex=/\??([^&=]+)=?([^&]*)/g;
	var match;
	while((match=regex.exec(query)) !== null) {
		params[match[1]]=decodeURIComponent(match[2]);
	}
    return params;
};

/**
 * Adds params to the query string of the given url. Accepts objects, preformed query strings, and arrays of query
 * params.
 *
 * @method addQueryParams
 * @param {String} url
 * @param {String|Object|Array} params
 * @returns {String}
 */
ozpIwc.util.addQueryParams=function(url,params){
    if(typeof url !== "string") { throw new Error("url should be a string."); }

    var formattedParams = {};
    switch(typeof params){
        case "object":
            // if in array form ["a=true","b=en_us",...]
            if(Array.isArray(params)){
                if(params.length === 0){
                    return url;
                }
                for(var i in params){
                    if(typeof params[i] === "string") {
                        var p = ozpIwc.util.parseQueryParams(params[i]);
                        for(var j in p){
                            formattedParams[j] = p[j];
                        }
                    }
                }
            } else {
                if(Object.keys(params).length === 0){
                    return url;
                }
                // if in object form {a:true, b:"en_us",...}
                formattedParams = params;
            }
            break;
        case "undefined":
            return url;

        default:
            if(params.length === 0) {
                return url;
            }
            // if in string form "?a=true&b=en_us&..."
            formattedParams = ozpIwc.util.parseQueryParams(params);
            break;
    }
    var hash = "";
    // Separate the hash temporarily (if exists)
    var hashSplit = url.split("#");
    if(hashSplit.length > 2){
        throw new Error("Invalid url.");
    } else {
        url = hashSplit[0];
        hash = hashSplit[1] || "";
    }

    //if the url has no query params  we append the initial "?"
    if(url.indexOf("?") === -1) {
        url += "?";
    } else {
        url += "&";
    }
    //skip on first iteration
    var ampersand = "";
    for(var k in formattedParams){
        url += ampersand + k +"=" + formattedParams[k];
        ampersand = "&";
    }

    if(hash.length > 0){
        url += "#" + hash;
    }

    return url;
};

/**
 * Determines the origin of a given url.  
 * @method determineOrigin
 * @param url
 * @returns {String}
 */
ozpIwc.util.protocolPorts={
    "http:" : "80",
    "https:" : "443",
    "ws:" : "80",
    "wss:" : "443"
};
ozpIwc.util.determineOrigin=function(url) {
    var a=document.createElement("a");
    a.href = url;
    if(a.origin) {
        return a.origin;
    }
    var origin=a.protocol + "//" + a.hostname;
    /* Internet Explorer adds the port to urls in <a> tags created by a script, even
     * if it wasn't there to start with.  Thanks, IE!
     * https://connect.microsoft.com/IE/feedback/details/817343/ie11-scripting-value-of-htmlanchorelement-host-differs-between-script-created-link-and-link-from-document
     * 
     * Other browsers seem to drop the port if it's the default, so we'll do the same.
    */
   
    if(a.port && ozpIwc.util.protocolPorts[a.protocol] !== a.port) {
        origin+= ":" + a.port;
    }
    return origin;
};

/**
 * Escapes regular expression characters in a string.
 * @method escapeRegex
 * @param {String} str
 * @returns {String}
 */
ozpIwc.util.escapeRegex=function(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * 
 * @method parseOzpUrl
 * @param {type} url
 * @returns {ozpIwc.TransportPacket}
 */
ozpIwc.util.parseOzpUrl=function(url) {
    var m = /^(?:(?:web\+ozp|ozp):\/\/)?([0-9a-zA-Z](?:[-.\w])*)(\/[^?#]*)(\?[^#]*)?(#.*)?$/.exec(decodeURIComponent(url));
    if (m) {
        // an action of "get" is implied
        var packet = {
            'dst': m[1],
            'resource': m[2],
            'action': "get"
        };
        // TODO: parse the query params into fields

        return packet;
    }
    return null;
};

/**
 * Returns true if the specified packet meets the criteria of an IWC Packet.
 * @method isIwcPacket
 * @static
 * @param {ozpIwc.TransportPacket} packet
 * @returns {Boolean}
 */
ozpIwc.util.isIWCPacket=function(packet) {
    if(typeof packet.src !== "string" ||typeof packet.dst !== "string" ||
        typeof packet.ver !== "number" || typeof packet.msgId !== "string") {
        return false;
    } else {
        return true;
    }
};


/**
 * Returns the version of Internet Explorer or a -1
 * (indicating the use of another browser).
 * @returns {number}
 */
ozpIwc.util.getInternetExplorerVersion= function() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName === 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = /MSIE ([0-9]{1,}[\.0-9]{0,})/;
        if (re.exec(ua) !== null) {
            rv = parseFloat(RegExp.$1);
        }
    }
    return rv;
};