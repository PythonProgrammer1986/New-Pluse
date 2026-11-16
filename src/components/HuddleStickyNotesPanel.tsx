import React, { useState } from 'react';
import { StickyNote } from '../types';
import VoiceInputButton from './VoiceInputButton';
import { Pin, Plus, Trash2, X, MessageSquare } from 'lucide-react';

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
        return 'bg-[#FFFBEB] border-[#FFC20E]/60 text-[#262A2E]';
      case 'green':
        return 'bg-emerald-50 border-emerald-300 text-[#262A2E]';
      case 'blue':
        return 'bg-[#F3F4F6] border-gray-300 text-[#262A2E]';
      case 'pink':
        return 'bg-rose-50 border-rose-300 text-[#262A2E]';
      case 'purple':
        return 'bg-amber-50 border-amber-300 text-[#262A2E]';
      default:
        return 'bg-[#FFFBEB] border-[#FFC20E]/60 text-[#262A2E]';
    }
  };

  const sortedNotes = [...notes]
    .filter((n) => filterColor === 'all' || n.color === filterColor)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  return (
    <div className="bg-white h-full flex flex-col p-6 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FFC20E] text-[#1F2328] flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#262A2E] uppercase tracking-wider">
              Shift Notes &amp; Handover Board
            </h3>
            <span className="text-[11px] text-gray-500">
              Shift handovers, floor kudos, safety alerts &amp; memos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#F7F8F9] border border-gray-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterColor('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
                filterColor === 'all' ? 'bg-white shadow-xs text-[#262A2E]' : 'text-gray-500'
              }`}
            >
              All
            </button>
            {(['yellow', 'blue', 'green', 'pink'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterColor(c)}
                className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                  filterColor === c ? 'scale-125 ring-2 ring-[#262A2E]' : 'opacity-70 hover:opacity-100'
                } ${
                  c === 'yellow' ? 'bg-[#FFC20E]' :
                  c === 'blue' ? 'bg-gray-400' :
                  c === 'green' ? 'bg-emerald-500' :
                  'bg-rose-400'
                }`}
                title={`Filter ${c} notes`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Post Note
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-[#262A2E] hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Add New Note Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-[#F7F8F9] border border-gray-200 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#262A2E]">
              New Shift Note
            </span>
            <div className="flex items-center gap-2">
              <VoiceInputButton
                onTranscript={(txt) => setNewContent((prev) => prev ? `${prev} ${txt}` : txt)}
              />
              <div className="flex items-center gap-1.5">
                {(['yellow', 'blue', 'green', 'pink'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-4 h-4 rounded-full cursor-pointer ${
                      newColor === c ? 'scale-125 ring-2 ring-[#262A2E]' : 'opacity-70'
                    } ${
                      c === 'yellow' ? 'bg-[#FFC20E]' :
                      c === 'blue' ? 'bg-gray-400' :
                      c === 'green' ? 'bg-emerald-500' :
                      'bg-rose-400'
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
            placeholder="Subject (e.g. Line 2 Safety Handover, Shift Kudos)"
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs text-[#262A2E] font-bold focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
          />

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            placeholder="Dictate with microphone or type shift notice..."
            className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E] resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="px-4 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40"
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
            className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between space-y-3 transition-all hover:shadow-md ${getColorStyles(note.color)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider truncate">
                {note.title}
              </h4>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateNote(note.id, { pinned: !note.pinned })}
                  title={note.pinned ? 'Unpin note' : 'Pin to top'}
                  className={`p-1 rounded-lg cursor-pointer ${
                    note.pinned ? 'text-[#262A2E]' : 'opacity-40 hover:opacity-100'
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

            <p className="text-xs leading-relaxed whitespace-pre-line font-medium">
              {note.content}
            </p>

            <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-mono text-gray-600">
              <span>By {note.author}</span>
              <span>{note.createdAt}</span>
            </div>
          </div>
        ))}

        {sortedNotes.length === 0 && (
          <div className="col-span-full py-10 text-center text-xs text-gray-500 font-mono">
            No active shift notes. Click &ldquo;Post Note&rdquo; to add reminders or kudos.
          </div>
        )}
      </div>
    </div>
  );
}
