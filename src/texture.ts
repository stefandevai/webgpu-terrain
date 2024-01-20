import type { Size } from './types';

export const createTexture = async (device: GPUDevice, path: string): Promise<GPUTexture> => {
  const res = await fetch(path);
  const bitmap = await createImageBitmap(await res.blob());

  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture: texture },
    [bitmap.width, bitmap.height],
  );

  return texture;
}

export const createDepthTexture = (device: GPUDevice, size: Size): GPUTexture => {
  return device.createTexture({
    size: [size.w, size.h],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

export const createCubemapTexture = async (device: GPUDevice, paths: string[]): Promise<GPUTexture> => {
  const promises = paths.map(async (path) => {
    const res = await fetch(path);
    return createImageBitmap(await res.blob());
  });

  const bitmaps = await Promise.all(promises);

  const texture = device.createTexture({
    dimension: '2d',
    size: [bitmaps[0].width, bitmaps[0].height, 6],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  for (let i = 0; i < bitmaps.length; i++) {
    const bitmap = bitmaps[i];

    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: texture, origin: [0, 0, i] },
      [bitmap.width, bitmap.height],
    );
  }

  return texture;
}
