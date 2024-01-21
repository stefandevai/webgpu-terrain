import { vec3 } from 'wgpu-matrix';
import { getTerrainPipelineData } from './pipelines/terrain';
import { getCubemapPipelineData } from './pipelines/cubemap';
import { createDepthTexture } from './texture';
import { createVertexBuffer, createIndexBuffer } from './buffer';
import Camera from './camera';
import type { Mesh, PipelineData } from './types';

enum PipelineType {
  Terrain = 'terrain',
  Cubemap = 'cubemap',
}

interface RenderData {
  renderPassDescriptor: GPURenderPassDescriptor;
  pipelines: {
    [key in PipelineType]: PipelineData;
  };
};

let renderData: RenderData | null = null;
let context: GPUCanvasContext | null = null;
let device: GPUDevice | null = null;

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

  const pipelineDataTerrain = await getTerrainPipelineData(device, presentationFormat);

  const pipelineDataCubemap = await getCubemapPipelineData(device, presentationFormat);

  const depthTexture = createDepthTexture(device, { w: canvas.width, h: canvas.height });

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
      [PipelineType.Cubemap]: pipelineDataCubemap,
      [PipelineType.Terrain]: pipelineDataTerrain,
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
