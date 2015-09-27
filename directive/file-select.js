var Buffer = Buffer || require('buffer/').Buffer;

module.exports = fileSelect;

/*@ngInject*/
function fileSelect($q, $timeout) {
	return {
		restrict: 'A',
		scope: {
			onProgress: '&',
			onError: '&',
			onLoaded: '&'
		},
		compile: compile
	};

	function compile(element, attr) {
		element.attr({
			type: 'file',
			required: 'required'
		});
		return link;
	}

	function link(scope, element, attr) {
		element.bind('change', function (changeEvent) {
			var files = [].slice.apply(changeEvent.target.files);
			if ('multiple' in attr) {
				$q.all(files.map(readFile))
					.then(promiseResolved, promiseRejected);
			} else {
				readFile(files[0])
					.then(promiseResolved, promiseRejected, promiseProgress);
			}

			function promiseResolved(res) {
				scope.onLoaded(res);
			}

			function promiseRejected(err) {
				scope.onError(err);
			}

			function promiseProgress(progress) {
				scope.onProgress(progress);
			}

			function readFile(file) {
				var deferred = $q.defer();
				var reader = new FileReader();
				reader.onload = readerLoaded;
				reader.onerror = readerError;
				if (files.length === 1) {
					reader.onprogress = readerProgress;
				}
				reader.readAsArrayBuffer(file);
				return deferred.promise;

				function readerProgress(event) {
					var read = event.loaded;
					var total = event.total;
					deferred.notify({ read: read, total: total, percent: 100 * read / total });
				}

				function readerError(error) {
					deferred.reject({ file: file, error: error });
				}

				function readerLoaded(loadEvent) {
					scope.$apply(function () {
						deferred.resolve({
							name: file.name,
							content: new Buffer(loadEvent.target.result)
						});
					});
				}
			}
		});
	}
}
