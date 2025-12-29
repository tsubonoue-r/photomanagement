"use client";

/**
 * スケッチキャンバスコンポーネント（スタブ）
 */

import React from "react";

interface SketchCanvasProps {
  width?: number;
  height?: number;
  disabled?: boolean;
}

export function SketchCanvas({ width = 300, height = 200, disabled }: SketchCanvasProps) {
  return (
    <canvas
      width={width}
      height={height}
      className="border border-zinc-300 rounded-md bg-white"
      style={{ opacity: disabled ? 0.5 : 1 }}
    />
  );
}
