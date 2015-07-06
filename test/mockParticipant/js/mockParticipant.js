
ozpIwc.test = ozpIwc.test || {};

ozpIwc.test.MockParticipant=function(config) {
    this.clientUrl=config.clientUrl;
    this.client=config.client;
    
    this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
    this.runId=0;
    
    var self=this;
    // set up the side-band channel to the window.
   	this.messageEventListener=ozpIwc.util.addEventListener("message", function(event) {
//        console.log("mockparticipant received: ",event.data);
       self.postMessageHandler.apply(self,arguments);
    });
    
    this.iframe = document.createElement("iframe");
    this.iframe.src = this.clientUrl;
    this.iframe.height = 1;
    this.iframe.width = 1;
    this.iframe.style = "display:none !important;";
    this.callbacks={};
    document.body.appendChild(this.iframe);
};

ozpIwc.test.MockParticipant.prototype.close=function() {
    ozpIwc.util.removeEventListener("message",this.messageEventListener,false);
    document.body.removeChild(this.iframe);
};     

ozpIwc.test.MockParticipant.prototype.postMessageHandler=function(event) {
    // ignore anything not from our iframe
    if(event.source !== this.iframe.contentWindow) {
        return;
    }
    var message=event.data;
    try {
        if (typeof(message) === 'string') {
            message = JSON.parse(event.data);
        }
        //console.log(JSON.stringify(message));
        switch (message.msgType) {
            case "address":
                this.address = message.address;
                this.sendDirectly({
                    'msgType': "address",
                    'address': this.client.address
                });
                this.events.trigger("connected", this);
                break;
            case "return":
                var cb = this.callbacks[message.runId];
                if (cb) {
                    cb.call(null, message.returnValue);
                    delete this.callbacks[message.runId];
                }
                break;
            default:
                console.log("Unknown message type from mock participant: ",message);
                break;
        }
    } catch (e){
        //nothing
    }
};

ozpIwc.test.MockParticipant.prototype.sendDirectly=function(data,callback) {
    if(callback) {
        data.runId=this.runId;
        this.callbacks[this.runId++]=callback;
    }
    ozpIwc.util.safePostMessage(this.iframe.contentWindow,data,'*');
};

ozpIwc.test.MockParticipant.prototype.send=function(packet,callback) {
    this.sendDirectly({
        'msgType': "send",
        'packet': packet
    },callback);
};

ozpIwc.test.MockParticipant.prototype.run=function(func,callback) {
    this.sendDirectly({
        'msgType': "run",
        'runId' : this.runId,
        'func': func.toString()
    },callback);
};