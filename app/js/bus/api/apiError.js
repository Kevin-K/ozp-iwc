/**
 * ```
    .---------------------------.
   /,--..---..---..---..---..--. `.
  //___||___||___||___||___||___\_|
  [j__ ######################## [_|
     \============================|
  .==|  |"""||"""||"""||"""| |"""||
 /======"---""---""---""---"=|  =||
 |____    []*  IWC     ____  | ==||
 //  \\        BUS    //  \\ |===||  hjw -(& kjk)
 "\__/"---------------"\__/"-+---+'
 * ```
 * @module bus
 */

/**
 * Classes related to api aspects of the IWC.
 * @module bus
 * @submodule bus.api
 */
/**
 * The API classes that can be used on the IWC bus. All of which subclass {{#crossLink "ozpIwc.CommonApiBase"}}{{/crossLink}}
 * @module bus.api
 * @submodule bus.api.Type
 */
/**
 * The API Value types that can be used in IWC apis. All of which subclass
 * {{#crossLink "CommonApiValue"}}{{/crossLink}}
 * @module bus.api
 * @submodule bus.api.Value
 */

/**
 * A base class for IWC error objects.
 *
 * @class ApiError
 * @namespace ozpIwc
 * @constructor
 *
 * @type {Function}
 * @param {String} action The action of the error.
 * @param {String} message The message corresponding to the error.
 */
ozpIwc.ApiError=ozpIwc.util.extend(Error,function(action,message) {
    Error.call(this,message);
    this.name="ApiError";
    this.errorAction=action;
    this.message=message;
});

/**
 * Stringifies the error.
 *
 * @method toString
 * @returns {String}
 */
ozpIwc.ApiError.prototype.toString=function() {
    return this.name+":"+JSON.stringify(this.message);
};

/**
 * Creates a subclass of the ApiError with the given error name prefix.
 *
 * @method subclass
 * @param response
 * @returns {Function}
 */
ozpIwc.ApiError.subclass=function(response) {
    return ozpIwc.util.extend(ozpIwc.ApiError,function(message) {
        ozpIwc.ApiError.call(this,response,message);
        this.name=response+"Error";
    });
};

/**
 * Thrown when an invalid action is called on an api.
 *
 * @class BadActionError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.BadActionError=ozpIwc.ApiError.subclass("badAction");

/**
 * Thrown when an invalid resource is called on an api.
 *
 * @class BadResourceError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.BadResourceError=ozpIwc.ApiError.subclass("badResource");

/**
 * Thrown when an invalid request is made against an api.
 *
 * @class BadRequestError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.BadRequestError=ozpIwc.ApiError.subclass("badRequest");

/**
 * Thrown when an invalid contentType is used in a request against an api.
 *
 * @class BadContentError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.BadContentError=ozpIwc.ApiError.subclass("badContent");

/**
 * Thrown when the action or entity is not valid for the resource's state.
 *
 * @class BadStateError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.BadStateError=ozpIwc.ApiError.subclass("badState");

/**
 * Thrown when no action is given in a request against an api.
 *
 * @class NoActionError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.NoActionError=ozpIwc.ApiError.subclass("noAction");

/**
 * Thrown when no resource is given in a request against an api.
 *
 * @class NoResourceError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.NoResourceError=ozpIwc.ApiError.subclass("noResource");

/**
 * Thrown if an api request packets ifTag exists but does not match the node's version property.
 *
 * @class NoMatchError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.NoMatchError=ozpIwc.ApiError.subclass("noMatch");

/**
 * Thrown when an api request is not permitted.
 *
 * @class NoPermissionError
 * @extends ozpIwc.ApiError
 * @static
 */
ozpIwc.NoPermissionError=ozpIwc.ApiError.subclass("noPermission");

