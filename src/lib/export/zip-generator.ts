/**
 * ZIP Generator for Album Export
 * Issue #10: Album and Report Output
 * Issue #48: Include actual photo files in ZIP export
 *
 * Generates ZIP archives with:
 * - All photos in album (actual image files)
 * - README file with album info
 * - JSON metadata files
 */

import archiver from 'archiver';
import { Album, ExportOptions } from '@/types/album';
import { getFromStorage, STORAGE_PATHS } from '@/lib/storage-factory';

interface ZIPGeneratorResult {
  buffer: Buffer;
  filename: string;
  fileCount: number;
  errors?: string[];
}

/**
 * Extract storage key from photo URL
 */
function getStorageKeyFromUrl(url: string): string | null {
  // Handle local storage URLs: /uploads/photos/originals/xxx.jpg
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '');
  }

  // Handle S3/R2 URLs - extract the key from the URL
  // e.g., https://bucket.s3.region.amazonaws.com/photos/originals/xxx.jpg
  const patterns = [
    /\/photos\/originals\/[^/]+$/,
    /photos\/originals\/[^/]+$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[0].startsWith('/') ? match[0].substring(1) : match[0];
    }
  }

  // Try to extract from any URL containing the storage paths
  if (url.includes(STORAGE_PATHS.originals)) {
    const idx = url.indexOf(STORAGE_PATHS.originals);
    return url.substring(idx);
  }

  return null;
}

/**
 * Get file extension from URL or content type
 */
function getExtension(url: string, contentType?: string): string {
  // Try to get from URL
  const urlMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (urlMatch) {
    return urlMatch[1].toLowerCase();
  }

  // Fallback to content type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/webp': 'webp',
  };

  if (contentType && mimeToExt[contentType]) {
    return mimeToExt[contentType];
  }

  return 'jpg'; // Default
}

/**
 * Generate ZIP archive from album
 */
export async function generateZIP(
  album: Album,
  options: ExportOptions
): Promise<ZIPGeneratorResult> {
  const errors: string[] = [];

  // Pre-fetch all photos from storage
  const photoDataPromises = album.photos.map(async (photo, index) => {
    const storageKey = getStorageKeyFromUrl(photo.url);
    if (!storageKey) {
      errors.push(`Photo ${index + 1} (${photo.title}): Could not determine storage key from URL`);
      return { photo, index, data: null, contentType: undefined };
    }

    try {
      const result = await getFromStorage(storageKey);
      if (!result.success || !result.body) {
        errors.push(`Photo ${index + 1} (${photo.title}): Failed to fetch - ${result.error || 'Unknown error'}`);
        return { photo, index, data: null, contentType: result.contentType };
      }
      return { photo, index, data: result.body, contentType: result.contentType };
    } catch (error) {
      errors.push(`Photo ${index + 1} (${photo.title}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { photo, index, data: null, contentType: undefined };
    }
  });

  const photoDataResults = await Promise.all(photoDataPromises);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let successfulPhotoCount = 0;

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => reject(err));
    archive.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const filename = `${album.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;

      resolve({
        buffer,
        filename,
        fileCount: successfulPhotoCount + 3, // photos + README + album.json + photos.json
        errors: errors.length > 0 ? errors : undefined,
      });
    });

    // Add README file
    const readme = generateReadme(album);
    archive.append(readme, { name: 'README.txt' });

    // Add album metadata JSON
    const albumJson = JSON.stringify(
      {
        id: album.id,
        title: album.title,
        name: album.name,
        description: album.description,
        cover: album.cover,
        status: album.status,
        exportOptions: album.exportOptions,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        createdBy: album.createdBy,
        lastExportedAt: album.lastExportedAt,
        photoCount: album.photos.length,
      },
      null,
      2
    );
    archive.append(albumJson, { name: 'album.json' });

    // Add photos metadata JSON
    const photosJson = JSON.stringify(
      album.photos.map((photo) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        location: photo.location,
        takenAt: photo.takenAt,
        order: photo.order,
        blackboardInfo: options.includeBlackboard ? photo.blackboardInfo : undefined,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
      })),
      null,
      2
    );
    archive.append(photosJson, { name: 'photos.json' });

    // Add actual photo files
    for (const { photo, index, data, contentType } of photoDataResults) {
      const paddedIndex = String(index + 1).padStart(3, '0');
      const safeTitle = photo.title.replace(/[^a-zA-Z0-9_\-]/g, '_');

      if (data) {
        // Add actual photo file
        const ext = getExtension(photo.url, contentType);
        const photoFilename = `photos/${paddedIndex}_${safeTitle}.${ext}`;
        archive.append(Buffer.from(data), { name: photoFilename });
        successfulPhotoCount++;
      } else {
        // Add info file for failed photos
        const photoInfo = generatePhotoInfo(photo, index, options);
        const infoFilename = `photos/${paddedIndex}_${safeTitle}_INFO.txt`;
        archive.append(photoInfo, { name: infoFilename });
      }
    }

    // Add errors file if any
    if (errors.length > 0) {
      const errorsContent = [
        'ZIP Export Errors',
        '='.repeat(50),
        '',
        `Total photos: ${album.photos.length}`,
        `Successfully included: ${successfulPhotoCount}`,
        `Failed: ${errors.length}`,
        '',
        'Error Details:',
        '-'.repeat(30),
        ...errors,
      ].join('\n');
      archive.append(errorsContent, { name: 'ERRORS.txt' });
    }

    archive.finalize();
  });
}

