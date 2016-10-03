---
layout: examples
title: Shared Functionality
category: basic
tag: 1.2.4
---

# Intents: Remote Functionality
Below is an application that takes in raw JSON as an input. And given the selected intent action chosen from the
dropdown menu, sends the input off to the remote application to be processed. If the remote application returns a
value, it is written to the "output" section of the application.

Without any intent applications opened, there are no intent actions to be called, open one of the pop up applications
from the list below the application.


Each intent handling application includes documentation in its GUI regarding the format of data it expects when handling
an intent invocation (the "input" section of the IWC Intent Tester below).

**Note:** While these examples are running on the same domain (codepen), they are not domain bound. You can have a
codepen snippet talk to a jsfiddle, plunkr, jsbin, ect. The benefit of the IWC here is minimal overhead for developers
in **cross domain communication**.

## IWC Intent Tester
<p data-height="500" data-theme-id="0" data-slug-hash="OMjzEr" data-default-tab="Result" data-user="Kevin-K" class='codepen'>


***

## Intent Handling Apps (opens in new window)
These applications register Intent handling functions to the IWC. Their handlers can found available in the dropdown
of the application above once the respected application is opened.
<div class="app-list">
    <a href="#"  onClick="openPopup('JGyMey','Simple Array Functions');return false;" >Simple Array Functions</a>
</div>

<script type="text/javascript">
    var openPopup = function(hash,title,height,width){
        if(!hash) {
            return;
        }
        title = title || '';
        height = height || 600;
        width = width || 500;
        var settings = "height=" + height + ", width=" + width;
        window.open('popupPen.html?title=' + title + '&hash='+hash, hash, settings);
    };
</script>

***

## IWC Intent Type formats
| API| /Type/Subtype| Expected invoke value format|
|-----|----------|------------|---|----------------------|
| Intents | /json/array| Array of valid JSON. |

### Intents API: /json/array
Intent handlers registered under the `/json/array` type/subtype expect the invocation to send an array as it's entity:

``` js
var value = [3, 1, "b", 0];
var arrRef = new iwc.intents.Reference("/json/array/sort");

arrRef.invoke(value).then(...);
```
