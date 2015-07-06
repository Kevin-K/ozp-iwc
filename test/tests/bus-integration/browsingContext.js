var ozpIwc=ozpIwc || {};
ozpIwc.testUtil=ozpIwc.testUtil || {};

ozpIwc.testUtil.BrowsingContext = function(onLoad,msgHandler,id){
    this.msgQueue = this.msgQueue || [];
    var self=this;
    var msgEvent = function(e){
        if(e.data !== "") {
            var message;
            try {
                if (typeof(e.data) === 'string') {
                    if(e.data.indexOf("setImmediate$") === -1) {
                        message = JSON.parse(e.data);
                    }
                } else {
                    message = e.data;
                }
            } catch (e) {
                console.error(e);
            }
            if (message !== "") {
                msgHandler(message, self);
            }
        }
    };

    var scripts = [ 'var ozpIwc = ozpIwc || {}; ozpIwc.enableDefault=false; var msgHandler = ' + msgHandler.toString() + ';' +
        'window.addEventListener("message",'+msgEvent.toString()+');',
            '('+onLoad.toString()+')();'];

    this.iframe = document.createElement("iframe");
    this.iframe.id = id || "iframe";
    this.iframe.height = 10;
    this.iframe.width = 10;
    var html = '<body></body>';

    document.body.appendChild(this.iframe);
    this.iframe.contentWindow.document.write("<!DOCTYPE html><html><body></body></html>");
    this.addScript('text',scripts[0])
        .then(this.addScript('src','/js/ozpIwc-bus.js'))
        .then(this.addScript('text',scripts[1]))
        .then(this.ready);

    this.iframe.style = "display:none !important;";
};

ozpIwc.testUtil.BrowsingContext.prototype.wrapReady = function(val){
//    return 'document.addEventListener("DOMContentLoaded", function() {' + val + '});';
    return val;
};

ozpIwc.testUtil.BrowsingContext.prototype.addScript = function(type,val){
    var script = this.iframe.contentWindow.document.createElement('script');
    script.type = "text/javascript";

    switch(type){
        case 'text':
            script.text = this.wrapReady(val);
            this.iframe.contentWindow.document.body.appendChild(script);
            return new Promise(function(res,rej) {
                res();
            });
        case 'src': 
            /* falls through */
        default:
            var xhrObj = new XMLHttpRequest();
            // open and send a synchronous request
            xhrObj.open('GET', val, false);
            xhrObj.send('');
            script.text = this.wrapReady(xhrObj.responseText);
            this.iframe.contentWindow.document.body.appendChild(script);

            return new Promise(function(res,rej) {
                if (script.readyState) {  //IE
                    script.onreadystatechange = function () {
                        if (script.readyState === "loaded" || script.readyState === "complete") {
                            script.onreadystatechange = null;
                            res();
                        }
                    };
                } else {//others
                    script.onload = function () {
                        res();
                    };
                }
            });
    }

};

ozpIwc.testUtil.BrowsingContext .prototype.ready = function() {
    return new Promise(function(res,rej){
        this.ready = true;
        for(var i in this.msgQueue){
            this.send(this.msgQueue[i]);
        }
        this.msgQueue = [];
        res();
    });
};

ozpIwc.testUtil.BrowsingContext .prototype.send = function(message){
    if(!this.ready){
        this.msgQueue.push(message);
    } else {
        ozpIwc.util.safePostMessage(this.iframe.contentWindow,message,'*');
    }
};