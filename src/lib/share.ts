import { isApiProject } from './project';
import { selectProject, useApiDesignerStore } from '../store/useApiDesignerStore';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toUrlSafeBase64 = (value: string) => value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromUrlSafeBase64 = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return padded;
};

const uint8ToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToUint8 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const compressText = async (text: string) => {
  if (!('CompressionStream' in window)) {
    return toUrlSafeBase64(btoa(encodeURIComponent(text)));
  }

  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  await writer.write(textEncoder.encode(text));
  await writer.close();
  const compressed = new Uint8Array(await new Response(stream.readable).arrayBuffer());
  return `gz.${toUrlSafeBase64(uint8ToBase64(compressed))}`;
};

const decompressText = async (encoded: string) => {
  if (encoded.startsWith('gz.')) {
    if (!('DecompressionStream' in window)) {
      return null;
    }
    const payload = encoded.slice(3);
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    await writer.write(base64ToUint8(fromUrlSafeBase64(payload)));
    await writer.close();
    const decompressed = new Uint8Array(await new Response(stream.readable).arrayBuffer());
    return textDecoder.decode(decompressed);
  }

  return decodeURIComponent(atob(fromUrlSafeBase64(encoded)));
};

export const buildShareLink = async () => {
  const project = JSON.stringify(selectProject(useApiDesignerStore.getState()));
  const payload = await compressText(project);
  const url = new URL(window.location.href);
  url.searchParams.set('share', payload);
  return url.toString();
};

export const decodeSharedProject = async (encoded: string) => {
  try {
    const raw = await decompressText(encoded);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isApiProject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
