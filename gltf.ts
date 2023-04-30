import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Noise3D } from "./utils";

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
    function () {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
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
    function () {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
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
    function () {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (error) {
      console.log("An error happened: " + error);
    }
  );
}

export function LoadRock(planet:THREE.Object3D, location_y:number, parent:Array<THREE.Object3D>, buildings_scale:Array<number>, rock_count:number) {
  loader.load(
    // resource URL
    "resources/gltf/rock1.glb",
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.position.y = location_y;
      for (var i=0; i<rock_count; ++i) {
        const building_parent = new THREE.Object3D();
        building_parent.setRotationFromQuaternion(
          new THREE.Quaternion().random()
        );
        planet.add(building_parent);
        const scaling = 0.0005+Math.random()*0.001;
        buildings_scale.push(scaling);
        gltf.scene.scale.x = scaling;
        gltf.scene.scale.y = scaling;
        gltf.scene.scale.z = scaling;
        var rock = gltf.scene.clone();
        building_parent.add(rock);
        var world_space_position = new THREE.Vector3();
        rock.getWorldPosition(world_space_position);
        world_space_position.x *= 0.5;
        world_space_position.y *= 0.5;
        world_space_position.z *= 0.5;
        const noise = Noise3D(world_space_position)*0.05;
        rock.position.y -= location_y*noise;
        parent.push(rock);
      }
    },
    // called while loading is progressing
    function () {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (error) {
      console.log("An error happened: " + error);
    }
  );
}

export function LoadCrate(planet:THREE.Object3D, location_y:number, parent:Array<THREE.Object3D>, crate_count:number) {
  loader.load(
    // resource URL
    "resources/gltf/crate.glb",
    // called when the resource is loaded
    function (gltf) {
      gltf.scene.position.y = location_y;
      for (var i=0; i<crate_count; ++i) {
        const crate_parent = new THREE.Object3D();
        crate_parent.setRotationFromQuaternion(
          new THREE.Quaternion().random()
        );
        planet.add(crate_parent);
        const scaling = 0.001;
        gltf.scene.scale.x = scaling;
        gltf.scene.scale.y = scaling;
        gltf.scene.scale.z = scaling;
        var crate = gltf.scene.clone();
        crate_parent.add(crate);
        var world_space_position = new THREE.Vector3();
        crate.getWorldPosition(world_space_position);
        world_space_position.x *= 0.5;
        world_space_position.y *= 0.5;
        world_space_position.z *= 0.5;
        const noise = Noise3D(world_space_position)*0.05;
        crate.position.y -= location_y*noise;
        parent.push(crate);
      }
    },
    // called while loading is progressing
    function () {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (error) {
      console.log("An error happened: " + error);
    }
  );
}
