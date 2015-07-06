/**
* @submodule bus.util
*/

/**
 * @class util
 * @namespace ozpIwc
 * @static
 */
ozpIwc.util=ozpIwc.util || {};

/**
 * Generates a large hexidecimal string to serve as a unique ID.  Not a guid.
 *
 * @method generateId
 * @static
 *
 * @returns {String}
 */
ozpIwc.util.generateId=function() {
    return Math.floor(Math.random() * 0xffffffff).toString(16);
};

/**
 * Invokes the callback handler on another event loop as soon as possible.
 *
 * @method setImmediate
 * @static
*/
ozpIwc.util.setImmediate=function(f) {
//    window.setTimeout(f,0);
    window.setImmediate(f);
};

/**
 * Returns true if every needle is found in the haystack.
 *
 * @method arrayContainsAll
 * @static
 * @param {Array} haystack The array to search.
 * @param {Array} needles All of the values to search.
 * @param {Function} [equal] What constitutes equality.  Defaults to a===b.
 *
 * @returns {Boolean}
 */
ozpIwc.util.arrayContainsAll=function(haystack,needles,equal) {
    equal=equal || function(a,b) { return a===b;};
    return needles.every(function(needle) { 
        return haystack.some(function(hay) { 
            return equal(hay,needle);
        });
    });
};


/**
 * Returns true if the value every attribute in needs is equal to 
 * value of the same attribute in haystack.
 *
 * @method objectContainsAll
 * @static
 * @param {Array} haystack The object that must contain all attributes and values.
 * @param {Array} needles The reference object for the attributes and values.
 * @param {Function} [equal] What constitutes equality.  Defaults to a===b.
 *
 * @returns {Boolean}
 */
ozpIwc.util.objectContainsAll=function(haystack,needles,equal) {
    equal=equal || function(a,b) { return a===b;};
    
    for(var attribute in needles) {
        if(!equal(haystack[attribute],needles[attribute])) {
            return false;
        }
    }
    return true;
};

/**
 * Wraps window.open.  If the bus is running in a worker, then
 * it doesn't have access to the window object and needs help from
 * a participant. 
 * @see window.open documentation for what the parameters actually do
 * 
 * @method openWindow
 * @static
 * @param {String} url The URL to open in a new window
 * @param {String} windowName The window name to open with.
 * @param {String} [features] The window features.
 *
 * @returns {undefined}
 */
ozpIwc.util.openWindow=function(url,windowName,features) {
    if(typeof windowName === "object") {
        var str="";
        for(var k in windowName) {
            str+=k+"="+encodeURIComponent(windowName[k]) +"&";
        }
        windowName=str;
    }
    try {
        window.open(url, windowName, features);
    } catch (e){
        //fallback for IE
        window.open(url + "?" + windowName,null,features);
    }
};


(function() {
    ozpIwc.BUS_ROOT=window.location.protocol + "//" +
            window.location.host +
            window.location.pathname.replace(/[^\/]+$/,"");

    ozpIwc.INTENT_CHOOSER_FEATURES = "width=330,height=500";
})();


/**
 * IWC alert handler.
 *
 * @method alert
 * @static
 * @param {String} message The string to display in the popup.
 * @param {Object} errorObject The object related to the alert to give as additional information
 * @todo fill with some form of modal popup regarding the alert.
 * @todo store a list of alerts to not notify if the user selects "don't show me this again" in the data.api
 *
 */
ozpIwc.util.alert = function (message, errorObject) {
    this.alerts = this.alerts || {};
    if(this.alerts[message]){
        this.alerts[message].error = errorObject;
    } else {
        this.alerts[message] = {
            error: errorObject,
            silence: false
        };
    }
    if(!this.alerts[message].silence){
        //TODO : trigger an angular/bootstrap modal alert to notify the user of the error.
        // on return of the alert:
            // set this.alerts[message].silence if the user silenced the alerts

        // Temporary placement: all alerts are silenced after first instance, but since this is not in data.api its on
        // a widget basis.
        this.alerts[message].silence = true;
        ozpIwc.log.log(message,errorObject);
    }
};

/**
 * Solves a common pattern to handle data from a function which may return a single object or an array of objects
 * If given an array, returns the array.
 * If given a single object, returns the object as a single element in a list.
 *
 * @method ensureArray
 * @static
 * @param {Object} obj The object may be an array or single object
 *
 * @returns {Array}
 */
ozpIwc.util.ensureArray=function(obj) {
	return Array.isArray(obj)?obj:[obj];
};
