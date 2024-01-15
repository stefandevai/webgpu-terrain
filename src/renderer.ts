import { mat4, vec3, vec4 } from 'wgpu-matrix';
import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import vertexShaderSource from './data/shaders/default.vert.wgsl?raw';
import fragmentShaderSource from './data/shaders/default.frag.wgsl?raw';
import { createTexture, createDepthTexture } from './texture';
import { createVertexBuffer, createIndexBuffer, createUniformBuffer } from './buffer';
import {
  cubeVertexArray,
  cubeIndexArray,
  cubeVertexSize,
  cubePositionOffset,
  cubeNormalOffset,
  cubeUVOffset,
  cubeIndexCount
} from './data/meshes/cube';

interface RenderData {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  uniformBindGroup: GPUBindGroup;
  renderPassDescriptor: GPURenderPassDescriptor;
  pipeline: GPURenderPipeline;
};

let renderData: RenderData | null = null;
let context: GPUCanvasContext | null = null;
let device: GPUDevice | null = null;

const lightColor = vec3.fromValues(1.0, 1.0, 1.0);
const lightPosition = vec3.fromValues(-5.0, -10.0, 15.0);

const uniformDefinitions = makeShaderDataDefinitions(vertexShaderSource + fragmentShaderSource);
const uniformValues = makeStructuredView(uniformDefinitions.uniforms.uniforms);

const init = async (canvas: HTMLCanvasElement): Promise<void> => {
  const adapter = await navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();

  if (device == null) {
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

  const vertexBuffer = createVertexBuffer(device, cubeVertexArray);
  const indexBuffer = createIndexBuffer(device, cubeIndexArray);

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
      cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });

  const depthTexture = createDepthTexture(canvas, device);

  const cubeTexture = await createTexture('/assets/textures/stone.png', device);

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

  const renderPassDescriptor = {
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
    vertexBuffer,
    indexBuffer,
    uniformBuffer,
    uniformBindGroup,
    renderPassDescriptor,
    pipeline,
  };
}

const render = (tranformationMatrix: mat4): void => {
  if (device == null || context == null || renderData == null) {
    return;
  }

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
  passEncoder.setVertexBuffer(0, renderData.vertexBuffer);
  passEncoder.setIndexBuffer(renderData.indexBuffer, 'uint32');
  passEncoder.setBindGroup(0, renderData.uniformBindGroup);
  passEncoder.drawIndexed(cubeIndexCount, 1, 0, 0);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}

export default {
  init,
  render,
};
