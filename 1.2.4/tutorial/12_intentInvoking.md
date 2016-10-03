---
layout: tutorial
title: Invoking an Intent (Shared Function)
category: intermediate
tag: 1.2.4
---
# Invoking
In the IWC, to **invoke** an intent, is to call the shared functionality
registered to the Intents API **resource** through a **reference**.

***

# Invoking an Intent on the Intents Api
The previous tutorial covered registering functions as intent handlers,
this tutorial will cover the other half of the Intents API, calling the shared
function.

***

## Invoking any handler
When invoking an intent on the IWC, the default behavior is to invoke an
**intent action** and allow the IWC to process which registered handler to use.
The choosing falls into 3 cases:

 1. There is only one handler(registered function) matching that action: simply,
  the only handler is chosen.
 2. There are multiple handlers and the user has no stored preference: A pop-up
 window opens to prompt the user which application to use to handle the
 invocation. The user has the option there to store their preference (for as long
 as that handling application is open) to have it always handle the request.
 This has not been implemented yet as of version 1.2.0 and is a planned feature.
 3. There are multiple handlers and the user has stored preference: The
 preferred handler is sent the invocation.


**To invoke an action and let the IWC handle where it is run:** call the
`invoke` action on a **reference** to a resource of an **Intent Action**,
`/{Type}/{Sub-type}/{Action}`. The invoke function signature has **2 parameter**:

####Parameters

| parameter | type   | description                                             |
|-----------|--------|---------------------------------------------------------|
| value   | Primative or Array | The payload to be passed to the shared function. |
| callback  | Function| **(Optional)** A callback that is called whenever the state of the intent invocation changes.|

###Returns
A promise that resolves with **the returned value from the shared function.** If
the operation fails, the promise will reject with the reason (string) for failure.


####Callback
The callback of the invoke action is for applications that wish to receive
status updates pertaining to the handling of an invocation. If the desire is to
simply have someone handle some data and optionally return a response, simply
utilizing the promise response should suffice and this callback is not needed.


The callback receives 2 parameters:
 1. `intentState`: contains various information about an intent operation's current state.
 2. `done`: A function to call to stop handling intent state changes. Useful for
 stopping retrieval of state updates about the invocation. Once the invocation
 completes updates automatically stop.

| property | type   | description                                |
|----------|--------|--------------------------------------------|
| intentState   | Object | Data pertaining to the state of the intent.|
| intentState.handler| Object| Data pertaining to the IWC client handling the request.|
| intentState.handler.address| String| The address of the handling IWC client.|
| intentState.handler.reason| String| The reason for this handler being used("onlyOne", "userSelected", or "remembered"|
| intentState.handler.resource| String| The resource path of the handler function.|
| intentState.request| * | The data passed to the IWC in the invoke request.|
| intentState.response | * | The data returned from the handler when finished computing (only available if state is "complete").|
| intentState.state | String | The state of the intent handling explained in table below.|
| intentState.status | String | Will be "ok" if this callback is reachable (internal use).|

####Intent states
The following are the states that will trigger the invoke callback.

| State   | description                                |
|---------|--------------------------------------------|
| init    | The request was acknowledged by the IWC.   |
| choosing| If multiple handlers are available and the user needs to pick, it will sit in the choosing state until the user has selected from the intent chooser.   |
| delivering| The IWC is delivering the intent invocation to the client that will handle it. |
| running | The handling client has received the invocation and is currently processing it. |
| complete| The handling client has finished processing the request and has returned the result. |


**Note:** this code example will receive a rejection with a reason of "noResource"
 if the [intent handler](http://s.codepen.io/Kevin-K/debug/xZbdLv) isn't open.
 Simply open it in another tab prior to invoking.
<p data-height="500" data-theme-id="0" data-slug-hash="yeoXbq" data-default-tab="js" data-user="Kevin-K" class='codepen'>

##Invoking a specific handler
If a specific IWC client is desired to handle an invoke action, create a
reference to the specific handler's Intent's API resource:
`/{Type}/{Sub-type}/{Action}/{HandlerId}` (as apposed to the general action
resource: `/{Type}/{Sub-type}/{Action}`). From there, follow the above approach
and call `invoke` on said reference.

If a handler doesn't register with its own unique handler ID (covered in
[registering tutorial](11_intentRegister.html)),
the `{HandlerId}` will be runtime generated and can not be statically referenced.

***

##Broadcast: Invoking all handlers
The `broadcast` follows the same signature & functionality as `invoke` with
one key difference. It **invokes on all handlers matching the supplied action.
The `broadcast` action applies to references general action resources:
`/{Type}/{Sub-type}/{Action}`. **

There are three differences between broadcasting and invoking:

1. Broadcast receives callback messages for state changes of every handler rather
 than an individual.
2. Broadcast promises resolve **when all handlers finish handling**.
3. The entity of the promise resolution holds a map of handler resource names
with their respective results. If a handler failed, its result is undefined.

<p data-height="500" data-theme-id="0" data-slug-hash="NxvgXy" data-default-tab="js" data-user="Kevin-K" class='codepen'>
