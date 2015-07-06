var jasminePromises = {
    
    
};
jasminePromises.promises=function(fn) {
  return function(done) {
        fn().then(
            function() {
                done();
            },
            function(error) {
                expect(error).toNotHappen();
                done();
            }
        );
    };
};

function pit(desc,fn) {
    return it(desc,jasminePromises.promises(fn));
}

function pBeforeEach(desc,fn) {
    return beforeEach(desc,jasminePromises.promises(fn));
}

function pAfterEach(desc,fn) {
    return afterEach(desc,jasminePromises.promises(fn));
}

function pauseForPromiseResolution() {
    var pause=50;
    return new Promise(function(resolve) {
        window.setTimeout(function() {
            resolve();
        },pause);
        try {
            jasmine.clock().tick(pause);
        } catch(e) {
            // Ignore it.  Just means that the clock probably isn't installed
        }
    });
};