import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

function CreateRenderer() {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('webgl2');
  if (context) {
      return new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          canvas: canvas,
          context: context
      });
  } else {
      return new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
      });
  }
}

const renderer:THREE.WebGLRenderer = CreateRenderer();
renderer.setPixelRatio(window.devicePixelRatio);

// Environment
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(
  /*fov=*/ 90,
  /*aspect=*/ window.innerWidth / window.innerHeight,
  /*near=*/ 0.1,
  /*far=*/ 100
);
camera.position.z = 3;

const controls = new OrbitControls(camera, renderer.domElement);

let time = 0;

// Objects
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const spot = new THREE.PointLight(0xffffff, 1);
scene.add(spot);
spot.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  )
);

scene.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(),
    new THREE.MeshStandardMaterial({ color: 0x123456 })
  )
);

const loader = new GLTFLoader();
loader.load(
  // resource URL
  "resources/gltf/monkey.glb",
  // called when the resource is loaded
  function (gltf) {
    gltf.scene.position.x = 3;
    scene.add(gltf.scene);
    gltf.animations; // Array<THREE.AnimationClip>
    gltf.scene; // THREE.Group
    gltf.scenes; // Array<THREE.Group>
    gltf.cameras; // Array<THREE.Camera>
    gltf.asset; // Object
  },
  // called while loading is progressing
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("An error happened: " + error);
  }
);

new RGBELoader()
  .setPath('resources/IBL/')
  .load('IBL.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });

const scene_background = new THREE.Scene();
var uniforms_background = {
  "time": {value: 0.5},
  "center": {type: "v2", value: new THREE.Vector2(1.0, 0.0)},
};
var sky_shader = new THREE.ShaderMaterial({
  uniforms : uniforms_background,
  vertexShader : `
    out vec2 out_uv;
    void main() {
        gl_Position = vec4(position.x, position.y, 0.0, 1.0);
        out_uv = vec2(position.x+1.0, position.y+1.0);
    }
    `,
  fragmentShader : `
    precision highp float;
    in vec2 out_uv;
    out vec4 output_color;
    uniform float time;
    uniform vec2 center;
    void main() {
      highp float dist = length(out_uv-center)*0.56;
      output_color = vec4(mix(vec3(0.682, 0.886, 0.973), vec3(0.063, 0.153, 0.239), dist), 1.0);
    }
  `,
  glslVersion: THREE.GLSL3,
});
sky_shader.depthWrite = false;
var background_plane = new THREE.PlaneGeometry(2, 2);
var background_mesh = new THREE.Mesh(background_plane, sky_shader);
scene_background.add(background_mesh);

// Events
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}
function renderLoop() {
  requestAnimationFrame(renderLoop);

  time += 0.01;
  spot.position.x = 2 * Math.cos(time);
  spot.position.y = 2 * Math.sin(time);

  controls.update();

  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene_background, camera);
  renderer.render(scene, camera);
}
renderLoop();
