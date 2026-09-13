'use client';

import React from 'react';
import { parseVideoUrl } from '../lib/videoUtils';
import { Video, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title = 'Car Walkaround Video',
  className = '',
}) => {
  const parsed = parseVideoUrl(url);

  if (!parsed.valid) {
    return (
      <div className={`aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center ${className}`}>
        <Video className="w-10 h-10 mb-2 text-slate-500" />
        <p className="text-sm font-semibold">Video preview unavailable</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
        >
          Open link directly <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (parsed.type === 'youtube' || parsed.type === 'vimeo') {
    return (
      <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black ${className}`}>
        <iframe
          src={parsed.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black ${className}`}>
      <video
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        src={parsed.directUrl}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
