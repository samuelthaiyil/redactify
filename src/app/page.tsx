'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import type * as Tesseract from 'tesseract.js';
import { PDFDocument, rgb } from 'pdf-lib';
import { toast } from 'sonner';
import Icon from './components/Icon';
import PledgXLogo from './components/PledgXLogo';

interface OCRResult {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

interface RedactionWord {
  word: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  page: number;
}

export default function PDFRedactionTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [redactionQueries, setRedactionQueries] = useState<string[]>(['']);
  const [ocrResults, setOcrResults] = useState<OCRResult[][]>([]);
  const [redactedPdfUrl, setRedactedPdfUrl] = useState<string | null>(null);
  const [wordsToRedact, setWordsToRedact] = useState<RedactionWord[]>([]);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pdfPageImages, setPdfPageImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("Starting PDFRedactionTool");

  // Skeleton component for PDF loading
  const PDFSkeleton = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="w-full h-[700px] bg-gray-100 flex justify-center items-center">
          <div className="w-[500px] h-[600px] bg-gray-200 rounded shadow-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // Initialize PDF.js worker with proper basePath handling
  const initializePDFWorker = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const pdfjsLib = await import('pdfjs-dist');
      const basePath = '/';
      const workerPath = `${basePath}/pdf.worker.min.js`;

