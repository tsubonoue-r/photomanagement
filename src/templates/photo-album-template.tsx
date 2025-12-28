/**
 * Photo Album PDF Template Components
 *
 * React components for rendering PDF album pages.
 */

import React from 'react';
import {
  Album,
  AlbumPhoto,
  ExportOptions,
  TocEntry,
  PAPER_DIMENSIONS,
  LAYOUT_DIMENSIONS,
} from '@/types/album';

function getPageDimensions(options: ExportOptions) {
  const paperDims = PAPER_DIMENSIONS[options.paperSize];
  const isLandscape = options.orientation === 'landscape';

  return {
    width: isLandscape ? paperDims.height : paperDims.width,
    height: isLandscape ? paperDims.width : paperDims.height,
  };
}

interface PageWrapperProps {
  options: ExportOptions;
  children: React.ReactNode;
}

export function PageWrapper({ options, children }: PageWrapperProps) {
  const dims = getPageDimensions(options);

  return (
    <div
      style={{
        width: dims.width + 'mm',
        height: dims.height + 'mm',
        padding: '10mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
        position: 'relative',
        pageBreakAfter: 'always',
      }}
    >
      {children}
    </div>
  );
}

interface CoverPageProps {
  album: Album;
  options: ExportOptions;
}

export function CoverPage({ album, options }: CoverPageProps) {
  const { cover } = album;

  return (
    <PageWrapper options={options}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          backgroundColor: cover.backgroundColor || '#ffffff',
        }}
      >
        <h1 style={{ fontSize: '28pt', fontWeight: 'bold', color: '#333333', marginBottom: '5mm' }}>
          {cover.title}
        </h1>
        {cover.subtitle && (
          <h2 style={{ fontSize: '16pt', color: '#666666', marginBottom: '15mm' }}>
            {cover.subtitle}
          </h2>
        )}
        {cover.projectName && (
          <div style={{ fontSize: '18pt', color: '#444444', marginBottom: '30mm', padding: '5mm 15mm', border: '1px solid #cccccc', borderRadius: '3mm' }}>
            {cover.projectName}
          </div>
        )}
        <div style={{ flexGrow: 1 }} />
        {cover.date && (
          <div style={{ fontSize: '12pt', color: '#888888', marginBottom: '10mm' }}>{cover.date}</div>
        )}
        {cover.companyName && (
          <div style={{ fontSize: '14pt', color: '#555555', fontWeight: 'bold' }}>{cover.companyName}</div>
        )}
      </div>
    </PageWrapper>
  );
}

interface TocPageProps {
  entries: TocEntry[];
  options: ExportOptions;
}

