---
layout: tutorial
title: Setup and Key Terms
permalink: "1.2.4/tutorial/index.html"
redirect_from: "/tutorial/"
category: basic
tag: 1.2.4
---

# Quick Start
In this tutorial, we will cover:

  1. Gather required library.
  2. A quick technology explanation.
  3. Define the keyterms of the IWC.

Following this tutorial is a brief application example using the basic
capabilities of data sharing in the IWC.
***

# Gathering the IWC
To use the IWC in a Javascript application, the IWC client library is needed.
The library can be gathered in the following ways.

### Bower

``` bash
   bower install ozone-development/ozp-iwc
```
When gathering the IWC through bower, the client library will be located at  `bower_components/ozp-iwc/dist/js/ozpIwc-client.min.js`.

Include it in your applications HTML as so:

``` html
<script type="text/javascript" src="/bower_components/ozp-iwc/dist/js/ozpIwc-client.min.js"></script>
```

### Github
Distributions of the IWC can be downloaded as a zip/tar.gz from the [github releases page](https://github.com/ozone-development/ozp-iwc/releases).
In the unarchived directory, the library is located  at `/dist/js/ozpIwc-client.min.js`.

### Remotely
The 1.2.0 release of the IWC client library is available here on github at `http://ozone-development.github.io/ozp-iwc/1.2.0/js/ozpIwc-client.js`.
The latest release is also regularly updated here on github at `http://ozone-development.github.io/ozp-iwc/js/ozpIwc-client.js`.

***


# Technology overview
The IWC functions by having the **IWC client**, the script gathered using methods above,
open a hidden iFrame to connection to an **IWC bus**, demonstrated in the following
seciton, which will utilize the **domain** of the IWC bus for CORS
(cross-origin resource sharing) purposes injuncture with HTML5 browser technology
(SharedWorker/localStorage) to let applications **act like they are sharing data
through a server, but, there is no server and the data is just passed internal to
the user's browser**.


***

# Terminology Breakdown
To develop application that use the IWC the following terms are important to know:
**IWC Client, IWC Bus, APIs, Resources, and References.**
## IWC Client
An IWC Client is an instantiation of the IWC client library within an application.
Creating a connection is covered below, but a single client is needed for an
application to utilize the IWC. Whenever a `new ozpIwc.Client(...)` is used
in code, a new client is created.

The Client allows the application to make requests and receive responses/events
from the **IWC Bus**.

## IWC Bus
The IWC Bus is the Javascript that marshals around and contains the state of
all the shared data and functionality of the IWC Clients.

The IWC Bus is created when the user's first **IWC Client** is instantiated. In
other terms, when the first application that connects to a given IWC Bus is opened,
the Bus is created. The Bus is created by IWC internals of the IWC Client and does not need to be
handled by the application developer.

When all applications accessing a given IWC Bus are closed, the Bus is destroyed.

***

## APIs
An API in the scope of the IWC is a subsection of the **IWC Bus** that governs
and maintains information for various uses of the application. A piece of information
an API maintains is called a **Resource**.

#### Data API
The Data API is the API of the IWC that manages **shared data among applications**.

#### Intents API
The Intents API is the API of the IWC that manages **shared functions among applications***.

***

## Resources
**Resources** are objects internal to the **IWC Bus** that applications request
to interact with. These objects may contain a shared current value (Data API),
or routing information for a shared function to be called (Intents API)

For example, stating "The bouncing ball application's **client** updates the shared
data **resource** '/foo'" means that the given applications **IWC Client** makes a
request to the **Data Api** to set the value stored in the **Resource** named "/foo".
The naming convension for resources follows the **relative pathing** style of URLs
for advanced IWC concepts covered later in these tutorials.

With an understanding of **resources** comes the last important term of the IWC,
**references**.

## References
A **Reference** is a instantiated class that links an application to a **resource**
of an **IWC API**.

Since resources are internal to the IWC, an application wanting to access them
does not have the visibility of the resources within their scope. In fact the
resources aren't stored within the same HTML window.

In order for an application to interact with a resource it must create a
**reference** to it. **A reference instantiation holds a set of functions to let the
application interact with the resource it reffers to.**
