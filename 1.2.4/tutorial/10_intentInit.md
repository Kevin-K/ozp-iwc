---
layout: tutorial
title: Shared Functions Overview
category: intermediate
tag: 1.2.4
---
# Intents
In the **IWC**, an **intent** is a function of an application registered to
the **Intents API** to allow other applications to call.

# Sharing Functionality using the Intents API
Inspired by the Android operating system's concept of intents, the IWC's Intents
API is an API to allow applications to share **functionality** with one another.
While this can be done using the Data Api, the purpose of the Intents API is to
create simplistic function sharing through the IWC (as apposed to the Data API's
simplistic data sharing).

This tutorial gives an analogy-based example of the use of **intents**, the
following tutorial covers how to register **intents** and how to invoke
**intents**.

***

## How it works
Intents are a way for one application to call a function located in another. To
explain how this works consider the following analogy:

All computers in an office have the ability to print. Each computer, by checking
the office network, knows that it can print JSON documents to any of 3 printers.
When a user goes to print, one of three things happens:

  * The document starts printing at the user specified printer.
  * The user is prompted to pick a printer.
  * The print job fails and the user receives a notification of the failure.

Breaking down each section of the above scenerio, envision the **computer** to
be synonymous with an **IWC Client**, the physical connection of devices in the
office to be synonymous with an **IWC Bus** and the 3 **printers** to be
functions registered by some other **IWC Clients**. The functions are irrelevant
to this explanation, but imagine they are **functions in applications** that
will each print to a specific printer.

***

### Each computer, by checking the office network, knows that it can print JSON documents to any of 3 printers
In the IWC, intents use the following resource name hierarchy:

```
/{Type}/{Sub-type}/{Action}/{Handler}
```

| Path Name | Description                                                                        | Example               |
|-----------|------------------------------------------------------------------------------------|-----------------------|
| Type      | The overall type of this intent's expected data.                                   | application           |
| Sub-type  | The sub-type of the intent's expected data.                                        | json                  |
| Action    | A verb describing the functionality of this intent.                                | print                 |
| Handler   | A unique identifier of this intent. Give's the ability to uniquely call an intent. | com.ozp.exampleIntent |

The Intents API internally keeps track of availability of intent **handlers**,
this means if no handlers are available a request to call an intent **action**
will return to the calling client as an error.

***

### Can print JSON documents to any of 3 printers
Three printer registrations means three **unique Intents API resources** under
the specific data type. In the given scenario, the computer is trying to print a
JSON document, in the IWC we denote non-specific json data with a /type/subtype
of `/application/json`.

The action the computer is trying to preform is printing, the IWC does not have
a strict dictionary of actions. For the given scenario assume the internet
standard for the IWC action is `print`.

This means each printer must **register** its function under
`/application/json/print`. Syntax of registration is covered in a later tutorial,
but it should be noted that when registering a unique handler name isn't
required. If not given, a run-time unique ID will be set for the handler.

The 3 printers may have Intents API resource names as so:

```
/application/json/print/floor1.conferenceRoomA
/application/json/print/floor1.printerRoom
/application/json/print/floor2.printerRoom
```

_**Note**: the /type/subtype **defines the format the registered function
expects**. The IWC is a flexible framework that will thrive on community defined
data /type/subtypes/actions. Reference the
[Community Intent Book](https://github.com/ozone-development/ozp-iwc/wiki/Community-Intent-Book),
if the desired /type/subtype doesn't exit, open an
[issue](http://www.github.com/ozone-development/ozp-iwc/issues) with the data
type/subtype, proposed format, and a description._

***

### Situation 1: The document starts printing at the user specified printer.
When calling an intent, the callee can choose to supply the full handler path
`/applicaiton/json/print/floor1.conferenceRoomA` or just the action path
`/application/json/print`. If the handler path supplied, the IWC knows the
specific function on the specific application to call.

For example, calling intent resource: `/application/json/print/floor1.printerRoom`
will print the document to the first-floor printer room, but not the
second-floor printer room or first-floor conference room A.

The syntax for calling these intents follows in the next tutorial.

***

### Situation 2: The user is prompted to pick a printer.
As stated in situation 1, providing the full handler path is optional. If the
computer invokes the intent resource: `/application/json/print`, the Intents API
will compute that 3 printers are available and open a popup window informing
the user to select from the 3 printers where it would like to print.

***

### Situation 3: The print job fails and the user receives a notification of the failure.
IWC Intents, when handled, return notice/results to the caller. Should something
go wrong in the process, the call for the intent will be rejected.

***
