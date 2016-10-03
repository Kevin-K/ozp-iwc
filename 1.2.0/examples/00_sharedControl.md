---
layout: old_examples
title: Shared Control
permalink: "1.2.0/examples/index.html"
category: basic
tag: 1.2.0
---

# Shared Control
Below is an application that generates balls on a canvas. Alone, it is just
drawing the ball's current position to the screen. By sharing the ball's state
through the Data API, other applications can manipulate ball positions.

**Note:** While these examples are running on the same domain (codepen), they
are not domain bound. You can have a codepen snippet talk to a jsfiddle, plunkr,
jsbin, ect. The benefit of the IWC here is minimal overhead for developers
in **cross domain communication**.

## Ball Viewer
<p data-height="500" data-theme-id="0" data-slug-hash="wMqPLj" data-default-tab="Result" data-user="Kevin-K" class='codepen'>


***

## Ball Apps (opens in new window)
These applications set resources to the IWC to create & modify balls on the Ball Viewer above.
<div class="app-list">
    <a href="#"  onClick="openPopup('gPxowz','Stationary Ball');return false;" >Stationary Ball</a>
    <a href="#"  onClick="openPopup('obepBW','Sequenced Ball');return false;" >Sequenced Ball</a>
    <a href="#"  onClick="openPopup('gPxomK','User Controlled');return false;" >User Controlled Ball</a>
    <a href="#"  onClick="openPopup('XXaVad','Shaker');return false;" >Manipulator: Shake a ball</a>
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

## IWC Resources Used by Ball Viewer
| API | Resource | Action | Reason| Resource Value Sample |
|-----|----------|------------|---|----------------------|
| Data| /github/example/balls| Watch | Listen for ball collection|  n/a |
| Data| /github/example/balls/{ballId}| Watch | Listen for individual ball updates|  ``` { x: 50, y: 50, radius: 20, color: "#FF0000" } ``` |

### Data Api: /github/example/balls
A resource for applications to watch for addition/deletion of ball resources. This information is in the resources
[collection](../tutorial/05_collections.html).


### Data Api: /github/examples/balls/{ballId}
Shared data on a ball drawn to the example below. Any IWC application can manipulate the state of the ball and update
its position on the screen.  The format of the **value** of the ball is as so:

``` js
{
   x: 12, // Number between 0-100
   y: 50, // Number between 0-100
   radius: 20, // Number between 0-50. Relative to the width of the canvas
   color: "#F0F0F0" // String hex value to set the balls color
}
```
