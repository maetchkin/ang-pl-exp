'use strict';

var pkg     = require('../package.json'),
    fs      = require('fs'),
    path    = require('path'),
    gutil   = require('gulp-util'),
    mkdirp  = require('mkdirp'),
    debug   = require('./debug.js')(gutil.env.d);

module.exports = function(data){
    var srcConf = path.join(process.cwd(), data.src),
        dstConf = path.join(process.cwd(), data.dst),
        file    = fs.readFileSync(srcConf),
        opt     = data.config,
        tpl     = gutil.template(file),
        res;

    data.config.file = {path: srcConf};
    data.config.cwd  = process.cwd();

    res = tpl( data.config );

    debug("srcConf", gutil.colors.red(srcConf));
    debug("dstConf", gutil.colors.red(dstConf));

    mkdirp.sync( path.dirname(data.dst) );

    fs.writeFileSync(dstConf, res, {"encoding": "utf8"});
}
