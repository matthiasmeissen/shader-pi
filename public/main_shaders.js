document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        console.error("Unable to initialize WebGL2. Your browser may not support it.");
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    out vec2 v_uv;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
    }
    `;

    const fragmentShader1Source = `#version 300 es
    precision highp float;

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
    `;

    const fragmentShader2Source = `#version 300 es
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
    `;

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader1 = compileShader(gl, fragmentShader1Source, gl.FRAGMENT_SHADER);
    const fragmentShader2 = compileShader(gl, fragmentShader2Source, gl.FRAGMENT_SHADER);

    const program1 = createProgram(gl, vertexShader, fragmentShader1);
    const program2 = createProgram(gl, vertexShader, fragmentShader2);

    const vertices = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const framebuffer = createFramebuffer(gl, canvas.width, canvas.height);

    function render() {
        let currentTime = Date.now();
        let elapsedTime = (currentTime - startTime) / 1000.0; // Convert to seconds

        // Set up rendering to framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);
        gl.useProgram(program1);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.uniform1f(gl.getUniformLocation(program1, "u_time"), elapsedTime);
        gl.uniform2f(gl.getUniformLocation(program1, "u_resolution"), canvas.width, canvas.height);
        const position = gl.getAttribLocation(program1, "a_position");
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(position);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Set up rendering to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(program2);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture);
        gl.uniform1f(gl.getUniformLocation(program2, "u_time"), elapsedTime);
        gl.uniform2f(gl.getUniformLocation(program2, "u_resolution"), canvas.width, canvas.height);
        gl.uniform1i(gl.getUniformLocation(program2, "u_texture"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }

    render();
});

let startTime = Date.now();

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function createFramebuffer(gl, width, height) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, 0);

    return { framebuffer, texture };
}
