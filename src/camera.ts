import { mat4, vec3, utils } from 'wgpu-matrix';

type Position = {
  x: number;
  y: number;
  z: number;
};

const position: Position = { x: 50, y: 3, z: 40 };
const velocity = vec3.fromValues(0, 0, 0);
const moving = {
  left: false,
  right: false,
  forward: false,
  backward: false,
};

const speed = 10;
const modelViewProjectionMatrix = mat4.create();
const projection = mat4.create();
const view = mat4.create();
const target = vec3.fromValues(0, 0, 0);
const front = vec3.fromValues(0, 0, -1);
const up = vec3.fromValues(0, 1, 0);
const sensitivity = 0.1;
let yaw = -90;
let pitch = 0;

const updateKey = (e: KeyboardEvent, value: boolean): void => {
  switch (e.code) {
    case 'KeyW':
      moving.forward = value;
      e.preventDefault();
      e.stopPropagation();
      break;
    case 'KeyS':
      moving.backward = value;
      e.preventDefault();
      e.stopPropagation();
      break;
    case 'KeyA':
      moving.left = value;
      e.preventDefault();
      e.stopPropagation();
      break;
    case 'KeyD':
      moving.right = value;
      e.preventDefault();
      e.stopPropagation();
      break;
    default:
      break;
  }
}

const handleKeyDown = (e: KeyboardEvent): void => {
  updateKey(e, true);
}

const handleKeyUp = (e: KeyboardEvent): void => {
  updateKey(e, false);
}

const handleMouseMove = (e: MouseEvent): void => {
  yaw += e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;

  if (pitch > 89.0) {
    pitch = 89.0;
  }
  else if (pitch < -89.0) {
    pitch = -89.0;
  }
}

const handleLockChange = (): void => {
  if (document.pointerLockElement) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  } else {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  }
}

const init = (canvas: HTMLCanvasElement): void => {
  const devicePixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth * devicePixelRatio;
  const height = canvas.clientHeight * devicePixelRatio;

  canvas.width = width;
  canvas.height = height;

  const aspect = width / height;

  mat4.perspective(
    Math.PI / 4,
    aspect,
    1,
    100,
    projection,
  );

  canvas.addEventListener("click", async () => {
    if(!document.pointerLockElement) {
      // @ts-ignore
      await canvas.requestPointerLock({
        unadjustedMovement: true,
      });
    }
  });

  document.addEventListener("pointerlockchange", handleLockChange, false);
}

const updateMovement = (delta: DOMHighResTimeStamp): void => {
  if (moving.right) {
    vec3.mulScalar(vec3.normalize(vec3.cross(front, up, velocity), velocity), speed * delta, velocity);
  }
  if (moving.left) {
    vec3.mulScalar(vec3.normalize(vec3.cross(front, up, velocity), velocity), -speed * delta, velocity);
  }
  if (moving.forward) {
    vec3.mulScalar(front, speed * delta, velocity);
  }
  if (moving.backward) {
    vec3.mulScalar(front, -speed * delta, velocity);
  }


  front[0] = Math.cos(utils.degToRad(yaw)) * Math.cos(utils.degToRad(pitch));
  front[1] = Math.sin(utils.degToRad(pitch));
  front[2] = Math.sin(utils.degToRad(yaw)) * Math.cos(utils.degToRad(pitch));
  vec3.normalize(front, front);

  position.x += velocity[0];
  position.y += velocity[1];
  position.z += velocity[2];

  velocity[0] *= 0.93;
  velocity[1] *= 0.93;
  velocity[2] *= 0.93;
}

const update = (delta: DOMHighResTimeStamp): void => {
  updateMovement(delta);
}

const getTransformationMatrix = () => {
  // const now = Date.now() / 1000;
  // mat4.lookAt([Math.sin(now) * 50, position.y, Math.cos(now) * 50], target, up, view);
  const cameraPosition = vec3.fromValues(position.x, position.y, position.z);
  vec3.add(cameraPosition, front, target);

  mat4.lookAt(cameraPosition, target, up, view);
  // const viewMatrix = mat4.identity();
  // mat4.translate(viewMatrix, vec3.fromValues(0, 0, -30), viewMatrix);
  // mat4.rotate(viewMatrix, vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1, viewMatrix);
  mat4.multiply(projection, view, modelViewProjectionMatrix);

  return modelViewProjectionMatrix as Float32Array;
}

export default {
  init,
  update,
  getTransformationMatrix,
  position,
};
