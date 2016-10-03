---
layout: tutorial
title: Location Analyzer
category: advanced
tag: 1.2.4
---

To understand this tutorial, understanding how to create & connect an IWC client
is necessary, as well as an understanding of the Data & Intents API. Advanced
references are used in this application to aid in references that collect.

**This application/tutorial is used to complement the Location Lister**. A majority of
terms in this tutorial are defined in the
[Location Lister](30_locationLister.html) tutorial. Refer to that tutorial prior
to this one.

**This tutorial does not cover the framework used to create the application
(AngularJS) nor the styling applied (Bootstrap). The purpose is to show the
connectivity of IWC to the applications components. The code has been
generalized, the actual angular application can be found [here](https://github.com/ozone-development/ozp-demo/tree/master/app/locationAnalyzer)**

***
#Location Analyzer
![The Location Analyzer Application](assets/locationAnalyzer.png)

The Location Analyzer is one of the example apps hosted on the [homepage]({{site.baseurl}}/)
of the IWC website.


This application performs the following tasks:

* Analyzes GPS coordinates from user input
* Analyzers GPS coordinates received through its IWC intent registration.
* Invokes an IWC intent to save the current coordinate inputs

The `Intent` class defined in Location Lister is reused in this application.
***

# Analyzing Inbound Intent Data
```js
//=======================================
// Analyze Shared Functionality
//
// IWC References:
// API: Intents
// Resource: /json/coord/analyze
//=======================================
var analyze = new Intent("/json/coord/analyze");
var lat,long;

var metaData = {
  icon: "http://some.website.io/iconPath.png",
  label: "Location Analyzer"
};

var analyzeFn = function(coord) {
  // This intent is expected to receive a JSON Object to prefill its add location modal.
  if (coord && (typeof coord.lat !== "undefined") &&
    (typeof coord.long !== "undefined") &&
    -90 <= coord.lat <= 90 && -180 <= coord.lat <= 180) {

    lat = coord.lat;
    long = coord.long;
  } else {      
    $.notify({message: "Invalid format received"},{type: 'danger' });
  }

};

analyze.register(metaData, analyzeFn);
```

The `/json/coord/analyze` intent registers to receive data in the following format:

```js
{
    lat: /* number in the range of [-90,90] */,
    long: /* number in the range of [-180,180] */
}
```

The intent registered function, `analyzeFn` does not return a value, therefore the invoker will receive `undefined` as the result of its `invoke` call. The application takes the `lat` and `long` data and computes the updated data for the UI.

If invalid data is received, the Location Analyzer uses a 3rd party tool
(bootstrap-notify) to throw an alert on the screen for the user.

***

# Saving Coordinates
## UI
![The Location Analyzer Save Success](assets/locationAnalyzerSave.png)
Like in Location Lister, this application uses the `Intent` class to encapsulate
tracking if intent function handlers are open. The `Save` button is enabled
when the `save.handlers.length` is greater than 0.

```js
var save = new Intent("/json/coord/save");
var saveEnabled = save.handlers.length > 0;
```
## Response
![The Location Analyzer Save Success](assets/locationAnalyzerResponse.png)

```js
//=========================================
// Save Functionality
//=========================================
var save = new Intent("/json/coord/save");

// The Location Lister expects the location data in the formatted structure.
 invokeSave = function() {
  var formatted = {
    title: "Saved from LocationAnalyzer",
    coords: {
      lat: $scope.lat,
      long: $scope.long
    }
  };

  // Run the save functionality on the Intent handler
  // Gather the new resource when successful and make a UI notification
  save.run(formatted).then(function(value) {
    var locationRef = new iwc.data.Reference(value.resource);
    locationRef.get().then(function(value) {
      $.notify({ message: "Location saved as: " + value.title  });
    });
  }).catch(function(er) {
    console.error(er);
  });
};
```
The save intent call as explained in Location Lister, receives reference
of the new Location resource created to the Data Api.

This allows the Location Analyzer to gather said resource, and notify the user
of the title of the new location.
