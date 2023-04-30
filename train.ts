import * as THREE from "three";
import { MathUtils } from "three";
import { LoadTrain, LoadWagon, LoadWagonCoal } from "./gltf";

const wagon_count = 4;
const distance_to_tip = 2;
const interwagon_distance = 0.4;

export class Train {
  loco = new THREE.Object3D();
  wagons = new Array<THREE.Object3D>(wagon_count);

  positions = new Array<THREE.Vector3>();
  rotations = new Array<THREE.Quaternion>();
  last_position = new THREE.Vector3();

  min_used_index = 0;

  constructor(scene: THREE.Object3D) {
    scene.add(this.loco);
    LoadTrain(this.loco);

    for (let i = 0; i < wagon_count; ++i) {
      this.wagons[i] = new THREE.Object3D();
      scene.add(this.wagons[i]);
    }
    LoadWagon(this.wagons);
    LoadWagonCoal(this.wagons);
  }

  public AddPoint(position: THREE.Vector3, rotation: THREE.Quaternion) {
    if (this.last_position.clone().sub(position).length() < 0.1) {
      return;
    }
    if (this.positions.length > 10000) {
      return; // Failsafe
    }
    this.positions.push(position.clone());
    this.rotations.push(rotation.clone());
    this.last_position = position.clone();
  }

  GetIndexForDistanceToTip(
    tip_position: THREE.Vector3,
    target_distance_to_tip: number
  ) {
    for (let i = this.positions.length - 1; i >= 0; --i) {
      if (
        this.positions[i].distanceTo(tip_position) >= target_distance_to_tip
      ) {
        return i;
      }
    }
    return this.positions.length - 1;
  }

  SetPositionOf(
    object: THREE.Object3D,
    tip_position: THREE.Vector3,
    target_distance_to_tip: number
  ) {
    const index = this.GetIndexForDistanceToTip(
      tip_position,
      target_distance_to_tip
    );
    let final_position = this.positions[index].clone();
    let final_rotation = this.rotations[index].clone();
    if (index < this.positions.length - 1) {
      const closer_position = this.positions[index + 1];
      const closer_rotation = this.rotations[index + 1];
      const further_position = this.positions[index];
      const further_rotation = this.rotations[index];
      let closer_distance = closer_position.distanceTo(tip_position);
      let further_distance = further_position.distanceTo(tip_position);
      closer_rotation;
      further_rotation;
      closer_distance;
      further_distance;
      final_rotation;
      if (
        further_distance >= target_distance_to_tip &&
        closer_distance < target_distance_to_tip
      ) {
        const lerp =
          (target_distance_to_tip - closer_distance) /
          (further_distance - closer_distance);
        final_position.lerpVectors(closer_position, further_position, lerp);
        const norm = MathUtils.lerp(
          closer_position.length(),
          further_position.length(),
          lerp
        );
        final_position.setLength(norm);
        final_rotation.slerpQuaternions(
          closer_rotation,
          further_rotation,
          lerp
        );
      }
    }
    object.position.x = final_position.x;
    object.position.y = final_position.y;
    object.position.z = final_position.z;
    object.setRotationFromQuaternion(final_rotation);

    this.min_used_index = Math.min(this.min_used_index, index);
  }

  public SetPosition(tip_position: THREE.Vector3) {
    if (this.positions.length == 0) {
      return;
    }

    this.min_used_index = this.positions.length - 1;
    this.SetPositionOf(this.loco, tip_position, distance_to_tip);
    for (let i = 0; i < wagon_count; ++i) {
      this.SetPositionOf(
        this.wagons[i],
        tip_position,
        distance_to_tip + interwagon_distance * (i + 1)
      );
    }
    if (this.min_used_index > 1000) {
      this.positions.splice(0, this.min_used_index - 1000);
      this.rotations.splice(0, this.min_used_index - 1000);
    }
  }

  public GetAbsolutePosition() {
    const position = new THREE.Vector3();
    this.loco.getWorldPosition(position);
    return position;
  }
}
