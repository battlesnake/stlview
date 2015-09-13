var vektor = require('vektor');

var Vec = vektor.vector;
var Mat = vektor.matrix;
var Quaternion = require('../class/quaternion');

var stl = require('stl.js');

module.exports = viewer;

function viewer($scope, $http) {
	$scope.stl = {
		triangles: []
	};
	$scope.view = {
		orientation: new Quaternion(0,0,0, 1),
		zoom: 1
	};
	$http.get('/stl/gear.stl')
		.then(function (res) {
			var data = res.data;
			var parsed = stl.parse(data, { lax: true });
			$scope.stl.triangles = parsed.triangles;
		});
}
