precision mediump float;
varying vec3 normal_m;

void main() {
	gl_FragColor = vec4((normal_m + vec3(1.0, 1.0, 1.0)) / 2.0, 1.0);
}
