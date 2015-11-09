'use strict';

var pkg         = require('./package.json'),
    gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    Tail        = require('tail').Tail,
    debug       = require('./tasks/debug.js')(),
    del         = require('del'),
    path        = require('path'),
    archy       = require('gulp-archy'),
    rename      = require('gulp-rename'),
    server      = require('gulp-express'),
    archyDebug = function(label){
        return archy(
            {
                prefix: '    ',
                callback: function(tree){
                    debug(
                        gutil.colors.magenta(
                            gutil.colors.yellow((label || '--label--')) + "\n" +
                            tree.split('\n').slice(1).join('\n')
                        )
                    )
                }
            }
        );
    };



gulp.task(
    'clean',
    function(cb) {
        del.sync([
            path.join(process.cwd(), "dist/app")+'/**',
            path.join(process.cwd(), "dist/app")
        ]);
        return cb();
    }
);

gulp.task(
    'src',
    ['clean'],
    function(cb) {

        return gulp
            .src(
                [
                    path.join(process.cwd(),"node_modules/less/dist/less.js"),
                    path.join(process.cwd(),"node_modules/angular/angular.js"),
                    path.join(process.cwd(),"node_modules/angularplasmid/src/js/declare.js"),
                    path.join(process.cwd(),"node_modules/angularplasmid/src/js/services.js"),
                    path.join(process.cwd(),"node_modules/angularplasmid/src/js/directives.js"),
                    path.join(process.cwd(),"node_modules/bootstrap/dist/css/bootstrap.css"),
                    path.join(process.cwd(),"node_modules/bootstrap/dist/css/bootstrap.css.map"),
                    //path.join(process.cwd(),"node_modules/angularplasmid/src/js/init.js"),
                ]
            )
            .pipe(
                rename(
                    function(src){
                        src.dirname = src.dirname.replace('node_modules/','');
                    }
                )
            )
            .pipe(archyDebug('src'))
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
            .src([path.join(process.cwd(), "app/**/*.{js,html,css,json,less,map}")])

            .pipe(
                rename(
                    function(src){
                        src.dirname = src.dirname.replace('src/','').replace('src','');
                    }
                )
            )

            .pipe(archyDebug('build'))

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
    'dna-report',
    function(cb) {
        debug("dna-report");
        server.run(
            [path.join(process.cwd(), pkg.dna.server)],
            {cwd: process.cwd(), livereload: false}
        );
        cb();
    }
);

gulp.task(
    'nginx',
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

gulp.task(
    'watch',
    function(cb) {
        gulp
            .watch(['app/**/*'])
            .on(
                'change',
                function(event) {
                    return gulp.start('build');
                }
            );
        return cb();
    }
);

gulp.task('run',        ['watch', 'dna-report', 'nginx']);
gulp.task('default',    ['build', 'nginx-conf']);