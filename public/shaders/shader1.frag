#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_parameter;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 p1 = p * p * 4.0;

    float c1 = fract(p1.x * sin(p.y) + u_time * 0.2) * length(p1);

    float c2 = length(p * (1.0 - u_parameter));

    vec3 color = vec3(c1 + c2);
    fragColor = vec4(color, 1.0);
}
