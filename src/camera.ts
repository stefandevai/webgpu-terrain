import { mat4, vec3, utils } from 'wgpu-matrix';

type Position = {
  x: number;
  y: number;
  z: number;
};

class Camera {
  position: Position = { x: 50, y: 5, z: 100 };
  velocity = vec3.fromValues(0, 0, 0);
  moving = {
    left: false,
    right: false,
    forward: false,
    backward: false,
  };
  speed = 10;
  aspectRatio = 1;
  modelViewProjectionMatrix = mat4.create();
  cubemapMatrix = mat4.create();
  projection = mat4.create();
  view = mat4.create();
  target = vec3.fromValues(0, 0, 0);
  front = vec3.fromValues(0, 0, -1);
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  sensitivity = 0.1;
  yaw = -90;
  pitch = 0;

  constructor(canvas: HTMLCanvasElement) {
    const devicePixelRatio = window.devicePixelRatio;
    const width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.clientHeight * devicePixelRatio;

    canvas.width = width;
    canvas.height = height;

    this.aspectRatio = width / height;

    mat4.perspective(
      Math.PI / 4,
      this.aspectRatio,
      1,
      1000,
      this.projection,
    );

    this.handleLockChange = this.handleLockChange.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.updateKey = this.updateKey.bind(this);

    canvas.addEventListener("click", async () => {
      if(!document.pointerLockElement) {
        // @ts-ignore
        await canvas.requestPointerLock({
          unadjustedMovement: true,
        });
      }
    });

    document.addEventListener("pointerlockchange", this.handleLockChange, false);
  }

  handleLockChange(): void {
    if (document.pointerLockElement) {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
    } else {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
    }
  }

  updateKey(e: KeyboardEvent, value: boolean): void {
    switch (e.code) {
      case 'KeyW':
        this.moving.forward = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyS':
        this.moving.backward = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyA':
        this.moving.left = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyD':
        this.moving.right = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      default:
        break;
    }
  }

  handleKeyDown(e: KeyboardEvent): void {
    this.updateKey(e, true);
  }

  handleKeyUp(e: KeyboardEvent): void {
    this.updateKey(e, false);
  }

  handleMouseMove(e: MouseEvent): void {
    this.yaw += e.movementX * this.sensitivity;
    this.pitch -= e.movementY * this.sensitivity;

    if (this.pitch > 89.0) {
      this.pitch = 89.0;
    }
    else if (this.pitch < -89.0) {
      this.pitch = -89.0;
    }
  }

  updateMovement(delta: DOMHighResTimeStamp): void {
    if (this.moving.right) {
      vec3.normalize(vec3.cross(this.front, this.up, this.velocity), this.velocity);
      vec3.mulScalar(this.velocity, this.speed * delta, this.velocity);
    }
    if (this.moving.left) {
      vec3.normalize(vec3.cross(this.front, this.up, this.velocity), this.velocity);
      vec3.mulScalar(this.velocity, -this.speed * delta, this.velocity);
    }
    if (this.moving.forward) {
      vec3.mulScalar(this.front, this.speed * delta, this.velocity);
    }
    if (this.moving.backward) {
      vec3.mulScalar(this.front, -this.speed * delta, this.velocity);
    }

    this.front[0] = Math.cos(utils.degToRad(this.yaw)) * Math.cos(utils.degToRad(this.pitch));
    this.front[1] = Math.sin(utils.degToRad(this.pitch));
    this.front[2] = Math.sin(utils.degToRad(this.yaw)) * Math.cos(utils.degToRad(this.pitch));
    vec3.normalize(this.front, this.front);

    this.position.x += this.velocity[0];
    this.position.y += this.velocity[1];
    this.position.z += this.velocity[2];

    this.velocity[0] *= 0.93;
    this.velocity[1] *= 0.93;
    this.velocity[2] *= 0.93;

    const cameraPosition = vec3.fromValues(this.position.x, this.position.y, this.position.z);
    vec3.add(cameraPosition, this.front, this.target);

    mat4.lookAt(cameraPosition, this.target, this.up, this.view);
    mat4.multiply(this.projection, this.view, this.modelViewProjectionMatrix);
  }

  update(delta: DOMHighResTimeStamp): void {
    this.updateMovement(delta);
  }

  getTransformationMatrix(): Float32Array {
    return this.modelViewProjectionMatrix as Float32Array;
  }

  getCubemapMatrix(): Float32Array {
    mat4.copy(this.view, this.cubemapMatrix);
    this.cubemapMatrix[12] = 0;
    this.cubemapMatrix[13] = 0;
    this.cubemapMatrix[14] = 0;
    mat4.multiply(this.projection, this.cubemapMatrix, this.cubemapMatrix);
    mat4.inverse(this.cubemapMatrix, this.cubemapMatrix);

    return this.cubemapMatrix as Float32Array;
  }
}

export default Camera;
