const socket = io.connect('http://localhost:3000')

socket.on('update_frontend', (data) => {
    console.log("Data received from Python:", data)
})



// Creat webgl canvas

const canvas = document.getElementById("glCanvas")
const gl = canvas.getContext("webgl2")

if (!gl) {
    console.log("WebGL 2 not supported by your browser.")
}

async function loadShader(url) {
    const response = await fetch(url)
    const data = await response.text()
    return data
}

function compileShader(type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader Compilation Error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}

async function createShaderProgram(vertexShaderURL, fragmentShaderURL) {
    const vsSource = await loadShader(vertexShaderURL)
    const fsSource = await loadShader(fragmentShaderURL)

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource)

    if (!vertexShader || !fragmentShader) return null

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking shader program:", gl.getProgramInfoLog(program))
    }

    return program
}

function setupGeometryBuffers() {
    const vertices = new Float32Array([
        -1.0, 1.0,
        -1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0
    ])

    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    return vertexBuffer
}

function resizeCanvas(program) {
    canvas.style.width = window.innerWidth + "px"
    canvas.style.height = window.innerHeight + "px"

    let ratio = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * ratio
    canvas.height = window.innerHeight * ratio

    gl.useProgram(program)

    const resolutionUniform = gl.getUniformLocation(program, 'u_resolution')
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height)

    gl.viewport(0, 0, canvas.width, canvas.height)
}

async function main() {
    const startTime = performance.now()

    const program = await createShaderProgram('shaders/shader.vert', 'shaders/shader.frag')
    if (!program) return

    resizeCanvas(program)

    const vertexBuffer = setupGeometryBuffers()
    const position = gl.getAttribLocation(program, 'position')
    const timeUniform = gl.getUniformLocation(program, 'u_time')

    gl.useProgram(program)
    gl.enableVertexAttribArray(position)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    function render() {
        const currentTime = performance.now()
        const elapsedTime = (currentTime - startTime) / 1000.0

        gl.uniform1f(timeUniform, elapsedTime)
        gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        requestAnimationFrame(render)
    }

    window.addEventListener('resize', () => resizeCanvas(program))

    render()
}

main()
