"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, ImageIcon } from "lucide-react";

const AvatarViewer3D = dynamic(
  () => import("./AvatarViewer3D").then((m) => m.AvatarViewer3D),
  { ssr: false, loading: () => <div className="h-32 flex items-center justify-center text-gray-500 text-xs">3D loading...</div> }
);

interface DigitalTwinPanelProps {
  dressedImageUrl: string | null;
  basePhotoUrl: string | null;
  modelGlbUrl: string | null;
  isTryingOn?: boolean;
  className?: string;
}

export function DigitalTwinPanel({
  dressedImageUrl,
  basePhotoUrl,
  modelGlbUrl,
  isTryingOn = false,
  className = "",
}: DigitalTwinPanelProps) {
  const [show3d, setShow3d] = useState(Boolean(modelGlbUrl));

  useEffect(() => {
    if (modelGlbUrl) setShow3d(true);
  }, [modelGlbUrl]);

  const displayUrl = dressedImageUrl || basePhotoUrl;

  return (
    <div className={`flex flex-col flex-1 min-h-[280px] ${className}`}>
      <div className="flex gap-2 mb-2 justify-center">
        <button
          type="button"
          onClick={() => setShow3d(false)}
          className={`px-3 py-1 rounded-full text-xs ${!show3d ? "bg-violet-600 text-white" : "glass text-gray-400"}`}
        >
          <ImageIcon className="w-3 h-3 inline mr-1" />
          Photo twin
        </button>
        {modelGlbUrl && (
          <button
            type="button"
            onClick={() => setShow3d(true)}
            className={`px-3 py-1 rounded-full text-xs ${show3d ? "bg-violet-600 text-white" : "glass text-gray-400"}`}
          >
            <Box className="w-3 h-3 inline mr-1" />
            3D rotate
          </button>
        )}
      </div>

      {show3d && modelGlbUrl ? (
        <AvatarViewer3D modelUrl={modelGlbUrl} className="flex-1 min-h-[240px]" />
      ) : (
        <div
          className={`relative flex-1 min-h-[240px] rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center ${
            isTryingOn ? "ring-2 ring-cyan-400/50" : ""
          }`}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt="Your digital twin"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                if (!t.src.startsWith("data:") && basePhotoUrl?.startsWith("data:")) {
                  t.src = basePhotoUrl;
                }
              }}
            />
          ) : (
            <p className="text-gray-500 text-sm">Upload photo to see your twin</p>
          )}
        </div>
      )}
    </div>
  );
}
