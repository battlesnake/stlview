module.exports = slowMap;

function slowMap($q, $rootScope) {
	return function (arr, mapper, quanta) {
		var len = arr.length;
		var i = 0;
		var result = [];
		result.length = len;
		quanta = quanta > 0 ? quanta : 5000;
		if (len <= quanta) {
			return $q.resolve(arr.map(mapper));
		} else {
			var deferred = $q.defer();
			map();
			return deferred;
		}

		function map() {
			var stop = i + quanta;
			try {
				while (i < len && i < stop) {
					result[i] = mapper(arr[i], i, arr);
					i++;
				}
			} catch (error) {
				return deferred.reject(error);
			}
			if (i === stop) {
				return setTimeout(map, 0);
			} else if (i === len) {
				return $rootScope.apply(function () {
					deferred.resolve(result);
				});
			}
		}
	};
}
