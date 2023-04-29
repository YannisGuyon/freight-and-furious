import * as THREE from "three";

// Environment
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(
  /*fov=*/ 90,
  /*aspect=*/ window.innerWidth / window.innerHeight,
  /*near=*/ 1,
  /*far=*/ 100
);
camera.position.z = 3;

// Objects
const scene = new THREE.Scene();
scene.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x123456 })
  )
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
  renderer.render(scene, camera);
}
renderLoop();
