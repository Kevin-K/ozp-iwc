---
layout: tutorial
title: Basic Data Sharing
category: basic
tag: 1.2.4
---

# Sharing Data with the Data API
The most common use of the IWC in applications is sharing data resources among applications. The IWC varies from
the various publish/subscribe libraries available in javascript because of the following 3 key components:

  1. **Cross-Domain Support**: The IWC was developed in a way to gracefully handle cross-domain sharing. This means
  applications hosted on different domains can interact.
  2. **State driven**: Unlike the typical publish/subscribe pattern, IWC retains state when using the `set` action. This
 means when a subscribing application is opened, it can gather the last value set (published).
  3. **(Optional) State Persistence**: The IWC has tie-ins for persisting resources beyond the working session by
  storing their value to a server. Further information on configuring a backend for state persistence to follow in
  a future tutorial.

***

## Accessing the Data API Resources
Covered in the [Using References](01_quickStart.html) tutorial, an IWC client is needed
to access the Data API, and to access a resource of the Data API a reference is
used.

``` js
 var iwc = new ozpIwc.Client("http://ozone-development.github.io/ozp-iwc");
 var fooRef = new client.data.Reference("/foo");
```

***

## Data API Reference Functionality (actions)
References of Data API resources have a set of functions that are linked to
the resource. In IWC terminology, these functions are called **actions**,
as it is some behavior that can modify the state of an application. These
actions were covered in the previous reference tutorial, but the actions
are defined below.


| action | description                                                         |
|--------|---------------------------------------------------------------------|
| set    | Stores a value to a given resource path.                            |
| get    | Retrieves a value from a given resource path.                       |
| delete | Removes a value from a given resource path.                         |
| watch  | Calls a callback function any time the resource path value changes. |

Each action returns a promise that is resolved when the IWC acknowledges the request. The acknowledgement returns the
state of the resource if it is a read action (get,watch). A watch action will also have a callback that is called
separately upon state change of a resource.

Actions have a handful of options that can be passed with them, for the purpose of this tutorial we will only be
covering the `entity` option, which is the value being passed/received from a resource. Further tutorials on the
various

***

## Set: storing data

To store a value in a resource, the set action of the reference is used.

#### Parameters

| parameter | type   | description                                                                                                                                                            |
|-----------|--------|------------------------------------------|
| value  | Primative or Array | The value to store in the resource.|

#### Returns
A promise that **resolves** with the value of the resource set, or
**rejects** with the reason (string) for failure.

 <p data-height="300" data-theme-id="0" data-slug-hash="mVMbXd" data-default-tab="js" data-user="Kevin-K" class='codepen'>

***

## Get: retrieving data

To retrieve a resource, regardless of the origin it was `set` in, the `get`
action is used on the reference.

####Parameters
The get action takes no parameters.


####Returns
A promise that **resolves** with the value of the resource upon retrieval. Or
**rejects** with the reason (string) for failure.

<p data-height="300" data-theme-id="0" data-slug-hash="NxvKEp" data-default-tab="js" data-user="Kevin-K" class='codepen'>

***

### Delete: removing data

####Parameters
The delete action takes no parameters.


####Returns
A promise that **resolves**  with no value when successful, or
**rejects** with the reason (string) for failure.

 <p data-height="300" data-theme-id="0" data-slug-hash="mVMbZV" data-default-tab="js" data-user="Kevin-K" class='codepen'>
