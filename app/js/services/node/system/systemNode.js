/**
 * @submodule bus.service.Value
 */

/**
 * @class SystemNode
 * @namespace ozpIwc
 * @extends ozpIwc.ApiNode
 * @constructor
 */
ozpIwc.SystemNode = ozpIwc.util.extend(ozpIwc.ApiNode, function(config) {
    ozpIwc.ApiNode.apply(this, arguments);
});

/**
 * If a resource path isn't given, this takes the best guess at assigning it.
 * @override
 * @method resourceFallback
 * @param serializedForm
 * @returns String
 */
ozpIwc.SystemNode.prototype.resourceFallback = function(serializedForm) {
    switch(this.contentType){
        case "application/vnd.ozp-application-v1+json":
            return "/application/" + serializedForm.id;
    }
};