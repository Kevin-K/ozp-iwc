var client = new ozpIwc.Client({peerUrl: "//aml-development.github.io/ozp-iwc"});

var listings = {
    '/locationLister/listings/chicago': {
        title: "Chicago, IL",
        coords: {
            lat: 41.834,
            long: -87.872
        },
        description: "The windy city."
    },
    '/locationLister/listings/houston': {
        title: "Houston, TX",
        coords: {
            lat: 29.817,
            long: -95.68
        },
        description: "The City With No Limits."
    },
    '/locationLister/listings/paloAlto': {
        title: "Palo Alto, CA",
        coords: {
            lat: 37.426,
            long: -122.170
        },
        description: "It's in California."
    }
};

// ensure that when watching /locationLister/listings in any application connected to the bus, the watcher gets
// notifications of additions to the /locationLister/listings/ path.
client.data().set("/locationLister/listings", {pattern: "/locationLister/listings/"});
for(var i in listings){
    client.data().set(i,{entity: listings[i]});
}
