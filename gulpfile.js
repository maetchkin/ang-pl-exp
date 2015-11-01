'use strict';

var pkg         = require('./package.json'),
    gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    Tail        = require('tail').Tail,
    debug       = require('./tasks/debug.js')(),
    path        = require('path');

gulp.task(
    'nginx',
    function(cb) {
        var exec       = require('child_process').exec,
            conf       = path.join(process.cwd(), "nginx.conf"),
            error_log  = path.join(process.cwd(), "error.log"),
            access_log = path.join(process.cwd(), "access.log"),
            child;
        debug('run nginx -c ' + conf);

        return;

        process.on('SIGINT', function() {
            exec('pkill -f nginx',
                function () {
                    console.log("\nNGINX STOPPED, BYE\n");
                    process.exit(0);
                }
            );
        });

        exec('pkill -f nginx',
            function(error, stdout, stderr){
                exec('nginx -c ' + conf,
                    function (error, stdout, stderr) {
                        if (stdout) {
                            debug('nginx stdout: ' + stdout);
                        }
                        if (stderr) {
                            debug('nginx stderr: ' + stderr);
                        }
                        if (error !== null) {
                            throw error;
                        }
                        gutil.log(gutil.colors.green.red("NGINX started on " /*+ profile.webserver.config.port*/ ));
                        var _keepalive  = setInterval(function() {}, 1000);

                        if(!gutil.env.d){
                            return;
                        }

                        var accessTail  = new Tail(access_log),
                            errorTail   = new Tail(error_log);

                        accessTail.on(
                            "line",
                            function(data) {
                                var values = data.split(" "),
                                    $status = values[0],
                                    $request_filename = values[1],
                                    $uri = values[2] || '';
                                //if($uri == '/index.html'){
                                    debug("\n____________________  DATA  ____________________");
                                //}
                                if($status >= 400 ){
                                    gutil.log(
                                        gutil.colors.bold.red("»"),
                                        gutil.colors.red($status, $uri),
                                        "\n"+ debugOffset + $request_filename
                                    );
                                } else {
                                    debug(
                                        gutil.colors['magenta']($status, $uri)
                                    );
                                }
                            }
                        );

                        errorTail.on(
                            "line",
                            function(data) {
                                gutil.log(
                                    gutil.colors.bold.red("» NGINX ERROR LOG:"),
                                    data
                                );
                            }
                        );
                    }
                );
            }
        );
        cb();
    }
);


gulp.task("default", ["nginx"/*"clean", "scriptsCore", "scriptsComplete"*/]);