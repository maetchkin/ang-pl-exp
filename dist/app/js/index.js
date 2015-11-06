(function(){

"use strict";

var app = angular.module('vixis', ['angularplasmid']);



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

function getPrimers(seq){
    var res = [],
        len = 5;

    seq.forEach(
        function(pair, index, arr){
            try{
                if(arr[index][0] == arr[index + len][1]){

                var p = checkPrimer( arr.slice( index, index + len ) );

                if ( p ) {
                    p.start =  index;
                    p.end   =  index + len;
                    res.push(p);
                }

                }
            } catch(e){

            }

        }
    );

    /*console.log(
        "res", res
    );*/

    return res;
}

app.controller('plasmidCtrl', ['$http', '$scope', '$timeout', function plasmidCtrl ($http, $scope, $timeout) {

    $scope.length   = 0;
    $scope.interval = 0;
    $scope.sequence = '';
    $scope.label = 'loading...';
    $scope.primers = [];

    $http.jsonp('./dna.json').success(
        function(data) {
            $scope.data = data;
            $scope.description = 'data calculation';

            setTimeout(
                function(s3,s5){
                    $scope.label = $scope.data.id;
                    $scope.description = $scope.data.description;

                    $scope.sequence = s3.map(
                                        function(v,i){
                                            return [s3[i], s5[i]];
                                        }
                                    );
                    $scope.length = $scope.sequence.length;
                    $scope.interval = $scope.length / 12;
                    var m = Math.pow(10, ($scope.sequence.length + "").length - 2 );
                    $scope.interval = Math.floor( $scope.interval / m ) * m;
                    $scope.primers = getPrimers($scope.sequence);;
                    $scope.$apply();

                },
                1000,
                $scope.data.sequence[0].split(""),
                $scope.data.sequence[1].split("")
            );
        }
    );

    $scope.markerClick = function(event, marker){
        $scope.$apply(function(){
            console.log('$scope.data', $scope.data)
            $scope.s3 = $scope.data.sequence[0].substring(marker.start, marker.end).split('');
            $scope.s5 = $scope.data.sequence[1].substring(marker.start, marker.end).split('');
            $scope.selectedmarker = marker;
        });
    }

    $scope.dismissPopup = function(){
        $scope.selectedmarker = null;
    }


}]);

})();
