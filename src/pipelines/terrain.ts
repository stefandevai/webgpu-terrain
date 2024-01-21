import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import { createTexture } from '../texture';
import { createUniformBuffer } from '../buffer';
import vertexShaderSource from '../data/shaders/default.vert.wgsl?raw';
import fragmentShaderSource from '../data/shaders/default.frag.wgsl?raw';
import type { PipelineData } from '../types';

const vertexSize = 8 * 4;
const positionOffset = 0;
const normalOffset = 4 * 3;
const uvOffset = 4 * 6;

export const getTerrainPipelineData = async (device: GPUDevice, presentationFormat: GPUTextureFormat): Promise<PipelineData> => {
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vertexShaderSource,
      }),
      entryPoint: 'main',
      buffers: [
        {
          arrayStride: vertexSize,
          attributes: [
            {
              shaderLocation: 0,
              offset: positionOffset,
              format: 'float32x3',
            },
            {
              shaderLocation: 1,
              offset: normalOffset,
              format: 'float32x3',
            },
            {
              shaderLocation: 2,
              offset: uvOffset,
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
      depthCompare: 'less-equal',
      format: 'depth24plus',
    },
  });

  const cubeTexture = await createTexture(device, `${import.meta.env.BASE_URL}assets/textures/stone.png`);

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'nearest',
  });

  const uniformDefinitions = makeShaderDataDefinitions(vertexShaderSource + fragmentShaderSource);

  const uniformValues = makeStructuredView(uniformDefinitions.uniforms.uniforms);

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

  return {
    uniformBuffer,
    uniformBindGroup,
    uniformValues,
    pipeline,
    meshData: [],
  }
}
