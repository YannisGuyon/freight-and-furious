import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

export function LoadTrain(train:THREE.Object3D) {
  loader.load(
    // resource URL
    "resources/gltf/old_train.glb",
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.scale.x = 0.001;
      gltf.scene.scale.y = 0.001;
      gltf.scene.scale.z = 0.001;
      train.add(gltf.scene);
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
}

export function LoadWagon(wagons:Array<THREE.Object3D>) {
  loader.load(
    // resource URL
    "resources/gltf/wagon.glb",
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.scale.x = 0.001;
      gltf.scene.scale.y = 0.001;
      gltf.scene.scale.z = 0.001;
      wagons[1].add(gltf.scene);
      wagons[2].add(gltf.scene.clone());
      wagons[3].add(gltf.scene.clone());
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
}

export function LoadWagonCoal(wagons:Array<THREE.Object3D>) {
  loader.load(
    // resource URL
    "resources/gltf/wagon_coal.glb",
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.scale.x = 0.001;
      gltf.scene.scale.y = 0.001;
      gltf.scene.scale.z = 0.001;
      wagons[0].add(gltf.scene);
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
}
