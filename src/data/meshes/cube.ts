export const cubeVertexSize = 8 * 4;
export const cubePositionOffset = 0;
export const cubeNormalOffset = 4 * 3;
export const cubeUVOffset = 4 * 6;
export const cubeIndexCount = 36;

export const cubeVertexArray = new Float32Array([
  // position (f3), normal(f3) uv (f2)
  // right face
   1,  1,  1,  1,0,0,  0, 1,
   1, -1,  1,  1,0,0,  1, 1,
   1, -1, -1,  1,0,0,  1, 0,
   1,  1, -1,  1,0,0,  0, 0,

  // top face
  -1,  1,  1,  0,-1,0,  0, 1,
   1,  1,  1,  0,-1,0,  1, 1,
   1,  1, -1,  0,-1,0,  1, 0,
  -1,  1, -1,  0,-1,0,  0, 0,

  // left face
  -1, -1,  1, -1,0,0,  0, 1,
  -1,  1,  1, -1,0,0,  1, 1,
  -1,  1, -1, -1,0,0,  1, 0,
  -1, -1, -1, -1,0,0,  0, 0,

  // bottom face
   1, -1,  1,  0,1,0,  0, 1,
  -1, -1,  1,  0,1,0,  1, 1,
  -1, -1, -1,  0,1,0,  1, 0,
   1, -1, -1,  0,1,0,  0, 0,

  // front face
   1,  1,  1,  0,0,1,  0, 1,
  -1,  1,  1,  0,0,1,  1, 1,
  -1, -1,  1,  0,0,1,  1, 0,
   1, -1,  1,  0,0,1,  0, 0,

  // back face
   1, -1, -1,  0,0,-1,  0, 1,
  -1, -1, -1,  0,0,-1,  1, 1,
  -1,  1, -1,  0,0,-1,  1, 0,
   1,  1, -1,  0,0,-1,  0, 0,
]);

export const cubeIndexArray = new Uint32Array([
  0, 1, 2,
  3, 0, 2,

  4, 5, 6,
  7, 4, 6,

  8, 9, 10,
  11, 8, 10,

  12, 13, 14,
  15, 12, 14,

  16, 17, 18,
  18, 19, 16,

  20, 21, 22,
  23, 20, 22,
]);
