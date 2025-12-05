import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText } from 'lucide-react';
import Header from '@/components/Header';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <img 
              src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/joy.png" 
              alt="Joy emotion" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-5xl font-black text-foreground mb-4">About LEMtool</h1>
          <p className="text-xl text-muted-foreground">
            Origins & Methodology
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-foreground/80 leading-relaxed text-lg">
              The <strong className="text-foreground">Layered Emotion Measurement (LEM) tool</strong> is a visual instrument designed to measure human emotions in interactive digital environments. Unlike traditional surveys that rely on text, LEM uses a visual language to capture immediate, intuitive emotional responses. The LEM emotion images are <strong className="text-foreground">fully scientifically validated</strong> as non-verbal response stimuli for emotional experiences.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles size={20} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground">ORIGINS & DEVELOPMENT</h2>
            </div>
            
            <p className="text-foreground/80 leading-relaxed mb-4">
              The LEMtool was originally conceptualized and developed by researchers at <strong className="text-foreground">SusaGroup</strong> and the <strong className="text-foreground">University of Twente</strong> (notably by Marco van Hout together with colleagues Gijs Huisman, Kevin Capota, David Guiza, Lars Rengersen, and Bas Jansen) in the Netherlands. It emerged from the need to go beyond standard usability testing and understand the <em>emotional experience</em> of users on the web.
            </p>
            
            <p className="text-foreground/80 leading-relaxed">
              Standard questionnaires often interrupt the user flow and force users to rationalize their feelings into words. The LEMtool was designed to be a "layer" over the interface, allowing users to simply drag and drop expressive cartoon characters onto the screen at the exact moment and place an emotion occurred.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground">SCIENTIFIC FOUNDATION</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-border rounded-xl p-6 bg-muted/30">
                <h3 className="text-lg font-bold text-foreground mb-3">Visual Primitives</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  The tool utilizes caricatured expressions based on universal facial coding research (Ekman). By using a consistent cartoon character, it reduces bias related to gender, age, or race, focusing purely on the emotional signal.
                </p>
              </div>

              <div className="border border-border rounded-xl p-6 bg-muted/30">
                <h3 className="text-lg font-bold text-foreground mb-3">Dimensional Model</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  The selected emotions cover key quadrants of the Circumplex Model of Affect (Valence vs. Arousal), ensuring a balanced measurement of both positive/negative and active/passive emotional states relevant to UX (e.g., Fascination vs. Boredom).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-black text-foreground mb-4">EVOLUTION TO AI</h2>
            <p className="text-foreground/80 leading-relaxed">
              This modern iteration, <strong className="text-foreground">LEM by METODIC</strong>, combines the validated visual methodology of the original LEMtool with advanced Generative AI. Instead of relying solely on live user panels, we use AI agents configured with deep psychological personas to simulate user reactions, allowing for instant, scalable emotional feedback during the design process.
            </p>
          </div>

          <div className="bg-accent/50 rounded-2xl p-8 border border-primary/20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              KEY REFERENCES
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-card rounded flex items-center justify-center">
                  <FileText size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground/80 italic">
                    Huisman, G., van Hout, M., van Dijk, B., van der Geest, T., & Heylen, D. (2013). LEMtool - Measuring Emotions in Visual Interfaces. In <em>CHI '13: Proceedings of the SIGCHI Conference on Human Factors in Computing Systems</em> (pp. 351–360). Paris, France: ACM.
                  </p>
                  <a 
                    href="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/Files/p351-huisman.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs mt-1 inline-block"
                  >
                    Download PDF →
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-card rounded flex items-center justify-center">
                  <FileText size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground/80 italic">
                    Huisman, G., & Van Hout, M. (2010). The development of a graphical emotion measurement instrument using caricatured expressions: the LEMtool.
                  </p>
                  <a 
                    href="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/Files/LEMtoolpaper.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs mt-1 inline-block"
                  >
                    Download PDF →
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-card rounded flex items-center justify-center">
                  <FileText size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground/80 italic">
                    Van Hout, M., Huisman, G., & Law, K. (2012). A digital love story: Measuring and designing for emotions in interactive visual interfaces. In <em>8th International Conference on Design & Emotion</em>. London, United Kingdom.
                  </p>
                  <a 
                    href="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/Files/A_digital_love_story_workshop_proposal1200.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs mt-1 inline-block"
                  >
                    Download PDF →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-3xl font-black mb-4">Ready to Measure Emotion?</h2>
            <p className="text-primary-foreground/80 mb-6 text-lg">
              Start analyzing your UI today with 3 free analyses
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-card text-primary hover:bg-card/90"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
