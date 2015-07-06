var ozpIwc = ozpIwc || {};

ozpIwc.apiMap = {
    "data.api" : { 'address': 'data.api',
        'actions': ["get","set","delete","watch","unwatch","list","bulkGet","addChild","removeChild"]
    },
    "intents.api" : { 'address': 'intents.api',
        'actions': ["get","set","delete","watch","unwatch","list","bulkGet","register","invoke","broadcast"]
    },
    "names.api" : { 'address': 'names.api',
        'actions': ["get","set","delete","watch","unwatch","list","bulkGet"]
    },
    "system.api" : { 'address': 'system.api',
        'actions': ["get","set","delete","watch","unwatch","list","bulkGet","launch"]
    },
    "locks.api" : { 'address' : 'locks.api',
        'actions': ["get","watch","unwatch","list","lock","unlock"]
    }
};