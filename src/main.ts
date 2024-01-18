import renderer from './renderer';
import camera from './camera';
import mesh from './mesh'
import './style.css';

const run = async () => {
  if (!navigator.gpu) {
    console.error('WebGPU not supported on this browser');
    return;
  }

  const canvas = document.querySelector('canvas');

  if (!canvas) {
    console.error('No canvas found');
    return;
  }

  camera.init(canvas);
  await renderer.init(canvas);

  let lastTime: DOMHighResTimeStamp | null = null;

  const meshObject = mesh.create();
  renderer.pushMesh(meshObject);

  const frame = (currentTime?: DOMHighResTimeStamp) => {
    // currentTime is undefined on the first frame
    if (!currentTime) {
      requestAnimationFrame(frame);
      return;
    }

    if (lastTime == null) {
      lastTime = currentTime;
    }

    const delta = (currentTime - lastTime) / 1000.0;
    lastTime = currentTime;
    
    camera.update(delta);
    renderer.render(camera.getTransformationMatrix());
    requestAnimationFrame(frame);
  };

  frame();
}

run();
