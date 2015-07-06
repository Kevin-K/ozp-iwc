ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

ozpIwc.policyAuth.Operations = ozpIwc.policyAuth.Operations || {};


/**
 * 10.4.9 op:date-equal
 *
 * op:date-equal($arg1 as xs:date, $arg2 as xs:date) as xs:boolean
 *
 * Summary: Returns true if and only if the starting instant of $arg1 is equal to starting instant of $arg2.
 * Returns false otherwise.
 * The starting instant of an xs:date is the xs:dateTime at time 00:00:00 on that date.
 *
 * The two starting instants are compared using op:dateTime-equal.
 *
 * This function backs up the "eq", "ne", "le" and "ge" operators on xs:date values.
 *
 * @TODO
 * @property op:time-equal
 * @param valA
 * @param valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Operations['op:date-equal'] = function(valA,valB){
    return true;
};

/**
 * 10.4.12 op:time-equal
 *
 * op:time-equal($arg1 as xs:time, $arg2 as xs:time) as xs:boolean
 *
 * Summary: Returns true if and only if the value of $arg1 converted to an xs:dateTime using the date components
 * from the reference xs:dateTime is equal to the value of $arg2 converted to an xs:dateTime using the date components
 * from the same reference xs:dateTime. Returns false otherwise.
 *
 * The two xs:dateTime values are compared using op:dateTime-equal.
 *
 * This function backs up the "eq", "ne", "le" and "ge" operators on xs:time values.
 *
 * @TODO
 * @property op:time-equal
 * @param valA
 * @param valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Operations['op:time-equal'] = function(valA,valB){
    return true;
};

/**
 * 10.4.6 op:dateTime-equal
 *
 * op:dateTime-equal($arg1 as xs:dateTime, $arg2 as xs:dateTime) as xs:boolean
 *
 * Summary: Returns true if and only if the value of $arg1 is equal to the value of $arg2 according to the algorithm
 * defined in section 3.2.7.4 of [XML Schema Part 2: Datatypes Second Edition] "Order relation on dateTime" for
 * xs:dateTime values with timezones. Returns false otherwise.
 * This function backs up the "eq", "ne", "le" and "ge" operators on xs:dateTime values.
 *
 * @TODO
 * @property op:dateTime-equal
 * @param valA
 * @param valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Operations['op:dateTime-equal'] = function(valA,valB){
    return true;
};

/**
 * 10.4.5 op:duration-equal
 *
 * op:duration-equal($arg1 as xs:duration, $arg2 as xs:duration) as xs:boolean
 *
 * Summary: Returns true if and only if the xs:yearMonthDuration and the xs:dayTimeDuration components of
 * $arg1 and $arg2 compare equal respectively. Returns false otherwise.
 *
 * This function backs up the "eq" and "ne" operators on xs:duration values.
 *
 * Note that this function, like any other, may be applied to arguments that are derived from the types given in
 * the function signature, including the two subtypes xs:dayTimeDuration and xs:yearMonthDuration.
 * With the exception of the zero-length duration, no instance of xs:dayTimeDuration can ever be
 * equal to an instance of xs:yearMonthDuration.
 *
 * @TODO
 * @property op:duration-equal
 * @param valA
 * @param valB
 * @returns {Boolean}
 */
ozpIwc.policyAuth.Operations['op:duration-equal'] = function(valA,valB){
    return true;
};