      try {
        // Test if the worker file is accessible
        const response = await fetch(workerPath, { method: 'HEAD' });
        if (response.ok) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
          console.log(`PDF worker loaded from: ${workerPath}`);
        } else {
          throw new Error(`Worker not found at ${workerPath}`);
        }
      } catch (error) {
        console.warn(`Failed to load local worker from ${workerPath}, using CDN fallback:`, error);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs';
      }
    }
  }, []);

  const loadPDFForViewer = useCallback(async (file: File) => {
    try {
      setIsPdfLoading(true);
      await initializePDFWorker();
      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      const images: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        images.push(canvas.toDataURL());
      }
      setPdfPageImages(images);
      setIsPdfLoading(false);
    } catch (error) {
      console.error('Error loading PDF for viewer:', error);
      toast.error('Failed to load PDF for preview');
      setIsPdfLoading(false);
    }
  }, [initializePDFWorker]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setRedactedPdfUrl(null);
      setOcrResults([]);
      setWordsToRedact([]);
      setDownloadFilename(uploadedFile.name.replace('.pdf', ''));
      loadPDFForViewer(uploadedFile);
    } else {
      alert('Please upload a valid PDF file');
    }
  }, [loadPDFForViewer]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set isDragOver to false if we're leaving the drop zone entirely
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setRedactedPdfUrl(null);
        setOcrResults([]);
        setWordsToRedact([]);
        setDownloadFilename(droppedFile.name.replace('.pdf', ''));
        loadPDFForViewer(droppedFile);
      } else {
        alert('Please drop a valid PDF file');
      }
    }
  }, [loadPDFForViewer]);

  const convertPDFToImages = async (pdfBuffer: ArrayBuffer): Promise<{ images: ImageData[], renderScale: number }> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      const pdf = await pdfjsLib.getDocument({
        data: pdfBuffer,
        useSystemFonts: true,
        disableFontFace: false
      }).promise;

      const images: ImageData[] = [];
      const renderScale = 2.0; // Track the scale used for rendering

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error(`Failed to get canvas context for page ${pageNum}`);
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          images.push(imageData);

        } catch (pageError) {
          console.error(`Error converting page ${pageNum}:`, pageError);
          throw new Error(`Failed to convert page ${pageNum} to image: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
        }
      }

      return { images, renderScale };
    } catch (error) {
      console.error('Error in convertPDFToImages:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const performOCR = async (images: ImageData[], renderScale: number): Promise<OCRResult[][]> => {
    let worker: Tesseract.Worker | null = null;

    try {
      worker = await createWorker('eng');
      const results: OCRResult[][] = [];

      for (let i = 0; i < images.length; i++) {
        try {
          toast.loading(`Processing page ${i + 1} of ${images.length}...`, {
            id: 'ocr-progress'
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error(`Failed to get canvas context for OCR on page ${i + 1}`);
          }

          canvas.width = images[i].width;
          canvas.height = images[i].height;
          ctx.putImageData(images[i], 0, 0);

          const result = await worker.recognize(canvas, undefined, { blocks: true });

          if (!result || !result.data) {
            throw new Error(`OCR returned no data for page ${i + 1}`);
          }

          const blocks = (result.data as any).blocks || [];

          let pageResults: OCRResult[] = [];

          if (blocks) {
            blocks.forEach((block: any) => {
              if (block.paragraphs) {
                block.paragraphs.forEach((paragraph: any) => {
                  if (paragraph.lines) {
                    paragraph.lines.forEach((line: any) => {
                      if (line.words && line.words.length > 0) {
                        pageResults.push({
                          text: line.text,
                          bbox: {
                            x0: line.bbox.x0 / renderScale,
                            y0: line.bbox.y0 / renderScale,
                            x1: line.bbox.x1 / renderScale,
                            y1: line.bbox.y1 / renderScale,
                          },
                          confidence: line.confidence,
                        });
                      }
                    });
                  }
                });
              }
            });

          }

          results.push(pageResults);

        } catch (pageError) {
          console.error(`OCR error on page ${i + 1}:`, pageError);
          throw new Error(`OCR failed on page ${i + 1}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in performOCR:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (worker) {
        try {
          await worker.terminate();

        } catch (terminateError) {
          console.warn('Error terminating worker:', terminateError);
        }
      }
    }
  };

  const findWordsToRedact = (ocrResults: OCRResult[][], query: string[]): RedactionWord[] => {
    const wordsToRedact: RedactionWord[] = [];
    const queryLower = query.map(q => q.toLowerCase());

    ocrResults.forEach((pageResults, pageIndex) => {
      let pageMatches = 0;

      pageResults.forEach(result => {
        const textLower = result.text.toLowerCase();
        const matches = queryLower.some(q => textLower.includes(q));
        const hasMinConfidence = result.confidence > 60;

        if (matches && hasMinConfidence) {
          wordsToRedact.push({
            word: result.text,
            bbox: result.bbox,
            page: pageIndex,
          });
          pageMatches++;

        }
      });


    });

    return wordsToRedact;
  };

  const createRedactedPDF = async (
    originalPdfBuffer: ArrayBuffer,
    wordsToRedact: RedactionWord[],
    images: ImageData[],
    renderScale: number
  ): Promise<Uint8Array> => {

    try {


      if (!originalPdfBuffer || originalPdfBuffer.byteLength === 0) {
        throw new Error('Invalid or detached ArrayBuffer provided to createRedactedPDF');
      }

      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      const pages = pdfDoc.getPages();



      if (wordsToRedact.length === 0) {
        return await pdfDoc.save();
      }



      let actualRedactionCount = 0;
      let skippedRedactionCount = 0;

      for (const word of wordsToRedact) {
        try {
          if (word.page >= pages.length) {
            console.warn(`Skipping word on invalid page ${word.page + 1} (document has ${pages.length} pages)`);
            continue;
          }

          const page = pages[word.page];
          const { width, height } = page.getSize();

          const imageWidth = images[word.page].width;
          const imageHeight = images[word.page].height;

          const originalImageWidth = imageWidth / renderScale;
          const originalImageHeight = imageHeight / renderScale;
          const scaleX = width / originalImageWidth;
          const scaleY = height / originalImageHeight;

          if (word.bbox.x0 < 0 || word.bbox.y0 < 0 ||
            word.bbox.x1 < word.bbox.x0 || word.bbox.y1 < word.bbox.y0) {
            skippedRedactionCount++;
            continue;
          }

          if (word.bbox.x1 > imageWidth * 5 || word.bbox.y1 > imageHeight * 5) {
            skippedRedactionCount++;
            continue;
          }

          const x = Math.max(0, word.bbox.x0 * scaleX);

          const rectWidth = Math.max(1, (word.bbox.x1 - word.bbox.x0) * scaleX);
          const rectHeight = Math.max(1, (word.bbox.y1 - word.bbox.y0) * scaleY);
          const y = Math.max(0, height - (word.bbox.y0 * scaleY) - rectHeight);

          const finalWidth = Math.min(rectWidth, width - x);
          const finalHeight = Math.min(rectHeight, height - y);

          const pageArea = width * height;
          const rectArea = finalWidth * finalHeight;
          const coveragePercentage = (rectArea / pageArea) * 100;



          if (coveragePercentage > 80) {
            skippedRedactionCount++;
            continue;
          }

          const maxReasonableWidth = width * 0.95;
          const maxReasonableHeight = height * 0.5;

          if (finalWidth > maxReasonableWidth || finalHeight > maxReasonableHeight) {
            skippedRedactionCount++;
            continue;
          }

          if (finalWidth > 0 && finalHeight > 0) {
            page.drawRectangle({
              x,
              y,
              width: finalWidth,
              height: finalHeight,
              color: rgb(0, 0, 0),
            });

            actualRedactionCount++;
          } else {
            skippedRedactionCount++;
          }
        } catch (wordError) {
          console.error(`Error redacting word "${word.word}" on page ${word.page + 1}:`, wordError);
        }
      }


      return await pdfDoc.save();
    } catch (error) {
      console.error('Error in createRedactedPDF:', error);
      throw new Error(`Failed to create redacted PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processRedaction = async () => {
    if (!file || redactionQueries.every(q => !q)) {
      alert('Please upload a PDF and enter a redaction query');
      return;
    }

    setIsProcessing(true);
    toast.loading('Converting PDF to images...', {
      id: 'redaction-process'
    });

    try {
      await initializePDFWorker();

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File too large. Please use a PDF smaller than 50MB.');
      }

      const pdfBuffer = await file.arrayBuffer();

      const pdfBufferCopy = pdfBuffer.slice(0);

      toast.loading('Converting PDF pages to images...', {
        id: 'redaction-process'
      });
      const { images, renderScale } = await convertPDFToImages(pdfBufferCopy);

      if (images.length === 0) {
        throw new Error('No pages found in PDF or failed to convert pages to images.');
      }

      toast.loading(`Performing OCR on ${images.length} page(s)...`, {
        id: 'redaction-process'
      });
      const ocrResults = await performOCR(images, renderScale);
      setOcrResults(ocrResults);

      toast.loading('Finding words to redact...', {
        id: 'redaction-process'
      });
      const wordsToRedact = findWordsToRedact(ocrResults, redactionQueries);
      setWordsToRedact(wordsToRedact);

      if (wordsToRedact.length === 0) {
        setIsProcessing(false);
        toast.dismiss('redaction-process');
        toast.dismiss('ocr-progress');
        toast.info('No instances found to redact.');
        return;
      }

      toast.loading(`Creating redacted PDF (found ${wordsToRedact.length} instances)...`, {
        id: 'redaction-process'
      });

      let redactedPdfBytes: Uint8Array;
      if (pdfBuffer.byteLength === 0) {
        const freshPdfBuffer = await file.arrayBuffer();
        redactedPdfBytes = await createRedactedPDF(freshPdfBuffer, wordsToRedact, images, renderScale);
      } else {
        redactedPdfBytes = await createRedactedPDF(pdfBuffer, wordsToRedact, images, renderScale);
      }

      const pdfBytes = new Uint8Array(redactedPdfBytes);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setRedactedPdfUrl(url);
      
      const redactedFile = new File([pdfBytes], file.name, { type: 'application/pdf' });
      setFile(redactedFile);
      
      await loadPDFForViewer(redactedFile);

      toast.dismiss('redaction-process');
      toast.dismiss('ocr-progress');
      toast.success('Redaction completed successfully!', {
        duration: 5000
      });
    } catch (error) {
      console.error('Error during redaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.dismiss('redaction-process');
      toast.dismiss('ocr-progress');
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadRedactedPDF = () => {
    if (redactedPdfUrl) {
      const link = document.createElement('a');
      link.href = redactedPdfUrl;
      const filename = downloadFilename.trim() || 'redacted_document';
      link.download = `${filename}.pdf`;
      link.click();
    }
  };

  const resetTool = () => {
    setFile(null);
    setRedactionQueries(['']);
    setOcrResults([]);
    setWordsToRedact([]);
    setRedactedPdfUrl(null);
    setDownloadFilename('');
    setPdfDocument(null);
    setPdfPageImages([]);
    setCurrentPage(1);
    setTotalPages(0);
    setIsPdfLoading(false);
    toast.dismiss();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 sm:p-5">
      <div className={`${file ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full max-w-7xl' : 'max-w-4xl mx-auto w-full'}`}>
        {/* Main Controls */}
        <div className={`${file ? '' : 'w-full'} bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6`}>
          {/* File Upload Section */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              {!file && (
                <div className="space-y-2">
                  {isDragOver ? (
                    <div className="flex flex-col items-center">
                      <Icon name="BsUpload" className="w-12 h-12 text-blue-500 mb-2" size="3rem" />
                      <p className="text-lg font-medium text-blue-700">Drop your PDF here</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <label
                        htmlFor="pdf-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm text-black font-medium rounded-md h-[38px]"
                      >
                        <Icon name="upload" className="mr-2" />
                        Choose or drop your PDF File
                      </label>
                    </div>
                  )}
                </div>
              )}
              {file && (
                <div className="mt-2 flex items-center justify-center space-x-1">
                  <p className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <button
                    onClick={() => {
                      setFile(null);
                      setOcrResults([]);
                      setWordsToRedact([]);
                      setRedactedPdfUrl(null);
                      setDownloadFilename('');
                      setPdfDocument(null);
                      setPdfPageImages([]);
                      setCurrentPage(1);
                      setTotalPages(0);
                      setIsPdfLoading(false);
                      toast.dismiss();
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-sm inline-flex items-center justify-center px-4 py-2 rounded-md h-[38px]"
                  >
                    <Icon name="trash" className="text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {file && (
            <>
              <div>
                {redactionQueries.map((query, index) => (
                  <div key={index} className="mt-4">
                    <label htmlFor="redaction-query" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter word or phrase to redact:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="redaction-query"
                        type="text"
                        value={query}
                        onChange={(e) => setRedactionQueries(prev => [...prev.slice(0, index), e.target.value, ...prev.slice(index + 1)])}
                        placeholder="Company Name, etc."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none text-black placeholder-gray-600 h-[38px]"
                      />
                      {redactionQueries.length > 1 && <button
                        className="flex items-center justify-center px-4 py-2 text-white text-sm border border-transparent rounded-md bg-red-500 h-[38px]"
                        onClick={() => {
                          setRedactionQueries(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Icon name="dash" />
                      </button>}
                    </div>
                  </div>
                ))}
                <button className="mt-2 text-sm border border-transparent rounded-md text-black disabled:bg-gray-400 flex items-center justify-center py-2 h-[38px]"
                  onClick={() => {
                    setRedactionQueries(prev => [...prev, '']);
                  }}>
                  <Icon name="plus" className="md:mr-1" />
                  Add Another Phrase
                </button>
              </div>
            </>
          )}

          {file && (
            <div className="text-center">
              <button
                onClick={processRedaction}
                disabled={isProcessing || !redactionQueries.every(q => Boolean(q))}
                className="w-full sm:w-auto text-sm inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-white bg-black disabled:bg-gray-400 h-[38px]"
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <Icon name="play-fill" className="mr-2" />
                    Start Redaction
                  </>
                )}
              </button>
            </div>
          )}



          {wordsToRedact.length > 0 && (
            <div className="bg-gry-300 rounded-md p-4">
              <h3 className="text-lg font-medium text-black mb-2 tracking-tighter">
                Redaction Summary
              </h3>
              <p className="text-gray-500 tracking-tighter">
                Found {wordsToRedact.length} instance(s) of &quot;{redactionQueries.join(', ')}&quot; to redact
              </p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {wordsToRedact.map((word, index) => (
                  <div key={index} className="text-sm text-gray-500 tracking-tighter">
                    Page {word.page + 1}: &quot;{word.word}&quot;
                  </div>
                ))}
              </div>
            </div>
          )}

          {redactedPdfUrl && (
            <div className="space-y-4">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col space-y-4 sm:hidden">
                {/* Download Input Row */}
                <div className="flex flex-col space-y-2">
                   <div className="flex items-center">
                    <input
                      id="download-filename-mobile"
                      type="text"
                      value={downloadFilename}
                      onChange={(e) => setDownloadFilename(e.target.value)}
                      placeholder="Enter filename"
                      className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-l-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-400 h-[38px]"
                    />
                    <span className="text-sm px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 h-[38px] flex items-center">.pdf</span>
                  </div>
                </div>
                
                {/* Buttons Row */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={downloadRedactedPDF}
                    className="w-full text-sm inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-white disabled:bg-gray-400 bg-black h-[38px]"
                  >
                    <Icon name="download" className="mr-2" />
                    Download
                  </button>
                  <button
                    onClick={resetTool}
                    className="w-full text-sm inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-400 h-[38px]"
                  >
                    <Icon name="arrow-clockwise" className="mr-2" />
                    Start Over
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <div className="flex items-center flex-1 min-w-0 max-w-xs">
                  <input
                    id="download-filename-desktop"
                    type="text"
                    value={downloadFilename}
                    onChange={(e) => setDownloadFilename(e.target.value)}
                    placeholder="Enter filename"
                    className="flex-1 min-w-0 text-sm px-3 py-2 border border-gray-300 rounded-l-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-400 h-[38px]"
                  />
                  <span className="text-sm px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 h-[38px] flex items-center">.pdf</span>
                </div>
                <button
                  onClick={downloadRedactedPDF}
                  className="text-sm inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-white disabled:bg-gray-400 bg-black h-[38px] whitespace-nowrap"
                >
                  <Icon name="download" className="mr-2" />
                  Download
                </button>
                <button
                  onClick={resetTool}
                  className="text-sm inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-400 h-[38px] whitespace-nowrap"
                >
                  <Icon name="arrow-clockwise" className="mr-2" />
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        {file && (isPdfLoading || pdfPageImages.length > 0) && (
          <>
            {isPdfLoading ? (
              <PDFSkeleton />
            ) : (
              <div 
                className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-fade-in" 
                style={{ 
                  animation: 'slideInRight 0.5s ease-out forwards, fadeIn 0.6s ease-out forwards',
                  opacity: 0,
                  animationDelay: '0.1s',
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-black tracking-tighter">
                    Preview
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 h-[38px] inline-flex items-center justify-center"
                    >
                      <Icon name="chevron-left" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 h-[38px] inline-flex items-center justify-center"
                    >
                      <Icon name="chevron-right" />
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full max-h-[700px] overflow-auto bg-gray-100 flex justify-center items-start p-4">
                    {pdfPageImages[currentPage - 1] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pdfPageImages[currentPage - 1]}
                        alt={`Page ${currentPage}`}
                        className="max-w-full object-contain shadow-lg border border-white"
                        style={{ height: 'auto', aspectRatio: 'auto' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}