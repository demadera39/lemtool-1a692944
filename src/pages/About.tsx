import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, Lightbulb, TrendingUp } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to LEMtool
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6">
            <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="#F26522" strokeWidth="12" strokeLinecap="round"/>
            <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="#555555" strokeWidth="10" strokeLinecap="round"/>
            <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="#F26522" strokeWidth="8" strokeLinecap="round"/>
          </svg>
          <h1 className="text-5xl font-black text-gray-900 mb-4">About LEMtool</h1>
          <p className="text-xl text-gray-600">
            Measure emotional impact in user interface design
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-4">What is LEMtool?</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            LEMtool is an innovative platform that combines AI-powered analysis with human emotional feedback to help designers and researchers understand the emotional impact of their user interfaces.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By analyzing websites through the lens of emotion theory and cognitive appraisal, LEMtool provides actionable insights into how users emotionally respond to different UI elements, helping you create more engaging and effective digital experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Target size={24} className="text-lem-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis</h3>
            <p className="text-gray-600">
              Our AI evaluates your UI against emotion theory, identifying emotional triggers and providing detailed analysis of user experience patterns.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users size={24} className="text-lem-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Participant Testing</h3>
            <p className="text-gray-600">
              Invite real users to share their emotional responses by placing markers and providing context about their feelings while interacting with your UI.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb size={24} className="text-lem-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Appraisal Theory</h3>
            <p className="text-gray-600">
              Based on cognitive appraisal theory, LEMtool helps understand the "why" behind emotions through goals, attitudes, and values.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-lem-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Comparison Dashboard</h3>
            <p className="text-gray-600">
              Compare AI predictions with real user feedback side-by-side to validate assumptions and discover unexpected emotional responses.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-lem-orange to-orange-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Measure Emotion?</h2>
          <p className="text-orange-100 mb-6 text-lg">
            Start analyzing your UI today with 3 free analyses
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-white text-lem-orange hover:bg-gray-50"
          >
            Get Started Free
          </Button>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">
            Questions or feedback? We'd love to hear from you.
          </p>
          <a href="mailto:hello@lemtool.com" className="text-lem-orange font-bold hover:underline">
            hello@lemtool.com
          </a>
        </div>
      </main>
    </div>
  );
};

export default About;