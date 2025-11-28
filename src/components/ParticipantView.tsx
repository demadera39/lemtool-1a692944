import { useState } from 'react';
import { Project, Marker, EmotionType, AppraisalInput } from '../types';
import AnalysisCanvas from './AnalysisCanvas';
import AppraisalModal from './AppraisalModal';
import Toolbar from './Toolbar';
import { EMOTIONS } from '../constants';
import { submitTestSession } from '../services/supabaseService';
import { CheckCircle2, AlertCircle, ChevronDown, Info, MousePointer2, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface ParticipantViewProps {
  project: Project;
  onExit: () => void;
}

const MIN_MARKERS = 10;

const ParticipantView = ({ project, onExit }: ParticipantViewProps) => {
  const [step, setStep] = useState<'intro' | 'test' | 'success'>('intro');
  const [participantName, setParticipantName] = useState('');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [showAppraisal, setShowAppraisal] = useState(false);
  const [pendingMarkerPos, setPendingMarkerPos] = useState<{x: number, y: number, width?: number, height?: number} | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [selectionMode, setSelectionMode] = useState<'point' | 'area'>('point');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if(participantName.trim()) setStep('test');
  };

  const handleEmotionSelect = (emotion: EmotionType) => {
    setSelectedEmotion(emotion);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (!selectedEmotion) {
      toast.error('Please select an emotion from the sidebar first');
      return;
    }
    setPendingMarkerPos({ x, y });
    setShowAppraisal(true);
  };

  const handleAreaSelect = (x: number, y: number, width: number, height: number) => {
    if (!selectedEmotion) {
      toast.error('Please select an emotion from the sidebar first');
      return;
    }
    setPendingMarkerPos({ x, y, width, height });
    setShowAppraisal(true);
  };

  const handleAppraisalSubmit = (appraisal: AppraisalInput) => {
    if (!pendingMarkerPos || !selectedEmotion) return;

    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      x: pendingMarkerPos.x,
      y: pendingMarkerPos.y,
      layer: 'emotions',
      emotion: selectedEmotion,
      source: 'HUMAN',
      comment: `${appraisal.prefix} ${appraisal.content}`,
      appraisal,
      ...(pendingMarkerPos.width && pendingMarkerPos.height ? {
        width: pendingMarkerPos.width,
        height: pendingMarkerPos.height,
        isArea: true
      } : {})
    };

    setMarkers(prev => [...prev, newMarker]);
    setPendingMarkerPos(null);
    setSelectedEmotion(null);
  };

  const handleSubmit = async () => {
    if (markers.length < MIN_MARKERS) {
      toast.error(`Please add at least ${MIN_MARKERS} markers`);
      return;
    }

    try {
      await submitTestSession(project.id, participantName, markers);
      setStep('success');
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit. Please try again.');
    }
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6">
            <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="#F26522" strokeWidth="12" strokeLinecap="round"/>
            <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="#555555" strokeWidth="10" strokeLinecap="round"/>
            <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="#F26522" strokeWidth="8" strokeLinecap="round"/>
          </svg>
          <h1 className="text-3xl font-black text-center text-gray-900 mb-4">
            Welcome, Tester!
          </h1>
          <p className="text-gray-600 text-center mb-6">
            You've been invited to share your emotional reactions to a website. 
            Your feedback is invaluable for improving user experience.
          </p>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <Input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-900 text-sm mb-2">Instructions:</h3>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Select an emotion from the sidebar</li>
                <li>Click on the website where you feel it</li>
                <li>Explain why you felt that way</li>
                <li>Add at least {MIN_MARKERS} markers</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-lem-orange hover:bg-lem-orange-dark"
              disabled={!participantName.trim()}
            >
              Start Test
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto mb-6 text-green-500" />
          <h1 className="text-3xl font-black text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-gray-600 mb-2">
            Your feedback has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            You added {markers.length} emotional markers.
          </p>
          <Button onClick={onExit} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <AppraisalModal
        isOpen={showAppraisal}
        onClose={() => {
          setShowAppraisal(false);
          setPendingMarkerPos(null);
        }}
        onSubmit={handleAppraisalSubmit}
        emotionLabel={selectedEmotion ? EMOTIONS[selectedEmotion].label : ''}
      />

      <Toolbar onAddMarker={handleEmotionSelect} selectedEmotion={selectedEmotion} />

      <div className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm justify-between">
          <div>
            <h2 className="font-bold text-gray-900">{participantName}&apos;s Test Session</h2>
            <p className="text-xs text-gray-500">
              {markers.length} / {MIN_MARKERS} markers minimum
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
              <button
                onClick={() => setSelectionMode('point')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${selectionMode === 'point' ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                title="Place point markers"
              >
                <MousePointer2 size={14} /> Point
              </button>
              <button
                onClick={() => setSelectionMode('area')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${selectionMode === 'area' ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                title="Select rectangular areas"
              >
                <Square size={14} /> Area
              </button>
            </div>
            {selectedEmotion && (
              <div className="px-4 py-2 bg-lem-orange/10 text-lem-orange rounded-lg text-sm font-medium">
                Selected: {EMOTIONS[selectedEmotion].label}
              </div>
            )}
            {markers.length >= MIN_MARKERS ? (
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 size={16} className="mr-2" />
                Submit Feedback
              </Button>
            ) : (
              <Button disabled variant="outline">
                <AlertCircle size={16} className="mr-2" />
                {MIN_MARKERS - markers.length} more needed
              </Button>
            )}
          </div>
        </header>

        <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen} className="border-b border-gray-200">
          <CollapsibleTrigger className="w-full bg-gradient-to-r from-blue-50 to-orange-50 hover:from-blue-100 hover:to-orange-100 transition-colors">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white rounded-full p-1.5">
                  <Info size={16} />
                </div>
                <span className="font-bold text-gray-900 text-sm">Testing Instructions</span>
                <span className="text-xs text-gray-500">(Click to {instructionsOpen ? 'hide' : 'show'})</span>
              </div>
              <ChevronDown 
                size={20} 
                className={`text-gray-600 transition-transform ${instructionsOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 py-4 bg-white space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span className="bg-lem-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                    Before You Start
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Scroll through the entire page</strong> first to get a complete first impression</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span>Take your time to <strong>observe all sections</strong> before adding markers</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span className="bg-lem-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                    Adding Markers
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span>Select an emotion from the left sidebar that matches your feeling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Point mode:</strong> Click on a specific element to place a marker</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Area mode:</strong> Click and drag to select a rectangular region</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Add at least {MIN_MARKERS} markers</strong> to complete the test</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span className="bg-lem-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                    Be Specific & Honest
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Describe your thoughts precisely:</strong> What caught your attention?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Mention your goals:</strong> What were you trying to accomplish?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span><strong>Share honest reactions:</strong> Both positive and negative feedback are valuable</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span className="bg-lem-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
                    Quality Over Quantity
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2 ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span>Detailed comments are more helpful than brief ones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span>Explain <em>why</em> you felt a certain way about an element</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lem-orange mt-1">•</span>
                      <span>Focus on meaningful reactions rather than rushing to reach {MIN_MARKERS} markers</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> Your honest feedback helps improve the user experience. 
                  There are no right or wrong answers - we want to understand your genuine reactions and thought process.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex-1 overflow-y-auto">
          <AnalysisCanvas
            imgUrl={project.url}
            markers={markers}
            setMarkers={setMarkers}
            isAnalyzing={false}
            activeLayer="emotions"
            setActiveLayer={() => {}}
            layoutStructure={project.report.layoutStructure}
            screenshot={project.screenshot}
            interactionMode={selectionMode === 'point' ? 'place_marker' : 'select_area'}
            onCanvasClick={handleCanvasClick}
            onAreaSelect={handleAreaSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default ParticipantView;
