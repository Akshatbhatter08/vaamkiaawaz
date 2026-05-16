import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "हमारे बारे में | वाम की आवाज़",
  description: "वाम की आवाज़ (vaamkiaawaz.in) - एक जन समाचार मंच का परिचय और उद्देश्य।",
};

export default function AboutUs() {
  return (
    <StaticPageLayout title="हमारे बारे में">
      <h2 className="text-xl font-bold text-[var(--headline)] font-serif mb-2">वाम की आवाज़ | जन समाचार मंच</h2>
      <p>
        <strong>वाम की आवाज़</strong> (vaamkiaawaz.in) पश्चिम बंगाल के कोलकाता से संचालित एक स्वतंत्र और निर्भीक डिजिटल समाचार प्लेटफॉर्म है। एक ऐसे दौर में जब मुख्यधारा का मीडिया सत्ता और पूंजी के प्रभाव में काम कर रहा है, हम जनता की स्वतंत्र और बेखौफ आवाज बनने के लिए प्रतिबद्ध हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">हमारा उद्देश्य</h2>
      <p>
        हमारा प्राथमिक उद्देश्य उन जन-संघर्षों, श्रमिक आंदोलनों, किसान मुद्दों, शिक्षा और स्वास्थ्य की बुनियादी समस्याओं, तथा सामाजिक न्याय से जुड़े उन ज्वलंत सवालों को मजबूती से उठाना है, जिन्हें अक्सर नजरअंदाज कर दिया जाता है। हम समाज के अंतिम पायदान पर खड़े व्यक्ति की कहानी को आगे लाते हैं। 
      </p>
      <p>
        हमारा मंच कोई व्यापारिक उपक्रम नहीं है; यह एक वैचारिक और सामाजिक जिम्मेदारी है। हम एक समतामूलक, न्यायपूर्ण और शोषण-मुक्त समाज के निर्माण के लिए पत्रकारीय धर्म निभा रहे हैं।
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">हमारा संकल्प</h2>
      <blockquote className="border-l-4 border-[var(--primary)] pl-4 italic text-[var(--muted)] my-6">
        "अगर थक गए हो चुप रहकर सहने से, रगों में खून उबल रहा है अन्याय के खिलाफ, न्याय, समानता और प्रगति में है विश्वास तो — उठो ! बोलो ! बदलो !"
      </blockquote>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">हमारी टीम</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>प्रेरक:</strong> मोहम्मद सलीम</li>
        <li><strong>मुख्य सचेतक:</strong> डॉ. अशोक सिंह</li>
        <li><strong>सलाहकार संपादक:</strong> उत्तम सेनगुप्ता</li>
        <li><strong>संपादक मण्डल:</strong> श्रेया जायसवाल, राजीव कुमार पाण्डेय और देश भर के अन्य समर्पित स्वतंत्र पत्रकार एवं लेखक।</li>
        <li><strong>संस्थापक एवं मुख्य संपादक:</strong> केशव कुमार भट्टड़</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">संपर्क जानकारी</h2>
      <ul className="list-none pl-0 space-y-2">
        <li><strong>मुख्यालय:</strong> कोलकाता, पश्चिम बंगाल, भारत</li>
        <li><strong>ईमेल:</strong> <a href="mailto:vaamkiaawaz@gmail.com" className="text-[var(--primary)] hover:underline">vaamkiaawaz@gmail.com</a></li>
        <li><strong>यूट्यूब (लाइव कवरेज):</strong> <a href="https://youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">@VaamKiAawaz</a></li>
        <li><strong>फेस्बूक:</strong> <a href="https://facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">@VaamKiAawaz</a></li>
        <li><strong>संपादक:</strong> <a href="https://www.facebook.com/keshava.bhattar/" target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">केशव कुमार भट्टड़</a></li>
      </ul>
    </StaticPageLayout>
  );
}
