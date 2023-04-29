import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Environment
const renderer = new THREE.WebGLRenderer();
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
scene.background = new THREE.Color(0x555555);
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
  renderer.render(scene, camera);
}
renderLoop();
