import FastNoiseLite from 'fastnoise-lite';
import { vec3 } from 'wgpu-matrix';
import type { Vec3 } from 'wgpu-matrix';
import type { Vector3, Size } from './types';

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

type HeightMap = {
  array: Float32Array;
  size: Size;
  yScale: number;
}

const generateHeightMap = (size: Size): HeightMap => {
  const heightMapSize = {
    w: size.w + 2,
    h: size.h + 2,
  };
  const yScale = 8;

  const heightMap = new Float32Array(heightMapSize.w * heightMapSize.h);

  // for (let j = 0; j < heightMapSize.h; j++) {
  //   for (let i = 0; i < heightMapSize.w; i++) {
  //     // heightMap[j * heightMapSize.w + i] = 0;
  //     // heightMap[j * heightMapSize.w + i] = Math.sin(i * 0.2) yScale;
  //     heightMap[j * heightMapSize.w + i] = (Math.sin(j * 0.2) + Math.cos(i * 0.2)) * yScale;
  //   }
  // }

  const noise = new FastNoiseLite();
  noise.SetSeed();
  noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
  noise.SetFrequency(0.02);
  noise.SetFractalType(FastNoiseLite.FractalType.FBm);
  noise.SetFractalOctaves(3);
  noise.SetFractalLacunarity(2);
  noise.SetFractalGain(0.5);
  noise.SetFractalWeightedStrength(0);

  for (let j = 0; j < heightMapSize.h; j++) {
    for (let i = 0; i < heightMapSize.w; i++) {
      heightMap[j * heightMapSize.w + i] = noise.GetNoise(i, j);
    }
  }

  return {
    array: heightMap,
    size: heightMapSize,
    yScale,
  };
}

// https://www.flipcode.com/archives/Calculating_Vertex_Normals_for_Height_Maps.shtml
// TODO: Try to improve based on this article:
// https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/perlin-noise-part-2/perlin-noise-computing-derivatives.html
const calculateNormals = (heightMap: HeightMap): Vec3[] => {
  const normals: Vec3[] = [];

  for (let j = 0; j < heightMap.size.h; j++) {
    for (let i = 0; i < heightMap.size.w; i++) {
      if (j == 0 || i == 0 || j == heightMap.size.h - 1 || i == heightMap.size.w - 1) {
        normals.push(vec3.fromValues(0, 0, 0));
        continue;
      }

      const x1 = heightMap.array[(j - 1) * heightMap.size.w + i];
      const x2 = heightMap.array[(j + 1) * heightMap.size.w + i];
      const y1 = heightMap.array[j * heightMap.size.w + i - 1];
      const y2 = heightMap.array[j * heightMap.size.w + i + 1];

      const dx = x1 - x2;
      const dy = y1 - y2;

      const normal = vec3.fromValues(dx * heightMap.yScale, -2, dy * heightMap.yScale);
      vec3.normalize(normal, normal);
      normals.push(normal);
    }
  }

  return normals;
}

const getQuadVertices = (heightMap: HeightMap, normals: Vec3[], offset: Vector3): number[] => {
  const quadSize = {
    x: 1,
    y: 1,
  };

  const index1 = heightMap.size.w*(offset.z + 2) + offset.x + 1;
  const index2 = heightMap.size.w*(offset.z + 2) + offset.x + 2;
  const index3 = heightMap.size.w*(offset.z + 1) + offset.x + 2;
  const index4 = heightMap.size.w*(offset.z + 1) + offset.x + 1;

  const scale = heightMap.yScale;

  return [
    offset.x,               offset.y + heightMap.array[index1] * scale, offset.z + quadSize.y,  ...normals[index1],  0, 1,
    offset.x + quadSize.x,  offset.y + heightMap.array[index2] * scale, offset.z + quadSize.y,  ...normals[index2],  1, 1,
    offset.x + quadSize.x,  offset.y + heightMap.array[index3] * scale, offset.z,               ...normals[index3],  1, 0,
    offset.x,               offset.y + heightMap.array[index4] * scale, offset.z,               ...normals[index4],  0, 0,
  ];
}

const getQuadIndices = (offset: number): number[] => {
  return [
    0 + offset * 4, 1 + offset * 4, 2 + offset * 4,
    3 + offset * 4, 0 + offset * 4, 2 + offset * 4,
  ];
}

const create = (): Mesh => {
  const size: Size = {
    w: 256,
    h: 256,
  };

  const heightMap = generateHeightMap(size);

  const normals = calculateNormals(heightMap);

  const verticesPerQuad = 2 * 2;
  const vertexCount = size.w * size.h * verticesPerQuad;

  const vertexLength = 8;
  const quadLength = vertexLength * verticesPerQuad;
  const bufferLength = size.w * size.h * quadLength;
  const vertexArray = new Float32Array(bufferLength);

  const indexCount = size.w * size.h * 6;
  const indexArray = new Uint32Array(indexCount);

  for (let j = 0; j < size.h; j++) {
    for (let i = 0; i < size.w; i++) {
      const quadOffset = {
        x: i,
        y: 0,
        z: j,
      };

      const bufferOffset = (j * size.w + i) * quadLength;
      vertexArray.set(getQuadVertices(heightMap, normals, quadOffset), bufferOffset);

      const indexOffset = (j * size.w + i) * 6;
      indexArray.set(getQuadIndices(j * size.w + i), indexOffset);
    }
  }

  return {
    vertexData: vertexArray,
    indexData: indexArray,
    vertexCount,
    indexCount,
  };
}

export default {
  create,
}
