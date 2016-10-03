---
layout: tutorial
title: Application Setup
category: owf
tag: 1.2.4
---
# Migration from OWF to IWC
This tutorial is for developers who are migrating applications previously
developed for the Ozone Widget Framework (OWF) to use IWC. This tutorial has the
following prerequisites:

  1. [Setup and Key Terms](index.html)
  2. [Using References](01_quickStart.html)
  3. [Basic Data Sharing](02_dataApi.html)


## Overview
This tutorial covers:

  1. Handling the required JavaScript dependencies.
  2. Differences in instantiating IWC vs OWF.

***

## Handling the required JavaScript dependencies
#### OWF
In OWF, it was required that applications had to:

  1. Include the `owf-widget-min.js` JavaScript library.
  2. Place the `rpc_relay.uncompressed.html` file in the application's directory & give reference to it with:
  ` OWF.relayFile = '<DIR_PATH>/rpc_relay.uncompressed.html';`

``` html
<html>
   <head>
     <script type="text/javascript" src="<DIR_PATH>/owf-widget-debug.js"></script>
     <script type="text/javascript">
       //The location is assumed to be at /<context>/js/eventing/rpc_relay.uncompressed.html if it is not set
       OWF.relayFile = '<DIR_PATH>/rpc_relay.uncompressed.html';
     </script>
   </head>
   <body></body>
</html>
```

#### IWC
In IWC, the two requirements above unfold as so:

  1. Include the 'ozpIwc-client.min.js` JavaScript library.
  2. No longer necessary

``` html
<html>
   <head>
     <script type="text/javascript" src="<DIR_PATH>/ozpIwc-client.min.js"></script>
   </head>
   <body></body>
</html>
```  

***

## Differences in instantiating IWC vs OWF
#### OWF
In OWF, it was required to wrap application logic in a callback to `OWF.ready`. When OWF  was ready for the application,
the application logic would run.

``` js
function initPage() {
  updateClock();
  msg = 'Running in OWF: ' + (OWF.Util.isRunningInOWF()?"Yes":"No");
  document.getElementById("message-panel").innerHTML = msg;
  document.getElementById("message-panel").style.display = 'block';
  setInterval('updateClock()', 1000 )
}
owfdojo.addOnLoad(function() {
  OWF.ready(initPage);
});
```

#### IWC
In IWC, the application does not need to wait for IWC to be ready to begin
operation. All IWC operations will be queued if the IWC is not ready for the
application. This means applications no longer have the `Loading..` splash-screen
of OWF.

A difference in IWC from OWF, the IWC isn't simply running by including the
library, a connection to the IWC domain must be established (covered in the
[Setup and Key Terms tutorial](index.html)). Syntactically this should not be
alarming to developers as they need to reference an instance of `ozpIwc.Client`
to use the IWC, and said reference prepares the IWC for use.

``` js
var iwc = new ozpIwc.Client({peerUrl: "http://localhost:13000"});
// all iwc requests will be queued until IWC is ready.
```

#### Knowing when the IWC Client Connects
While the client auto connects and will process any requests queued, the
`connect` promise will resolve when the client is connected. This promise can be
called as often as desired, the client will not reconnect by calling it, rather
it will reference the connection to resolve and move on to any chained functions.

Chaining asynchronous code off the **IWC Client** connection is only necessary
if specific information pertaining to the generated client is needed (client's
address).

``` js
var iwc = new ozpIwc.Client({peerUrl: "http://localhost:13000"});
iwc.connect().then(function(){
   // This asynchronous function runs once the client is connected.
});
```

The below code snippet demonstrates the use of the `connect` promise to write
the client's unique address to the application once connected.

<p data-height="250" data-theme-id="0" data-slug-hash="zrdzLg" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>
