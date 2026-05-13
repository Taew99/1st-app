import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const FULL_MAX_WIDTH = 1080;
const THUMB_MAX_WIDTH = 400;
const QUALITY = 0.7;

interface ProcessedImages {
  fullUri: string;
  thumbUri: string;
}

async function processImage(
  sourceUri: string,
  maxWidth: number,
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: maxWidth } }],
    { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function preparePostImages(sourceUri: string): Promise<ProcessedImages> {
  const [fullUri, thumbUri] = await Promise.all([
    processImage(sourceUri, FULL_MAX_WIDTH),
    processImage(sourceUri, THUMB_MAX_WIDTH),
  ]);
  return { fullUri, thumbUri };
}

async function uploadImageToStorage(
  localUri: string,
  storagePath: string,
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

  const { error } = await supabase.storage
    .from('post-images')
    .upload(storagePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('post-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadPostImages(
  userId: string,
  postId: string,
  fullUri: string,
  thumbUri: string,
): Promise<{ imageUrl: string; thumbUrl: string }> {
  const [imageUrl, thumbUrl] = await Promise.all([
    uploadImageToStorage(fullUri, `${userId}/${postId}/image.jpg`),
    uploadImageToStorage(thumbUri, `${userId}/${postId}/thumb.jpg`),
  ]);
  return { imageUrl, thumbUrl };
}

export async function deletePostImages(userId: string, postId: string): Promise<void> {
  await supabase.storage.from('post-images').remove([
    `${userId}/${postId}/image.jpg`,
    `${userId}/${postId}/thumb.jpg`,
  ]);
}
