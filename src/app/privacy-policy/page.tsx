import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "गोपनीयता नीति | वाम की आवाज़",
  description: "वाम की आवाज़ (vaamkiaawaz.in) की गोपनीयता नीति (Privacy Policy)।",
};

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="गोपनीयता नीति (Privacy Policy)">
      <p>
        <strong>वाम की आवाज़</strong> (vaamkiaawaz.in) में हम अपने पाठकों की गोपनीयता (Privacy) का सम्मान करते हैं। यह गोपनीयता नीति स्पष्ट करती है कि जब आप हमारी वेबसाइट पर आते हैं तो हम किस प्रकार की जानकारी एकत्र करते हैं, उसका उपयोग कैसे करते हैं, और आपकी जानकारी को सुरक्षित रखने के लिए क्या कदम उठाते हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">1. हम कौन सी जानकारी एकत्र करते हैं?</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>व्यक्तिगत जानकारी:</strong> जब आप स्वेच्छा से हमसे संपर्क करते हैं (जैसे ईमेल के माध्यम से) या हमारे न्यूज़लेटर की सदस्यता लेते हैं, तो हम आपका नाम और ईमेल पता एकत्र कर सकते हैं।
        </li>
        <li>
          <strong>गैर-व्यक्तिगत और स्वचालित जानकारी:</strong> जब आप हमारी वेबसाइट ब्राउज़ करते हैं, तो हम आपके डिवाइस, ब्राउज़र प्रकार, IP एड्रेस (IP Address), और वेबसाइट पर बिताए गए समय जैसी सामान्य जानकारी कुकीज़ (Cookies) और एनालिटिक्स टूल्स (जैसे Google Analytics) के माध्यम से एकत्र कर सकते हैं। यह जानकारी वेबसाइट के प्रदर्शन को सुधारने के लिए उपयोग की जाती है।
        </li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">2. जानकारी का उपयोग</h2>
      <p>हम एकत्र की गई जानकारी का उपयोग निम्नलिखित उद्देश्यों के लिए करते हैं:</p>
      <ul className="list-disc pl-6 space-y-3">
        <li>हमारी वेबसाइट और सामग्री के अनुभव को बेहतर बनाने के लिए।</li>
        <li>पाठकों के रुझान (Trends) और ट्रैफ़िक का विश्लेषण करने के लिए।</li>
        <li>यदि आपने न्यूज़लेटर की सदस्यता ली है, तो आपको समाचार और अपडेट भेजने के लिए।</li>
        <li>पाठकों के सवालों और फीडबैक का उत्तर देने के लिए।</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">3. तीसरे पक्ष (Third-Party) सेवाएँ और कुकीज़</h2>
      <p>
        हमारी वेबसाइट पर विज्ञापन प्रदर्शित करने या ट्रैफ़िक का विश्लेषण करने के लिए तीसरे पक्ष की सेवाओं (जैसे Google Analytics, Google AdSense) का उपयोग किया जा सकता है। ये सेवाएँ अपनी कुकीज़ का उपयोग कर सकती हैं ताकि वे आपको आपकी रुचियों के आधार पर प्रासंगिक विज्ञापन दिखा सकें। आप अपने ब्राउज़र की सेटिंग में जाकर कुकीज़ को अक्षम (Disable) कर सकते हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">4. डेटा साझाकरण (Data Sharing)</h2>
      <p>
        हम आपका ईमेल पता या कोई भी व्यक्तिगत जानकारी बिना आपकी स्पष्ट सहमति के किसी भी तीसरे पक्ष (Third Party) के साथ बेचते या साझा नहीं करते हैं। अपवाद केवल कानूनी आवश्यकताओं या सरकारी आदेशों के मामले में हो सकता है।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">5. बाहरी लिंक्स (External Links)</h2>
      <p>
        हमारे लेखों में संदर्भ के लिए बाहरी वेबसाइटों के लिंक हो सकते हैं। उन वेबसाइटों की अपनी गोपनीयता नीतियां होती हैं। हम किसी अन्य वेबसाइट की सामग्री या गोपनीयता प्रथाओं के लिए जिम्मेदार नहीं हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">6. नीति में बदलाव</h2>
      <p>
        हम समय-समय पर अपनी गोपनीयता नीति में बदलाव कर सकते हैं। कोई भी महत्वपूर्ण बदलाव होने पर उसे इसी पृष्ठ पर अपडेट किया जाएगा। 
      </p>

      <div className="bg-[var(--surface-soft)] p-4 rounded-lg border border-[var(--line)] mt-8">
        <h3 className="font-bold text-[var(--headline)] mb-2">संपर्क करें</h3>
        <p className="m-0 text-sm">इस गोपनीयता नीति के संबंध में किसी भी प्रश्न के लिए आप हमें <a href="mailto:vaamkiaawaz@gmail.com" className="text-[var(--primary)] hover:underline">vaamkiaawaz@gmail.com</a> पर संपर्क कर सकते हैं।</p>
      </div>
    </StaticPageLayout>
  );
}
