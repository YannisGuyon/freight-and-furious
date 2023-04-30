import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Planet } from "./planet";
import { Player } from "./player";
import { Rails } from "./rails";
import { LoadTrain, LoadWagon, LoadWagonCoal } from "./gltf";

function CreateRenderer() {
  let canvas = document.createElement("canvas");
  var context = canvas.getContext("webgl2");
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
let playing = false;
const gros_overlay = document.getElementById("GrosOverlay")!;
let gros_overlay_opacity = 1;
const play_button = document.getElementById("PlayButton")!;

const planet = new Planet(scene, planet_radius);

const rails = new Rails(scene);

const train = new THREE.Object3D();
scene.add(train);
LoadTrain(train);
const wagon_count = 4;
const wagons = new Array<THREE.Object3D>(wagon_count);
for (let i = 0; i < wagon_count; ++i) {
  wagons[i] = new THREE.Object3D();
  scene.add(wagons[i]);
}
LoadWagon(wagons);
LoadWagonCoal(wagons);

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
    StartPlaying();
    player.EndMoveLeft();
    user_triggered_event = true;
  } else if (keyCode == "ArrowRight") {
    StartPlaying();
    player.EndMoveRight();
    user_triggered_event = true;
  }
  if (user_triggered_event) {
    // Avoids "The AudioContext was not allowed to start.
    // It must be resumed (or created) after a user gesture on the page."
    //sound = new Sound(camera);
  }
}

function GameLoop(duration: number, factor: number) {
  const speed_min = 0.05;
  const speed_max = 2.0;
  const speed =
    speed_min +
    Math.min(speed_max - speed_min, (speed_max - speed_min) * factor);
  let step = duration * speed;
  while (step > 0) {
    player.Update(Math.min(step, 0.001));
    rails.AddPoint(player.GetAbsolutePosition(), player.GetAbsoluteRotation());
    step -= 0.001;
    player.UpdatePath();
  }
}
function StartPlaying() {
  if (!playing) {
    playing = true;
    const sound_element = document.getElementById("Sound")! as HTMLMediaElement;
    sound_element.play();

    // Kickstart trails
    for (let i = 0; i < 1000; ++i) {
      player.Update(0.001);
      rails.AddPoint(
        player.GetAbsolutePosition(),
        player.GetAbsoluteRotation()
      );
      if (rails.IsLoaded()) {
        console.log("enough " + i);
        break;
      }
      player.UpdatePath();
    }
  }
}
play_button.addEventListener("click", StartPlaying);

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
  const duration = (timestamp - previous_timestamp) / 1000;

  let lerp_factor = 0.2;
  if (playing && gros_overlay_opacity > 0) {
    gros_overlay_opacity = Math.max(0, gros_overlay_opacity - duration);
    gros_overlay.style.opacity = gros_overlay_opacity.toString();
    if (gros_overlay_opacity == 0) {
      gros_overlay.style.display = "none";
    }
    lerp_factor = 1;
  }

  if (playing && !debug_stop) {
    time += duration;

    const factor = Math.max(0, Math.min(1, (time - 1) / 30));
    GameLoop(duration, factor);

    const sound_element = document.getElementById("Sound")! as HTMLMediaElement;
    sound_element.playbackRate = Math.max(1, Math.min(2, 1 + factor * 1));

    const map_position = document.getElementById("MapPosition")!;
    map_position.style.transform =
      "rotate(" + (factor * 180 - 90).toString() + "deg)";
    // transform: rotate(90deg);

    // document.getElementById("Debug")!.textContent =
    //   "Factor " + factor.toString();
  }

  player.GetTrain().getWorldPosition(train.position);
  player.GetTrain().getWorldQuaternion(train.quaternion);
  for (var i=0; i<wagon_count; ++i) {
    player.GetWagon(i).getWorldPosition(wagons[i].position);
    player.GetWagon(i).getWorldQuaternion(wagons[i].quaternion);
  }
  
  const ideal_camera_position = player.GetIdealCameraPosition(camera_distance);
  const ideal_camera_rotation = player.GetAbsoluteRotation();

  camera_placeholder.position.lerpVectors(
    camera_placeholder.position,
    ideal_camera_position,
    lerp_factor
  );
  camera_placeholder.setRotationFromQuaternion(
    new THREE.Quaternion().slerpQuaternions(
      camera_placeholder.quaternion,
      ideal_camera_rotation,
      lerp_factor
    )
  );
  planet.ReduceBuildings(camera_placeholder.position);

  rails.AddPoint(player.GetAbsolutePosition(), player.GetAbsoluteRotation());

  var is_collide = planet.CheckCollision(train);
  if (is_collide) {
    collision_count++;
    document.getElementById("Collision")!.textContent =
      "Collision count: " + collision_count.toString();
  }

  document.getElementById("Fps")!.textContent = duration.toString() + " ms";

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
