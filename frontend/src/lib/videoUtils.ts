/**
 * Video Utilities for parsing and embedding YouTube, Vimeo, and Direct Video URLs
 */

export interface ParsedVideo {
  type: 'youtube' | 'vimeo' | 'html5' | 'unknown';
  embedUrl?: string;
  directUrl?: string;
  valid: boolean;
}

export function parseVideoUrl(url?: string | null): ParsedVideo {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', valid: false };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { type: 'unknown', valid: false };
  }

  // 1. YouTube (watch?v=..., youtu.be/..., shorts/..., embed/...)
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
      valid: true,
    };
  }

  // 2. Vimeo (vimeo.com/123456789)
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      valid: true,
    };
  }

  // 3. Direct Video URLs (.mp4, .webm, .ogg, /uploads/...)
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('http://127.0.0.1:8000/uploads/') ||
    trimmed.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
  ) {
    return {
      type: 'html5',
      directUrl: trimmed,
      valid: true,
    };
  }

  // Fallback if generic https URL
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'html5',
      directUrl: trimmed,
      valid: true,
    };
  }

  return { type: 'unknown', valid: false };
}
