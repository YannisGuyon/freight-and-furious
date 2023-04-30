import * as THREE from "three";

export class Player {
  pivot = new THREE.Object3D();
  empty = new THREE.Object3D();
  is_go_right = false;
  is_go_left = false;

  constructor(scene: THREE.Object3D, height: number) {
    this.empty.position.y = height;
    this.pivot.add(this.empty);
    scene.add(this.pivot);
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

  public Update(step: number) {
    this.pivot.rotateOnAxis(new THREE.Vector3(-1, 0, 0), step);

    if (this.is_go_left && !this.is_go_right) {
      this.pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), step * 4);
    } else if (!this.is_go_left && this.is_go_right) {
      this.pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), -step * 4);
    }
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
