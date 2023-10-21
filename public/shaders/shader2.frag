#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 fragColor;

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
    return a + b*cos( 6.28318*(c*t+d) );
}

void main() {
    vec4 texColor = texture(u_texture, v_uv);

    float c1 = texColor.r;

    vec3 col = pal(c1 + u_time * 0.04, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.10,0.20));

    vec3 color = vec3(col);

    fragColor = vec4(color, 1.0);
}
