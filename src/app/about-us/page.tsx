import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Vaam Ki Aawaz",
  description: "An introduction to Vaam Ki Aawaz (vaamkiaawaz.in), its purpose, commitments, and team.",
};

export default function AboutUs() {
  return (
    <StaticPageLayout title="About Us">
      <h2 className="text-xl font-bold text-[var(--headline)] font-serif mb-2">Vaam Ki Aawaz | People&apos;s News Platform</h2>
      <p>
        <strong>Vaam Ki Aawaz</strong> (vaamkiaawaz.in), operated by <strong>[REGISTERED ENTITY NAME]</strong>, is an independent and fearless digital news platform based in Kolkata, West Bengal. At a time when mainstream media is increasingly influenced by power and capital, we remain committed to serving as an independent and unafraid voice of the people.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">Our Purpose</h2>
      <p>
        Our primary purpose is to bring sustained attention to people&apos;s struggles, labour movements, farmers&apos; issues, fundamental concerns relating to education and healthcare, and urgent questions of social justice that are frequently overlooked. We seek to bring forward the stories of those situated at the most marginalised levels of society.
      </p>
      <p>
        Our platform is not a commercial undertaking; it represents an ideological and social responsibility. Through our journalism, we seek to contribute to the creation of an equitable, just, and exploitation-free society.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">Our Pledge</h2>
      <blockquote className="border-l-4 border-[var(--primary)] pl-4 italic text-[var(--muted)] my-6">
        &quot;अगर थक गए हो चुप रहकर सहने से, रगों में खून उबल रहा है अन्याय के खिलाफ, न्याय, समानता और प्रगति में है विश्वास तो — उठो ! बोलो ! बदलो !&quot;
      </blockquote>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">Our Team</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Inspirer:</strong> Mohammed Salim</li>
        <li><strong>Chief Whip:</strong> Dr. Ashok Singh</li>
        <li><strong>Advisory Editor:</strong> Uttam Sengupta</li>
        <li><strong>Editorial Board:</strong> Shreya Jaiswal, Rajiv Kumar Pandey, and other dedicated independent journalists and writers from across India.</li>
        <li><strong>Founder and Chief Managing Editor:</strong> Keshaw Kumar Bhattar</li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">Contact Information</h2>
      <ul className="list-none pl-0 space-y-2">
        <li><strong>Headquarters:</strong> Kolkata, West Bengal, India</li>
        <li><strong>Email:</strong> <a href="mailto:vaamkiaawaz@gmail.com" className="text-[var(--primary)] hover:underline">vaamkiaawaz@gmail.com</a></li>
        <li><strong>YouTube (Live Coverage):</strong> <a href="https://youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">@VaamKiAawaz</a></li>
        <li><strong>Facebook:</strong> <a href="https://facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">@VaamKiAawaz</a></li>
        <li><strong>Editor:</strong> <a href="https://www.facebook.com/keshava.bhattar/" target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">Keshav Kumar Bhattar</a></li>
      </ul>
    </StaticPageLayout>
  );
}
