---
layout: tutorial
title: Basic Data Watching
category: basic
tag: 1.2.4
---
# Leveraging the Watch Action
As explained in the [Using Resources](01_quickStart.html) tutorial, the `watch`
action will notify a reference when the value of its resource changes.
This allows developers to implement cross-domain responsiveness.

The watch action is not limited to only the Data Api, but for most development
watch actions pertain to this Api.

***

## Watch:

Watch actions vary slightly from the actions explained in the [Basic Data Sharing](02_dataApi.html) tutorial, as we
now have to introduce a callback function into the signature:

#### Parameters

| parameter          | type     | description                                  |
|--------------------|----------|----------------------------------------------|
| callback           | Function | The callback function to be called when the given reference's resource changes.                                                                                  
### Returns
A promise that resolves on the acknowledgement of the request. If the resource
exists, the value of the resource is passed to the promise resolution.

This promise function is **not called on resource value change**. The callback
parameter is called on resource change. The purpose for the promise resolution
is to allow a watcher to obtain immediate state of a resource when watching
without an additional request.

### Callback
The callback function passed to the watch action has 2 parameters:

| parameter          | type     | description                                  |  
|--------------------|----------|----------------------------------------------|
| changes             | Object   | The changes of the resource that triggered this callback|
| changes.newValue    | Primative or Array| The new value of the resource.|
| changes.oldValue    | Primative or Array| The old value of the resource.|
| changes.deleted     | Boolean | A boolean flag notifying if the resource was deleted.|
| done                | Function| A function to call if the callback is to be unregistered.|

<p data-height="350" data-theme-id="0" data-slug-hash="ZQydmd" data-default-tab="js" data-user="Kevin-K" class='codepen'></p>

The watch has additional configurations that can pass additional values to the
callback's `changes` object. For basic use of the IWC they are not needed,
they are covered in a later advanced tutorial.

***

### Example
Below is a simple watch example where the callback's response and the promise resolution's response are written to the screen.

Take note that the `count` value written out above the increment/decrement buttons is done in response to the
data acquired from the callback/promise resolution response and is never written locally except for declaring the
count to 0 if it is undefined.
<p data-height="450" data-theme-id="0" data-slug-hash="eJEYvx" data-default-tab="result" data-user="Kevin-K" class='codepen'>

***

### Advanced Watch information
While more tutorials will be added,check out the
[watch action documentation in our gitbook]({{site.baseurl}}/{{page.tag}}/gitbook/client/apis/common/watch.html).
