precision mediump float;

uniform vec4 material_color;
uniform vec3 light_position;
uniform vec3 ambient_light_color;
uniform vec3 diffuse_light_color;
uniform vec3 specular_light_color;
uniform float specular_exponent;

varying vec3 normal_m;
varying vec3 normal_w;

varying vec3 position_w;
varying vec3 position_e;

varying vec4 color;

float coslaw(vec3 a, vec3 b) {
	return (1.0 + dot(normalize(a), normalize(b))) / 2.0;
}

void calc_color() {
	vec3 normal = normalize(normal_w);
	/* Diffuse lighting */
	vec3 diffuse_light = diffuse_light_color * coslaw(light_position, normal);
	/* Specular lighting */
	vec3 specular_light_dist = light_position - position_w;
	vec3 specular_reflection_dir = reflect(-specular_light_dist, normal);
	float specular_cosine = coslaw(-position_e, specular_reflection_dir);
	vec3 specular_light = specular_light_color *
		pow(specular_cosine, specular_exponent) /
		dot(specular_light_dist, specular_light_dist);
	/* Combine light colours */
	vec3 light_color = ambient_light_color + diffuse_light + specular_light;
	gl_FragColor = clamp(vec4(light_color, 1.0) * material_color, 0.0, 1.0);
}

void main() {
	calc_color();
}
