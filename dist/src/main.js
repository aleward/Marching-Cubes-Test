import { mat4, vec3, vec2 } from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Camera from './Camera';
import { setGL } from './globals';
import ShaderProgram, { Shader } from './rendering/gl/ShaderProgram';
import MarchCube from './geometry/MarchCube';
import March from './March';
// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
    // TODO: add any controls you want
    'Cubes Across': 10,
    'Generate Mesh': function () { },
};
let screenQuad;
let outerCube;
function main() {
    // Initial display for framerate
    const stats = Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
    // TODO: add any controls you need to the gui
    const gui = new DAT.GUI();
    // E.G. gui.add(controls, 'tesselations', 0, 8).step(1);
    var cubesAcross = gui.add(controls, 'Cubes Across', 5, 50).step(1);
    var generate = gui.add(controls, 'Generate Mesh');
    // get canvas and webgl context
    const canvas = document.getElementById('canvas');
    function setSize(width, height) {
        canvas.width = width;
        canvas.height = height;
    }
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL 2 not supported!');
    }
    // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
    // Later, we can import `gl` from `globals.ts` to access it
    setGL(gl);
    screenQuad = new Square(vec3.fromValues(0, 0, 0));
    screenQuad.create();
    // MARCHING CUBES TESTS
    outerCube = new MarchCube(vec3.fromValues(0, 0, 0));
    const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.disable(gl.DEPTH_TEST);
    //gl.lineWidth(2);
    const raymarchShader = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/screenspace-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/raymarch-frag.glsl')),
    ]);
    // NEW MARCHCUBE VALUES
    const cubeMarch = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/marching-cubes-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/marching-cubes-frag.glsl')),
    ]);
    let cubeTrans = mat4.fromValues(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, -0.1, -0.2, 1.0);
    let cubeScale = mat4.fromValues(1.7, 0.0, 0.0, 0.0, 0.0, 1.7, 0.0, 0.0, 0.0, 0.0, 1.8, 0.0, 0.0, 0.0, 0.0, 1.0);
    outerCube.setScaleTrans(vec3.fromValues(1.7, 1.7, 1.8), vec3.fromValues(0.0, -0.1, -0.2));
    outerCube.create();
    /*let vec3arr = new Array(3);
    vec3arr[0] = vec3.fromValues(-1, -1, 0);
    vec3arr[1] = vec3.fromValues(1, -1, 0);
    vec3arr[2] = vec3.fromValues(1, 1, -1);
  
    let testTri = new Triangle(vec3.fromValues(0, 0, 0), vec3arr);
    testTri.setNorms();
    testTri.create();*/
    let cModelMat = mat4.create();
    mat4.multiply(cModelMat, cubeTrans, cubeScale);
    // ****YEP SO CUBE MARCHING HAPPENS FIRST BC NO COMPUTE SHADER ****
    // Initialize March structure - contains vertices and block divisions
    let mainMarch = new March(outerCube.tempRefScale, outerCube.tempRefTrans, outerCube.divisions);
    //mainMarch.testVertexSDFs();
    // *****************************************************************
    function setVals(modelMat) {
        cubeMarch.setEye(camera.controls.eye);
        cubeMarch.setViewMatrix(camera.viewMatrix);
        cubeMarch.setProjectionMatrix(camera.projectionMatrix);
        cubeMarch.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
        cubeMarch.setModelMatrix(modelMat);
    }
    let time = 0.;
    // This function will be called every frame
    function tick() {
        camera.update();
        stats.begin();
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // TODO: get / calculate relevant uniforms to send to shader here
        // TODO: send uniforms to shader
        raymarchShader.setEye(camera.controls.eye);
        raymarchShader.setViewMatrix(camera.viewMatrix);
        raymarchShader.setProjectionMatrix(camera.projectionMatrix);
        raymarchShader.setDimensions(vec2.fromValues(window.innerWidth, window.innerHeight));
        raymarchShader.setTime(time);
        // March!
        raymarchShader.draw(screenQuad);
        // TODO: more shaders to layer / process the first one? (either via framebuffers or blending)
        setVals(cModelMat);
        cubeMarch.setUnifDrawMode(2);
        gl.enable(gl.DEPTH_TEST);
        // Draw Cube corner display
        cubeMarch.draw(outerCube);
        // Draw triangles from cube marching, parse each block
        /*cubeMarch.setUnifDrawMode(0);
        cubeMarch.draw(testTri);*/
        gl.disable(gl.DEPTH_TEST);
        time = time + 1.0;
        stats.end();
        // Tell the browser to call `tick` again whenever it renders a new frame
        requestAnimationFrame(tick);
    }
    window.addEventListener('resize', function () {
        setSize(window.innerWidth, window.innerHeight);
        camera.setAspectRatio(window.innerWidth / window.innerHeight);
        camera.updateProjectionMatrix();
    }, false);
    setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    // Start the render loop
    tick();
}
main();
//# sourceMappingURL=main.js.map