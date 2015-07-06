[ozp-iwc](http://ozone-development.github.io/ozp-iwc/) [![Build Status](https://travis-ci.org/ozone-development/ozp-iwc.svg?branch=master)](https://travis-ci.org/ozone-development/ozp-iwc)
==============================

ozp-iwc provides an in-browser communications network between participants in multiple browser tabs, 
iframes, or workers using HTML5 standard features.  These participants, which can be from different origins,
can use the client API to send messages to any other participant on the network.

To Build
--------------
1.  Install node.js.
2.  sudo npm install -g grunt-cli
3.  git clone git@github.com:ozone-development/ozp-iwc.git
4.  cd ozp-iwc
5.  git submodule init
6.  git submodule update
7.  npm install
8.  npm install -g bower
9.  bower install
10. grunt connect-all
11. Browse to http://localhost:14000 for an index of samples and tests!

Demo
---------------
Various example widgets using the ozp-iwc can be found at:
http://ozone-development.github.io/ozp-demo/
