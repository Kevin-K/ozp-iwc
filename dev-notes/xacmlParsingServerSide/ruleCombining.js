ozpIwc = ozpIwc || {};
ozpIwc.policyAuth = ozpIwc.policyAuth || {};
ozpIwc.policyAuth.RuleCombining = ozpIwc.policyAuth.RuleCombining || {};


/**
 * @method urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-overrides
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-overrides'] =
        function(rules,request){
    var atLeastOneErrorD,
        atLeastOneErrorP,
        atLeastOneErrorDP,
        atLeastOnePermit = false;

    for(var i in rules){
        var decision = rules[i].evaluate(request);
        switch(decision){
            case "Deny":
                return "Deny";
            case "Permit":
                atLeastOnePermit = true;
                break;
            case "NotApplicable":
                continue;
            case "Indeterminate{D}":
                atLeastOneErrorD = true;
                break;
            case "Indeterminate{P}":
                atLeastOneErrorP = true;
                break;
            case "Indeterminate{DP}":
                atLeastOneErrorDP = true;
                break;
            default:
                continue;
        }
    }

    if(atLeastOneErrorDP){
        return "Indeterminate{DP}";
    } else if(atLeastOneErrorD && (atLeastOneErrorP || atLeastOnePermit)){
        return "Indeterminate{DP}";
    } else if(atLeastOneErrorD){
        return "Indeterminate{D}";
    } else if(atLeastOnePermit) {
        return "Permit";
    } else if(atLeastOneErrorP){
        return "Indeterminate{P}";
    }

    return "NotApplicable";
};

/**
 * @method urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-overrides
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-overrides'] =
        function(){

};

/**
 * @method urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:first-applicable
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:first-applicable'] =
        function(){

};

/**
 * @method urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:ordered-deny-overrides
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:ordered-deny-overrides'] =
        function(){

};

/**
 * @method urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:ordered-permit-overrides
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:ordered-permit-overrides'] =
        function(){

};

/**
 * @method urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-unless-permit
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-unless-permit'] =
        function(){

};

/**
 * @method urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-unless-deny
 */
ozpIwc.policyAuth.RuleCombining['urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-unless-deny'] =
        function(){

};