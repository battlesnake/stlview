module.exports = viewer;

/*@ngInject*/
function viewer($scope, Quaternion, $interval, $timeout, modelRepository) {
	$scope.stl = {
		triangles: []
	};
	$scope.view = {
		orientation: new Quaternion(),
		zoom: 50,
		size: 540,
		projection: 'orthographic',
		wireframe: false
	};
	$scope.projections = {
		perspective: 'Perspective',
		orthographic: 'Orthographic'
	};
	$scope.methods = {
		setRotation: setRotation,
		setZooming: setZooming,
		reset: reset,
		strZoom: strZoom,
		loadModel: loadModel
	};
	var repository = $scope.repository = modelRepository;

	var anim = {
		rx: 0,
		ry: 0,
		rz: 0,
		z: 0
	};

	var ival = null;
	var zt = new Date().getTime();

	$interval(function () {
		var w = window.innerWidth;
		var h = window.innerHeight;
		var min = Math.min(w, h);
		var max = Math.max(w, h) - 160;
		$scope.view.size = Math.min(min, max);
	}, 100);

	$scope.$watch('repository.active', function () {
		loadModel($scope.repository.active);
	});
	loadModel();

	reset();

	return;

	function loadModel() {
		$scope.stl.triangles = [];
		var model = repository.active;
		if (!model) {
			return;
		}
		model.getTriangles()
			.then(function (triangles) {
				$scope.stl.triangles = triangles;
			});
	}

	function setRotation(rx, ry, rz) {
		anim.rx = rx;
		anim.ry = ry;
		anim.rz = rz;
		animate();
	}

	function setZooming(z) {
		anim.z = z;
		animate();
	}

	function animate() {
		if (anim.rx === 0 && anim.ry === 0 && anim.rz === 0 && anim.z === 0) {
			if (ival) {
				$timeout.cancel(ival);
				ival = null;
			}
			return;
		}
		var dt = (new Date().getTime() - zt) / 1000;
		dt = dt > 0.1 ? 0.1 : dt;
		zt = new Date().getTime();
		var rot = new Quaternion([-anim.ry, -anim.rx, anim.rz], 90 * Math.PI/180 * dt);
		var z = anim.z * 20 * dt;
		rot = rot.mul($scope.view.orientation);
		z = $scope.view.zoom + z;
		z = z < 18 ? 18 : z > 105 ? 105 : z;
		$scope.view.orientation = rot;
		$scope.view.zoom = z;
		if (!ival) {
			ival = $interval(animate, 20);
		}
	}

	function reset() {
		setRotation(0, 0, 0);
		setZooming(0);
		$scope.view.orientation = new Quaternion();
		$scope.view.zoom = 50;
	}

	function strZoom() {
		return Math.round($scope.view.zoom) + 'mm';
	}

}
