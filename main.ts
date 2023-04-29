let gl: WebGL2RenderingContext;
let timeLoc: WebGLUniformLocation = 0;
let aspectRatioLoc: WebGLUniformLocation = 0;
let startTime: number = 0;

window.onload = function () {
    var canvas = document.getElementById('freight_and_furious_canvas') as HTMLCanvasElement;
    if (canvas === null) {
        return;
    }
    gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) as WebGL2RenderingContext;
    if (!gl) {
        throw new Error("WebGL2 not supported")
    }

    const vertex_shader = createShader(
        gl,
        gl.VERTEX_SHADER,
        `#version 300 es
        in vec4 position;
        out vec2 uv;
        void main() {
            gl_Position = position;
            uv = vec2(position.xy);
        }`) as WebGLShader;

    const fragment_shader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        `#version 300 es
        precision highp float;
        in vec2 uv;
        out vec4 output_color;
        void main(void) {
            output_color = vec4(uv, 0.0, 1.0);
        }`) as WebGLShader;
    const program = createProgram(gl, [vertex_shader, fragment_shader]);
    gl.useProgram(program);

    timeLoc = gl.getUniformLocation(program, "time") as WebGLUniformLocation;
    aspectRatioLoc = gl.getUniformLocation(program, "aspectRatio") as WebGLUniformLocation;

    const buffer_position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(gl.getAttribLocation(program, "position"));
    gl.vertexAttribPointer(gl.getAttribLocation(program, "position"), 2, gl.FLOAT, false, 0, 0);
    render();
}

function render() {
    if (gl.canvas.width!==gl.canvas.clientWidth||
        gl.canvas.height!==gl.canvas.clientHeight) {
        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(render);
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    const compilation_error = gl.getShaderInfoLog(shader) as string;
    throw new Error(compilation_error);
}

function createProgram(gl: WebGL2RenderingContext, shaders: WebGLShader[]): WebGLProgram {
    const program = gl.createProgram() as WebGLProgram;
    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    const link_error = gl.getProgramInfoLog(program) as string;
    throw new Error(link_error);
}
