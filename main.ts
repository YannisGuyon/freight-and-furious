import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Planet } from "./planet";
import { Player } from "./player";
import { Rails } from "./rails";
import { Sound } from "./sound";

let canvas = document.createElement("canvas");
canvas.style.visibility = "hidden";
canvas.style.opacity = "0";
var context = canvas.getContext("webgl2");
function CreateRenderer() {
  if (context) {
    return new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvas,
      context: context,
    });
  } else {
    return new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
  }
}

var collision_count = 0;

const renderer: THREE.WebGLRenderer = CreateRenderer();
renderer.setPixelRatio(window.devicePixelRatio);

// Environment
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(
  /*fov=*/ 60,
  /*aspect=*/ window.innerWidth / window.innerHeight,
  /*near=*/ 0.001,
  /*far=*/ 100
);
let sound: Sound | null = null;
const planet_radius = 10;
const camera_distance = 5;

const controls = new OrbitControls(camera, renderer.domElement);
let debug_camera = false;
let debug_stop = false;

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

const player = new Player(scene, planet_radius);

const planet = new Planet(scene, planet_radius);

const rails = new Rails(scene);

const train = new THREE.Object3D();
scene.add(train);
const loader = new GLTFLoader();
loader.load(
  // resource URL
  "resources/gltf/old_train.glb",
  // called when the resource is loaded
  function (gltf) {
    gltf.scene.scale.x = 0.001;
    gltf.scene.scale.y = 0.001;
    gltf.scene.scale.z = 0.001;
    train.add(gltf.scene);
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
  } else if (keyCode == " ") {
    debug_stop = !debug_stop;
  }
}

document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event: KeyboardEvent) {
  var keyCode = event.key;
  let user_triggered_event = false;
  if (keyCode == "ArrowLeft") {
    player.EndMoveLeft();
    user_triggered_event = true;
  } else if (keyCode == "ArrowRight") {
    player.EndMoveRight();
    user_triggered_event = true;
  }
  if (user_triggered_event && sound == null) {
    // Avoids "The AudioContext was not allowed to start.
    // It must be resumed (or created) after a user gesture on the page."
    sound = new Sound(camera);
  }
}

const scene_background = new THREE.Scene();
var uniforms_background = {
  time: { value: 0.5 },
  center: { type: "v2", value: new THREE.Vector2(1.0, 0.0) },
};
var sky_shader = new THREE.ShaderMaterial({
  uniforms: uniforms_background,
  vertexShader: `
    out vec2 out_uv;
    void main() {
        gl_Position = vec4(position.x, position.y, 0.0, 1.0);
        out_uv = vec2(position.x+1.0, position.y+1.0);
    }
    `,
  fragmentShader: `
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

let previous_timestamp: null | number = null;
let time = 0;
function renderLoop(timestamp: number) {
  requestAnimationFrame(renderLoop);

  if (previous_timestamp == null) {
    previous_timestamp = timestamp;
  }
  if (!debug_stop) {
    const duration = (timestamp - previous_timestamp) / 1000;
    time += duration;
    if (time > 1) {
      canvas.style.visibility = "visible";
      canvas.style.opacity = "" + Math.min(time - 1, 1);
    }

    const speed_min = 0.008;
    const speed_max = 0.015;
    let speed =
      speed_min + Math.min(speed_max - speed_min, (speed_max - speed_min) * (time / 30));
    while (speed > 0) {
      player.Update(Math.min(speed, 0.001));
      rails.AddPoint(
        player.GetAbsolutePosition(),
        player.GetAbsoluteRotation()
      );
      speed -= 0.001;
    }
  }

  player.GetTrain().getWorldPosition(train.position);
  player.GetTrain().getWorldQuaternion(train.quaternion);

  const ideal_camera_position = player.GetIdealCameraPosition(camera_distance);
  const ideal_camera_rotation = player.GetAbsoluteRotation();

  camera_placeholder.position.lerpVectors(
    camera_placeholder.position,
    ideal_camera_position,
    0.2
  );
  camera_placeholder.setRotationFromQuaternion(
    new THREE.Quaternion().slerpQuaternions(
      camera_placeholder.quaternion,
      ideal_camera_rotation,
      0.2
    )
  );
  planet.ReduceBuildings(camera_placeholder.position);

  rails.AddPoint(player.GetAbsolutePosition(), player.GetAbsoluteRotation());

  var is_collide = planet.CheckCollision(train);
  if (is_collide) {
    collision_count++;
    var score_element = document.getElementById("Collision");
    if (score_element) {
      score_element.textContent="Collision count: "+collision_count.toString();
    }
  }

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

  previous_timestamp = timestamp;
}
renderLoop(0);
