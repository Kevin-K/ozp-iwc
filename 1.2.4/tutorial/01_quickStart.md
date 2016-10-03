---
layout: tutorial
title: Using References
category: basic
tag: 1.2.4
---

# Quick Start
In this tutorial, we will create a Javascript application that will do the following:

  1. Connects to the public IWC bus
  2. Creates a reference to a Data API resource.
  3. Implement a publish/subscribe pattern to create a clock.

***

## Creating an IWC Connection
The IWC library uses the `ozpIwc` namespace. To create a connection, an  
**IWC Client** must be instantiated. When creating a client, the path to the
**IWC Bus** (common domain) must be specified.

Naming of the client variable is irrelevant, for these tutorials we will label
it `iwc` as it is our local instantiated connection to the IWC Bus.

``` js
 var iwc = new ozpIwc.Client("http://ozone-development.github.io/ozp-iwc");
```

The path of the **IWC Bus** is a path to the directory containing a special HTML
file, `iframe_peer.html`. This file will pull the needed IWC Bus components to
the user's browser.

**Are you developing a public facing application?** Simply use our github IWC
bus demonstrated above. In the future we plan to utilize a more optimal bus
hosting structure (CDN), when that day comes we will redirect the above link so
applications will work when transitioned.

**Are you developing for a private application suite?** If you are developing a
group of applications, the IWC is still viable, a privatized bus will be needed.
A privatized bus is configurable for more advanced features including account
based permissions and user data persistence. See our gitbook for
[hosting documentation]({{site.baseurl}}/{{page.tag}}/gitbook/bus/overview.html), tutorials will
be produced on this matter at a later date as well.

The use of http://ozone-development.github.io/ozp-iwc instead of
http://ozone-development.github.io/ozp-iwc/1.2.0 for the **IWC Bus**  is because all
releases of IWC 1 (`1.x.y`) can communicate with backwards compatibility. This
means developers can utilize a specific version of IWC for it's client API, but
communicate with all IWC applications regardless of version.

***

## Testing the Connection
To verify the IWC Client has connected, the `connect` promise can be used to run some functionality once connected.

<p data-height="170" data-theme-id="0" data-slug-hash="bERzVV" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>


It is not required to call `client.connect()` as the client by default
automatically connects. Rather the `connect` promise gives notification if
the connection fails.

**Waiting for the IWC Client to connect to call IWC functions is not necessary.**
The client will queue up all requests and send them upon connection. Waiting
for connection is only neccessary for gathering information pertaining the
connection, gathering the IWC Client's address for example.


***
## Creating a Reference
To access shared information, reference objects are used. As explained in the
last tutorial, references contain functionality to link an application to an
IWC resource.

<p data-height="250" data-theme-id="0" data-slug-hash="dGRaNa" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

The above code demonstrates creating a **reference** to the **Data API resource**
`/clock`.

To give more background on this resource, `/clock` will hold a time
value that can be updated.

**All of the reference functions to communicate with a resource return promises.**
This allows chaining of operations to occur, the common operations are
demonstrated below.

***

## Set the value of /clock
To set the value of the clock resource, the `set` function is used on the
reference.

<p data-height="250" data-theme-id="0" data-slug-hash="pgwGqp" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

The above example sets the **numerical** Unix epoch time to `/clock`. This may be
useful as it stores the time in a common-formattable way. The IWC can store
**primatives and arrays** in it's resources. In other words, the IWC can store
any valid JSON, thus it **cannot store a function**. Sharing functions is
a feature of the IWC though, and it is introduced in a section below.

***

## Get the value of /clock
To retrieve the value of `/clock` the `get` function is used on the reference.
The get function returns a promise that will resolve with the value of `/clock`.

<p data-height="250" data-theme-id="0" data-slug-hash="zrzQVy" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

If a `get` is used on a reference and it's resource does not exist, (not been
set yet), the returned promise will reject with the thrown error "noResource".

<p data-height="350" data-theme-id="0" data-slug-hash="pgwXvV" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

This "catch" allows developers to attempt to gather a resource, but distinguish
between the resource holding no value and the resource not existing.

***

## Watch (Change Notification) the value  of /clock
Often applications are programmed to react on change of a value. Known as
change listeners, or **watchers**, in the IWC references have a `watch` function
to register to hear changes to a resource.

<p data-height="350" data-theme-id="0" data-slug-hash="ZQydmd" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

The `onChange` function above will be called whenever any application connected
to the IWC Bus, local to the user, changes the value of `/clock`.

**A watch can be called on a resource that does not exist.** When created the
watch will receive the value of `/clock` in `change.newValue`.

***

## Delete the resource /clock
Often applications rely on tracking value states such that is a value is no
longer needed it can be ommited from operation use. IWC references have a
`delete` function, that when called clears the resource and notifies any
**watchers** that the resource has been deleted from the IWC. Watchers will
continue to watch the resource, they will receive notification if the resource
is created again.

<p data-height="250" data-theme-id="0" data-slug-hash="YwQmwE" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

***

## Publish Subscribe pattern
While the IWC doesn't have defined `publish` and `subscribe` methods, it's `set` action is a direct mapping to publish,
and it's **`watch`** action is an enhanced subscribe.

Below is a (running) example of publish  and subscribe. App A is the publisher
while App B is the subscriber. Make sure to hit the "results" tab to see App B
consuming the updates.

### App A (publish)
<p data-height="350" data-theme-id="0" data-slug-hash="VeWoPr" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>


### App B (subscribe)
<p data-height="350" data-theme-id="0" data-slug-hash="XXgvgK" data-default-tab="js" data-user="Kevin-K" class='codepen'>

***

## Cross-Domain example
The above example while using different applications is running within the same
domain, [codepen](http://codepen.io/). This isn't demonstrating the IWC
capability of cross-domain sharing. Lets throw another domain in the mix.

Running the code of App B (subscribe) on [jsfiddle](https://jsfiddle.net/) below,
we can see that cross-domain sharing is functional. **Dont forget this isn't
bound to a single page, these applications can be in separate tabs and windows.**

<iframe width="100%" height="300" src="//jsfiddle.net/kjkelly/0upvjwp5/embedded/js,html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
