'use strict';

var pkg         = require('./package.json'),
    gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    Tail        = require('tail').Tail,
    debug       = require('./tasks/debug.js')(),
    del         = require('del'),
    path        = require('path');



gulp.task(
    'clean',
    function(cb) {
        del.sync([
            path.join(process.cwd(), "dist")+'/**',
            path.join(process.cwd(), "dist")
        ]);
        return cb();
    }
);

gulp.task(
    'src',
    ['clean'],
    function(cb) {
        return gulp
            .src(["**/angularplasmid.complete.min.js"], {base: path.join(process.cwd(),"node_modules")})
            .pipe(
                gulp.dest(
                    path.join(process.cwd(), "dist/app/static")
                )
            );
    }
);
gulp.task(
    'build',
    ['src'],
    function(cb) {
        return gulp
            .src("**", {base: path.join(process.cwd(),"app/src")})
            .pipe(
                gulp.dest(
                    path.join(process.cwd(), "dist/app")
                )
            );
    }
);

gulp.task(
    'nginx-conf',
    ['build'],
    function(cb) {
        debug("Create nginx config");
        require("./tasks/server-nginx.js")(pkg.nginx);
        cb();
    }
);

gulp.task(
    'nginx', ['nginx-conf'],
    function(cb) {
        var exec       = require('child_process').exec,
            conf       = path.join(process.cwd(), pkg.nginx.dst),
            error_log  = path.join(process.cwd(), pkg.nginx.config.errorlog),
            access_log = path.join(process.cwd(), pkg.nginx.config.accesslog),
            child;

        debug('run nginx -c ' + conf);


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
                        gutil.log(gutil.colors.green("NGINX started on " + pkg.nginx.config.host + ":" + pkg.nginx.config.port ));
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
                                        "\n"+ "    " + $request_filename
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


gulp.task("default", ["build", "nginx"/*"clean", "scriptsCore", "scriptsComplete"*/]);