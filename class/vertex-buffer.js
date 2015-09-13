module.exports = vertexBuffer;

function vertexBuffer() {
	return VertexBuffer;

	function VertexBuffer(gl, data, width, type) {
		var count = data.length / width;
		if (count !== Math.floor(count) || width === 0) {
			throw new Error('Dataset is incomplete');
		}
		var buffer = gl.createBuffer();
		bind();
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

		this.buffer = buffer;
		this.width = width;
		this.count = count;
		this.bind = bind;
		this.typeCode = gl.FLOAT;
		this.draw = draw;

		return Object.freeze(this);

		function bind() {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		}

		function draw() {
			gl.drawArrays(type, 0, count);
		}
	}
}
