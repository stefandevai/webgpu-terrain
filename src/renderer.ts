import { vec3 } from 'wgpu-matrix';
import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import type { StructuredView } from 'webgpu-utils';
import vertexShaderSource from './data/shaders/default.vert.wgsl?raw';
import fragmentShaderSource from './data/shaders/default.frag.wgsl?raw';
import vertexShaderSourceCubemap from './data/shaders/cubemap.vert.wgsl?raw';
import fragmentShaderSourceCubemap from './data/shaders/cubemap.frag.wgsl?raw';
import { createTexture, createDepthTexture, createCubemapTexture } from './texture';
import { createVertexBuffer, createIndexBuffer, createUniformBuffer } from './buffer';
import Camera from './camera';
import type { Mesh, MeshData } from './mesh';

enum PipelineType {
  Terrain = 'terrain',
  Cubemap = 'cubemap',
}

interface RenderData {
  renderPassDescriptor: GPURenderPassDescriptor;
  pipelines: {
    [key in PipelineType]: {
      uniformBuffer: GPUBuffer;
      uniformBindGroup: GPUBindGroup;
      uniformValues: StructuredView;
      pipeline: GPURenderPipeline;
      meshData: MeshData[];
    }
  };
};

let renderData: RenderData | null = null;
let context: GPUCanvasContext | null = null;
let device: GPUDevice | null = null;

const vertexSize = 8 * 4;
const positionOffset = 0;
const normalOffset = 4 * 3;
const uvOffset = 4 * 6;

// const lightColor = vec3.fromValues(1.0, 1.0, 1.0);
const lightColor = vec3.fromValues(0.976,0.973,0.784);
const lightPosition = vec3.fromValues(-5.0, -10.0, 15.0);

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

  // Cubemap pipeline
  const pipelineCubemap = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vertexShaderSourceCubemap,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShaderSourceCubemap,
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

  const cubemapTexture = await createCubemapTexture(device, [
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/px.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/nx.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/py.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/ny.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/pz.jpg`,
    `${import.meta.env.BASE_URL}assets/textures/cubemap2/nz.jpg`,
  ]);

  const samplerCubemap = device.createSampler({
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'nearest',
    mipmapFilter: 'nearest',
    maxAnisotropy: 1,
  });

  const uniformDefinitionsCubemap = makeShaderDataDefinitions(vertexShaderSourceCubemap + fragmentShaderSourceCubemap);

  const uniformValuesCubemap = makeStructuredView(uniformDefinitionsCubemap.uniforms.uniforms);

  const uniformBufferCubemap = createUniformBuffer(device, uniformValuesCubemap.arrayBuffer.byteLength);

  const uniformBindGroupCubemap = device.createBindGroup({
    layout: pipelineCubemap.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBufferCubemap,
        },
      },
      {
        binding: 1,
        resource: samplerCubemap,
      },
      {
        binding: 2,
        resource: cubemapTexture.createView({
          dimension: 'cube',
        }),
      },
    ],
  });

  // Terrain pipeline
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

  const depthTexture = createDepthTexture(device, { w: canvas.width, h: canvas.height });

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
    renderPassDescriptor,
    pipelines: {
      [PipelineType.Cubemap]: {
        uniformBuffer: uniformBufferCubemap,
        uniformBindGroup: uniformBindGroupCubemap,
        uniformValues: uniformValuesCubemap,
        pipeline: pipelineCubemap,
        meshData: [],
      },
      [PipelineType.Terrain]: {
        uniformBuffer,
        uniformBindGroup,
        uniformValues,
        pipeline,
        meshData: [],
      }
    }
  };
}

const pushMesh = (mesh: Mesh): void => {
  if (device == null || renderData == null) {
    return;
  }

  const vertexBuffer = createVertexBuffer(device, mesh.vertexData);
  const indexBuffer = createIndexBuffer(device, mesh.indexData);

  renderData.pipelines[PipelineType.Terrain].meshData.push({
    vertexBuffer,
    indexBuffer,
    count: mesh.indexCount,
  });
}

const render = (camera: Camera): void => {
  if (!device || !context || !renderData) {
    return;
  }

  // @ts-ignore
  renderData.renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderData.renderPassDescriptor);

  // Terrain pipeline
  renderData.pipelines[PipelineType.Terrain].uniformValues.set({
    mvp: camera.getTransformationMatrix(),
    light_position: lightPosition,
    light_color: lightColor,
  });
  device.queue.writeBuffer(
    renderData.pipelines[PipelineType.Terrain].uniformBuffer,
    0, 
    renderData.pipelines[PipelineType.Terrain].uniformValues.arrayBuffer
  );
  passEncoder.setPipeline(renderData.pipelines[PipelineType.Terrain].pipeline);
  passEncoder.setBindGroup(0, renderData.pipelines[PipelineType.Terrain].uniformBindGroup);

  for (const mesh of renderData.pipelines[PipelineType.Terrain].meshData) {
    passEncoder.setVertexBuffer(0, mesh.vertexBuffer);
    passEncoder.setIndexBuffer(mesh.indexBuffer, 'uint32');
    passEncoder.drawIndexed(mesh.count, 1, 0, 0);
  }

  // Cubemap pipeline
  renderData.pipelines[PipelineType.Cubemap].uniformValues.set({
    view_projection: camera.getCubemapMatrix(),
  });
  device.queue.writeBuffer(
    renderData.pipelines[PipelineType.Cubemap].uniformBuffer,
    0, 
    renderData.pipelines[PipelineType.Cubemap].uniformValues.arrayBuffer
  );
  passEncoder.setPipeline(renderData.pipelines[PipelineType.Cubemap].pipeline);
  passEncoder.setBindGroup(0, renderData.pipelines[PipelineType.Cubemap].uniformBindGroup);
  passEncoder.draw(3);

  // Draw
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]);
}

export default {
  init,
  render,
  pushMesh,
};
