class ShaderApp {
    constructor(canvasElementId) {
        this.canvas = document.getElementById(canvasElementId);
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl) {
            console.log("WebGL 2 not supported by your browser.");
        }
        this.program = null;
        this.timeUniform = null;
        this.parameter1Uniform = null;
        this.initialize();
    }

    async loadShader(url) {
        const response = await fetch(url);
        return response.text();
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Shader Compilation Error:", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    async createShaderProgram(vertexShaderURL, fragmentShaderURL) {
        const vsSource = await this.loadShader(vertexShaderURL);
        const fsSource = await this.loadShader(fragmentShaderURL);

        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return null;

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Error linking shader program:", this.gl.getProgramInfoLog(program));
        }

        return program;
    }

    setupGeometryBuffers() {
        const vertices = new Float32Array([
            -1.0, 1.0,
            -1.0, -1.0,
            1.0, 1.0,
            1.0, 1.0,
            -1.0, -1.0,
            1.0, -1.0
        ])
    
        const vertexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
    
        return vertexBuffer
    }

    resizeCanvas() {
        this.canvas.style.width = window.innerWidth + "px"
        this.canvas.style.height = window.innerHeight + "px"

        let ratio = window.devicePixelRatio || 1
        this.canvas.width = window.innerWidth * ratio
        this.canvas.height = window.innerHeight * ratio

        this.gl.useProgram(this.program)

        const resolutionUniform = this.gl.getUniformLocation(this.program, 'u_resolution')
        this.gl.uniform2f(resolutionUniform, this.canvas.width, this.canvas.height)

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    }

    updateParameter(value) {
        this.gl.uniform1f(this.parameter1Uniform, value);
    }

    async initialize() {
        const startTime = performance.now();

        this.program = await this.createShaderProgram('shaders/shader.vert', 'shaders/shader.frag');
        if (!this.program) return;

        this.resizeCanvas();

        this.timeUniform = this.gl.getUniformLocation(this.program, 'u_time');
        this.parameter1Uniform = this.gl.getUniformLocation(this.program, 'u_parameter1');
        
        const vertexBuffer = this.setupGeometryBuffers();
        const position = this.gl.getAttribLocation(this.program, 'position');

        this.gl.useProgram(this.program);
        this.gl.enableVertexAttribArray(position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);

        const render = () => {
            const currentTime = performance.now()
            const elapsedTime = (currentTime - startTime) / 1000.0

            this.gl.uniform1f(this.timeUniform, elapsedTime)
            this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)

            requestAnimationFrame(render)
        };

        window.addEventListener('resize', () => this.resizeCanvas());
        render();
    }
}

const app = new ShaderApp('glCanvas');


const socket = io.connect('http://localhost:3000')

socket.on('update_frontend', (data) => {
    console.log("Data received from Python:", data);
    if (data && typeof data.value === 'number') {
        app.updateParameter(data.value);
    }
});
