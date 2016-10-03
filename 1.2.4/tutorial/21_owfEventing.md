---
layout: tutorial
title: Eventing API
category: owf
tag: 1.2.4
---
# Migration from OWF Eventing to IWC Data API
This tutorial is for developers who are migrating applications previously
developed for the Ozone Widget Framework (OWF) to use IWC. This tutorial has the
following prerequisites:

  1. [Setup and Key Terms](index.html)
  2. [Using References](01_quickStart.html)
  3. [Basic Data Sharing](02_dataApi.html)

***

## Overview
This tutorial covers:

  1. `OWF.Eventing.publish` functionality migration
  2. `OWF.Eventing.subscribe` functionality migration
  3. Recreating the **Announcing Clock** and **Second Tracker** from the [OWF7 Developer Guides](https://github.com/ozoneplatform/owf-framework/wiki/OWF-7-Developer-Adding-Eventing-API-to-Widget).

As covered in the [(OWF) Application Setup](10_owfInit.html) guide, OWF
application logic runs inside of a `OWF.ready` callback. This guide focuses on
logic running within said callback.

***

## Publish
In OWF, publishing data required a **channel** and some **payload**.

#### OWF
``` js
var currentTimeString = "The time is: " + Date.now();
OWF.Eventing.publish("ClockChannel", currentTimeString);
```

In IWC, calling a `set` action on a **reference** to a `Data API` **resource**
 replicates the publish functionality.

#### IWC
``` js
var clockRef = new iwc.data.Reference("/ClockChannel");

var currentTimeString = "The time is: " + Date.now();
clockRef.set(currentTimeString);
```

**Note:** The `set` functionality causes the last payload set to a resource
(channel) to be stored in the Data API. The set functionality **modifies the
state of the resource** rather than just broadcasting on a channel.

***

## Subscribe
In OWF, listening to published data on a channel used the `subscribe` action.
It took a **channel** and some **callback** function.


#### OWF

``` js
var callback = function(sender, msg){
  console.log("Received: ", msg);
};

OWF.Eventing.subscribe("ClockChannel", currentTimeString);
```

In IWC, calling a `watch` action on a **reference** to a `Data API` **resource**
(channel) and with a supplied **callback** replicates this functionality.

#### IWC
``` js
var clockRef = new iwc.data.Reference("/ClockChannel");

var callback = function (change, done) {
  console.log("New Value: ", change.newValue);
};

clockRef.watch(callback);
```
***

### Response Format differences
Unlike the OWF callback, which receives the **sender** and **message**,
the IWC callback receives the new and oldvalue of the watched **resource**.
object sent to the client.

* **change**: The message payload, structured for a watch
* **change.newValue**: The new value (payload) of the resource
* **change.oldValue**: The previous value (payload) of the resource
* **change.deleted**: A boolean flag marking if the resource was destroyed

***

### Watch also calls Get
Unlike OWF subscribes, an IWC watch callback is triggered
**when the state of the resource changes** rather than a message broadcast
received. This means if the resource is deleted, the watcher gets notified.

As with all IWC actions, the `watch` action's promise will resolve when the
request was handled. As covered in the [Basic Data Sharing](01_dataApi.html)
tutorial, the watch action will resolve **with the value of the resource**.
This means when registering a `watch` on a resource, if it has a value it is
gathered instantly, preventing the application from waiting for a change in value:

#### IWC
``` js
var clockRef = new iwc.data.Reference("/ClockChannel");

var callback = function (change, done) {
  console.log("New Value: ", change.newValue);
};
var onResolved = function(value){
  console.log("Initial receive: ", value);
};

clockRef.watch(callback).then(onResolved);
```

***

## Recreating Announcing Clock and Second Tracker
This is a rewrite of the example widgets in the [OWF7 Developer Guides](https://github.com/ozoneplatform/owf-framework/wiki/OWF-7-Developer-Adding-Eventing-API-to-Widget).
Some of the code has been simplified to better showcase the IWC changes
(clock string generation). Note, the `Connection Uptime` in the Second Tracker
is actually a receive count.

### Second Tracker
<p data-height="400" data-theme-id="0" data-slug-hash="gPxRqG" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

### Announcing Clock
<p data-height="400" data-theme-id="0" data-slug-hash="VezWOP" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>
