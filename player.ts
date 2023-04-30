import * as THREE from "three";

const length_player_path = 1000;

function Modulus(a:number, b:number) {
  return ((a % b) + b) % b;
}

export class Player {
  pivot = new THREE.Object3D();
  empty = new THREE.Object3D();
  path_representation = new Array<THREE.Object3D>(length_player_path);
  current_player_index = 0;
  current_train_index = 700;
  is_go_right = false;
  is_go_left = false;

  constructor(scene: THREE.Object3D, height: number) {
    this.empty.position.y = height;
    this.pivot.add(this.empty);
    scene.add(this.pivot);
    for (let i = 0; i < length_player_path; i++) {
      this.path_representation[i] = new THREE.Object3D();
      scene.add(this.path_representation[i]);
    }
  }

  public StartMoveLeft() {
    this.is_go_left = true;
  }
  public StartMoveRight() {
    this.is_go_right = true;
  }
  public EndMoveLeft() {
    this.is_go_left = false;
  }
  public EndMoveRight() {
    this.is_go_right = false;
  }

  public UpdatePath() {
    this.empty.getWorldPosition(
      this.path_representation[this.current_player_index].position
    );
    this.empty.getWorldQuaternion(
      this.path_representation[this.current_player_index].quaternion
    );
    this.current_player_index =
      (this.current_player_index + 1) % length_player_path;
    this.current_train_index =
      (this.current_train_index + 1) % length_player_path;
  }

  public Update(step: number) {
    this.pivot.rotateOnAxis(new THREE.Vector3(-1, 0, 0), step);

    if (this.is_go_left && !this.is_go_right) {
      this.pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), step * 3);
    } else if (!this.is_go_left && this.is_go_right) {
      this.pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), -step * 3);
    }
  }

  public GetTrain() {
    return this.path_representation[this.current_train_index];
  }

  public GetWagon(index:number) {
    return this.path_representation[Modulus(this.current_train_index-48*(index+1), length_player_path)];
  }

  public GetAbsolutePosition() {
    const position = new THREE.Vector3();
    this.empty.getWorldPosition(position);
    return position;
  }
  public GetAbsoluteRotation() {
    const rotation = new THREE.Quaternion();
    this.empty.getWorldQuaternion(rotation);
    return rotation;
  }

  public GetIdealCameraPosition(camera_distance: number) {
    const forward = new THREE.Vector3(0, 0, -camera_distance).applyQuaternion(
      this.GetAbsoluteRotation()
    );
    return this.GetAbsolutePosition().sub(forward);
  }
}
