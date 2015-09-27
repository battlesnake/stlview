var angular = window.angular = require('angular');

angular.module('stlviewer', [])
	.factory('slowReduce', require('./service/slow-reduce'))
	.factory('slowMap', require('./service/slow-map'))
	.factory('ShaderRepository', require('./class/shader'))
	.factory('VertexBuffer', require('./class/vertex-buffer'))
	.factory('Quaternion', require('./class/quaternion'))
	.factory('Matrix', require('./class/matrix'))
	.factory('modelRepository', require('./service/model-repository'))
	.controller('viewer', require('./controller/viewer'))
	.controller('uploader', require('./controller/uploader'))
	.directive('stlViewer', require('./directive/stl-viewer'))
	.directive('fileSelect', require('./directive/file-select'))
	;
