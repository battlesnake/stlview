var stl = require('stl.js');

module.exports = uploader;

/*@ngInject*/
function uploader($scope, $q, modelRepository) {
	$scope.uploader = {
		file: null,
		percent: 0,
		loadFile: loadFile
	};

	function loadFile(name, content) {
		$scope.uploader.percent = 0;
		window.location.hash = '#';
		var triangles = stl.parse(content, { lax: true }).triangles;
		modelRepository.active = modelRepository.add(name,
			function () { return $q.resolve(triangles); });
	}

}
