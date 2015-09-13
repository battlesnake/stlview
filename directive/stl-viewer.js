var vektor = require('vektor');

var Vec = vektor.vector;
var Mat = vektor.matrix;

var WebGLDebugUtils = require('../webgl-debug.js');

module.exports = stlViewer;

function Translate(x, y, z) {
	var m = new Mat(4, 4, true);
	m.set(3, 0, x);
	m.set(3, 1, y);
	m.set(3, 2, z);
	return m;
}

function Scale(s) {
	var m = new Mat(4, 4, true);
	m.set(0, 0, s);
	m.set(1, 1, s);
	m.set(2, 2, s);
	return m;
}

function Ortho(w, h, d) {
	var m = new Mat(4, 4, true);
	m.set(0, 0, 2/w);
	m.set(1, 1, 2/h);
	m.set(2, 2, 2/d);
	m.set(0, 3, -1);
	m.set(1, 3, -1);
	return m;
}

function stlViewer($q, slowReduce, slowMap, ShaderRepository, VertexBuffer, Quaternion) {
	return {
		restrict: 'A',
		scope: {
			data: '=',
			zoom: '=',
			orientation: '='
		},
		link: link
	};

	function throwOnError(err, func, args) {
		console.error(err, func, args);
		throw new Error(func + ': ' + err);
	}

	function link(scope, element, attrs) {
		var el = element[0];
		var gl = el.getContext('webgl') || el.getContext('experimental-webgl');
		gl = WebGLDebugUtils.makeDebugContext(gl, throwOnError);
		if (!gl) {
			window.alert('Your browser does not support WebGL');
			throw new Error('WebGL required');
		}

		var centre = new Vec(0, 0, 0);
		var radius = 1;
		var vertexBuf = null;
		var normalBuf = null;
		var shaders = new ShaderRepository(gl);
		var shader = null;

		var transform;

		$q.all([
				shaders.loadVertexShader('diffuse'),
				shaders.loadFragmentShader('diffuse')
			]).then(function (vs, fs) {
				shader = shaders.build('diffuse', 'diffuse');
				initView();
				scope.watch('data', dataChanged);
				scope.watch('zoom orientation', viewChanged);
			});

		var ambient_color = new Vec(0.2, 0.3, 0.6);
		var diffuse_color = new Vec(0.8, 0.8, 0.8);
		var diffuse_direction = new Vec(1, 1, 1);

		return;

		function dataChanged() {
			var data = scope.data || [];
			var q_centre = getCentroid(data);
			var q_radius = q_centre.then(function (centre) {
				return getRadius(centre, data);
			});
			var q_vb = makeVertexBuffer(data);
			var q_nb = makeNormalBuffer(data);
			return $q.all([q_centre, q_radius, q_vb, q_nb])
				.then(function (c, r, vb, nb) {
					centre = c;
					radius = r;
					vertexBuf = vb;
					normalBuf = nb;
				})
				.then(function () {
					viewChanged();
					setInterval(viewChanged, 500);
				});
		}

		function viewChanged() {
			if (!scope.zoom || !scope.orientation) {
				return;
			}
			var matrices = [
				new Ortho(1, 1, 2),
				new Translate(0, 0, 1),
				scope.orientation.asMatrix(),
				new Scale(scope.zoom / radius),
				new Translate(-centre[0], -centre[1], -centre[2])
			];
			transform = matrices.reduce(function (l, r) {
					return l.dot(r);
				}, new Mat(4, 4, true));
			initView();
			redraw();
		}

		function initView() {
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.enable(gl.CULL_FACE);
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			shader.use();
			shader.get('position').enable();
			shader.get('normal').enable();
		}

		function redraw() {
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			if (!scope.data) {
				return;
			}
			shader.get('position').bind(vertexBuf);
			shader.get('normal').bind(normalBuf);
			shader.get('transform').set(transform);
			shader.get('ambient_light_color').set(ambient_color);
			shader.get('diffuse_light_color').set(diffuse_color);
			shader.get('diffuse_light_direction').set(diffuse_direction);
			vertexBuf.draw();
		}

		function getCentroid(triangles) {
			return slowReduce(triangles, function (state, t) {
					var area = triangleArea(t);
					var mid = triangleMid(t);
					state.centre = state.centre.add(mid.scale(area));
					state.weight += area;
					return state;
				}, { accum: new Vec(0, 0, 0), weight: 0 })
				.then(function (state) {
					return state.weight ? state.accum.scale(1 / state.weight) : state.accum;
				});
		}

		function getRadius(centre, triangles) {
			return slowReduce(triangles, function (state, t) {
					var mid = triangleMid(t);
					var r = mid.distanceFrom(centre);
					return r > state ? r : state;
				})
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
					for (var c = 0; c < 3; c++) {
						var n = t.normal[c];
						var len = n.length();
						n = len ? n.scale(1 / n.length()) : triangleNormal(t);
						for (var rep = 0; rep < 3; rep++) {
							state.coords[state.i++] = n;
						}
					}
				}, state)
				.then(function (state) {
					return new VertexBuffer(gl, state.coords, 3);
				});
		}

		function triangleMid(t) {
			var v = t.vertices.map(Vec);
			return v[0].add(v[1]).add(v[2]).scale(1/3);
		}

		function triangleNormal(t) {
			var v = t.vertices.map(Vec);
			var n = v[1].sub(v[0]).cross(v[2].sub(v[0]));
			var l = n.length();
			return l ? n.scale(1 / l) : n;
		}

		function triangleArea(t) {
			var v = t.vertices.map(Vec);
			return v[1].sub(v[0]).cross(v[2].sub(v[0])).length() / 2;
		}

	}

}
