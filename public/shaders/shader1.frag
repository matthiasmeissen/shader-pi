#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    float c1 = fract(p.x + u_time * 0.2);

    vec3 color = vec3(c1);
    fragColor = vec4(color, 1.0);
}
