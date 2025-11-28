import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { AppraisalInput } from '../types';

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appraisal: AppraisalInput) => void;
  emotionLabel: string;
}

const APPRAISAL_TYPES = [
  { type: 'Goal' as const, prefix: 'I want to...' },
  { type: 'Attitude' as const, prefix: 'I think...' },
  { type: 'Norm' as const, prefix: 'I should...' },
  { type: 'Standard' as const, prefix: 'I expect...' }
];

const AppraisalModal = ({ isOpen, onClose, onSubmit, emotionLabel }: AppraisalModalProps) => {
  const [selectedType, setSelectedType] = useState<typeof APPRAISAL_TYPES[number]>(APPRAISAL_TYPES[0]);
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onSubmit({
      type: selectedType.type,
      prefix: selectedType.prefix,
      content: content.trim()
    });
    
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Share Your Feeling</h2>
            <p className="text-sm text-gray-600">
              You selected <span className="font-bold text-lem-orange">{emotionLabel}</span>. 
              Now tell us why you felt this way.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What triggered this emotion?
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {APPRAISAL_TYPES.map((type) => (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedType.type === type.type
                        ? 'bg-lem-orange text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">{selectedType.prefix}</div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Complete the sentence..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lem-orange focus:border-lem-orange resize-none"
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!content.trim()}
                className="flex-1 bg-lem-orange hover:bg-lem-orange-dark"
              >
                Add Marker
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppraisalModal;
