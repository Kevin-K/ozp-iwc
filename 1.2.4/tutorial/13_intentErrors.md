---
layout: tutorial
title: Intent Error Handling
category: intermediate
tag: 1.2.4
---

# Handling Errors when Invoking Intents
Up to this point registering functionality and invoking functionality has been
explained. As with any remote communication, adhering to formatting requirments
is crucial with the IWC Intents. **When a developer registers a function as and
intent handler, it is their responsibility to release documentation on what that
intent handler expects (specifically what the invocation's entity should contain).**

In the event that an intent invoker supplies non-valid data for a handler,
unexpected behavior will occur. To make integration efforts easier, intent
handlers should perform checks on the data received before operating on it.
**If the format of the received data will result in the handler failing to
produce an expected result an error should be thrown.** The IWC will forward
said error to the invoker to signify what went wrong. This is a good point to
utilize both application specific error codes and human readable error messages.
Below is an example of an intent handler throwing an error based on received
input, followed by an invoker catching the error forwarded.

***

### Validating Input Data in the Handler
``` js
var randomizeRef = new iwc.intents.Reference("/json/array/randomize");

var handlerValidation = function(data) {
  if(typeof data !== "Array"){
     throw new Error("Invalid input. Expected array but received: " + typeof data);
  }
}
var handler = function(invocation) {
  handlerValidation(invocation.entity);
  return someFunctionCall(invocation.entity);
};

randomizeRef.register(handler);
```

### Handling Errors on the Invoker
``` js
var randomizeRef = new iwc.intents.Reference("/json/array/randomize");

var onError = function(err){
  // Do something to handle the error ( ex.: alert the user)
  // err.entity is "Invalid input. Expected array but received: string" in this example
  alert(err.entity);  
};

var onComplete = function(response){ ...};

randomizeRef.invoke("this should have been an array")
    .then(onComplete)
    .catch(onError);
```
