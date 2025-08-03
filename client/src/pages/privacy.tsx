import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Privacy & Security</h1>
        <p className="text-sm sm:text-base text-gray-300">Your privacy matters to us</p>
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-20 space-y-6">
        <Card className="glass-card p-4 sm:p-6 space-y-4 text-sm sm:text-base text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Your Privacy Matters</h2>
            <p className="text-slate-700">
              This app collects, stores, and processes personal health data to provide accurate tracking and personalized recommendations.
              We take your privacy and data security seriously.
            </p>
          </section>

          <section>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Data Collection and Usage</h3>
            <p className="text-slate-700">
              We collect information such as your name, age, gender, activity levels, biometric data (e.g., heart rate, steps), and
              health-related entries (e.g., symptoms, medications, sleep). This data is used solely to enhance your experience and
              improve app functionality.
            </p>
          </section>

          <section>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Data Security</h3>
            <p className="text-slate-700">
              All data is encrypted both in transit and at rest. We implement industry-standard security protocols and regularly
              update our systems to protect against unauthorized access, data breaches, and misuse.
            </p>
          </section>

          <section>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Third-Party Access</h3>
            <p className="text-slate-700">
              We do not sell your personal data. Third-party access is limited to services essential for app functionality (e.g., cloud
              storage, analytics) and complies with data protection laws. These partners are contractually obligated to maintain
              confidentiality and data security.
            </p>
          </section>

          <section>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Your Control</h3>
            <p className="text-slate-700">
              You can access, update, or delete your data at any time via your profile settings. You may also request complete data
              deletion by contacting our support team.
            </p>
          </section>

          <section>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Health Disclaimer</h3>
            <p className="text-slate-700">
              This app is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified
              healthcare provider with any health-related questions.
            </p>
          </section>

          <section>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Consent</h3>
            <p className="text-slate-700">
              By using this app, you consent to the collection and use of your information as described above.
            </p>
          </section>
        </Card>
      </div>
    </AppLayout>
  );
}
