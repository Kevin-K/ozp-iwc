/**
 * @submodule bus.util
 */
var getStackTrace = function() {
    var obj = {};
    Error.captureStackTrace(obj, getStackTrace);
    return obj.stack;
};


/**
 * A logging wrapper for the ozpIwc namespace
 * @class log
 * @static
 * @namespace ozpIwc
 */
ozpIwc.log=ozpIwc.log || {
    // syslog levels
    NONE: { logLevel: true, severity: 0, name: "NONE"},
    DEFAULT: { logLevel: true, severity: 1, name: "DEFAULT"},
    ERROR: { logLevel: true, severity: 3, name: "ERROR"},
    INFO: { logLevel: true, severity: 6, name: "INFO"},
    DEBUG: { logLevel: true, severity: 7, name: "DEBUG"},
    ALL: { logLevel: true, severity: 10, name: "ALL"},
    
    threshold: 3,

    /**
     * Sets the threshold for the IWC's logger.
     * @method setThreshold
     * @param {Number|Object} level
     * @param {Number} [level.severity]
     */
    setThreshold: function(level) {
        if(typeof(level)==="number") {
            ozpIwc.log.threshold=level;
        } else if(typeof(level.severity) === "number") {
            ozpIwc.log.threshold=level.severity;
        } else {
            throw new TypeError("Threshold must be a number or one of the ozpIwc.log constants.  Instead got" + level);
        }
    },
    
    /**
     * A wrapper for log messages. Forwards to console.log if available.
     * @property log
     * @type Function
     */
	log: function(level) {
        if(level.logLevel === true && typeof(level.severity) === "number") {
            ozpIwc.log.logMsg(level,Array.prototype.slice.call(arguments, 1));
        } else {
            ozpIwc.log.logMsg(ozpIwc.log.DEFAULT,Array.prototype.slice.call(arguments, 0));
        }
	},

    /**
     * Logs the given message if the severity is above the threshold.
     * @method logMsg
     * @param {Number} level
     * @param {Arguments} args
     */
    logMsg: function(level,args) {
        if(level.severity > ozpIwc.log.threshold) {
            return;
        }

        // if no console, no logs.
        if(!console || !console.log){
            return;
        }
        
        var msg=args.reduce(function(acc, val) {
            if(val instanceof Error) {
                return acc + val.toString() + (val.stack?(" -- " +val.stack):""); //"[" + val.name + ":" + val.message;
            }else if(typeof(val) === "object") {
                return acc + JSON.stringify(val,null,2);
            }
            return acc + val;
        },"["+level.name+"] ");
        
        console.log(msg);
//        var original = console.log;
//        if(original.apply){
//            original.apply(console,["["+level.name+"] "].concat(args));
//        } else {
//            // IE does not have apply on console functions
//            var msg = ["["+level.name+"]"].concat(args).join(' ');
//            original(msg);
//        }
    },
    
    /**
     * A wrapper for error messages. Forwards to console.error if available.
     * @property error
     * @type Function
     */
	error: function() {
        ozpIwc.log.logMsg(ozpIwc.log.ERROR,Array.prototype.slice.call(arguments, 0));
	},

    /**
     * A wrapper for debug messages. Forwards to console.error if available.
     * @property error
     * @type Function
     */
    debug: function() {
        ozpIwc.log.logMsg(ozpIwc.log.DEBUG,Array.prototype.slice.call(arguments, 0));
//        window.console.log.apply(window.console,arguments);
    },
    /**
     * A wrapper for debug messages. Forwards to console.error if available.
     * @property error
     * @type Function
     */
    info: function() {
        ozpIwc.log.logMsg(ozpIwc.log.INFO,Array.prototype.slice.call(arguments, 0));
//        window.console.log.apply(window.console,arguments);
    }
};
