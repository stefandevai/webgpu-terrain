import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import vertexShaderSource from '../data/shaders/cubemap.vert.wgsl?raw';
import fragmentShaderSource from '../data/shaders/cubemap.frag.wgsl?raw';
import { createCubemapTexture } from '../texture';
import { createUniformBuffer } from '../buffer';
import type { PipelineData } from '../types';

export const getCubemapPipelineData = async (device: GPUDevice, presentationFormat: GPUTextureFormat): Promise<PipelineData> => {
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vertexShaderSource,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShaderSource,
      }),
      entryPoint: 'main',
      targets: [{
        format: presentationFormat,
      }],
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less-equal',
      format: 'depth24plus',
    },
  });

  const texture = await createCubemapTexture(device, [
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/px.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/nx.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/py.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/ny.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/pz.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/nz.jpg`,
  ]);

  const sampler = device.createSampler({
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'nearest',
    mipmapFilter: 'nearest',
    maxAnisotropy: 1,
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
        resource: texture.createView({
          dimension: 'cube',
        }),
      },
    ],
  });

  return {
    uniformBuffer: uniformBuffer,
    uniformBindGroup: uniformBindGroup,
    uniformValues: uniformValues,
    pipeline: pipeline,
    meshData: [],
  };
}
