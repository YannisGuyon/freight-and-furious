import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Player } from "./player";
import { Rails } from "./rails";

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
  /*fov=*/ 80,
  /*aspect=*/ window.innerWidth / window.innerHeight,
  /*near=*/ 0.001,
  /*far=*/ 100
);

const controls = new OrbitControls(camera, renderer.domElement);
let debug_camera = false;

// Objects
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const spot = new THREE.PointLight(0xffffff, 1, 400);
scene.add(spot);
spot.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  )
);
spot.position.x = -20;
spot.position.y = 20;
spot.position.z = 20;

//const camera_placeholder_container = new THREE.Object3D();
const camera_placeholder = new THREE.Object3D();
camera_placeholder.position.y = 4;
camera_placeholder.position.z = 5;
//camera_placeholder.rotateX(90);
const camera_representation = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 1),
  new THREE.MeshStandardMaterial({ color: 0x996666 })
);
camera_placeholder.add(camera_representation);
scene.add(camera_placeholder);

const player = new Player(scene);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x123456 })
);
for (let i = 0; i < 30; ++i) {
  const building_parent = new THREE.Object3D();
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(
      THREE.MathUtils.randFloat(0.1, 0.7),
      THREE.MathUtils.randFloat(0.3, 1.2),
      THREE.MathUtils.randFloat(0.1, 0.7)
    ),
    new THREE.MeshStandardMaterial({ color: 0xaabbcc })
  );
  building.position.y = 6;
  building_parent.add(building);
  building_parent.setRotationFromQuaternion(new THREE.Quaternion().random());
  planet.add(building_parent);
}
scene.add(planet);

const rails = new Rails(scene);

const loader = new GLTFLoader();
loader.load(
  // resource URL
  "resources/gltf/old_train.glb",
  // called when the resource is loaded
  function (gltf) {
    gltf.scene.position.y = -3;
    gltf.scene.rotateX(Math.PI/4.0)
    camera_placeholder.add(gltf.scene);
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

new RGBELoader().setPath("resources/IBL/").load("IBL.hdr", function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// Inputs
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event: KeyboardEvent) {
  var keyCode = event.key;
  if (keyCode == "Shift") {
    debug_camera = !debug_camera;
    if (debug_camera) {
      camera.position.x = 0;
      camera.position.y = 0;
      camera.position.z = 20;
    }
  } else if (keyCode == "ArrowLeft") {
    player.StartMoveLeft();
  } else if (keyCode == "ArrowRight") {
    player.StartMoveRight();
  }
}

document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event: KeyboardEvent) {
  var keyCode = event.key;
  if (keyCode == "ArrowLeft") {
    player.EndMoveLeft();
  } else if (keyCode == "ArrowRight") {
    player.EndMoveRight();
  }
}

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
var background_plane = new THREE.PlaneGeometry(20, 20);
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

  player.Update(0.01);

  player.GetTrain().getWorldPosition(camera_placeholder.position);
  camera_placeholder.translateY(3);
  player.GetTrain().getWorldQuaternion(camera_placeholder.quaternion);

  rails.AddPoint(player.GetAbsolutePosition(), player.GetAbsoluteRotation());

  if (debug_camera) {
    controls.update();
  } else {
    camera_placeholder.getWorldPosition(camera.position);
    camera_placeholder.getWorldQuaternion(camera.quaternion);
  }
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene_background, camera);
  renderer.render(scene, camera);
}
renderLoop();