export function TocPage({ entries, options }: TocPageProps) {
  return (
    <PageWrapper options={options}>
      <div style={{ height: '100%' }}>
        <h2 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#333333', textAlign: 'center', marginBottom: '15mm', paddingBottom: '5mm', borderBottom: '2px solid #333333' }}>
          Table of Contents
        </h2>
        <div style={{ marginTop: '10mm' }}>
          {entries.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '4mm', fontSize: '11pt' }}>
              <span style={{ color: '#333333', minWidth: '60%' }}>{entry.title}</span>
              <span style={{ flexGrow: 1, borderBottom: '1px dotted #cccccc', marginLeft: '3mm', marginRight: '3mm' }} />
              <span style={{ color: '#666666' }}>{entry.photoCount} photos</span>
              <span style={{ color: '#333333', fontWeight: 'bold', marginLeft: '5mm', minWidth: '10mm', textAlign: 'right' }}>
                p.{entry.pageNumber}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

interface PhotoCardProps {
  photo: AlbumPhoto;
  width: number;
  height: number;
  includeBlackboard: boolean;
}

export function PhotoCard({ photo, width, height, includeBlackboard }: PhotoCardProps) {
  const captionHeight = photo.caption ? 8 : 0;
  const imageHeight = height - captionHeight - 4;

  return (
    <div style={{ width: width + 'mm', height: height + 'mm', padding: '2mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexGrow: 1, height: imageHeight + 'mm', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '2mm', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {photo.photo.thumbnailLargeUrl ? (
          <img src={photo.photo.thumbnailLargeUrl} alt={photo.caption || 'Photo ' + (photo.order + 1)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ color: '#999999', fontSize: '10pt', textAlign: 'center' }}>Photo {photo.order + 1}</div>
        )}
        {photo.includeBlackboard && includeBlackboard && (
          <div style={{ position: 'absolute', top: '2mm', right: '2mm', backgroundColor: '#2d5016', color: 'white', padding: '1mm 2mm', borderRadius: '1mm', fontSize: '7pt', fontWeight: 'bold' }}>BB</div>
        )}
        <div style={{ position: 'absolute', bottom: '2mm', left: '2mm', backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '1mm 2mm', borderRadius: '1mm', fontSize: '8pt' }}>
          No.{photo.order + 1}
        </div>
      </div>
      {photo.caption && (
        <div style={{ marginTop: '2mm', fontSize: '9pt', color: '#333333', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {photo.caption}
        </div>
      )}
    </div>
  );
}

interface ContentPageProps {
  photos: AlbumPhoto[];
  pageNumber: number;
  totalPages: number;
  options: ExportOptions;
  albumTitle: string;
}

export function ContentPage({ photos, pageNumber, totalPages, options, albumTitle }: ContentPageProps) {
  const dims = getPageDimensions(options);
  const layoutDims = LAYOUT_DIMENSIONS[options.layout];
  const margin = 10;

  const contentWidth = dims.width - margin * 2;
  const contentHeight = dims.height - margin * 2 - 15;
  const photoWidth = contentWidth / layoutDims.cols;
  const photoHeight = contentHeight / layoutDims.rows;

  const grid: (AlbumPhoto | null)[][] = [];
  for (let row = 0; row < layoutDims.rows; row++) {
    grid[row] = [];
    for (let col = 0; col < layoutDims.cols; col++) {
      const index = row * layoutDims.cols + col;
      grid[row][col] = photos[index] || null;
    }
  }

  return (
    <PageWrapper options={options}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3mm', paddingBottom: '2mm', borderBottom: '1px solid #e0e0e0', fontSize: '9pt', color: '#666666' }}>
          <span>{albumTitle}</span>
          <span>Page {pageNumber} of {totalPages}</span>
        </div>
        <div style={{ flexGrow: 1 }}>
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex', height: photoHeight + 'mm' }}>
              {row.map((photo, colIndex) => (
                <div key={colIndex} style={{ width: photoWidth + 'mm', height: photoHeight + 'mm' }}>
                  {photo ? (
                    <PhotoCard photo={photo} width={photoWidth} height={photoHeight} includeBlackboard={options.includeBlackboard} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', border: '1px dashed #e0e0e0', margin: '2mm', boxSizing: 'border-box', borderRadius: '2mm', color: '#cccccc', fontSize: '10pt' }}>
                      No Photo
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '3mm', paddingTop: '2mm', borderTop: '1px solid #e0e0e0', fontSize: '8pt', color: '#999999', textAlign: 'center' }}>
          Generated by Photo Management System
        </div>
      </div>
    </PageWrapper>
  );
}

interface AlbumDocumentProps {
  album: Album;
  options: ExportOptions;
}

export function AlbumDocument({ album, options }: AlbumDocumentProps) {
  const sortedPhotos = [...album.photos].sort((a, b) => a.order - b.order);
  const photosPerPage = options.layout;

  const contentPages: AlbumPhoto[][] = [];
  for (let i = 0; i < sortedPhotos.length; i += photosPerPage) {
    contentPages.push(sortedPhotos.slice(i, i + photosPerPage));
  }

  let totalPages = contentPages.length;
  if (options.includeCover) totalPages++;
  if (options.includeToc) totalPages++;

  const tocEntries: TocEntry[] = contentPages.map((photos, index) => {
    const startNum = index * photosPerPage + 1;
    const endNum = startNum + photos.length - 1;
    const pageOffset = (options.includeCover ? 1 : 0) + (options.includeToc ? 1 : 0);

    return {
      title: 'Photos ' + startNum + ' - ' + endNum,
      pageNumber: pageOffset + index + 1,
      photoCount: photos.length,
    };
  });

  let currentPage = 0;

  return (
    <div>
      {options.includeCover && <CoverPage album={album} options={options} />}
      {options.includeToc && <TocPage entries={tocEntries} options={options} />}
      {contentPages.map((photos, index) => {
        currentPage++;
        const pageNumber = (options.includeCover ? 1 : 0) + (options.includeToc ? 1 : 0) + currentPage;
        return (
          <ContentPage
            key={index}
            photos={photos}
            pageNumber={pageNumber}
            totalPages={totalPages}
            options={options}
            albumTitle={album.title}
          />
        );
      })}
    </div>
  );
}

export default AlbumDocument;
