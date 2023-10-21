class ShaderApp {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) {
            console.error("Unable to initialize WebGL2. Your browser may not support it.");
            return;
        }

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.startTime = Date.now();
        this.init();
    }

    async init() {
        const vertexShaderSource = await this.loadShader('shaders/shader.vert');
        const fragmentShader1Source = await this.loadShader('shaders/shader1.frag');
        const fragmentShader2Source = await this.loadShader('shaders/shader2.frag');

        this.vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        this.fragmentShader1 = this.compileShader(fragmentShader1Source, this.gl.FRAGMENT_SHADER);
        this.fragmentShader2 = this.compileShader(fragmentShader2Source, this.gl.FRAGMENT_SHADER);

        this.program1 = this.createProgram(this.vertexShader, this.fragmentShader1);
        this.program2 = this.createProgram(this.vertexShader, this.fragmentShader2);
        this.setupBuffers();
        this.framebuffer = this.createFramebuffer(this.canvas.width, this.canvas.height);

        this.uTimeLocation1 = this.gl.getUniformLocation(this.program1, "u_time");
        this.uResolutionLocation1 = this.gl.getUniformLocation(this.program1, "u_resolution");
        this.uParameterLocation = this.gl.getUniformLocation(this.program1, "u_parameter");

        this.uTimeLocation2 = this.gl.getUniformLocation(this.program2, "u_time");
        this.uResolutionLocation2 = this.gl.getUniformLocation(this.program2, "u_resolution");
        this.uTextureLocation = this.gl.getUniformLocation(this.program2, "u_texture");


        this.render();
    }

    async loadShader(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load shader from ${url}: ${response.statusText}`);
        }
        return response.text();
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    setupBuffers() {
        const vertices = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0,
        ]);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }

    createFramebuffer(width, height) {
        const framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        const attachmentPoint = this.gl.COLOR_ATTACHMENT0;
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachmentPoint, this.gl.TEXTURE_2D, texture, 0);

        return { framebuffer, texture };
    }

    updateParameter(value) {
        if (this.program1 && this.uParameterLocation !== undefined) {
            this.gl.useProgram(this.program1);
            this.gl.uniform1f(this.uParameterLocation, value);
        } else {
            console.error("Program not initialized or u_parameter location not found");
        }
    }

    render() {
        let currentTime = Date.now();
        let elapsedTime = (currentTime - this.startTime) / 1000.0; // Convert to seconds

        // Set up rendering to framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer.framebuffer);
        this.gl.useProgram(this.program1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

        this.gl.uniform1f(this.uTimeLocation1, elapsedTime);
        this.gl.uniform2f(this.uResolutionLocation1, this.canvas.width, this.canvas.height);

        const position = this.gl.getAttribLocation(this.program1, "a_position");
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // Set up rendering to screen
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.useProgram(this.program2);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.framebuffer.texture);

        this.gl.uniform1f(this.uTimeLocation2, elapsedTime);
        this.gl.uniform2f(this.uResolutionLocation2, this.canvas.width, this.canvas.height);
        this.gl.uniform1i(this.uTextureLocation, 0);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        requestAnimationFrame(this.render.bind(this));
    }
}

let app = null;

document.addEventListener("DOMContentLoaded", () => {
    app = new ShaderApp("glCanvas");
});

const inputParameter = document.getElementById("parameter1");

inputParameter.addEventListener("input", (event) => {
    const value = parseFloat(event.target.value);
    console.log("Input value changed:", value);
    app.updateParameter(value);
});

const socket = io.connect('http://localhost:3000')

socket.on('update_frontend', (data) => {
    console.log("Data received from Python:", data);
    if (data && typeof data.value === 'number') {
        app.updateParameter(data.value);
    }
});
