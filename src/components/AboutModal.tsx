import { X, Heart, Brain, Target, Users } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
              <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="#F26522" strokeWidth="12" strokeLinecap="round"/>
              <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="#555555" strokeWidth="10" strokeLinecap="round"/>
              <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="#F26522" strokeWidth="8" strokeLinecap="round"/>
            </svg>
            <h2 className="text-3xl font-black text-gray-900">About LEMtool</h2>
            <p className="text-gray-600 mt-2">Layered Emotion Measurement for UX Research</p>
          </div>

          <div className="space-y-6 text-gray-700">
            <p className="leading-relaxed">
              <strong>LEMtool</strong> is a pioneering research tool that combines <strong>Appraisal Theory</strong>, 
              <strong> Self-Determination Theory</strong>, and <strong>AI-powered analysis</strong> to measure emotional 
              impact in digital experiences.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-lem-orange">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={20} className="text-lem-orange" />
                  <h3 className="font-bold text-gray-900">Emotions Layer</h3>
                </div>
                <p className="text-sm">
                  Identify Joy, Desire, Interest, Satisfaction, and negative emotions through AI analysis and user testing.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={20} className="text-blue-500" />
                  <h3 className="font-bold text-gray-900">Psych Needs</h3>
                </div>
                <p className="text-sm">
                  Measure how well your design fulfills Autonomy, Competence, and Relatedness (SDT).
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} className="text-green-500" />
                  <h3 className="font-bold text-gray-900">Strategy Layer</h3>
                </div>
                <p className="text-sm">
                  Discover Opportunities, Pain Points, and Insights for strategic design decisions.
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-purple-500" />
                  <h3 className="font-bold text-gray-900">User Testing</h3>
                </div>
                <p className="text-sm">
                  Invite participants to place emotional markers and share their appraisals in real-time.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-3">How It Works</h3>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li><strong>Enter a URL</strong> - Paste any website address</li>
                <li><strong>AI Analysis</strong> - Gemini AI analyzes emotional triggers automatically</li>
                <li><strong>Review Layers</strong> - Switch between Emotions, Needs, and Strategy</li>
                <li><strong>Invite Testers</strong> - Share test links with real users</li>
                <li><strong>Export Report</strong> - Download comprehensive PDF reports</li>
              </ol>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Created by <strong>METODIC</strong> • Powered by Gemini AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
