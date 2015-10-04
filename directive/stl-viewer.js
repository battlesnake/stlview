var WebGLDebugUtils = require('../webgl-debug.js');

module.exports = stlViewer;

/*@ngInject*/
function stlViewer($q, slowReduce, slowMap, ShaderRepository, VertexBuffer, Quaternion, Matrix, $timeout) {
	return {
		restrict: 'EA',
		template: '<canvas style="width: {{width}}px; height: {{height}}px;"></canvas>',
		scope: {
			/* Array of { vertices: [v1, v2, v3], normal: n } */
			data: '=',
			/* 35mm focal length, mm */
			zoom: '=',
			/* 'orthographic' or 'perspective' */
			projection: '=',
			/* Quaternion */
			orientation: '=',
			/* Pixels */
			width: '=',
			height: '=',
			/* Bad wireframe */
			badWireframe: '=',
			/* Shader */
			shader: '='
		},
		link: link
	};

	function throwOnError(err, func, args) {
		console.error(err, func, args);
		throw new Error(func + ': ' + err);
	}

	function link(scope, element, attrs) {
		var canvas = element.find('canvas')[0];
		var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		gl = WebGLDebugUtils.makeDebugContext(gl, throwOnError);
		if (!gl) {
			window.alert('Your browser does not support WebGL');
			throw new Error('WebGL required');
		}

		var object = {
			centre: new Matrix.vec3(0, 0, 0),
			radius: 1
		};
		var vertexBuf = null;
		var normalBuf = null;
		var shaders = new ShaderRepository(gl);
		var shader = null;
		var aspect = 1;

		var presetShaders = Object.preventExtensions({
			diffuse: null,
			depth: null,
			normal: null
		});

		var transform = {
			projection: null,
			model: null
		};

		var viewInvalid = true;
		var viewportInvalid = true;

		var redrawPromise = null;

		$q.all([
				shaders.loadVertexShader('diffuse'),
				shaders.loadFragmentShader('diffuse'),
				shaders.loadFragmentShader('depth'),
				shaders.loadFragmentShader('normal')
			]).then(function (res) {
				presetShaders.diffuse = shaders.build('diffuse', 'diffuse');
				presetShaders.depth = shaders.build('diffuse', 'depth');
				presetShaders.normal = shaders.build('diffuse', 'normal');
				shader = presetShaders.diffuse;
				initShaders();
				scope.$watch('zoom', viewChanged);
				scope.$watch('orientation', viewChanged);
				scope.$watch('width', viewportChanged);
				scope.$watch('height', viewportChanged);
				scope.$watch('data', dataChanged);
				scope.$watch('projection', viewChanged);
				scope.$watch('badWireframe', viewChanged);
				scope.$watch('shader', shaderChanged);
				dataChanged();
			});

		var light_position = new Matrix.vec3(0.6, 0.35, -1);

		var material_color = new Matrix.vec4(0.2, 0.3, 0.6, 1.0);
		var ambient_color = new Matrix.vec3(1, 1, 1).scale(0.1);
		var diffuse_color = new Matrix.vec3(1, 1, 1).scale(0.3);
		var specular_color = new Matrix.vec3(1, 1, 1).scale(10);
		var specular_exponent = 10;

		var camera_position = new Matrix.vec3(0, 0, -5);

		return;

		function deferRedraw() {
			if (redrawPromise) {
				return;
			}
			redrawPromise = $timeout(redraw, 0);
			redrawPromise.finally(function () {
					redrawPromise = null;
				});
		}

		function viewChanged() {
			viewInvalid = true;
			deferRedraw();
		}

		function viewportChanged() {
			viewportInvalid = true;
			deferRedraw();
		}

		function dataChanged() {
			var data = scope.data || [];
			var q_centre = getCentroid(data);
			var q_radius = q_centre.then(function (centre) {
				return getRadius(centre, data);
			});
			var q_vb = makeVertexBuffer(data);
			var q_nb = makeNormalBuffer(data);
			return $q.all([q_centre, q_radius, q_vb, q_nb])
				.then(function (res) {
					object = Object.freeze({
						centre: res[0],
						radius: res[1]
					});
					vertexBuf = res[2];
					normalBuf = res[3];
				})
				.then(function () {
					viewChanged();
					deferRedraw();
				});
		}

		function shaderChanged() {
			var newShader = presetShaders[scope.shader];
			if (newShader === shader) {
				return;
			}
			if (!newShader) {
				throw new Error('Shader "' + scope.shader + '" does not exist');
			}
			if (shader) {
				shader.disableAll();
			}
			shader = newShader;
			initShaders();
			deferRedraw();
		}

		function initShaders() {
			shader.use();
			shader.enableAll();
		}

		function updateViewport() {
			if (!scope.width || !scope.height) {
				return;
			}
			gl.disable(gl.CULL_FACE);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			canvas.width = scope.width;
			canvas.height = scope.height;
			gl.viewport(0, 0, scope.width, scope.height);
			aspect = scope.width / scope.height;
			viewportInvalid = false;
		}

		function updateView() {
			if (!scope.zoom || !scope.orientation) {
				return;
			}
			var projection;
			var camera_distance = -camera_position.data[2];
			if (scope.projection === 'ortho' || scope.projection === 'orthographic' || !scope.projection) {
				projection = new Matrix.Orthographic(-1*aspect, 1*aspect, -1, 1, camera_distance - 1, camera_distance + 1)
					.scale(scope.zoom / 50);
			} else if (scope.projection === 'perspective') {
				projection = new Matrix.Camera35mm(aspect, scope.zoom, camera_distance - 1, camera_distance + 1);
			} else {
				throw new Error('Unknown projection: "' + scope.projection + '"');
			}
			transform.model = Matrix.Chain(
				new Matrix.Rotation(scope.orientation),
				new Matrix.Scale(1 / object.radius),
				new Matrix.Translation(object.centre.neg())
			);
			transform.projection = projection;
			viewInvalid = false;
		}

		function redraw() {
			if (viewInvalid) {
				updateView();
			}
			if (viewportInvalid) {
				updateViewport();
			}
			gl.clearColor(0, 0, 0.1, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			if (!scope.data || !vertexBuf) {
				return;
			}
			shader.get('projection').set(transform.projection);
			shader.get('model').set(transform.model);
			shader.get('camera_position').set(camera_position);
			shader.get('material_color').set(material_color);
			shader.get('light_position').set(light_position);
			shader.get('ambient_light_color').set(ambient_color);
			shader.get('diffuse_light_color').set(diffuse_color);
			shader.get('specular_light_color').set(specular_color);
			shader.get('specular_exponent').set(specular_exponent);
			shader.get('position').bind(vertexBuf);
			shader.get('normal').bind(normalBuf);
			if (scope.badWireframe) {
				vertexBuf.draw(gl.LINE_STRIP);
			} else {
				vertexBuf.draw();
			}
		}

		/* Centroid of model surface */
		function getCentroid(triangles) {
			return slowReduce(triangles, function (state, t) {
					var area = triangleArea(t);
					var mid = triangleMid(t);
					if (isFinite(area)) {
						state.accum = state.accum.add(mid.scale(area));
						state.weight += area;
					}
					return state;
				}, { accum: new Matrix.vec3(), weight: 0 })
				.then(function (state) {
					return state.weight > 0 ? state.accum.scale(1 / state.weight) : state.accum;
				});
		}

		/* Maximum distance of vertex from centroid */
		function getRadius(centre, triangles) {
			return slowReduce(triangles, function (state, t) {
					var v = t.vertices.map(makeVec3);
					for (var i = 0; i < 3; i++) {
						var r = v[i].sub(centre).norm();
						if (r > state) {
							state = r;
						}
					}
					return state;
				}, 0)
				.then(function (state) {
					return state > 0 ? state : 1;
				});
		}

		function makeVertexBuffer(triangles) {
			var state = {
				coords: [],
				i: 0
			};
			state.coords.length = triangles.length * 9;
			return slowReduce(triangles, function (state, t) {
					for (var v = 0; v < 3; v++) {
						for (var c = 0; c < 3; c++) {
							state.coords[state.i++] = t.vertices[v][c];
						}
					}
					return state;
				}, state)
				.then(function (state) {
					return new VertexBuffer(gl, state.coords, 3, gl.TRIANGLES);
				});
		}

		function makeNormalBuffer(triangles) {
			var state = {
				coords: [],
				i: 0
			};
			state.coords.length = triangles.length * 9;
			return slowReduce(triangles, function (state, t) {
					var calcNormal = function () { return triangleNormal(t); };
					var n = makeVec3(t.normal).unit(calcNormal).data;
					for (var rep = 0; rep < 3; rep++) {
						for (var c = 0; c < 3; c++) {
							state.coords[state.i++] = n[c];
						}
					}
					return state;
				}, state)
				.then(function (state) {
					return new VertexBuffer(gl, state.coords, 3);
				});
		}

		function makeVec3(v) {
			if (v.length !== 3) {
				console.info(v);
				throw new Error('Vector size mismatch');
			}
			return new Matrix.vec3(v);
		}

		function triangleMid(t) {
			var v = t.vertices.map(makeVec3);
			return v[0].add(v[1]).add(v[2]).scale(1/3);
		}

		function triangleNormal(t) {
			var v = t.vertices.map(makeVec3);
			return v[1].sub(v[0]).cross(v[2].sub(v[1])).unit();
		}

		function triangleArea(t) {
			var v = t.vertices.map(makeVec3);
			return v[1].sub(v[0]).cross(v[2].sub(v[0])).norm() / 2;
		}

	}

}
