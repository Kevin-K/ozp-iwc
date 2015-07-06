module.exports = function(grunt) {
    /* jshint camelcase: false */
    var sampleDataBase={
        "path":"data-schemas/mock",
        options: {
            directory: false,
            index: "index.json"
        }
    };

    // Project configuration.
    var config = {
        pkg: grunt.file.readJSON('package.json'),

        src: {
            common: [
                'bower_components/es5-shim/es5-shim.js',
                'bower_components/es5-shim/es5-sham.js',
                'bower_components/es6-promise/promise.js',
                'app/js/common/**/*.js'
            ],
            metrics: [
                '<%= src.common %>',
                'app/js/metrics/statistics/sample.js',
                'app/js/metrics/statistics/binary_heap.js',
                'app/js/metrics/statistics/exponentiallyDecayingSample.js',
                'app/js/metrics/statistics/exponentiallyWeightedMovingAverage.js',
                'app/js/metrics/baseMetric.js',
                'app/js/metrics/types/*.js',
                'app/js/metrics/metricsRegistry.js'
            ],
            bus: [
                '<%= src.common %>',
                '<%= src.metrics %>',
                'app/js/bus/util/**/*.js',
                'app/js/bus/security/**/*.js',
                'app/js/bus/network/**/*.js',
                'app/js/bus/transport/participant.js',
                'app/js/bus/transport/internalParticipant.js',
                'app/js/bus/transport/router.js',
                'app/js/bus/transport/**/*.js',
                'app/js/bus/storage/**/*.js',
                'app/js/bus/api/commonApiValue.js',
                'app/js/bus/api/commonApiCollectionValue.js',
                'app/js/bus/api/*.js',
                'app/js/bus/api/**/*.js',
                'app/js/bus/*/**/*.js',
                'app/js/services/*.js',
                'app/js/services/node/**/*.js',
                'app/js/services/api/**/*.js',
                'app/js/defaultWiring.js'
            ],
            client: [
                '<%= src.common %>',
                'app/js/client/**/*.js'
            ],
            testLib: [
                'test/karma/**/*.js',
                'test/lib/**/*.js',
                'test/mockParticipant/**/*.js'
            ],
            testUnit: [
                'test/tests/unit/mockObject.js',
                'test/tests/unit/**/*.js'
            ],
            testIntegrationClient: [
                'test/tests/client-integration/**/*.js'
            ],
            testIntegrationBus: [
                'test/tests/bus-integration/**/*.js'
            ],
            test: [
                '<%= src.testUnit %>',
                '<%= src.testIntegrationClient %>'
            ],
            debugger: [
                '<%= src.bus %>',
                'bower_components/bootstrap/dist/boostrap.js',
                'bower_components/jquery/dist/jquery.js',
                'bower_components/angular/angular.js',
                'bower_components/vis/dist/vis.js',
                'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                'bower_components/angular-ui-router/release/angular-ui-router.js',
                'bower_components/angular-ui-grid/ui-grid.js',
                'app/js/debugger/debugger.js',
                'app/js/debugger/**/*.js'
            ],
            debuggerCss: [
                'bower_components/bootstrap/dist/css/bootstrap.css',
                'bower_components/angular-ui-grid/ui-grid.css',
                'bower_components/vis/dist/vis.css',
                'app/css/debugger/**/*.css'
            ],
            all: [
                '<%= src.metrics %>',
                '<%= src.bus %>',
                '<%= src.client %>',
                '<%= src.debugger %>'
            ]
        },
        output: {
            busJs: 'dist/js/<%= pkg.name %>-bus.js',
            clientJs: 'dist/js/<%= pkg.name %>-client.js',
            metricsJs: 'dist/js/<%= pkg.name %>-metrics.js',
            debuggerJs: 'dist/js/debugger.js',
            debuggerCss: 'dist/css/debugger.css',

            busJsMin: 'dist/js/<%= pkg.name %>-bus.min.js',
            clientJsMin: 'dist/js/<%= pkg.name %>-client.min.js',
            metricsJsMin: 'dist/js/<%= pkg.name %>-metrics.min.js',
            debuggerJsMin: 'dist/js/debugger.min.js',
            allJs: ['<%=output.busJs %>', '<%=output.clientJs %>', '<%=output.metricsJs %>'],
            allJsMin: ['<%=output.busJsMin %>', '<%=output.clientJsMin %>', '<%=output.metricsJsMin %>'],
            testUnit: [
                '<%= output.busJsMin %>',
                '<%= output.clientJsMin %>',
                '<%= src.testLib %>',
                '<%= src.testUnit %>'
            ],
            testIntegrationClient: [
                '<%= output.busJsMin %>',
                '<%= output.clientJsMin %>',
                '<%= src.testLib %>',
                '<%= src.testIntegrationClient %>'
            ],
            testIntegrationBus: [
                '<%= output.busJs %>',
                '<%= src.testLib %>',
                '<%= src.testIntegrationBus %>'
            ]
        },
        concat_sourcemap: {
            options: {
                sourcesContent: true
            },
            bus: {
                src: '<%= src.bus %>',
                dest: '<%= output.busJs %>'
            },
            client: {
                src: '<%= src.client %>',
                dest: '<%= output.clientJs %>'
            },
            metrics: {
                src: '<%= src.metrics %>',
                dest: '<%= output.metricsJs %>'
            },
            debugger: {
                src: '<%= src.debugger %>',
                dest: '<%= output.debuggerJs %>'
            },
            debuggerCss: {
                src: '<%= src.debuggerCss %>',
                dest: '<%= output.debuggerCss %>'
            }
        },
        uglify: {
            options: {
                sourceMap:true,
                sourceMapIncludeSources: true,
                sourceMapIn: function(m) { return m+".map";}
            },
            bus: {
                src: '<%= concat_sourcemap.bus.dest %>',
                dest: '<%= output.busJsMin %>'
            },
            client: {
                src: '<%= concat_sourcemap.client.dest %>',
                dest: '<%= output.clientJsMin %>'
            },
            metrics: {
                src: '<%= concat_sourcemap.metrics.dest %>',
                dest: '<%= output.metricsJsMin %>'
            },
            debugger: {
                src: '<%= concat_sourcemap.debugger.dest %>',
                dest: '<%= output.debuggerJsMin %>'
            }
        },

        // Copies minified and non-minified js into dist directory
        copy: {
            dist: {
                files: [
                    {
                        src: ['*.html'],
                        dest: './dist/',
                        cwd: 'app',
                        expand: true,
                        nonull:true
                    },{
                        src: ['**/*'],
                        dest: './dist/js/app/js',
                        cwd: 'app/js',
                        expand: true,
                        nonull:true
                    },{
                        src: ['*'],
                        dest: './dist/fonts',
                        cwd: 'bower_components/bootstrap/dist/fonts',
                        expand: true,
                        nonull:true
                    },
                    {
                        src: ['*.eot','*.svg','*.ttf','*.woff'],
                        dest: './dist/css',
                        cwd: 'bower_components/angular-ui-grid',
                        expand: true,
                        nonull:true
                    },
                    {
                        src: ['**/*.tpl.html'],
                        dest: './dist/templates',
                        cwd: 'app/js/debugger',
                        expand: true,
                        flatten: true,
                        nonull:true
                    },{
                        src: ['**/*.json'],
                        dest: './dist/data',
                        cwd: 'app/js/debugger',
                        expand: true,
                        flatten: true,
                        nonull:true
                    },{
                        src: ['**'],
                        dest: './dist/hal-browser',
                        cwd: 'bower_components/hal-browser',
                        expand: true,
                        nonull:true
                    },{
                        src: ['favicon.ico'],
                        dest: './dist/',
                        cwd: 'app/js/debugger',
                        expand: true,
                        nonull:true
                    }
                ]
            },
            // concat_sourcemap on the boostrap.css wants to see the less files
            // munge the source a bit to give it what it wants
            hackBootstrap: {
                files: [
                    {
                        src: ['**/*'],
                        dest: 'bower_components/bootstrap/dist/css/less',
                        cwd: 'bower_components/bootstrap/less',
                        expand: true,
                        nonull:true
                    }
                ]
            }
        },
        clean: {
            dist: ['./dist/']
        },
        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                url: '<%= pkg.homepage %>',
                options: {
                    paths: [
                        'app/js/'
                    ],
//                    themedir: 'path/to/custom/theme/',
                    outdir: 'dist/doc'
                }
            }
        },
        watch: {
            concatFiles: {
                files: ['Gruntfile.js', '<%= src.all %>','app/**/*'],
                tasks: ['jshint','concat_sourcemap', 'copy:dist'],
                options: {
                    interrupt: true,
                    spawn: false
                }

            },
            test: {
                files: ['Gruntfile.js', 'dist/**/*', '<%= src.test %>'],
                options: {
                    livereload: true,
                    spawn: false
                }
            }
        },
        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= src.all %>',
                '!bower_components/**/*'
            ],
            test: {
                src: ['<%= src.test %>']
            }
        },
        connect: {
            app: {
                options: {
                    port: 13000,
                    base: [sampleDataBase,'dist']
                }
            },
            tests: {
                options: {port: 14000, base: ["dist", "test",sampleDataBase, 'node_modules/jasmine-core/lib']}
            },
            mockParticipant: {
                options: {port: 14001, base: ["dist","test/mockParticipant"]}
            },
            testBus: {
                options:{ port: 14002, base: ['dist',sampleDataBase] }
            },
            demo1: {
                options: { port: 15000, base: ["dist","demo/bouncingBalls"] }
            },
            demo2: {
                options: { port: 15001, base: ["dist","demo/bouncingBalls"] }
            },
            demo3: {
                options: { port: 15002, base: ["dist","demo/bouncingBalls"] }
            },
            demo4: {
                options: { port: 15003, base: ["dist","demo/bouncingBalls"] }
            },
            gridsterDemo: {
                options: { port: 15004, base: ["dist","demo/gridster"] }
            },
            intentsDemo: {
                options:{	port: 15006, base: ["dist","demo/intentDemo","test/tests/unit"]}
            },
            performanceTester: {
                options:{	port: 15007, base: ["dist","demo/performanceTester"]}
            }
        },
        dist: {

        },
        bump: {
            options: {
                files: [
                    'package.json',
                    'bower.json'
                ],
                commit: false,
                createTag: false,
                push: false
            }
        },
        shell: {
            buildVersionFile: {
                command: [
                    'echo "Version: <%= pkg.version %>" > dist/version.txt',
                    'echo "Git hash: " >> dist/version.txt',
                    'git rev-parse HEAD >> dist/version.txt',
                    'echo Date: >> dist/version.txt',
                    'git rev-parse HEAD | xargs git show -s --format=%ci >> dist/version.txt'
                ].join('&&')
            },
            releaseGit: {
                command: [
                    'git add bower.json package.json',
                    'git commit -m "chore(release): <%= pkg.version %>"',
                    'git push origin master',
                    'git checkout --detach',
                    'grunt dist',
                    'git add -f dist',
                    'git commit -m "chore(release): <%= pkg.version %>"',
                    'git tag -a "<%= pkg.version %>" -m "chore(release): <%= pkg.version %>"',
                    'git push origin <% pkg.version %> --tags',
                    'git checkout master'
                ].join('&&')
            },
            tarDate: {
                command: [
                    './packageRelease.sh iwc-prod dist'
                ].join('&&')
            },
            tarVersion: {
                command: [
                    './packageRelease.sh iwc-prod dist <%= pkg.version %>'
                ].join('&&')
            }
        },
        karma: {
            options:{
                configFile: 'karma.conf.js',
                browsers: ['Firefox']
            },
            unit: {
                files: {
                    src: ['<%= output.testUnit %>']
                }
            },
            integrationClient: {
                files: {
                    src: ['<%= output.testIntegrationClient %>']
                }
            },
            integrationBus: {
                files: {
                    src: ['<%= output.testIntegrationBus %>']
                },
                proxies: {
                    '/js/ozpIwc-bus.js': '/base/dist/js/ozpIwc-bus.js'
                }
            }
        }

    };

    // load all grunt tasks matching the `grunt-*` pattern
    require('load-grunt-tasks')(grunt);

    grunt.initConfig(config);

    grunt.registerTask('readpkg', 'Read in the package.json file', function() {

        grunt.config.set('pkg', grunt.file.readJSON('./package.json'));

    });
    // Default task(s).
    grunt.registerTask('build', "Concat and minify the source code into dist",
        ['copy:hackBootstrap', 'jshint', 'concat_sourcemap', 
            'uglify', 'copy:dist','shell:buildVersionFile']
    );

    grunt.registerTask('karmaTests', "Runs the unit and integration tests.",
        ['build','karma:unit','connect:testBus','connect:mockParticipant', 'karma:integrationClient', 'karma:integrationBus']
    );
    grunt.registerTask('travis', "Build, Runs the unit tests, and create Docs",['build','karma:unit', 'yuidoc']);

    grunt.registerTask('dist', "Builds and tests the full distribution",
        ['build','karmaTests','yuidoc']
    );
    grunt.registerTask('connect-tests', "Runs the tests locally for in-browser testing",
        ['build','connect:tests','connect:testBus','connect:mockParticipant', 'watch']
    );
    grunt.registerTask('connect-all', "Runs tests and demos locally",
        ['build','connect','watch']
    );
    grunt.registerTask('releasePatch', ['bump:patch','readpkg','shell:releaseGit']);
    grunt.registerTask('releaseMinor', ['bump:minor','readpkg', 'shell:releaseGit']);
    grunt.registerTask('releaseMajor', ['bump:major','readpkg', 'shell:releaseGit']);
    grunt.registerTask('default', ['dist']);

};
