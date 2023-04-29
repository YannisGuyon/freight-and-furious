import * as THREE from "three";

export class Player {
  direction_container = new THREE.Object3D();
  direction = new THREE.Object3D();

  constructor(scene: THREE.Object3D) {
    this.direction.position.y = 6;
    this.direction.rotateX(-Math.PI * 0.5);
    const direction_representation = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x66aa66 })
    );
    this.direction.add(direction_representation);
    this.direction_container.add(this.direction);
    scene.add(this.direction_container);
  }

  public MoveLeft() {
    this.direction_container.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.2);
  }
  public MoveRight() {
    this.direction_container.rotateOnAxis(new THREE.Vector3(0, 1, 0), -0.2);
  }
  public Update(step: number) {
    this.direction_container.rotateOnAxis(new THREE.Vector3(-1, 0, 0), step);
  }

  public GetAbsolutePosition() {
    const position = new THREE.Vector3();
    this.direction.getWorldPosition(position);
    return position;
  }
  public GetAbsoluteRotation() {
    const rotation = new THREE.Quaternion();
    this.direction.getWorldQuaternion(rotation);
    return rotation;
  }
}
