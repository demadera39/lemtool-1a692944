import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-black text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">1. Information We Collect</h2>
              <p className="text-gray-600">
                We collect information you provide directly, including your email address, name, and payment information. We also collect URLs of websites you analyze and the resulting analysis data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-600">
                We use your information to provide and improve LEMtool services, process payments, communicate with you about your account, and send service-related announcements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">3. Data Storage and Security</h2>
              <p className="text-gray-600">
                Your data is stored securely using industry-standard encryption. We use Supabase for database services and Stripe for payment processing. Both services maintain high security standards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">4. Website Screenshots</h2>
              <p className="text-gray-600">
                When you analyze a website, we capture and store screenshots of that website. These screenshots are used solely for analysis purposes and are associated with your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">5. Third-Party Services</h2>
              <p className="text-gray-600">
                We use third-party services including Google (Gemini AI for analysis), Stripe (payments), and Supabase (authentication and database). These services have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">6. Data Retention</h2>
              <p className="text-gray-600">
                We retain your account information and analysis data as long as your account is active. You can request deletion of your data by deleting your account in the Settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">7. Your Rights</h2>
              <p className="text-gray-600">
                You have the right to access, correct, or delete your personal data. You can export your analysis data or delete your account at any time through the Settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">8. Cookies</h2>
              <p className="text-gray-600">
                We use essential cookies for authentication and session management. We do not use tracking cookies or share data with advertising networks.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">9. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">10. Contact</h2>
              <p className="text-gray-600">
                For questions about this Privacy Policy or your data, please contact us through our Support page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;