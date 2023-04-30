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

export function LoadRock(planet:THREE.Object3D, location_y:number, parent:Array<THREE.Object3D>, rock_count:number) {
  loader.load(
    // resource URL
    "resources/gltf/rock1.glb",
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.position.y = location_y;
      gltf.scene.scale.x = 0.002;
      gltf.scene.scale.y = 0.002;
      gltf.scene.scale.z = 0.002;
      for (var i=0; i<rock_count; ++i) {
        const building_parent = new THREE.Object3D();
        building_parent.setRotationFromQuaternion(
          new THREE.Quaternion().random()
        );
        planet.add(building_parent);
        var rock = gltf.scene.clone();
        building_parent.add(rock);
        parent.push(rock);
      }
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
