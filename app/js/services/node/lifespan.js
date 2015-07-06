/**
 * Persistance types for the apiNode.
 * @module bus.service.Value
 * @submodule bus.service.Value.Persistance
 */
/**
 *
 * @namespace ozpIwc.Lifespan
 */
ozpIwc.Lifespan = ozpIwc.Lifespan || {};

/**
 * Returns the lifespan functionality given the lifespan object given.
 * @method getLifespan
 * @static
 * @param {Object} lifespanObj
 * @param {String} lifespan.type
 * @returns {{shouldPersist: Function, shouldDelete: Function}|*}
 */
ozpIwc.Lifespan.getLifespan = function(lifespanObj){

    switch(lifespanObj.type){
        case "Ephemeral":
            return ozpIwc.Lifespan.ephemeralFunctionality;
        case "Persistent":
            return ozpIwc.Lifespan.persistentFunctionality;
        case "Bound":
            return ozpIwc.Lifespan.boundFunctionality;
        default:
            ozpIwc.Error("Received a malformed Lifespan, resource will be dropped: ", lifespanObj);
            break;
    }
};

/**
 * Functionality for ephemeral lifespans.
 * @method ephemeralFunctionality
 * @static
 * @type {{shouldPersist: Function, shouldDelete: Function}}
 */
ozpIwc.Lifespan.ephemeralFunctionality = {
    shouldPersist: function(){ return false; },
    shouldDelete: function(){ return false; }
};

/**
 * Functionality for persistant lifespans.
 * @method ephemeralFunctionality
 * @static
 * @type {{shouldPersist: Function, shouldDelete: Function}}
 */
ozpIwc.Lifespan.persistentFunctionality = {
    shouldPersist: function(){ return true; },
    shouldDelete: function(){ return false; }
};


/**
 * Functionality for bound lifespans.
 * @method ephemeralFunctionality
 * @static
 * @type {{shouldPersist: Function, shouldDelete: Function}}
 */
ozpIwc.Lifespan.boundFunctionality = {
    shouldPersist: function(){ return false; },
    shouldDelete: function(lifespan,address){
        var len=address.length;
        for(var i in lifespan.addresses) {
            if(lifespan.addresses[i].substr(-len) === address) {
                return true;
            }
        }
        return false;
    }
};

/**
 * Creates a persistent lifespan object
 * @Class Persistent
 * @namespace ozpIwc.Lifespan
 * @constructor
 */
ozpIwc.Lifespan.Persistent = function(){
    this.type = "Persistent";
};

/**
 * Creates an ephemeral lifespan object
 * @Class Ephemeral
 * @namespace ozpIwc.Lifespan
 * @constructor
 */
ozpIwc.Lifespan.Ephemeral = function(){
    this.type = "Ephemeral";
};

/**
 * Creates a bound lifespan object
 * @Class Bound
 * @namespace ozpIwc.Lifespan
 * @property {Object} config
 * @property {String[]} config.addresses
 * @constructor
 *
 */
ozpIwc.Lifespan.Bound = function(config){
    config = config || {};
    this.type = "Bound";
    this.addresses = config.addresses || [];
};
