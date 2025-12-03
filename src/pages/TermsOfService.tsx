import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using LEMtool, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">2. Description of Service</h2>
              <p className="text-gray-600">
                LEMtool provides AI-powered emotional analysis of websites using the Layered Emotion Measurement (LEM) methodology. The service analyzes web pages to identify emotional triggers, psychological needs, and strategic elements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">3. User Accounts</h2>
              <p className="text-gray-600">
                You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">4. Acceptable Use</h2>
              <p className="text-gray-600">
                You agree not to use LEMtool for any unlawful purpose or in any way that could damage, disable, or impair our service. You may only analyze websites that you have permission to analyze.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">5. Intellectual Property</h2>
              <p className="text-gray-600">
                The LEM methodology, emotion images, and all related intellectual property are owned by LEMtool and its licensors. Analysis reports generated are for your personal or business use only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">6. Payment and Refunds</h2>
              <p className="text-gray-600">
                Subscription fees are billed in advance. One-time analysis pack purchases are non-refundable. We reserve the right to change pricing with 30 days notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-600">
                LEMtool is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">8. Changes to Terms</h2>
              <p className="text-gray-600">
                We may modify these terms at any time. Continued use of LEMtool after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">9. Contact</h2>
              <p className="text-gray-600">
                For questions about these Terms of Service, please contact us through our Support page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;