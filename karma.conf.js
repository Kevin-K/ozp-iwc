// Karma configuration
// Generated on Tue Mar 24 2015 10:45:12 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [], // Overridden in Gruntfile.js


    // list of files to exclude
    exclude: [],

    proxies: {},
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        //'app/**/*.js': ['coverage']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'], // Add 'coverage' for karma-coverage output


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],
    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 100000,

    // to avoid DISCONNECTED messages
    browserDisconnectTimeout : 10000, // default 2000
    browserDisconnectTolerance : 3, // default 0
    browserNoActivityTimeout : 60000, //default 10000
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,     // If browser does not capture in given timeout [ms], kill it
  });
};
