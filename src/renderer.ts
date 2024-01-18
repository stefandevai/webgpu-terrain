import { vec3 } from 'wgpu-matrix';
import type { Mat4 } from 'wgpu-matrix';
import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import vertexShaderSource from './data/shaders/default.vert.wgsl?raw';
import fragmentShaderSource from './data/shaders/default.frag.wgsl?raw';
import { createTexture, createDepthTexture } from './texture';
import { createVertexBuffer, createIndexBuffer, createUniformBuffer } from './buffer';
import {
  cubeVertexSize,
  cubePositionOffset,
  cubeNormalOffset,
  cubeUVOffset,
} from './data/meshes/cube';
import type { Mesh } from './mesh';

interface RenderData {
  uniformBuffer: GPUBuffer;
  uniformBindGroup: GPUBindGroup;
  renderPassDescriptor: GPURenderPassDescriptor;
  pipeline: GPURenderPipeline;
  meshData: MeshData[];
};

interface MeshData {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  count: number;
};

let renderData: RenderData | null = null;
let context: GPUCanvasContext | null = null;
let device: GPUDevice | null = null;

const lightColor = vec3.fromValues(1.0, 1.0, 1.0);
const lightPosition = vec3.fromValues(-5.0, -10.0, 15.0);

const uniformDefinitions = makeShaderDataDefinitions(vertexShaderSource + fragmentShaderSource);
const uniformValues = makeStructuredView(uniformDefinitions.uniforms.uniforms);

const init = async (canvas: HTMLCanvasElement): Promise<void> => {
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });

  if (adapter == null) {
    console.error('WebGPU not supported on this browser');
    return;
  }

  const adapterInfo = await adapter.requestAdapterInfo();
  console.log(`WebGPU vendor: ${adapterInfo.vendor}, architecture: ${adapterInfo.architecture}`);

  device = await adapter.requestDevice();

  if (!device) {
    console.error('WebGPU not supported on this browser');
    return;
  }

  context = canvas.getContext('webgpu') as GPUCanvasContext;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vertexShaderSource,
      }),
      entryPoint: 'main',
      buffers: [
        {
          arrayStride: cubeVertexSize,
          attributes: [
            {
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: 'float32x3',
            },
            {
              shaderLocation: 1,
              offset: cubeNormalOffset,
              format: 'float32x3',
            },
            {
              shaderLocation: 2,
              offset: cubeUVOffset,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShaderSource,
      }),
      entryPoint: 'main',
      targets: [
        {
          format: presentationFormat,
        },
      ]
    },
    primitive: {
      topology: 'triangle-list',
      // cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });

  const depthTexture = createDepthTexture(canvas, device);

  const cubeTexture = await createTexture(`${import.meta.env.BASE_URL}assets/textures/stone.png`, device);

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  const uniformBuffer = createUniformBuffer(device, uniformValues.arrayBuffer.byteLength);

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: cubeTexture.createView(),
      },
    ],
  });

  const renderPassDescriptor: GPURenderPassDescriptor = {
    // @ts-ignore
    colorAttachments: [
      {
        view: undefined,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  };

  renderData = {
    uniformBuffer,
    uniformBindGroup,
    renderPassDescriptor,
    pipeline,
    meshData: [],
  };
}

const pushMesh = (mesh: Mesh): void => {
  if (device == null || renderData == null) {
    return;
  }

  const vertexBuffer = createVertexBuffer(device, mesh.vertexData);
  const indexBuffer = createIndexBuffer(device, mesh.indexData);

  renderData.meshData.push({
    vertexBuffer,
    indexBuffer,
    count: mesh.indexCount,
  });
}

const render = (tranformationMatrix: Mat4): void => {
  if (device == null || context == null || renderData == null || !renderData.renderPassDescriptor.colorAttachments) {
    return;
  }

  // @ts-ignore
  renderData.renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

  uniformValues.set({
    mvp: tranformationMatrix,
    light_position: lightPosition,
    light_color: lightColor,
  });

  device.queue.writeBuffer(renderData.uniformBuffer, 0, uniformValues.arrayBuffer);

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderData.renderPassDescriptor);
  passEncoder.setPipeline(renderData.pipeline);
  passEncoder.setBindGroup(0, renderData.uniformBindGroup);

  for (const mesh of renderData.meshData) {
    // passEncoder.setVertexBuffer(0, mesh.vertexBuffer);
    // passEncoder.draw(mesh.count);

    passEncoder.setVertexBuffer(0, mesh.vertexBuffer);
    passEncoder.setIndexBuffer(mesh.indexBuffer, 'uint32');
    passEncoder.drawIndexed(mesh.count, 1, 0, 0);
  }

  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}

export default {
  init,
  render,
  pushMesh,
};
