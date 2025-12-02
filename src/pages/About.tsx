import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Sparkles, FileText } from 'lucide-react';

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
          <div className="w-16 h-16 bg-lem-orange rounded-lg flex items-center justify-center mx-auto mb-6">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">About LEMtool</h1>
          <p className="text-xl text-gray-600">
            Origins & Methodology
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <p className="text-gray-700 leading-relaxed text-lg">
            The <strong>Layered Emotion Measurement (LEM) tool</strong> is a visual instrument designed to measure human emotions in interactive digital environments. Unlike traditional surveys that rely on text, LEM uses a visual language to capture immediate, intuitive emotional responses. The LEM emotion images are <strong>fully scientifically validated</strong> as non-verbal response stimuli for emotional experiences.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-lem-orange" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">ORIGINS & DEVELOPMENT</h2>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            The LEMtool was originally conceptualized and developed by researchers at <strong>SusaGroup</strong> and the <strong>University of Twente</strong> (notably by Marco van Hout together with colleagues Gijs Huisman, Kevin Capota, David Guiza, Lars Rengersen, and Bas Jansen) in the Netherlands. It emerged from the need to go beyond standard usability testing and understand the <em>emotional experience</em> of users on the web.
          </p>
          
          <p className="text-gray-700 leading-relaxed">
            Standard questionnaires often interrupt the user flow and force users to rationalize their feelings into words. The LEMtool was designed to be a "layer" over the interface, allowing users to simply drag and drop expressive cartoon characters onto the screen at the exact moment and place an emotion occurred.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-lem-orange" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">SCIENTIFIC FOUNDATION</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Visual Primitives</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                The tool utilizes caricatured expressions based on universal facial coding research (Ekman). By using a consistent cartoon character, it reduces bias related to gender, age, or race, focusing purely on the emotional signal.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Dimensional Model</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                The selected emotions cover key quadrants of the Circumplex Model of Affect (Valence vs. Arousal), ensuring a balanced measurement of both positive/negative and active/passive emotional states relevant to UX (e.g., Fascination vs. Boredom).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-4">EVOLUTION TO AI</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            This modern iteration, <strong>LEM by METODIC</strong>, combines the validated visual methodology of the original LEMtool with advanced Generative AI. Instead of relying solely on live user panels, we use AI agents configured with deep psychological personas to simulate user reactions, allowing for instant, scalable emotional feedback during the design process.
          </p>
        </div>

        <div className="bg-orange-50 rounded-2xl p-8 border border-orange-200 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-lem-orange" />
            KEY REFERENCES
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white rounded flex items-center justify-center">
                <FileText size={14} className="text-lem-orange" />
              </div>
              <div>
                <p className="text-gray-700 italic">
                  Huisman, G., van Hout, M., van Dijk, B., van der Geest, T., & Heylen, D. (2013). LEMtool - Measuring Emotions in Visual Interfaces. In <em>CHI '13: Proceedings of the SIGCHI Conference on Human Factors in Computing Systems</em> (pp. 351–360). Paris, France: ACM. DOI: 10.1145/2470654.2470706
                </p>
                <a 
                  href="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/Files/p351-huisman.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lem-orange hover:underline text-xs mt-1 inline-block"
                >
                  Download PDF →
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white rounded flex items-center justify-center">
                <FileText size={14} className="text-lem-orange" />
              </div>
              <p className="text-gray-700 italic">
                Huisman, G., & Van Hout, M. (2010). The development of a graphical emotion measurement instrument using caricatured expressions: the LEMtool.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white rounded flex items-center justify-center">
                <FileText size={14} className="text-lem-orange" />
              </div>
              <p className="text-gray-700 italic">
                Van Hout, M., et al. Measuring emotions in visual and interaction design. SusaGroup.
              </p>
            </div>
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

        <div className="mt-12 text-center">
          <Button 
            variant="ghost"
            onClick={() => navigate('/support')}
            className="text-lem-orange hover:text-lem-orange-dark"
          >
            Questions? Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
};

export default About;