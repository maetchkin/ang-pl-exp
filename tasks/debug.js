'use strict';
var gutil = require('gulp-util');
module.exports = function(){
    return gutil.env.d
        ? function(){
            gutil.log.apply(gutil, ([gutil.colors.bold.green("»")]).concat([].slice.apply(arguments)) );
        }
        : function(){}
}
