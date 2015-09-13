var Mat = require('vektor').matrix;

module.exports = quaternion;

function quaternion() {
	return Quaternion;
}

function Quaternion(axis, angle) {
	var i, j, k, r;
	if (arguments.length === 4) {
		i = arguments[0];
		j = arguments[1];
		k = arguments[2];
		r = arguments[3];
	} else {
		var c = Math.cos(angle / 2);
		var s = Math.sin(angle / 2);
		i = s * axis[0];
		j = s * axis[1];
		k = s * axis[2];
		r = c;
	}
	this.i = i;
	this.j = j;
	this.k = k;
	this.r = r;
	this.mul = mul;
	this.asMatrix = asMatrix;
	return Object.freeze(this);

	function mul(x) {
		var i_ = j*x.k - k*x.j;
		var j_ = k*x.i - i*x.k;
		var k_ = i*x.j - j*x.i;
		var r_ = -(i*x.i + j*x.j + k*x.k);
		return new Quaternion(i_, j_, k_, r_);
	}

	function asMatrix(size) {
		size = size || 3;
		var m = new Mat(size, size, true);
		m.set(0, 0, 1 - 2 * (j*j + k*k));
		m.set(0, 1,     2 * (i*j + k*r));
		m.set(0, 2,     2 * (i*k + j*r));
		m.set(1, 0,     2 * (i*j + k*r));
		m.set(1, 1, 1 - 2 * (i*i + k*k));
		m.set(1, 2,     2 * (j*k - i*r));
		m.set(2, 0,     2 * (i*k - j*r));
		m.set(2, 1,     2 * (j*k + i*r));
		m.set(2, 2, 1 - 2 * (i*i + j*j));
		return m;
	}
}
