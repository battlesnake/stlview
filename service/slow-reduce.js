module.exports = slowReduce;

/*@ngInject*/
function slowReduce($q, $rootScope) {
	return function (arr, reductor, state, quanta) {
		var len = arr.length;
		var i = 0;
		quanta = quanta > 0 ? quanta : 5000;
		if (len <= quanta) {
			return $q.resolve(arr.reduce(reductor, state));
		} else {
			var deferred = $q.defer();
			reduce();
			return deferred;
		}

		function reduce() {
			var stop = i + quanta;
			try {
				while (i < len && i < stop) {
					state = reductor(state, arr[i], i, arr);
					i++;
				}
			} catch (error) {
				return deferred.reject(error);
			}
			if (i === stop) {
				return setTimeout(reduce, 0);
			} else if (i === len) {
				return $rootScope.apply(function () {
					deferred.resolve(state);
				});
			}
		}
	};
}
