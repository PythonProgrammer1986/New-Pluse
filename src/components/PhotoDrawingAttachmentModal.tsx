import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import { 
  X, Camera, PenTool, Image as ImageIcon, Trash2, 
  RotateCcw, Download, Check, Sparkles, ZoomIn
} from 'lucide-react';

interface PhotoDrawingAttachmentModalProps {
  title: string;
  attachments?: Attachment[];
  onAddAttachment: (att: Omit<Attachment, 'id' | 'timestamp'>) => void;
  onDeleteAttachment: (id: string) => void;
  onClose: () => void;
}

export default function PhotoDrawingAttachmentModal({
  title,
  attachments = [],
  onAddAttachment,
  onDeleteAttachment,
  onClose
}: PhotoDrawingAttachmentModalProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'upload' | 'draw'>('view');
  
  // File upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  // Full-screen viewer state
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#FFC20E'); // Epiroc Yellow default
  const [drawWidth, setDrawWidth] = useState(3);
  const [drawingName, setDrawingName] = useState('Floor Sketch');
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0F172A'; // Slate dark board
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Save initial state
        setCanvasHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      }
    }
  }, [activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadName) {
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = () => {
    if (!uploadPreview) return;
    onAddAttachment({
      name: uploadName || 'Photo Attachment',
      type: 'photo',
      dataUrl: uploadPreview
    });
    setUploadPreview(null);
    setUploadName('');
    setActiveTab('view');
  };

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setCanvasHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setCanvasHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const undoCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasHistory.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const nextHistory = [...canvasHistory];
      nextHistory.pop(); // remove current
      const prevState = nextHistory[nextHistory.length - 1];
      ctx.putImageData(prevState, 0, 0);
      setCanvasHistory(nextHistory);
    }
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onAddAttachment({
      name: drawingName || 'Floor Sketch',
      type: 'drawing',
      dataUrl
    });
    clearCanvas();
    setActiveTab('view');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">
              Visual Documentation & Markup
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-md">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'view'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>Attached Gallery ({attachments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-500" />
            <span>Upload / Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4 text-emerald-500" />
            <span>Sketch & Drawing Pad</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: Gallery View */}
          {activeTab === 'view' && (
            <div>
              {attachments.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No visual attachments yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Attach photos of physical equipment, part defects, jigs, or draw a sketch of the problem.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('draw')}
                      className="px-3.5 py-2 bg-[#FFC20E] text-slate-950 rounded-lg text-xs font-black hover:bg-amber-400 cursor-pointer flex items-center gap-1.5"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Start Sketch</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group relative bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      <div
                        onClick={() => setViewingAttachment(att)}
                        className="h-36 w-full overflow-hidden bg-slate-900 cursor-pointer relative"
                      >
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-6 h-6" />
                        </div>
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-900/80 text-white">
                          {att.type}
                        </span>
                      </div>

                      <div className="p-2.5 flex items-center justify-between gap-2 bg-white dark:bg-slate-850">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {new Date(att.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteAttachment(att.id)}
                          title="Delete attachment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Photo Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Attachment Title / Description
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Broken bracket on station 3, Inspection tag photo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                />
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-amber-400 transition-colors">
                {uploadPreview ? (
                  <div className="space-y-4">
                    <img
                      src={uploadPreview}
                      alt="Upload Preview"
                      className="max-h-60 mx-auto rounded-lg shadow-md border border-slate-700 object-contain"
                    />
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveUpload}
                        className="px-5 py-2.5 bg-[#FFC20E] text-slate-950 text-xs font-black rounded-lg hover:bg-amber-400 cursor-pointer shadow-lg shadow-[#FFC20E]/20 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Save Photo Attachment
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadPreview(null)}
                        className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
                      >
                        Choose Different
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Click to choose image or drag & drop here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP supported</p>
                    <label className="mt-4 inline-block px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-800 transition-all">
                      Browse Local Files
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Canvas Drawing */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={drawingName}
                    onChange={(e) => setDrawingName(e.target.value)}
                    placeholder="Sketch title"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs w-48 font-bold"
                  />
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Colors */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {[
                      { hex: '#FFC20E', label: 'Yellow' },
                      { hex: '#EF4444', label: 'Red' },
                      { hex: '#10B981', label: 'Green' },
                      { hex: '#38BDF8', label: 'Blue' },
                      { hex: '#FFFFFF', label: 'White' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setDrawColor(c.hex)}
                        title={c.label}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                          drawColor === c.hex ? 'scale-125 ring-2 ring-white shadow' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>

                  {/* Stroke Width */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {[
                      { width: 2, label: 'Fine' },
                      { width: 4, label: 'Medium' },
                      { width: 8, label: 'Thick' }
                    ].map((w) => (
                      <button
                        key={w.width}
                        type="button"
                        onClick={() => setDrawWidth(w.width)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                          drawWidth === w.width
                            ? 'bg-[#FFC20E] text-slate-950 font-black'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={undoCanvas}
                    title="Undo stroke"
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    title="Clear sketch"
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawing Area */}
              <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={340}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair touch-none w-full max-h-[340px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveDrawing}
                  className="px-5 py-2.5 bg-[#FFC20E] hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg cursor-pointer shadow-lg shadow-[#FFC20E]/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Drawing to Item
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Full-Screen Zoom Viewer */}
      {viewingAttachment && (
        <div
          onClick={() => setViewingAttachment(null)}
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingAttachment.dataUrl}
              alt={viewingAttachment.name}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain border border-slate-700"
            />
            <div className="mt-3 flex items-center justify-between text-white">
              <div>
                <p className="font-bold text-sm">{viewingAttachment.name}</p>
                <p className="text-xs text-slate-400 font-mono">
                  {viewingAttachment.type.toUpperCase()} • Attached {new Date(viewingAttachment.timestamp).toLocaleString()}
                </p>
              </div>
              <a
                href={viewingAttachment.dataUrl}
                download={`${viewingAttachment.name.replace(/\s+/g, '_')}.png`}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
