ozpIwc = ozpIwc || {};
ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * A collection of functions for the XACML policy decision process.
 * @class Functions
 * @namespace ozpIwc.policyAuth
 * @type {{}|*|ozpIwc.policyAuth.Functions}
 */
ozpIwc.policyAuth.Functions = ozpIwc.policyAuth.Functions || {};

/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#string” and SHALL return
 * an “http://www.w3.org/2001/XMLSchema#boolean”.  The function SHALL return "True" if and only if the value of both
 * of its arguments are of equal length and each string is determined to be equal.  Otherwise, it SHALL return “False”.
 * The comparison SHALL use Unicode codepoint collation, as defined for the
 * identifier http://www.w3.org/2005/xpath-functions/collation/codepoint by [XF].
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:string-equal
 * @type {Function}
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */

/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#string” and SHALL return
 * an “http://www.w3.org/2001/XMLSchema#boolean”.  The function SHALL return "True" if and only if the value of both
 * of its arguments are of equal length and each string is determined to be equal.  Otherwise, it SHALL return “False”.
 * The comparison SHALL use Unicode codepoint collation, as defined for the
 * identifier http://www.w3.org/2005/xpath-functions/collation/codepoint by [XF].
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:string-equal
 * @type {Function}
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */

/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#integer” and SHALL return an
 * “http://www.w3.org/2001/XMLSchema#boolean”. The function SHALL return “True” if and only if the two arguments
 * represent the same number.
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:integer-equal
 * @type {Function}
 * @param {Number} valA
 * @param {Number} valB
 * @returns {Boolean}
 */

/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#double” and SHALL return an
 * “http://www.w3.org/2001/XMLSchema#boolean”.  It SHALL perform its evaluation on doubles according to
 * IEEE 754 [IEEE754].
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:double-equal
 * @type {Function}
 * @param {Number} valA
 * @param {Number} valB
 * @returns {Boolean}
 */




ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:string-equal'] =
    ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:boolean-equal'] =
        ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:integer-equal'] =
            ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:double-equal'] =
                            function (valA, valB) { return (valA === valB); };


/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#date” and SHALL return an
 * “http://www.w3.org/2001/XMLSchema#boolean”.  It SHALL perform its evaluation according to the “op:date-equal”
 * function [XF] Section 10.4.9.
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:date-equal
 * @type {Function}
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:date-equal'] = function (valA,valB){
    return ozpIwc.policyAuth.Operations['op:date-equal'](valA,valB);
};

/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#time” and SHALL return an
 * “http://www.w3.org/2001/XMLSchema#boolean”.  It SHALL perform its evaluation according to the “op:time-equal”
 * function [XF] Section 10.4.12.
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:time-equal
 * @type {Function}
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:time-equal'] = function (valA,valB){
    return ozpIwc.policyAuth.Operations['op:time-equal'](valA,valB);
};
/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#dateTime” and SHALL return an
 * “http://www.w3.org/2001/XMLSchema#boolean”.  It SHALL perform its evaluation according to the “op:dateTime-equal”
 * function [XF] Section 10.4.6.
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:dateTime-equal
 * @type {Function}
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:dateTime-equal'] = function (valA,valB){
    return ozpIwc.policyAuth.Operations['op:dateTime-equal'](valA,valB);
};

/**
 * This function SHALL take two arguments of data-type "http://www.w3.org/2001/XMLSchema#dayTimeDuration” and SHALL
 * return an "http://www.w3.org/2001/XMLSchema#boolean".  This function shall perform its evaluation according to the
 * "op:duration-equal" function [XF] Section 10.4.5.  Note that the lexical representation of each argument MUST be
 * converted to a value expressed in fractional seconds [XF] Section 10.3.2.
 *
 * See: http://www.w3.org/TR/xpath-functions/#func-duration-equal
 *
 * @property urn:oasis:names:tc:xacml:3.0:function:dayTimeDuration-equal
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */

/**
 * This function SHALL take two arguments of data-type "http://www.w3.org/2001/XMLSchema#yearMonthDuration” and SHALL
 * return an "http://www.w3.org/2001/XMLSchema#boolean".  This function shall perform its evaluation according to the
 * "op:duration-equal" function [XF] Section 10.4.5.  Note that the lexical representation of each argument MUST be
 * converted to a value expressed in fractional seconds [XF] Section 10.3.2.
 *
 * See: http://www.w3.org/TR/xpath-functions/#func-duration-equal
 *
 * @property urn:oasis:names:tc:xacml:3.0:function:yearMonthDuration-equal
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:3.0:function:dayTimeDuration-equal'] =
    ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:3.0:function:yearMonthDuration-equal'] =
        function (valA,valB){
            return ozpIwc.policyAuth.Operations['op:duration-equal'](valA,valB);
        };

/**
 * This function SHALL take two arguments of data-type “http://www.w3.org/2001/XMLSchema#anyURI” and SHALL return an
 * “http://www.w3.org/2001/XMLSchema#boolean”.  The function SHALL convert the arguments to strings
 * with urn:oasis:names:tc:xacml:3.0:function:string-from-anyURI and return “True” if and only if the values of the
 * two arguments are equal on a codepoint-by-codepoint basis.
 *
 * @property urn:oasis:names:tc:xacml:1.0:function:anyURI-equal
 * @param {String} valA
 * @param {String} valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:1.0:function:anyURI-equal'] = function (valA,valB){
    var uToS = ozpIwc.policyAuth.Functions['urn:oasis:names:tc:xacml:3.0:function:string-from-anyURI'];
    return (uToS(valA) === uToS(valB));
};