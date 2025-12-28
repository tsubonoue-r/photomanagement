'use client';

import { useState } from 'react';
import { Album, AlbumCover, ExportOptions } from '@/types/album';

interface AlbumEditorProps {
  album: Album;
  onUpdate: (updates: Partial<Album>) => void;
}

export function AlbumEditor({ album, onUpdate }: AlbumEditorProps) {
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description || '');
  const [cover, setCover] = useState<AlbumCover>(album.cover);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(album.exportOptions);
  const [hasChanges, setHasChanges] = useState(false);

  const updateCover = (field: keyof AlbumCover, value: string) => {
    setCover((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({ title, description, cover, exportOptions });
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Album Title</label>
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">{album.status}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cover Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Cover Title</label><input type="text" value={cover.title} onChange={(e) => updateCover('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label><input type="text" value={cover.subtitle || ''} onChange={(e) => updateCover('subtitle', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label><input type="text" value={cover.projectName || ''} onChange={(e) => updateCover('projectName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={cover.companyName || ''} onChange={(e) => updateCover('companyName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end gap-3">
          <button onClick={() => { setTitle(album.title); setDescription(album.description || ''); setCover(album.cover); setHasChanges(false); }} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg">Reset</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
        </div>
      )}
    </div>
  );
}

export default AlbumEditor;
