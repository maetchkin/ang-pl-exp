(function(){

"use strict";

var app = angular.module('Plasmid', ['angularplasmid']);

function checkPrimer(sub){
    var pc_s3 = sub.map(function(e){ return e[0] }),
        pc_s5 = sub.map(function(e){ return e[1] });

    return pc_s3.join("") == pc_s5.reverse().join("")
            ? {
                "s3": pc_s3,
                "s5": pc_s5
            }
            : false;
}

function getPrimer (s5, s3, primer){

    var restriction_5 = primer.restriction.replace("^", ""),
        restriction_3 = restriction_5.split("").reverse().join(""),
        index_5,
        index_3,
        offset = 0;

    primer.matches = [];

    do {
        index_5 = s5.indexOf(restriction_5, offset);
        index_3 = s3.indexOf(restriction_3, offset);
        offset = index_5 + restriction_5.length;

        if(index_5 !== -1 && index_5 === index_3){
            primer.matches.push(index_5);
            //console.log('primer ', index_5, index_3, primer.name );
        }
    }

    while ( index_5 > -1 );

    this.primers.push(primer);
    this.$apply();
}

function getPrimers(s5, s3, primers){
    this.clearPrimers();
    this.$apply();
    var cb = getPrimer.bind(this, s5, s3);
    for (var i = 0; i < primers.length; i++) {
        setTimeout(cb, 0, primers[i]);
    };
}

app.directive(
    'subSequence', function(){

        return {
            replace: true,
            restrict: 'E',
            scope: {
                seq: '=',
                st: '='
            },
            templateUrl: 'subSequence.html',

            link: function(scope, element, attrs) {

                /*var st = attrs.st;
                scope.classRestriction = function(sX, i){
                    var cc = [
                            'btn-danger',
                            'btn-info',
                            'btn-default'
                        ],
                        c = 2, r = -1;

                    if(scope.seq.restriction){
                        r = scope.seq.restriction.indexOf('^');
                        r = sX === 's5' ? r : scope.seq.restriction.length - 1 - r;
                    }
                    if (r > -1){
                        c = (i >= r) ? 1 : 0;
                        if (sX === 's3'){
                            c = !c;
                        }
                        if (st === 'to'){
                            c = !c;
                        }
                    } else {
                        c = (sX === 's5') ? 1 : 0;
                    }
                    return cc[ c+0 ];
                }*/

                scope.$watch('seq', function PFUNC(seq) {
                    if(!seq){
                        return;
                    }
                    seq.length = seq.end - seq.start;
                    seq.length = seq.length < 0 ? seq.length * -1 : seq.length;
                    seq.s5 = scope.$parent.data.sequence.s5.substring( seq.start, seq.end );
                    seq.s3 = scope.$parent.data.sequence.s3.substring( seq.start, seq.end );
                });
            }
        };

    }
);

app.controller('plasmidCtrl', ['$http', '$scope', '$timeout', function plasmidCtrl ($http, $scope, $timeout) {

    $scope.control = {
        length: 600,
        lengths: [60,360,600,1200,3600,6000,12000,360000,1200000]
    };

    $scope.clearPrimers = function(){
        $scope.primers = [];
        $scope.selectedPrimerGroups = {};
        $scope.selectedPrimers = [];
        $scope.subSequence = { from: null, seq: null, to: null};
    }
    $scope.clear = function(){
        $scope.length   = 0;
        $scope.interval = 0;
        $scope.sequence = '';
        $scope.label = 'loading...';
        $scope.focusedPrimerGroup = null;
        $scope.clearPrimers();
    }

    $scope.setSeqByLen = function(l){
        $scope.control.length = l;
    }

    $scope.markerClick = function(marker){
        $scope.$apply(function(){
            var ss = $scope.subSequence;
            if( ss.from ){
                if (ss.from === marker) {
                    ss.to = ss.from = null;
                } else if( ss.to === marker ){
                    ss.to = null;
                } else {
                    ss.to = marker;
                }
            } else {
                ss.from = marker;
            }

            //console.log($scope.subSequence);
        });
    }

    $scope.primerHasMatches = function(item){
        return item.matches.length > 0;
    }

    $scope.selectPrimerGroup = function(item){
        var group = item.name;
        $scope.selectedPrimerGroups[group]
            = group in $scope.selectedPrimerGroups
                ? !$scope.selectedPrimerGroups[group]
                : true;

        $scope.focusedPrimerGroup = $scope.selectedPrimerGroups[group] ? group : null;

        $scope.setSelectedPrimers();
    }

    $scope.subSequenceReverse = function(){
        var from = $scope.subSequence.from;
        $scope.subSequence.from = $scope.subSequence.to;
        $scope.subSequence.to = from;
    }

    $scope.setSelectedPrimers = function(primer){
        var res = [];

        if($scope.primers){
            $scope.primers.forEach(
                function(p){
                    if( $scope.selectedPrimerGroups[p.name] ){
                        res = res.concat(
                            p.matches.map(
                                function(m){
                                    return {
                                        restriction: p.restriction,
                                        name: p.name,
                                        start: m,
                                        end: m + p.restriction.replace('^','').length
                                    };
                                }
                            )
                        );
                    }
                }
            );
        }

        $scope.selectedPrimers = res;
    }

    function asyncParseData (s5, s3){

        $scope.label       = $scope.data.id;
        $scope.description = $scope.data.description;

        $scope.sequence = s5;


        $scope.length = $scope.sequence.length;
        $scope.interval = $scope.length / 12;
        var m = Math.pow(10, ($scope.sequence.length + "").length - 2 );
        $scope.interval = Math.floor( $scope.interval / m ) * m;

        getPrimers.call(
            $scope,
            s5, s3,
            $scope.primersMatrix.map(
                function(p){
                    return $.extend({}, p);
                }
            )
        );
    }

    function parseData(result){
        $scope.data = result.data;
        $scope.description = 'calculation';
        setTimeout(
            asyncParseData,
            0,
            $scope.data.sequence.s5,
            $scope.data.sequence.s3
        );
    }

    function setPrimersMatrix(result){
        $scope.primersMatrix = result.data;
    }

    function setRestrictionEnzymes(result){
        $scope.restrictionEnzymes = result.data;
    }


    $http.get('./primers.json')
        .then(setPrimersMatrix)
        .then($scope.clear);

    $http.get('./RestrictionEnzymes.json')
        .then(setRestrictionEnzymes)

    $scope.$watch(
        "control.length",
        function(){
            $http.get(
                './dna-report/generate?length=' + $scope.control.length
            )
            .then(
                parseData
            );
        }
    );

    $scope.$watchGroup(
        ['subSequence.from', 'subSequence.to'],
        function(){
            try {
                $scope.subSequence.seq
                    = $scope.subSequence && $scope.subSequence.from && $scope.subSequence.to
                    ? {start: $scope.subSequence.from.end + 1 , end: $scope.subSequence.to.start + 1}
                    : null;
            } catch(e) {

            }


        }
    );

}]);

})();
