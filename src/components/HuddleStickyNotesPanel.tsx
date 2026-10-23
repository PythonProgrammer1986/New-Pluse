import React, { useState } from 'react';
import { StickyNote } from '../types';
import VoiceInputButton from './VoiceInputButton';
import { 
  Pin, Plus, Trash2, Edit2, X, Check, MessageSquare, 
  Sparkles, Calendar, PenTool, Image as ImageIcon
} from 'lucide-react';

interface HuddleStickyNotesPanelProps {
  notes: StickyNote[];
  onAddNote: (note: Omit<StickyNote, 'id' | 'createdAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<StickyNote>) => void;
  onDeleteNote: (id: string) => void;
  currentUserRole?: string;
  onClose?: () => void;
}

export default function HuddleStickyNotesPanel({
  notes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  currentUserRole = 'Operator',
  onClose
}: HuddleStickyNotesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState<'yellow' | 'blue' | 'green' | 'pink' | 'purple'>('yellow');
  const [filterColor, setFilterColor] = useState<string>('all');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    onAddNote({
      title: newTitle.trim() || 'Floor Notice',
      content: newContent.trim(),
      color: newColor,
      author: currentUserRole,
      pinned: false
    });

    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  const getColorStyles = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100';
      case 'green':
        return 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100';
      case 'blue':
        return 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700/60 text-sky-950 dark:text-sky-100';
      case 'pink':
        return 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-100';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700/60 text-purple-950 dark:text-purple-100';
      default:
        return 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-950';
    }
  };

  // Sort notes: pinned first, then chronological
  const sortedNotes = [...notes]
    .filter((n) => filterColor === 'all' || n.color === filterColor)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFC20E] text-slate-950 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Huddleboard Sticky Notes & Chalkboard
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Shift handovers, floor kudos, safety alerts & whiteboard memos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Color filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterColor('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                filterColor === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'
              }`}
            >
              All
            </button>
            {(['yellow', 'green', 'blue', 'pink', 'purple'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterColor(c)}
                className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                  filterColor === c ? 'scale-125 ring-2 ring-slate-400' : 'opacity-70 hover:opacity-100'
                } ${
                  c === 'yellow' ? 'bg-amber-400' :
                  c === 'green' ? 'bg-emerald-400' :
                  c === 'blue' ? 'bg-sky-400' :
                  c === 'pink' ? 'bg-rose-400' : 'bg-purple-400'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-[#FFC20E] hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#FFC20E]/20"
          >
            <Plus className="w-3.5 h-3.5" /> Post Sticky Note
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Add New Note Form Overlay */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              New Shift Sticky Note
            </span>
            <div className="flex items-center gap-2">
              <VoiceInputButton
                onTranscript={(txt) => setNewContent((prev) => prev ? `${prev} ${txt}` : txt)}
              />
              <div className="flex items-center gap-1">
                {(['yellow', 'green', 'blue', 'pink', 'purple'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-4 h-4 rounded-full cursor-pointer ${
                      newColor === c ? 'scale-125 ring-2 ring-slate-950 dark:ring-white' : 'opacity-70'
                    } ${
                      c === 'yellow' ? 'bg-amber-400' :
                      c === 'green' ? 'bg-emerald-400' :
                      c === 'blue' ? 'bg-sky-400' :
                      c === 'pink' ? 'bg-rose-400' : 'bg-purple-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note subject (e.g. Line 2 Safety Handover, Shift Kudos)"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-[#FFC20E]"
          />

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            placeholder="Dictate with microphone or type shift notice here..."
            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#FFC20E] resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="px-4 py-1.5 bg-[#FFC20E] text-slate-950 text-xs font-black rounded-lg hover:bg-amber-400 cursor-pointer disabled:opacity-40"
            >
              Pin to Board
            </button>
          </div>
        </form>
      )}

      {/* Sticky Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedNotes.map((note) => (
          <div
            key={note.id}
            className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 transition-all hover:shadow-md relative ${getColorStyles(
              note.color
            )}`}
          >
            {/* Top Bar of Note */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider font-mono truncate">
                {note.title}
              </h4>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateNote(note.id, { pinned: !note.pinned })}
                  title={note.pinned ? 'Unpin note' : 'Pin to top'}
                  className={`p-1 rounded-lg cursor-pointer ${
                    note.pinned ? 'text-amber-600 dark:text-amber-400 font-black' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                  title="Remove sticky note"
                  className="p-1 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Content */}
            <p className="text-xs leading-relaxed whitespace-pre-line font-medium">
              {note.content}
            </p>

            {/* Note Footer */}
            <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono opacity-75">
              <span>By {note.author}</span>
              <span>{note.createdAt}</span>
            </div>
          </div>
        ))}

        {sortedNotes.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-400 font-mono">
            No active shift sticky notes. Click &ldquo;Post Sticky Note&rdquo; to add reminders or kudos!
          </div>
        )}
      </div>
    </div>
  );
}
