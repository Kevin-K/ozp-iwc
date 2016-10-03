---
layout: tutorial
title: Registering an Intent (Shared Function)
category: intermediate
tag: 1.2.4
---

# Registering an Intent on the Intents API
Registering an intent handler means to share some functionality of an
application with other applications.

Before registering a handler, refer to the following frequently asked questions:

## What is the /type/sub-type of my expected data?
The /type/sub-type of an intent handler specifies the required data schema of
your intent. When defining an intent handler, if public utilization of your
application is desired, utilize a community-driven /type/sub-type path.

If your intent use is private to your applications, utilize
`/application/{uniqueName}`, where `{uniqueName}` is some dot-separated
unique name for your private use (ex. `com.ozp.myApps`).

Documentation on public /type/sub-type paths are developed based on community
support. As the IWC is in its infant years of use, if you can't find
documentation on your desired data type, it is very well possible you are the
first to use it. Open an
[issue](http://www.github.com/ozone-development/ozp-iwc/issues) with the data
type/subtype, proposed schema, and a description. The IWC
[Community Intent Book](https://github.com/ozone-development/ozp-iwc/wiki/Community-Intent-Book)
is a community driven set of data type documents used as a centralized resource
for developers.

## What is the Action this Function Handles?
The action is the verb of the handler, it should be a single word describing
what the intent handler does (print, graph, map, ect). As stated above, check
the [Community Intent Book](https://github.com/ozone-development/ozp-iwc/wiki/Community-Intent-Book)
for community-driven formatting and actions.

## What if the /type/sub-type/action I want to use is already in the Community Intent Book?
**This is ideal!** If your desired /type/sub-type/action exists in the
[Community Intent Book](https://github.com/ozone-development/ozp-iwc/wiki/Community-Intent-Book),
this does not mean your application isn't desired. This means the functionality
you would like to produce has been developed by others. If their functionality
doesn't meet your needs or you would like your own version, as long as you
maintain the defined data schema, then developers and users can use your
application interchangeably.

**Don't agree with a defined format?** If you have supporting reason to modify
the schema open an [issue](http://www.github.com/ozone-development/ozp-iwc/issues)
and address the creator of the format. If there is enough community support
it will be considered for  modification. This will push the new data type to a
versioned name (ex. `/json/location/` would become `/json/location;version=2`).

***

## Accessing Intents Api Resources
To register a function, a reference to the **Intents Api**  resource from the
client is needed. This follows the same format as the **Data Api**, the
`intents` reference can come from the same client object as `data` references.

``` js
var iwc = new ozpIwc.Client("http://ozone-development.github.io/ozp-iwc");
var functionRef = iwc.intents.Reference("/application/json/print");
```
***

## Register: sharing a function

####Parameters

| parameter | type   | description |
|-----------|--------|---------------------------------------------------------|
| metaData   | Object | An object of informative data pertaining to the shared function. |
| metaData.icon  | String | A URL path to an Icon to use as metadata for the intent. |
| metaData.label| Object | A Title unique to the registered application.             |
| callback  | Function| The function to call with the type/sub-type matching data.

####Returns
A promise that resolves with no value if registration is successful, **rejects**
with the reason (string) if fails to register.



####Callback
The callback receives 2 parameters:

| property | type   | description                                              |
|----------|--------|----------------------------------------------------------|
| reply    | Primitive or Array | The value of the intent invocation to be handled.|
| done     | Function |  A function to call to stop handling intent requests. Useful for conditionally stopping intent handling.|


**The return value of the callback is returned to the intent invoker.** This
means when developing an application, if there is some complex computation an
application can share that other applications can utilize (complex sorting for
example), returning the result value in the handler function means other
applications receive the output and can leverage the shared functionality.

<p data-height="420" data-theme-id="0" data-slug-hash="eJERYj" data-default-tab="js" data-user="Kevin-K" class='codepen'>

***

## Invoking: calling an intent function
Invoking an intent function across the IWC is done with the `invoke` action on
a reference to the intent action (/json/all/prettyPrint) or the handler
(/json/all/prettyPrint/io.codepen.kevin-k). It is covered in its own
[tutorial](12_intentInvoking.html). For purpose of seeing the above code
snippet work, click the button on the example below.

<p data-height="300" data-theme-id="0" data-slug-hash="wMqeKd" data-default-tab="result" data-user="Kevin-K" class='codepen'>
