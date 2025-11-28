import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 relative overflow-hidden">
      {/* Decorative emotion stickers */}
      <div className="absolute top-10 right-10 text-6xl opacity-20 rotate-12">😊</div>
      <div className="absolute bottom-20 left-10 text-5xl opacity-15 -rotate-12">🎯</div>
      <div className="absolute top-1/3 left-1/4 text-4xl opacity-10">✨</div>
      
      <header className="bg-white border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={18} className="mr-2" />
            Back to LEMtool
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Start free, upgrade when you need more analyses
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Free</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900">$0</span>
                <span className="text-gray-500">/forever</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">3 UI analyses per account</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">AI emotion markers</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Full analysis reports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">No participant testing</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">No comparison dashboard</span>
              </li>
            </ul>

            <div className="relative">
              <div className="absolute -top-3 -right-3 text-4xl animate-bounce">😊</div>
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline" 
                className="w-full"
              >
                Get Started Free
              </Button>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-lem-orange to-orange-600 rounded-2xl border-2 border-lem-orange p-8 shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full text-sm font-bold text-lem-orange border-2 border-lem-orange">
              Most Popular
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-white mb-2">Premium</h2>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-white">$9.99</span>
                <span className="text-orange-100">/month</span>
              </div>
              <p className="text-orange-100 text-sm">or $109/year (save $11)</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Unlimited UI analyses</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">AI emotion markers</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Full analysis reports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Participant testing links</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">AI vs Human comparison</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Priority support</span>
              </li>
            </ul>

            <div className="relative">
              <div className="absolute -top-3 -right-3 text-4xl animate-pulse">✨</div>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-white text-lem-orange hover:bg-gray-50"
              >
                Start Free Trial
              </Button>
              <p className="text-center text-orange-100 text-xs mt-3">
                Start with 3 free analyses
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-black text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">
                Can I upgrade or downgrade anytime?
              </h4>
              <p className="text-gray-600">
                Yes! You can upgrade to Premium at any time. If you cancel, you'll keep Premium features until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">
                What happens to my projects if I cancel?
              </h4>
              <p className="text-gray-600">
                Your existing projects and data remain accessible. You'll keep your 3 free analyses and can view all previous work.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">
                How does participant testing work?
              </h4>
              <p className="text-gray-600">
                Premium users can generate invite links for participants to place emotion markers and provide feedback on your UI, which you can then compare with AI insights.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;