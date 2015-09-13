module.exports = shader;

function ShaderProperty(gl, program, name, type) {
	this.name = name;
	this.type = type;

	this.getLocation = getLocation;

	var location;

	return;

	function getLocation() {
		if (!location) {
			this.updateLocation();
		}
		return location;
	}
}

function ShaderAttribute(gl, program, name, type) {
	ShaderProperty.apply(this, arguments);

	var enabled = false;

	this.updateLocation = updateLocation;
	this.enable = enable;
	this.disable = disable;
	this.bind = bind;

	return Object.freeze(this);

	function updateLocation() {
		return gl.getAttribLocation(program, name);
	}

	function enable() {
		gl.enableVertexAttribArray(this.getLocation());
		enabled = true;
	}

	function disable() {
		gl.disableVertexAttribArray(this.getLocation());
		enabled = false;
	}

	function bind(buffer) {
		if (!enabled) {
			enable();
		}
		buffer.bind();
		gl.vertexAttribPointer(this.getLocation(), buffer.width, buffer.typeCode, false, 0, 0);
	}
}

function ShaderUniform(gl, program, name, type) {
	ShaderProperty.apply(this, arguments);

	var setter;
	switch (type) {
		case "int": setter = "uniform1iv"; break;
		case "float":
		case "vec1": setter = "uniform1fv"; break;
		case "vec2": setter = "uniform2fv"; break;
		case "vec3": setter = "uniform3fv"; break;
		case "vec4": setter = "uniform4fv"; break;
		case "mat1": setter = "uniformMatrix1fv"; break;
		case "mat2": setter = "uniformMatrix2fv"; break;
		case "mat3": setter = "uniformMatrix3fv"; break;
		case "mat4": setter = "uniformMatrix4fv"; break;
		default: setter = "<error>"; break;
	}
	if (!gl[setter]) {
		throw new Error('Unsupported GLSL data type: "' + type + '"');
	}
	var setFunc = gl[setter];

	this.updateLocation = updateLocation;
	this.assign = setValue;

	return Object.freeze(this);

	function updateLocation() {
		return gl.getUniformLocation(program, name);
	}

	function setValue(value) {
		if (value instanceof Array) {
			value = [].concat.apply([], value);
		}
		setFunc.call(gl, this.getLocation(), false, value);
	}
}

function ShaderProgram(gl, program, vs, fs) {
	var attrRx = /;\s*attribute\s+(\S+)\s+(\S+)\b/g;
	var uniformRx = /;\s*uniform\s+(\S+)\s+(\S+)\b/g;
	var source = ';' + vs.source + ';\n' + fs.source;
	var match;
	var vars = {}, varArray = [];
	while ((match = attrRx.exec(source))) {
		pushVar(new ShaderAttribute(gl, program, match[2], match[1]));
	}
	while ((match = uniformRx.exec(source))) {
		pushVar(new ShaderUniform(gl, program, match[2], match[1]));
	}
	this.program = program;
	this.use = use;
	this.get = getVariable;

	return Object.freeze(this);

	function getVariable(name) {
		var v = vars['var_' + name];
		if (!v) {
			throw new Error('Variable "' + name + '" does not exist');
		}
		return v;
	}

	function pushVar(v) {
		vars['var_' + v.name] = v;
		varArray.push(v);
	}

	function use() {
		gl.useProgram(program);
		varArray.forEach(function (v) {
			v.updateLocation();
		});
	}
}

function shader($cacheFactory, $http, $q) {
	var idx = 0;

	return ShaderRepository;

	function ShaderRepository(gl) {
		var cache = $cacheFactory('glslCache-' + idx);
		this.loadVertexShader = load('vertex', gl.VERTEX_SHADER);
		this.loadFragmentShader = load('frag', gl.FRAGMENT_SHADER);
		this.build = build;
		return Object.freeze(this);

		function load(type, typeCode) {
			return function (basename) {
				var name = basename + '.' + type;
				var test = cache.get(name);
				if (test) {
					return $q.resolve(test);
				}
				var path = '/shader/' + name;
				return $http.get(path)
					.then(function (res) {
						var glsl = res.data;
						var shader = gl.createShader(typeCode);
						gl.shaderSource(shader, glsl);
						gl.compileShader(shader);
						if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
							cache.put(name, { shader: shader, source: glsl });
							return shader;
						} else {
							throw new Error('Failed to compile shader "' + name + '": ' + gl.getShaderInfoLog(shader));
						}
					}, function (err) {
						throw new Error('Failed to get shader ' + name);
					});
			};
		}

		function get(name) {
			var res = cache.get(name);
			if (!res) {
				throw new Error('Shader not loaded: "' + name + '"');
			}
			return res;
		}

		function build(vertex, fragment) {
			var vs = get(vertex + '.vertex');
			var fs = get(fragment + '.frag');
			var program = gl.createProgram();
			gl.attachShader(program, vs.shader);
			gl.attachShader(program, fs.shader);
			gl.linkProgram(program);
			if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
				return new ShaderProgram(gl, program, vs, fs);
			} else {
				throw new Error('Failed to link shaders: ' + gl.getProgramInfoLog(program));
			}
		}

	}
}
