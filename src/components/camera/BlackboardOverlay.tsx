'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Move,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
} from 'lucide-react';
import type { BlackboardTemplate, BlackboardFieldValue } from '@/types/blackboard';
import { drawBlackboard } from '@/lib/blackboard';

export type BlackboardPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';

export interface BlackboardOverlayState {
  visible: boolean;
  position: BlackboardPosition;
  customPosition: { x: number; y: number };
  scale: number;
  opacity: number;
}

interface BlackboardOverlayProps {
  template: BlackboardTemplate | null;
  values: BlackboardFieldValue[];
  state: BlackboardOverlayState;
  onStateChange: (state: BlackboardOverlayState) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

const POSITION_PRESETS = {
  'top-left': { label: '左上', icon: CornerUpLeft },
  'top-right': { label: '右上', icon: CornerUpRight },
  'bottom-left': { label: '左下', icon: CornerDownLeft },
  'bottom-right': { label: '右下', icon: CornerDownRight },
};

export function BlackboardOverlay({
  template,
  values,
  state,
  onStateChange,
  containerRef,
}: BlackboardOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);

  // Draw blackboard to canvas
  useEffect(() => {
    if (!template || !canvasRef.current) return;
    drawBlackboard(canvasRef.current, template, values);
  }, [template, values]);

  // Calculate position based on preset or custom
  const getPosition = useCallback(() => {
    if (!containerRef?.current || state.position === 'custom') {
      return state.customPosition;
    }

    const container = containerRef.current.getBoundingClientRect();
    const padding = 20;
    const blackboardWidth = (template?.width || 300) * state.scale;
    const blackboardHeight = (template?.height || 200) * state.scale;

    switch (state.position) {
      case 'top-left':
        return { x: padding, y: padding };
      case 'top-right':
        return { x: container.width - blackboardWidth - padding, y: padding };
      case 'bottom-left':
        return { x: padding, y: container.height - blackboardHeight - padding };
      case 'bottom-right':
        return { x: container.width - blackboardWidth - padding, y: container.height - blackboardHeight - padding };
      default:
        return state.customPosition;
    }
  }, [containerRef, state.position, state.customPosition, state.scale, template]);

  // Handle touch start for dragging
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - state.customPosition.x,
        y: e.touches[0].clientY - state.customPosition.y,
      });
    }
  }, [state.customPosition]);

  // Handle touch move for dragging
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;

    onStateChange({
      ...state,
      position: 'custom',
      customPosition: { x: newX, y: newY },
    });
  }, [isDragging, dragStart, state, onStateChange]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse events for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - state.customPosition.x,
      y: e.clientY - state.customPosition.y,
    });
  }, [state.customPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    onStateChange({
      ...state,
      position: 'custom',
      customPosition: { x: newX, y: newY },
    });
  }, [isDragging, dragStart, state, onStateChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    onStateChange({ ...state, visible: !state.visible });
  }, [state, onStateChange]);

  // Set position preset
  const setPositionPreset = useCallback((position: BlackboardPosition) => {
    onStateChange({ ...state, position });
  }, [state, onStateChange]);

  // Adjust scale
  const adjustScale = useCallback((delta: number) => {
    const newScale = Math.max(0.3, Math.min(2, state.scale + delta));
    onStateChange({ ...state, scale: newScale });
  }, [state, onStateChange]);

  // Adjust opacity
  const adjustOpacity = useCallback((value: number) => {
    onStateChange({ ...state, opacity: value });
  }, [state, onStateChange]);

  if (!template || !state.visible) {
    return null;
  }

  const position = getPosition();
  const width = template.width * state.scale;
  const height = template.height * state.scale;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Blackboard */}
      <div
        ref={overlayRef}
        className="absolute pointer-events-auto touch-none cursor-move"
        style={{
          left: position.x,
          top: position.y,
          width,
          height,
          opacity: state.opacity,
          transition: isDragging ? 'none' : 'left 0.2s, top 0.2s',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setShowControls(!showControls)}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />

        {/* Drag handle indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded text-white text-[10px] flex items-center gap-1">
          <Move className="w-3 h-3" />
          ドラッグで移動
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-3 pointer-events-auto">
          {/* Position Presets */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-xs">位置</span>
            <div className="flex gap-1">
              {(Object.entries(POSITION_PRESETS) as [BlackboardPosition, { label: string; icon: typeof CornerUpLeft }][]).map(
                ([key, { icon: Icon }]) => (
                  <button
                    key={key}
                    onClick={() => setPositionPreset(key)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                      state.position === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Scale */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-xs">サイズ</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustScale(-0.1)}
                className="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <span className="text-white text-xs w-12 text-center">
                {Math.round(state.scale * 100)}%
              </span>
              <button
                onClick={() => adjustScale(0.1)}
                className="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opacity */}
          <div className="flex items-center justify-between">
            <span className="text-white text-xs">透明度</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.1"
                value={state.opacity}
                onChange={(e) => adjustOpacity(parseFloat(e.target.value))}
                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-white text-xs w-10 text-right">
                {Math.round(state.opacity * 100)}%
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowControls(false)}
            className="mt-3 w-full py-2 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}

// Control button for camera view
export function BlackboardToggleButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        visible
          ? 'bg-blue-600 text-white'
          : 'bg-black/50 text-white hover:bg-black/70'
      }`}
    >
      {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
    </button>
  );
}
