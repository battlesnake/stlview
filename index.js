var angular = window.angular = require('angular');

angular.module('stlviewer', [])
	.factory('slowReduce', require('./service/slow-reduce'))
	.factory('slowMap', require('./service/slow-map'))
	.factory('ShaderRepository', require('./class/shader'))
	.factory('VertexBuffer', require('./class/vertex-buffer'))
	.factory('Quaternion', require('./class/quaternion'))
	.factory('Matrix', require('./class/matrix'))
	.controller('viewer', require('./controller/viewer'))
	.directive('stlViewer', require('./directive/stl-viewer'))
	;
