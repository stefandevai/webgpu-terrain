import { mat4, vec3 } from 'wgpu-matrix';
import renderer from './renderer';
import './style.css';

const run = async () => {
  if (!navigator.gpu) {
    console.error('WebGPU not supported on this browser');
    return;
  }

  const canvas = document.querySelector('canvas');
  const devicePixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth * devicePixelRatio;
  const height = canvas.clientHeight * devicePixelRatio;
  canvas.width = width;
  canvas.height = height;

  await renderer.init(canvas);

  const aspect = canvas.width / canvas.height;

  const projectionMatrix = mat4.perspective(
    Math.PI / 4,
    aspect,
    1,
    100,
  );

  const modelViewProjectionMatrix = mat4.create();

  const getTransformationMatrix = () => {
    const now = Date.now() / 1000;
    const viewMatrix = mat4.identity();
    mat4.translate(viewMatrix, vec3.fromValues(0, 0, -20), viewMatrix);
    mat4.rotate(viewMatrix, vec3.fromValues(Math.sin(now), Math.cos(now), 0), 1, viewMatrix);
    mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

    return modelViewProjectionMatrix as Float32Array;
  }

  const frame = () => {
    renderer.render(getTransformationMatrix());
    requestAnimationFrame(frame);
  };

  frame();
}

run();
