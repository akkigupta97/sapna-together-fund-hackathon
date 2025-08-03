import AppLayout from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Help & Support</h1>
        <p className="text-sm sm:text-base text-gray-300">We're here to assist you</p>
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-20 space-y-6">
        <Card className="glass-card p-4 sm:p-6 space-y-4 text-sm sm:text-base text-gray-300 leading-relaxed">
          <section>
            <p className="text-slate-700">
              If you have any questions, concerns, or need assistance regarding the app, please don’t hesitate to reach out to us.
              We’re always happy to help.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">📧 Support Email</h2>
            <ul className="space-y-1 text-slate-700">
              <li>
                <a
                  href="mailto:akshat.ag1097@gmail.com"
                  className="text-mint-green hover:underline break-words"
                >
                  akshat.ag1097@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="mailto:abinashsena@gmail.com"
                  className="text-mint-green hover:underline break-words"
                >
                  abinashsena@gmail.com
                </a>
              </li>
            </ul>
          </section>

          <section>
            <p className="text-slate-700">
              We aim to respond to all inquiries within <strong>48 hours</strong>. Your feedback helps us improve and grow—thank you for being a part of our journey.
            </p>
          </section>
        </Card>
      </div>
    </AppLayout>
  );
}
