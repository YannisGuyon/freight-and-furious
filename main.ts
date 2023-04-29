import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Environment
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(
  /*fov=*/ 80,
  /*aspect=*/ window.innerWidth / window.innerHeight,
  /*near=*/ 0.1,
  /*far=*/ 100
);

const controls = new OrbitControls(camera, renderer.domElement);
let debug_camera = false;

// Objects
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x555555);
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

const camera_placeholder_container = new THREE.Object3D();
const camera_placeholder = new THREE.Object3D();
camera_placeholder.position.y = 4;
camera_placeholder.position.z = 5;
camera_placeholder.rotateX(90);
const camera_representation = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 1),
  new THREE.MeshStandardMaterial({ color: 0x996666 })
);
camera_placeholder.add(camera_representation);
camera_placeholder_container.add(camera_placeholder);
scene.add(camera_placeholder_container);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(6),
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
  }
}

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

  camera_placeholder_container.rotateX(-0.01);

  if (debug_camera) {
    controls.update();
  } else {
    camera_placeholder.getWorldPosition(camera.position);
    camera_representation.getWorldQuaternion(camera.quaternion);
    camera.rotateX(-1.8);
  }
  renderer.render(scene, camera);
}
renderLoop();
