#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_uv);

    vec3 col = texColor.rgb * vec3(abs(sin(u_time * 0.2)), 0.4, 0.0);

    vec3 color = vec3(col);

    fragColor = vec4(color, 1.0);
}
