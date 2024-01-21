import type { StructuredView } from 'webgpu-utils';

export type Size = {
  w: number;
  h: number;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Mesh = {
  vertexData: Float32Array;
  indexData: Uint32Array;
  vertexCount: number;
  indexCount: number;
};

export type MeshData = {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  count: number;
};

export type HeightMap = {
  array: Float32Array;
  size: Size;
  yScale: number;
}

export type PipelineData = {
  uniformBuffer: GPUBuffer;
  uniformBindGroup: GPUBindGroup;
  uniformValues: StructuredView;
  pipeline: GPURenderPipeline;
  meshData: MeshData[];
};
