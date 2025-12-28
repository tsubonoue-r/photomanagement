'use client';

import { useState } from 'react';
import { CreateAlbumRequest, AlbumCover } from '@/types/album';

interface AlbumCreatorProps {
  projectId: string;
  onCreated: (albumId: string) => void;
  onCancel: () => void;
}

/**
 * Album Creator Component
 *
 * Provides a form for creating new albums with:
 * - Title and description
 * - Cover configuration
 * - Project assignment
 */
export function AlbumCreator({
  projectId,
  onCreated,
  onCancel,
}: AlbumCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<Partial<AlbumCover>>({
    backgroundColor: '#ffffff',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'basic' | 'cover'>('basic');

  /**
   * Update cover field
   */
  const updateCover = (field: keyof AlbumCover, value: string) => {
    setCover((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Submit album creation
   */
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const request: CreateAlbumRequest = {
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        cover,
      };

      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create album');
      }

      const album = await response.json();
      onCreated(album.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create album');
    } finally {
      setCreating(false);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Album</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex mb-6">
            <button
              onClick={() => setStep('basic')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                step === 'basic'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              1. Basic Info
            </button>
            <button
              onClick={() => setStep('cover')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                step === 'cover'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              2. Cover Design
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Basic Info Step */}
          {step === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter album title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter album description (optional)"
                  rows={3}
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
                  placeholder="Enter project name"
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
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Cover Design Step */}
          {step === 'cover' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Subtitle
                </label>
                <input
                  type="text"
                  value={cover.subtitle || ''}
                  onChange={(e) => updateCover('subtitle', e.target.value)}
                  placeholder="Enter subtitle (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={cover.date || new Date().toISOString().split('T')[0]}
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
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
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
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Cover Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Preview
                </label>
                <div
                  className="rounded-lg border border-gray-300 p-8 text-center"
                  style={{ backgroundColor: cover.backgroundColor }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {title || 'Album Title'}
                  </h3>
                  {cover.subtitle && (
                    <p className="text-gray-600 mb-4">{cover.subtitle}</p>
                  )}
                  {cover.projectName && (
                    <div className="inline-block px-3 py-1 border border-gray-300 rounded text-gray-700 mb-4">
                      {cover.projectName}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-4">
                    {cover.date}
                  </div>
                  {cover.companyName && (
                    <div className="text-gray-700 font-medium mt-2">
                      {cover.companyName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <div>
              {step === 'cover' && (
                <button
                  onClick={() => setStep('basic')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {step === 'basic' ? (
                <button
                  onClick={() => setStep('cover')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Album'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlbumCreator;
