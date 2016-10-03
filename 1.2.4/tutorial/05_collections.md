---
layout: tutorial
title:  Collections (Resource Groupings)
category: intermediate
tag: 1.2.4
---

# Collections of Resources
In the last tutorial, [Resource Structure](04_structure.html), the concept of
abstracting resource data  and its benefits were conveyed. The IWC collection
actions utilize the naming structure of IWC resources to open up multi-resource
based actions.

A **Collection** in the IWC is a group of resources that relate to some parent
resource. Resources are related to the parent **if they are pathed below the
parent**.

As an example, the following resources exist in a hypothetical IWC Bus's Data API:

```
/shoppingCart
/shoppingCart/bestBuy
/shoppingCart/bestBuy/123456789
/shoppingCart/bestBuy/685814652
/shoppingCart/amazon
/shoppingCart/amazon/6546548885
```

The collection that relates to `/shoppingCart` is:

```
/shoppingCart/bestBuy
/shoppingCart/bestBuy/123456789
/shoppingCart/bestBuy/685814652
/shoppingCart/amazon
/shoppingCart/amazon/6546548885
```

The collection that relates to `/shoppingCart/bestBuy` is:

```
/shoppingCart/bestBuy/123456789
/shoppingCart/bestBuy/685814652
```

***

## Collection Actions
The IWC has one main collection-based action, **list**. Additionally the
**watch** action demonstrated earlier in these tutorials has advanced
capabilities to watch for changes in collection.

***

## List
Calling the list action of a **reference** gathers a list of all the resources
that pertain to a resource. The gathered list is **an array of the resource
paths, not their values**. In order to promote reference-linking, the resource
paths that are retrieved can be used to generate references.

#### Parameters
The list action takes no parameters.

#### Returns
A promise that **resolves** with the **an array of the resource
paths that make up the resource's collection** , or
**rejects** with the reason (string) for failure.

 <p data-height="300" data-theme-id="0" data-slug-hash="TODO" data-default-tab="js" data-user="Kevin-K" class='codepen'>

***

## Watch (with a configured reference)
If a reference is configured to enable collecting, its watch
callbacks can receive notification for its resource if a resource was added to
(generated) or removed from (deleted) its collection.

## Reference Configuration
The tutorials up until now have been using non-configured references, in
most use-cases references will not have to be configured. A **reference
configuration** is a setting applied to the reference that alters its behavior.
This concept is covered in more detail in the [Reference Configuration](about:blank) section
of the advanced tutorials.

## Reference Configuration for Watched Collections
In order to receive change notifications about a resource's collection, a
reference must be configured, this is done in one of two ways:

### 1) Configuring the Reference on Creation
```js
var fooRef = new iwc.data.Reference("/shoppingCart",{collect:true});
```

### 2) Updating the Reference Settings
```js
fooRef.updateDefaults({collect: true});
```

In both approaches, the `collect` flag of the reference is updated to true. This
has to be done functionally to update the reference internal functionality.

### If a Mixture of both Watch Behaviors is Desired in a Given Application for a Resource

Simply create two separate references:

```js
var fooRef = new iwc.data.Reference("/shoppingCart");
var fooCollectRef = iwc.data.Reference("/shoppingCart",{collect:true});

// Notified of value changes of /shoppingCart
fooRef.watch(onChange);

// Notified of collection and value changes of /shoppingCart
fooCollectRef.watch(diferentOnChange);
```
