'use client';

import { useState } from 'react';
import { Album, AlbumCover, ExportOptions } from '@/types/album';

interface AlbumEditorProps {
  album: Album;
  onUpdate: (updates: Partial<Album>) => void;
}

/**
 * Album Editor Component
 *
 * Provides editing capabilities for:
 * - Album title and description
 * - Cover configuration
 * - Export options
 */
export function AlbumEditor({ album, onUpdate }: AlbumEditorProps) {
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description || '');
  const [cover, setCover] = useState<AlbumCover>(album.cover);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(
    album.exportOptions
  );
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Update cover field
   */
  const updateCover = (field: keyof AlbumCover, value: string) => {
    setCover((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  /**
   * Update export options
   */
  const updateExportOptions = <K extends keyof ExportOptions>(
    field: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  /**
   * Save changes
   */
  const handleSave = () => {
    onUpdate({
      title,
      description,
      cover,
      exportOptions,
    });
    setHasChanges(false);
  };

  /**
   * Reset changes
   */
  const handleReset = () => {
    setTitle(album.title);
    setDescription(album.description || '');
    setCover(album.cover);
    setExportOptions(album.exportOptions);
    setHasChanges(false);
  };

  /**
   * Background color presets
   */
  const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f3f4f6' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Green', value: '#dcfce7' },
    { name: 'Yellow', value: '#fef9c3' },
    { name: 'Pink', value: '#fce7f3' },
  ];

  return (
    <div className="space-y-8">
      {/* Basic Info Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Album Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
              {album.status.charAt(0).toUpperCase() + album.status.slice(1)}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasChanges(true);
              }}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Cover Settings Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cover Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Title
            </label>
            <input
              type="text"
              value={cover.title}
              onChange={(e) => updateCover('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={cover.subtitle || ''}
              onChange={(e) => updateCover('subtitle', e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={cover.projectName || ''}
              onChange={(e) => updateCover('projectName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={cover.companyName || ''}
              onChange={(e) => updateCover('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={cover.date || ''}
              onChange={(e) => updateCover('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateCover('backgroundColor', preset.value)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    cover.backgroundColor === preset.value
                      ? 'border-blue-600 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
              <input
                type="color"
                value={cover.backgroundColor || '#ffffff'}
                onChange={(e) => updateCover('backgroundColor', e.target.value)}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>
        </div>

        {/* Cover Preview */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Preview
          </label>
          <div
            className="rounded-lg border border-gray-300 p-6 text-center max-w-md"
            style={{ backgroundColor: cover.backgroundColor }}
          >
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              {cover.title}
            </h4>
            {cover.subtitle && (
              <p className="text-sm text-gray-600 mb-3">{cover.subtitle}</p>
            )}
            {cover.projectName && (
              <div className="inline-block px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 mb-3">
                {cover.projectName}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-3">{cover.date}</div>
            {cover.companyName && (
              <div className="text-sm text-gray-700 font-medium mt-1">
                {cover.companyName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Options Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Default Export Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paper Size
            </label>
            <select
              value={exportOptions.paperSize}
              onChange={(e) =>
                updateExportOptions('paperSize', e.target.value as 'A4' | 'A3')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos per Page
            </label>
            <select
              value={exportOptions.layout}
              onChange={(e) =>
                updateExportOptions('layout', parseInt(e.target.value, 10) as 1 | 2 | 4)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">1 photo</option>
              <option value="2">2 photos</option>
              <option value="4">4 photos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orientation
            </label>
            <select
              value={exportOptions.orientation}
              onChange={(e) =>
                updateExportOptions(
                  'orientation',
                  e.target.value as 'portrait' | 'landscape'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality
            </label>
            <select
              value={exportOptions.quality}
              onChange={(e) =>
                updateExportOptions(
                  'quality',
                  e.target.value as 'standard' | 'high'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="high">High Quality</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exportOptions.includeCover}
              onChange={(e) =>
                updateExportOptions('includeCover', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Cover Page</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exportOptions.includeToc}
              onChange={(e) =>
                updateExportOptions('includeToc', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Table of Contents</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={exportOptions.includeBlackboard}
              onChange={(e) =>
                updateExportOptions('includeBlackboard', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include Blackboard Overlay</span>
          </label>
        </div>
      </div>

      {/* Save/Reset Buttons */}
      {hasChanges && (
        <div className="flex justify-end gap-3 sticky bottom-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

export default AlbumEditor;
