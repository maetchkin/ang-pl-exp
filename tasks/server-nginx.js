'use strict';

var pkg     = require('../package.json'),
    fs      = require('fs'),
    path    = require('path'),
    gutil   = require('gulp-util'),
    mkdirp  = require('mkdirp'),
    debug   = require('./debug.js')(gutil.env.d);

module.exports = function(data){
    var srcConf = path.join(data.src, "webservers", 'nginx.conf'),
        dstConf = path.join(data.dst, "webservers", 'nginx.conf'),
        tpl     = gutil.template(fs.readFileSync(srcConf, {encoding: 'utf8'})),
        opt     = data.config,
        res;
    opt.file    = { path: srcConf };
    opt.dst     = data.dst;
    opt.staticRoute = pkg.directories.staticRoute;
    opt.static = pkg.directories.static;
    res = tpl(opt);
    debug("srcConf", gutil.colors.red(srcConf));
    debug("dstConf", gutil.colors.red(dstConf));

    mkdirp.sync(path.join(data.dst, "webservers"));
    fs.symlinkSync(
        path.join(data.src, "webservers", "cert"),
        path.join(data.dst, "webservers", "cert"),
        "dir"
    );
    fs.writeFileSync(dstConf, res, {"encoding": "utf8"});
}
