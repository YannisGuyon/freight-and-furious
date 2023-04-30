import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Planet } from "./planet";
import { Player } from "./player";
import { Rails } from "./rails";
import { Train } from "./train";
import { Noise3D } from "./utils";

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
camera_representation.rotateX(Math.PI * 0.5);
camera_placeholder.add(camera_representation);
scene.add(camera_placeholder);

// Debug cube
// const box = new THREE.Mesh(
//   new THREE.BoxGeometry(0.1, 0.1, 0.1),
//   new THREE.MeshStandardMaterial({ color: 0xff0000 })
// );
// scene.add(box);
// box.position.x = ideal_camera_position.x;
// box.position.y = ideal_camera_position.y;
// box.position.z = ideal_camera_position.z;

const player = new Player(scene, planet_radius);
let playing = false;
let finished = false;
const gros_overlay = document.getElementById("GrosOverlay")!;
const encore_plus_gros_overlay = document.getElementById(
  "EncorePlusGrosOverlay"
)!;
let gros_overlay_opacity = 1;
const play_button = document.getElementById("PlayButton")!;
const replay_button = document.getElementById("ReplayButton")!;

const planet = new Planet(scene, planet_radius);

const rails = new Rails(scene);

const train = new Train(scene);

new RGBELoader().setPath("resources/IBL/").load("IBL.hdr", function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// Inputs
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event: KeyboardEvent) {
  if (finished) {
    return;
  }
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
    document.getElementById("Pause")!.style.display = debug_stop
      ? "block"
      : "none";
  }
}

document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event: KeyboardEvent) {
  if (finished) {
    return;
  }
  var keyCode = event.key;
  if (keyCode == "ArrowLeft") {
    StartPlaying();
    player.EndMoveLeft();
  } else if (keyCode == "ArrowRight") {
    StartPlaying();
    player.EndMoveRight();
  }
}

function GameLoop(duration: number, factor: number) {
  const speed_min = 0.5;
  const speed_max = 2.0;
  const speed =
    speed_min +
    Math.min(speed_max - speed_min, (speed_max - speed_min) * factor);
  let step = duration * speed;
  while (step > 0) {
    player.Update(Math.min(step, 0.001));
    const position = player.GetAbsolutePosition();
    const displacement =
      1 - Noise3D(position.clone().multiplyScalar(0.5)) * 0.05;
    position.multiplyScalar(displacement);
    rails.AddPoint(position, player.GetAbsoluteRotation());
    train.AddPoint(position, player.GetAbsoluteRotation());
    step -= 0.001;
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
      const position = player.GetAbsolutePosition();
      const displacement =
        1 - Noise3D(position.clone().multiplyScalar(0.5)) * 0.05;
      position.multiplyScalar(displacement);
      rails.AddPoint(position, player.GetAbsoluteRotation());
      train.AddPoint(position, player.GetAbsoluteRotation());
      if (rails.IsLoaded()) {
        break;
      }
    }
  }
}
play_button.addEventListener("click", StartPlaying);
replay_button.addEventListener("click", () => {
  location.reload();
});

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

const scene_post_effect = new THREE.Scene();
var uniforms_post_effect = {
  damage: { value: 0.0 },
  center: { type: "v2", value: new THREE.Vector2(1.0, 0.0) },
};
var post_effect_shader = new THREE.ShaderMaterial({
  uniforms: uniforms_post_effect,
  vertexShader: `
    out vec2 out_uv;
    void main() {
      gl_Position = vec4(position.x, position.y, 0.0, 1.0);
      out_uv = vec2(position.x/2.0+0.5, position.y/2.0+0.5);
    }
    `,
  fragmentShader: `
    precision highp float;
    in vec2 out_uv;
    out vec4 output_color;
    uniform float damage;
    uniform vec2 center;
    void main() {
      vec2 rescale_uv = out_uv;
      rescale_uv *= 1.0-rescale_uv.yx;
      float vig = pow(rescale_uv.x*rescale_uv.y*15.0, 0.25);
      output_color = vec4(vig+damage, vig, vig, 1.0);
    }
  `,
  glslVersion: THREE.GLSL3,
  blending: THREE.MultiplyBlending,
});
post_effect_shader.depthWrite = false;
var post_effect_plane = new THREE.PlaneGeometry(20, 20);
var post_effect_mesh = new THREE.Mesh(post_effect_plane, post_effect_shader);
scene_post_effect.add(post_effect_mesh);

