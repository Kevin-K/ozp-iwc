ozpIwc.object={
    eachEntry: function(obj,fn,self) {
        var rv=[];
        for(var k in obj) {
            rv.push(fn.call(self,k,obj[k],obj.hasOwnProperty(k)));
        }
        return rv;
    },
    values:function(obj,filterFn) {
        filterFn=filterFn || function(key,value) {
            return true;
        };
        var rv=[];
        for(var k in obj) {
            if(filterFn(k,obj[k])) {
                rv.push(obj[k]);
            }
        }
        return rv;
    }
};
