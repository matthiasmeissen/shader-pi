#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 p = (v_uv * u_resolution - 0.5 * u_resolution.xy) / u_resolution.y;

    float c1 = length(p);
    float c2 = fract(p.x + u_time * 0.2);

    vec3 col = vec3(c1 - c2);

    vec3 color = vec3(col);
    fragColor = vec4(color, 1.0);
}
