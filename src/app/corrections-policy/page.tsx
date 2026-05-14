import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "सुधार एवं स्पष्टीकरण नीति | वाम की आवाज़",
  description: "वाम की आवाज़ (vaamkiaawaz.in) की भूल-सुधार और स्पष्टीकरण नीति।",
};

export default function CorrectionsPolicy() {
  return (
    <StaticPageLayout title="सुधार एवं स्पष्टीकरण नीति">
      <p>
        <strong>वाम की आवाज़</strong> (vaamkiaawaz.in) अपने पाठकों तक तथ्यात्मक और सटीक जानकारी पहुंचाने को अपनी सर्वोच्च प्राथमिकता मानती है। हम पूरी सावधानी बरतते हैं, फिर भी पत्रकारिता की भागदौड़ में मानवीय भूल होना संभव है। यदि हमारे किसी प्रकाशित लेख, रिपोर्ट या समाचार में कोई तथ्यात्मक, भाषिक या व्याख्यात्मक गलती पाई जाती है, तो हम उसे तुरंत सुधारने और अपने पाठकों को इसके बारे में पारदर्शी रूप से सूचित करने के लिए प्रतिबद्ध हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">सुधार की प्रक्रिया</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>सामान्य त्रुटियां:</strong> छोटी गलतियों, जैसे कि वर्तनी (Spelling), व्याकरण, या टाइपिंग मिस्टेक को बिना किसी विशेष घोषणा के तुरंत सुधार लिया जाता है। हालांकि, यदि इससे वाक्य का अर्थ बदल रहा था, तो हम लेख के अंत में एक नोट जोड़ते हैं।
        </li>
        <li>
          <strong>तथ्यात्मक गलतियां:</strong> यदि लेख में कोई बड़ी तथ्यात्मक गलती (जैसे गलत आंकड़े, गलत नाम, या गलत संदर्भ) हो गई है, तो हम उसे तुरंत सुधारते हैं और लेख के शीर्ष (Top) पर या नीचे स्पष्ट रूप से <strong>"सुधार" (Correction)</strong> या <strong>"अपडेट"</strong> नोट दिखाते हैं। इस नोट में स्पष्ट किया जाता है कि मूल लेख में क्या गलती थी और अब क्या सही जानकारी दी गई है।
        </li>
        <li>
          <strong>स्पष्टीकरण (Clarification):</strong> यदि कोई रिपोर्ट तथ्यात्मक रूप से सही है, लेकिन उसकी भाषा भ्रामक हो सकती है या किसी तथ्य का गलत अर्थ निकाला जा सकता है, तो हम उसे अधिक स्पष्ट करने के लिए भाषा को संशोधित करते हैं और एक <strong>"स्पष्टीकरण"</strong> नोट जोड़ते हैं।
        </li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">गलती की रिपोर्ट कैसे करें?</h2>
      <p>
        हम अपने पाठकों की सतर्कता का स्वागत करते हैं। यदि आपको हमारी वेबसाइट पर प्रकाशित किसी भी सामग्री में कोई गलती या भ्रामक जानकारी मिलती है, तो कृपया बेझिझक हमसे संपर्क करें।
      </p>
      <div className="bg-[var(--surface-soft)] p-4 rounded-lg border border-[var(--line)] mt-4">
        <p className="m-0"><strong>ईमेल:</strong> <a href="mailto:vaamkiaawaz@gmail.com" className="text-[var(--primary)] hover:underline">vaamkiaawaz@gmail.com</a></p>
      </div>
      <p className="mt-4">
        हमारी संपादकीय टीम आपकी शिकायत मिलने के <strong>48 घंटे के भीतर</strong> उसकी जांच करेगी और आवश्यक होने पर तुरंत सुधार करेगी।
      </p>
    </StaticPageLayout>
  );
}