/**
 * Generate README content
 */
function generateReadme(album: Album): string {
  const lines = [
    '=' .repeat(60),
    album.title,
    '=' .repeat(60),
    '',
    'Album Information',
    '-'.repeat(40),
    `Title: ${album.title}`,
    `Name: ${album.name}`,
    `Description: ${album.description || 'N/A'}`,
    `Status: ${album.status}`,
    `Photo Count: ${album.photos.length}`,
    '',
    'Cover Information',
    '-'.repeat(40),
    `Cover Title: ${album.cover.title}`,
    `Subtitle: ${album.cover.subtitle || 'N/A'}`,
    `Project Name: ${album.cover.projectName || 'N/A'}`,
    `Company Name: ${album.cover.companyName || 'N/A'}`,
    `Date: ${album.cover.date || 'N/A'}`,
    '',
    'Export Settings',
    '-'.repeat(40),
    `Format: ${album.exportOptions.format}`,
    `Paper Size: ${album.exportOptions.paperSize}`,
    `Layout: ${album.exportOptions.layout} photo(s) per page`,
    `Orientation: ${album.exportOptions.orientation}`,
    `Quality: ${album.exportOptions.quality}`,
    `Include Blackboard: ${album.exportOptions.includeBlackboard ? 'Yes' : 'No'}`,
    `Include Cover: ${album.exportOptions.includeCover ? 'Yes' : 'No'}`,
    `Include TOC: ${album.exportOptions.includeToc ? 'Yes' : 'No'}`,
    '',
    'Photo List',
    '-'.repeat(40),
    ...album.photos.map(
      (photo, index) =>
        `${String(index + 1).padStart(3, '0')}. ${photo.title}${photo.location ? ` (${photo.location})` : ''}`
    ),
    '',
    'Metadata',
    '-'.repeat(40),
    `Created At: ${formatDate(album.createdAt)}`,
    `Updated At: ${formatDate(album.updatedAt)}`,
    `Created By: ${album.createdBy}`,
    `Last Exported: ${album.lastExportedAt ? formatDate(album.lastExportedAt) : 'N/A'}`,
    '',
    'Files in this archive',
    '-'.repeat(40),
    '- README.txt: This file',
    '- album.json: Album metadata in JSON format',
    '- photos.json: Photos list in JSON format',
    '- photos/: Directory containing photo information files',
    '',
    '=' .repeat(60),
    `Generated on ${formatDate(new Date())}`,
    '=' .repeat(60),
  ];

  return lines.join('\n');
}

/**
 * Generate individual photo info file content
 */
function generatePhotoInfo(
  photo: Album['photos'][0],
  index: number,
  options: ExportOptions
): string {
  const lines = [
    `Photo ${index + 1}: ${photo.title}`,
    '='.repeat(50),
    '',
    'Basic Information',
    '-'.repeat(30),
    `ID: ${photo.id}`,
    `Title: ${photo.title}`,
    `Description: ${photo.description || 'N/A'}`,
    `URL: ${photo.url}`,
    `Thumbnail URL: ${photo.thumbnailUrl || 'N/A'}`,
    `Location: ${photo.location || 'N/A'}`,
    `Taken At: ${photo.takenAt ? formatDate(photo.takenAt) : 'N/A'}`,
    `Order: ${photo.order}`,
    '',
  ];

  if (options.includeBlackboard && photo.blackboardInfo) {
    const bb = photo.blackboardInfo;
    lines.push(
      'Blackboard Information',
      '-'.repeat(30),
      `Project Name: ${bb.projectName || 'N/A'}`,
      `Construction Type: ${bb.constructionType || 'N/A'}`,
      `Contractor: ${bb.contractor || 'N/A'}`,
      `Photographer: ${bb.photographerName || 'N/A'}`,
      `Date: ${bb.date ? formatDate(bb.date) : 'N/A'}`,
      `Memo: ${bb.memo || 'N/A'}`,
      ''
    );
  }

  lines.push(
    'Timestamps',
    '-'.repeat(30),
    `Created At: ${formatDate(photo.createdAt)}`,
    `Updated At: ${formatDate(photo.updatedAt)}`
  );

  return lines.join('\n');
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default generateZIP;
