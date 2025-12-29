'use client';

import { useState } from 'react';
import { Album, ExportOptions, PaperSize, PhotoLayout } from '@/types/album';

interface ExportDialogProps {
  album: Album;
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
  initialOptions: ExportOptions;
}

/**
 * Export Dialog Component
 *
 * Provides export configuration:
 * - Format selection (PDF/Excel)
 * - Paper size and layout
 * - Quality settings
 * - Blackboard options
 */
export function ExportDialog({
  album,
  onExport,
  onClose,
  initialOptions,
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(initialOptions);
  const [exporting, setExporting] = useState(false);

  /**
   * Update option field
   */
  const updateOption = <K extends keyof ExportOptions>(
    field: K,
    value: ExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    setExporting(true);
    await onExport(options);
    setExporting(false);
  };

  /**
   * Calculate estimated pages
   */
  const calculatePages = () => {
    const photosPerPage = options.layout;
    const contentPages = Math.ceil(album.photos.length / photosPerPage);
    const hasCover = options.includeCover ? 1 : 0;
    const hasToc = options.includeToc ? 1 : 0;
    return contentPages + hasCover + hasToc;
  };

  /**
   * Calculate estimated file size
   */
  const calculateFileSize = () => {
    const baseSize = options.format === 'pdf' ? 0.5 : 0.1; // MB per photo
    const qualityMultiplier = options.quality === 'high' ? 2 : 1;
    const sizeInMb = album.photos.length * baseSize * qualityMultiplier + 1;
    return `~${Math.round(sizeInMb * 10) / 10} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Export Album</h2>
            <button
              onClick={onClose}
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

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => updateOption('format', 'pdf')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    options.format === 'pdf'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">PDF</div>
                  <div className="font-medium text-gray-900">PDF</div>
                  <div className="text-sm text-gray-500">Photo album</div>
                </button>
                <button
                  onClick={() => updateOption('format', 'excel')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    options.format === 'excel'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">XLS</div>
                  <div className="font-medium text-gray-900">Excel</div>
                  <div className="text-sm text-gray-500">Data report</div>
                </button>
                <button
                  onClick={() => updateOption('format', 'zip')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    options.format === 'zip'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">ZIP</div>
                  <div className="font-medium text-gray-900">ZIP</div>
                  <div className="text-sm text-gray-500">Bulk download</div>
                </button>
              </div>
            </div>

            {/* PDF-specific options */}
            {options.format === 'pdf' && (
              <>
                {/* Paper Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paper Size
                    </label>
                    <select
                      value={options.paperSize}
                      onChange={(e) =>
                        updateOption('paperSize', e.target.value as PaperSize)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="A4">A4 (210 x 297 mm)</option>
                      <option value="A3">A3 (297 x 420 mm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orientation
                    </label>
                    <select
                      value={options.orientation}
                      onChange={(e) =>
                        updateOption(
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
                </div>

                {/* Layout Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Photos per Page
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {([1, 2, 4] as PhotoLayout[]).map((layout) => (
                      <button
                        key={layout}
                        onClick={() => updateOption('layout', layout)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          options.layout === layout
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-center mb-2">
                          {layout === 1 && (
                            <div className="w-12 h-16 bg-gray-300 rounded" />
                          )}
                          {layout === 2 && (
                            <div className="flex flex-col gap-1">
                              <div className="w-12 h-7 bg-gray-300 rounded" />
                              <div className="w-12 h-7 bg-gray-300 rounded" />
                            </div>
                          )}
                          {layout === 4 && (
                            <div className="grid grid-cols-2 gap-1">
                              <div className="w-5 h-6 bg-gray-300 rounded" />
                              <div className="w-5 h-6 bg-gray-300 rounded" />
                              <div className="w-5 h-6 bg-gray-300 rounded" />
                              <div className="w-5 h-6 bg-gray-300 rounded" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 text-center">
                          {layout} photo{layout > 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality
                  </label>
                  <select
                    value={options.quality}
                    onChange={(e) =>
                      updateOption('quality', e.target.value as 'standard' | 'high')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="standard">Standard (smaller file size)</option>
                    <option value="high">High Quality (larger file size)</option>
                  </select>
                </div>
              </>
            )}

            {/* Include Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Include in Export
              </label>
              <div className="space-y-3">
                {options.format === 'pdf' && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeCover}
                        onChange={(e) =>
                          updateOption('includeCover', e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-gray-700">Cover Page</span>
                        <p className="text-sm text-gray-500">
                          Title page with project information
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeToc}
                        onChange={(e) =>
                          updateOption('includeToc', e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-gray-700">Table of Contents</span>
                        <p className="text-sm text-gray-500">
                          Page index for easy navigation
                        </p>
                      </div>
                    </label>
                  </>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeBlackboard}
                    onChange={(e) =>
                      updateOption('includeBlackboard', e.target.checked)
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-gray-700">Blackboard Overlay</span>
                    <p className="text-sm text-gray-500">
                      Show construction blackboard on photos
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Format:</span>
                  <span className="ml-2 text-gray-900">
                    {options.format.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Photos:</span>
                  <span className="ml-2 text-gray-900">{album.photos.length}</span>
                </div>
                {options.format === 'pdf' && (
                  <>
                    <div>
                      <span className="text-gray-500">Pages:</span>
                      <span className="ml-2 text-gray-900">{calculatePages()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-2 text-gray-900">
                        {options.paperSize} {options.orientation}
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-500">Est. File Size:</span>
                  <span className="ml-2 text-gray-900">{calculateFileSize()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || album.photos.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export {options.format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
