var _ = require('lodash');
var stl = require('stl.js');

module.exports = modelRepository;

/*@ngInject*/
function modelRepository($q, $http) {
	var cache = [];

	var res = {
		get: getModel,
		add: addModel,
		active: null,
		list: cache
	};

	addModel('gear', loadRemoteModel);
	addModel('ship', loadRemoteModel);

	res.active = cache[0];
	res.active.getTriangles();

	return res;

	function loadRemoteModel(name) {
		return $http.get('stl/' + name + '.stl')
			.then(function (res) {
				var data = res.data;
				var parsed = stl.parse(data, { lax: true });
				return parsed.triangles;
			});
	}

	function getModel(name) {
		var model = _.findWhere(cache, 'name', name);
		if (model) {
			throw new Error('Model ' + name + ' does not exist');
		}
		return model;
	}

	function addModel(name, loader) {
		var model = new Model(name, loader);
		cache.push(model);
		return model;
	}

	function Model(name, loader) {
		var triangles = null;
		this.name = name;
		this.getTriangles = getTriangles;

		function getTriangles() {
			if (triangles) {
				return $q.when(triangles);
			} else {
				return loader(name)
					.then(function (data) {
						triangles = data;
						return triangles;
					}, function (err) {
						console.error(err, name);
						throw err;
					});
			}
		}
	}
}