// Events
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

function KeepWithin(
  object: THREE.Object3D,
  target: THREE.Vector3,
  max_distance: number,
  fixed_elevation: number
) {
  const object_to_target = target.clone().sub(object.position);
  if (object_to_target.length() > max_distance) {
    object_to_target.setLength(max_distance);
    const new_object_position = target.clone().sub(object_to_target);
    new_object_position.setLength(fixed_elevation);
    object.position.x = new_object_position.x;
    object.position.y = new_object_position.y;
    object.position.z = new_object_position.z;
  }
}

let previous_timestamp: null | number = null;
let time = 0;
let average_duration = 0.016;
function renderLoop(timestamp: number) {
  requestAnimationFrame(renderLoop);

  if (previous_timestamp == null) {
    previous_timestamp = timestamp;
  }
  average_duration = THREE.MathUtils.lerp(
    average_duration,
    (timestamp - previous_timestamp) / 1000,
    0.1
  );
  const duration = average_duration; // Can also be hardcoded to 0.016.

  let lerp_factor = 0.2;
  if (playing && gros_overlay_opacity > 0) {
    gros_overlay_opacity = Math.max(0, gros_overlay_opacity - duration);
    gros_overlay.style.opacity = gros_overlay_opacity.toString();
    if (gros_overlay_opacity == 0) {
      gros_overlay.style.display = "none";
    }
    lerp_factor = 1;
  }

  if (playing && !debug_stop && !finished) {
    time += duration;

    const factor = Math.max(0, Math.min(1, (time - 1) / 60));
    GameLoop(duration, factor);

    const sound_element = document.getElementById("Sound")! as HTMLMediaElement;
    sound_element.playbackRate = Math.max(1, Math.min(2, 1 + factor * 1));

    const map_position = document.getElementById("MapPosition")!;
    map_position.style.transform =
      "rotate(" + (factor * 180 - 90).toString() + "deg)";

    if (factor == 1) {
      finished = true;
      encore_plus_gros_overlay.style.display = "block";
      console.log("finished");
    }
    if (uniforms_post_effect.damage.value > 0.0) {
      uniforms_post_effect.damage.value -= 0.01;
    } else {
      uniforms_post_effect.damage.value = 0.0;
    }
  }

  const tip_position = player.GetAbsolutePosition();
  if (finished) {
    train.LaunchIntoSpace();
  } else {
    train.SetPosition(tip_position);
  }
  if (playing && !debug_stop) {
    train.SpawnSmoke();
  }

  const ideal_camera_position = player.GetIdealCameraPosition(camera_distance);
  const ideal_camera_rotation = player.GetAbsoluteRotation();

  if (lerp_factor == 1) {
    camera_placeholder.position.x = ideal_camera_position.x;
    camera_placeholder.position.y = ideal_camera_position.y;
    camera_placeholder.position.z = ideal_camera_position.z;
    camera_placeholder.setRotationFromQuaternion(ideal_camera_rotation);
  } else {
    const ideal_to_tip = tip_position.clone().sub(ideal_camera_position);
    // const camera_to_tip = tip_position.clone().sub(camera_placeholder.position);
    // camera_to_tip.setLength(ideal_to_tip.length());
    // const new_camera_position = tip_position.clone().sub(camera_to_tip);
    // new_camera_position.setLength(ideal_camera_position.length());
    // camera_placeholder.position.x = new_camera_position.x;
    // camera_placeholder.position.y = new_camera_position.y;
    // camera_placeholder.position.z = new_camera_position.z;
    KeepWithin(
      camera_placeholder,
      tip_position,
      ideal_to_tip.length(),
      ideal_camera_position.length()
    );

    KeepWithin(
      camera_placeholder,
      ideal_camera_position,
      ideal_to_tip.length() * 0.8,
      ideal_camera_position.length()
    );

    // camera_placeholder.setRotationFromQuaternion(ideal_camera_rotation);
    // camera_placeholder.setRotationFromQuaternion(
    //   new THREE.Quaternion().slerpQuaternions(
    //     camera_placeholder.quaternion,
    //     ideal_camera_rotation,
    //     lerp_factor
    //   )
    // );
    // const new_camera_to_tip = tip_position
    //   .clone()
    //   .sub(camera_placeholder.position);
    // camera_placeholder.setRotationFromQuaternion(
    //   new THREE.Quaternion().setFromUnitVectors(
    //     new_camera_to_tip.normalize(),
    //     camera_placeholder.position.clone().normalize()
    //   )
    // );

    // const new_camera_to_tip = tip_position
    //   .clone()
    //   .sub(camera_placeholder.position);
    // const quat = new THREE.Quaternion();
    // new_camera_to_tip.normalize();
    // const euler = new THREE.Euler(new_camera_to_tip.x,
    //   new_camera_to_tip.y, new_camera_to_tip.z);
    // quat.setFromEuler(euler);

    // const new_camera_to_tip = tip_position
    //   .clone()
    //   .sub(camera_placeholder.position);
    // new_camera_to_tip.normalize();
    // camera_placeholder.setRotationFromQuaternion(
    //   new THREE.Quaternion().setFromUnitVectors(
    //     camera_placeholder.position.clone().normalize(),new_camera_to_tip
    //   )
    // );

    // camera_placeholder.position.x = 0;
    // camera_placeholder.position.y = 0;
    // camera_placeholder.position.z = -12;

    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.lookAt(
      tip_position,
      camera_placeholder.position,
      camera_placeholder.position.clone().normalize().negate()
    );
    camera_placeholder.setRotationFromQuaternion(
      new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
    );
  }
  // camera_placeholder.position.lerpVectors(
  //   camera_placeholder.position,
  //   ideal_camera_position,
  //   lerp_factor
  // );
  // const ideal_to_tip = player.GetAbsolutePosition().sub(ideal_camera_position);
  // const camera_to_tip = player
  //   .GetAbsolutePosition()
  //   .sub(camera_placeholder.position);
  // camera_placeholder.position
  //   .add(camera_to_tip)
  //   .sub(camera_to_tip.clone().setLength(ideal_to_tip.length()));

  // camera_placeholder.position.lerpVectors(
  //   camera_placeholder.position,
  //   ideal_camera_position,
  //   lerp_factor
  // );
  // camera_placeholder.setRotationFromQuaternion(
  //   new THREE.Quaternion().slerpQuaternions(
  //     camera_placeholder.quaternion,
  //     ideal_camera_rotation,
  //     lerp_factor
  //   )
  // );
  planet.ReduceBuildings(camera_placeholder.position);

  if (playing && !finished) {
    var is_collide = planet.CheckCollision(
      train.GetAbsolutePosition(),
      train.GetAbsoluteDirection().negate()
    );
    if (is_collide) {
      uniforms_post_effect.damage.value = 0.6;
      collision_count++;
      document.getElementById("Score")!.textContent =
        "Score: " + collision_count.toString();
    }
  }
  if (!debug_stop) {
    planet.UpdateHit(duration);
  }

  document.getElementById("Fps")!.textContent =
    average_duration.toString() + " ms";

  if (debug_camera) {
    controls.update();
  } else {
    if (lerp_factor == 1) {
      camera_placeholder.getWorldPosition(camera.position);
      camera_placeholder.getWorldQuaternion(camera.quaternion);
    } else {
      camera_representation.getWorldPosition(camera.position);
      camera_representation.getWorldQuaternion(camera.quaternion);
      camera.rotateX(Math.PI * 0.5);
    }
  }

  if (playing && !debug_stop) {
    train.UpdateSmoke(duration, camera.quaternion);
  }

  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene_background, camera);
  renderer.render(scene, camera);
  renderer.render(scene_post_effect, camera);

  previous_timestamp = timestamp;
}
renderLoop(0);
