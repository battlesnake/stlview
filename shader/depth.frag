precision mediump float;

void main() {
	vec3 color_far = vec3(0.0, 0.0, 0.5);
	vec3 color_near = vec3(1.0, 1.0, 0.5);
	gl_FragColor = vec4(mix(color_near, color_far, gl_FragCoord.z), 1.0);
}
