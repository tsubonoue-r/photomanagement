'use client';

import { useState } from 'react';
import { Album, ExportOptions, PaperSize, PhotoLayout } from '@/types/album';

interface ExportDialogProps {
  album: Album;
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
  initialOptions: ExportOptions;
}

export function ExportDialog({ album, onExport, onClose, initialOptions }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(initialOptions);
  const [exporting, setExporting] = useState(false);

  const updateOption = <K extends keyof ExportOptions>(field: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [field]: value }));
  };

  const handleExport = async () => {
    setExporting(true);
    await onExport(options);
    setExporting(false);
  };

  const calculatePages = () => {
    const contentPages = Math.ceil(album.photos.length / options.layout);
    return contentPages + (options.includeCover ? 1 : 0) + (options.includeToc ? 1 : 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Export Album</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">X</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => updateOption('format', 'pdf')} className={'p-4 rounded-lg border-2 ' + (options.format === 'pdf' ? 'border-blue-600 bg-blue-50' : 'border-gray-200')}>
                  <div className="font-medium">PDF</div>
                </button>
                <button onClick={() => updateOption('format', 'excel')} className={'p-4 rounded-lg border-2 ' + (options.format === 'excel' ? 'border-blue-600 bg-blue-50' : 'border-gray-200')}>
                  <div className="font-medium">Excel</div>
                </button>
              </div>
            </div>

            {options.format === 'pdf' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                    <select value={options.paperSize} onChange={(e) => updateOption('paperSize', e.target.value as PaperSize)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="A4">A4</option><option value="A3">A3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                    <select value={options.orientation} onChange={(e) => updateOption('orientation', e.target.value as 'portrait' | 'landscape')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Photos per Page</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([1, 2, 4] as PhotoLayout[]).map((layout) => (
                      <button key={layout} onClick={() => updateOption('layout', layout)} className={'p-4 rounded-lg border-2 ' + (options.layout === layout ? 'border-blue-600 bg-blue-50' : 'border-gray-200')}>
                        {layout} photo{layout > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Include in Export</label>
              <div className="space-y-3">
                {options.format === 'pdf' && (
                  <>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={options.includeCover} onChange={(e) => updateOption('includeCover', e.target.checked)} className="w-5 h-5" /><span>Cover Page</span></label>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={options.includeToc} onChange={(e) => updateOption('includeToc', e.target.checked)} className="w-5 h-5" /><span>Table of Contents</span></label>
                  </>
                )}
                <label className="flex items-center gap-3"><input type="checkbox" checked={options.includeBlackboard} onChange={(e) => updateOption('includeBlackboard', e.target.checked)} className="w-5 h-5" /><span>Blackboard Overlay</span></label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Format:</span> <span className="text-gray-900">{options.format.toUpperCase()}</span></div>
                <div><span className="text-gray-500">Photos:</span> <span className="text-gray-900">{album.photos.length}</span></div>
                {options.format === 'pdf' && <div><span className="text-gray-500">Pages:</span> <span className="text-gray-900">{calculatePages()}</span></div>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleExport} disabled={exporting || album.photos.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {exporting ? 'Exporting...' : 'Export ' + options.format.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
