import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';
const Pricing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 relative overflow-hidden">
      {/* Decorative emotion stickers using real emotion images */}
      <div className="absolute top-10 right-10 w-20 h-20 opacity-20 rotate-12">
        <img src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/joy.png" alt="Joy" className="w-full h-full" />
      </div>
      <div className="absolute bottom-20 left-10 w-16 h-16 opacity-15 -rotate-12">
        <img src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/interest.png" alt="Interest" className="w-full h-full" />
      </div>
      <div className="absolute top-1/3 left-1/4 w-12 h-12 opacity-10">
        <img src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/satisfaction.png" alt="Satisfaction" className="w-full h-full" />
      </div>
      
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
            Buy analysis packs that never expire • No subscriptions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Free</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900">€0</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">One-time only</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700"><strong>3 analyses</strong> to try the tool</span>
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
            </ul>

            <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
              Get Started Free
            </Button>
          </div>

          {/* Starter Pack */}
          <div className="bg-gradient-to-br from-lem-orange to-orange-600 rounded-2xl border-2 border-lem-orange p-8 shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full text-sm font-bold text-lem-orange border-2 border-lem-orange">
              Most Popular
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-white mb-2">Starter Pack</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">€9.99</span>
              </div>
              <p className="text-orange-100 text-sm mt-1">10 analyses • Never expire</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium"><strong>10 MONTHLY analyses</strong></span>
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
            </ul>

            <Button onClick={() => navigate('/auth')} className="w-full bg-white text-lem-orange hover:bg-gray-50">
              Buy Starter Pack
            </Button>
          </div>

          {/* Top-up Pack */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Top-up Pack (premium users)</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900">€4.99</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">5 analyses • Never expire</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700"><strong>5 analyses</strong> that never expire</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Perfect for occasional use</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">All premium features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Buy multiple packs anytime</span>
              </li>
            </ul>

            
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-black text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">
                Do analysis packs expire?
              </h4>
              <p className="text-gray-600">
                No! Once you purchase a pack, the analyses are yours forever. Use them at your own pace.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">
                Can I buy multiple packs?
              </h4>
              <p className="text-gray-600">
                Yes! Buy as many top-up packs as you need. They all stack and never expire.
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
    </div>;
};
export default Pricing;