import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "संपर्क करें | वाम की आवाज़",
  description: "वाम की आवाज़ (vaamkiaawaz.in) से संपर्क करने की जानकारी।",
};

export default function ContactUs() {
  return (
    <StaticPageLayout title="संपर्क करें">
      <p>
        हम <strong>वाम की आवाज़</strong> (vaamkiaawaz.in) पर अपने पाठकों, समर्थकों और आलोचकों के विचारों का स्वागत करते हैं। यदि आपके पास कोई सवाल है, कोई जानकारी साझा करनी है, तो कृपया नीचे दिए गए माध्यमों से हमसे संपर्क करें।
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-6">
          <h3 className="font-serif text-xl font-bold text-[var(--headline)] mb-4">ईमेल (Email)</h3>
          <p className="text-sm text-[var(--muted)] mb-2">सामान्य पूछताछ, फीडबैक, और शिकायत के लिए:</p>
          <a href="mailto:vaamkiaawaz@gmail.com" className="text-lg font-semibold text-[var(--primary)] hover:underline">
            vaamkiaawaz@gmail.com
          </a>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-6">
          <h3 className="font-serif text-xl font-bold text-[var(--headline)] mb-4">सोशल मीडिया</h3>
          <p className="text-sm text-[var(--muted)] mb-2">लाइव कवरेज, वीडियो और अपडेट्स के लिए:</p>
          <a href="https://youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className="text-lg font-semibold text-[var(--primary)] hover:underline">
            YouTube / @VaamKiAawaz
          </a>
          <br/>
          <a href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" className="text-lg font-semibold text-[var(--primary)] hover:underline mt-2 inline-block">
            Facebook / VaamKiAawaz
          </a>
        </div>
      </div>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">संपादकीय टीम से संपर्क</h2>
      <p>
        यदि आप कोई <strong>लेख (Article)</strong>, <strong>ग्राउंड रिपोर्ट</strong> या <strong>संपादकीय सुझाव</strong> भेजना चाहते हैं, तो कृपया अपने विषय के साथ हमें ईमेल करें। हम स्वतंत्र लेखकों और नागरिक पत्रकारों (Citizen Journalists) के योगदान का हमेशा स्वागत करते हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">हमारा पता</h2>
      <p>
        <strong>मुख्यालय:</strong> कोलकाता, पश्चिम बंगाल, भारत<br/>
        <span className="text-sm text-[var(--muted)] italic">(सुरक्षा और गोपनीयता कारणों से हमारा पूर्ण कार्यालय का पता केवल आवश्यक संपर्क पर ही उपलब्ध कराया जाता है।)</span>
      </p>

    </StaticPageLayout>
  );
}
