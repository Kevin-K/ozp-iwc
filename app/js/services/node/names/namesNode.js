/**
 * @submodule bus.service.Value
 */

/**
 * @class NamesNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.NamesNode = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    // Take the supplied data for anything that matches in the super class,
    // such as resource.
    ozpIwc.ApiNode.apply(this, arguments);

    /**
     * @property lifespan
     * @type {ozpIwc.Lifespan.Bound}
     */
    this.lifespan = new ozpIwc.Lifespan.Bound({
        'addresses': [config.src]
    });

    /**
     * @property entity
     * @type {Object}
     */
    this.entity = config.entity || {};

});
