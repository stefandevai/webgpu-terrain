import FastNoiseLite from 'fastnoise-lite';
import { vec3 } from 'wgpu-matrix';
import type { Vec3 } from 'wgpu-matrix';

export type Mesh = {
  vertexData: Float32Array;
  indexData: Uint32Array;
  vertexCount: number;
  indexCount: number;
};

type Size = {
  w: number;
  h: number;
};

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type HeightMap = {
  array: Float32Array;
  size: Size;
  normals: Vec3[];
  yScale: number;
}

const generateHeightMap = (size: Size): HeightMap => {
  const heightMapSize = {
    w: size.w + 2,
    h: size.h + 2,
  };

  const heightMap = new Float32Array(heightMapSize.w * heightMapSize.h);
  const normals: Vec3[] = [];

  // for (let j = 0; j < heightMapSize.h; j++) {
  //   for (let i = 0; i < heightMapSize.w; i++) {
  //     heightMap[j * heightMapSize.w + i] = Math.sin(i) + Math.cos(j);
  //     // heightMap[j * size.w + i] = 0;
  //   }
  // }

  const yScale = 0;
  const noise = new FastNoiseLite();
  noise.SetSeed(1337);
  noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
  noise.SetFrequency(0.08);

    /* noise.SetSeed(seed); */
  /* noise.SetNoiseType(FastNoiseLite::NoiseType::NoiseType_OpenSimplex2S); */
  /* noise.SetRotationType3D(FastNoiseLite::RotationType3D_ImproveXYPlanes); */
  /* noise.SetFrequency(simplex_freq); */
  /* noise.SetFractalType(FastNoiseLite::FractalType::FractalType_FBm); */
  /* noise.SetFractalOctaves(simplex_octaves); */
  /* noise.SetFractalLacunarity(simplex_lacunarity); */
  /* noise.SetFractalGain(simplex_gain); */
  /* noise.SetFractalWeightedStrength(simplex_weighted_strength); */


  for (let j = 0; j < heightMapSize.h; j++) {
    for (let i = 0; i < heightMapSize.w; i++) {
      heightMap[j * heightMapSize.w + i] = noise.GetNoise(i, j) * yScale;
    }
  }

  // Calculate normals
  // https://www.flipcode.com/archives/Calculating_Vertex_Normals_for_Height_Maps.shtml
  for (let j = 0; j < heightMapSize.h; j++) {
    for (let i = 0; i < heightMapSize.w; i++) {
      if (j == 0 || j == 0 || j == heightMapSize.h - 1 || i == heightMapSize.w - 1) {
        normals.push(vec3.fromValues(0, 0, 0));
        continue;
      }

      const x1 = heightMap[(j - 1) * heightMapSize.w + i];
      const x2 = heightMap[(j + 1) * heightMapSize.w + i];
      const y1 = heightMap[j * heightMapSize.w + i - 1];
      const y2 = heightMap[j * heightMapSize.w + i + 1];

      const dx = x1 - x2;
      const dy = y1 - y2;

      const normal = vec3.fromValues(dx, -2, dy);
      vec3.normalize(normal, normal);
      normals.push(normal);
      console.log(normal)
    }
  }

  return {
    array: heightMap,
    size: heightMapSize,
    normals,
    yScale,
  };
}

const getQuadVertices = (heightMap: HeightMap, offset: Vector3): Float32Array => {
  const quadSize = {
    x: 1,
    y: 1,
  };

  const index1 = heightMap.size.w*(offset.z + 2) + offset.x + 1;
  const index2 = heightMap.size.w*(offset.z + 2) + offset.x + 2;
  const index3 = heightMap.size.w*(offset.z + 1) + offset.x + 2;
  const index4 = heightMap.size.w*(offset.z + 1) + offset.x + 1;

  return [
    offset.x,               offset.y + heightMap.array[index1], offset.z + quadSize.y,  ...heightMap.normals[index1], 0, 1,
    offset.x + quadSize.x,  offset.y + heightMap.array[index2], offset.z + quadSize.y,  ...heightMap.normals[index2],  1, 1,
    offset.x + quadSize.x,  offset.y + heightMap.array[index3], offset.z,               ...heightMap.normals[index3],  1, 0,
    offset.x,               offset.y + heightMap.array[index4], offset.z,               ...heightMap.normals[index4],  0, 0,
  ];
}

const getQuadIndices = (offset: number): Uint32Array => {
  return [
    0 + offset*4, 1 + offset * 4, 2 + offset * 4,
    3 + offset * 4, 0 + offset * 4, 2 + offset * 4,
  ];
}

const create = (): Mesh => {
  const size: Size = {
    w: 256,
    h: 256,
  };

  const heightMap = generateHeightMap(size);

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
      vertexArray.set(getQuadVertices(heightMap, quadOffset), bufferOffset);

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
