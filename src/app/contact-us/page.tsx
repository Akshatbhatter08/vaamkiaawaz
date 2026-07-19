import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Vaam Ki Aawaz",
  description: "Contact information for Vaam Ki Aawaz (vaamkiaawaz.in).",
};

export default function ContactUs() {
  return (
    <StaticPageLayout title="Contact Us">
      <p>
        <strong>Last updated: 19 July 2026</strong>
      </p>

      <p>
        This page sets out the authorised channels for contacting{" "}
        <strong>[REGISTERED ENTITY NAME]</strong> (&quot;Vaam Ki Aawaz&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) in connection with{" "}
        <strong>vaamkiaawaz.in</strong> (the &quot;Website&quot;).
      </p>

      <p>
        We welcome inquiries, feedback, editorial submissions, correction
        reports, privacy requests, and other communications relating to the
        Website. Use of the channels below does not create any contractual
        relationship, employment relationship, or obligation to publish,
        respond in a particular form, or adopt any requested position, except
        where applicable law expressly requires a response or where we have
        separately undertaken a specific commitment in a published policy.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        1. Primary Contact
      </h2>
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-6">
        <p className="m-0 text-sm text-[var(--muted)]">
          Operator: <strong>[REGISTERED ENTITY NAME]</strong>
          <br />
          Location: Kolkata, West Bengal, India
        </p>
        <p className="mt-4 mb-1 text-sm text-[var(--muted)]">
          Primary email for general inquiries, feedback, complaints, editorial
          submissions, correction reports, and privacy requests:
        </p>
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-lg font-semibold text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
      </div>
      <p className="mt-4">
        For efficient handling, please state the subject clearly in the email
        subject line—for example, &quot;Correction Request&quot;,
        &quot;Privacy / Deletion Request&quot;, &quot;Editorial Submission&quot;,
        &quot;Complaint&quot;, or &quot;General Inquiry&quot;.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        2. Purpose-Specific Communications
      </h2>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.1 General inquiries and feedback
      </h3>
      <p>
        Questions about the Website, feedback on published material, and
        general correspondence may be sent to the primary email address above.
        We endeavour to review genuine communications in good faith, but we do
        not guarantee a reply to every message or within any fixed period unless
        a specific published policy provides otherwise.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.2 Editorial complaints and content concerns
      </h3>
      <p>
        Complaints concerning published editorial content may be sent to the
        same email address. Please include the article URL, a concise
        description of the concern, and any supporting material. Editorial
        standards are governed by our Editorial Policy. Alleged factual errors
        are handled under our Corrections Policy.
      </p>
      <p>
        This contact channel is an editorial and administrative means of
        communication. It is not a representation that a statutory Grievance
        Officer has been appointed where no such appointment has yet been made.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.3 Corrections and clarifications
      </h3>
      <p>
        To report an alleged factual error, misleading statement, or ambiguity
        requiring clarification, email{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>{" "}
        with the particulars described in our Corrections Policy. We will
        endeavour to commence review of a genuine and intelligible report within
        48 hours, as set out in that Policy.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.4 Privacy, unsubscribe, and deletion requests
      </h3>
      <p>
        Requests relating to personal data—including newsletter unsubscription,
        access, correction, withdrawal of consent, or deletion—should be sent to{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
        . Subject to verification and applicable law, we will act upon a genuine
        request within 30 days, as set out in our Privacy Policy.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.5 Legal notices
      </h3>
      <p>
        Formal legal notices, including notices alleging defamation, copyright
        infringement, privacy breach, or other legal claims, should be sent to
        the primary email address and should clearly identify:
      </p>
      <ul className="list-disc pl-6 space-y-3">
        <li>the full legal name and contact details of the sender;</li>
        <li>the capacity in which the sender acts;</li>
        <li>the URL(s) or other precise identification of the material concerned;</li>
        <li>the legal basis of the complaint or demand; and</li>
        <li>the relief sought.</li>
      </ul>
      <p>
        Receipt of a notice does not constitute admission of any allegation,
        waiver of any defence, or agreement to any demanded remedy. We reserve
        all rights and remedies available under law.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        3. Editorial Submissions
      </h2>
      <p>
        We welcome submissions of articles, ground reports, interviews,
        photographs with lawful rights, documentary materials, and editorial
        suggestions from independent writers, researchers, and citizen
        journalists, subject to our Editorial Policy and applicable law.
      </p>
      <p>
        Submissions should be sent by email to{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
        , preferably with:
      </p>
      <ul className="list-disc pl-6 space-y-3">
        <li>the proposed title and a brief summary;</li>
        <li>the full draft or relevant materials;</li>
        <li>the author&apos;s name and contact details;</li>
        <li>
          a statement of originality and of the rights held in any accompanying
          images, documents, or media; and
        </li>
        <li>
          disclosure of any conflict of interest, sponsorship, or prior
          publication.
        </li>
      </ul>
      <p>
        Sending a submission does not guarantee review, acceptance, publication,
        payment, byline placement, or retention of the material in any
        particular form. We may edit, decline, delay, or return submissions at
        our discretion. Unless otherwise agreed in writing, unsolicited
        submissions are provided voluntarily and without creating any obligation
        of confidentiality beyond that required by law or by our Privacy Policy.
      </p>
      <p>
        Contributor and administrator accounts on the Website are created only
        by authorised personnel and are restricted to persons aged 18 years or
        older. Public submission by email is not the same as being granted a
        publishing account.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        4. Social Media and Public Channels
      </h2>
      <p>
        We maintain public social-media and video channels for updates, video
        coverage, and general public communication. Those channels are not
        substitutes for formal email notice on legal, privacy, correction, or
        complaint matters. Messages sent only through social-media platforms
        may not be received, retained, or acted upon as formal notices.
      </p>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>YouTube:</strong>{" "}
          <a
            href="https://www.youtube.com/@VaamKiAawaz"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            youtube.com/@VaamKiAawaz
          </a>
        </li>
        <li>
          <strong>Facebook:</strong>{" "}
          <a
            href="https://www.facebook.com/VaamKiAawaz"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            facebook.com/VaamKiAawaz
          </a>
        </li>
        <li>
          <strong>Instagram:</strong>{" "}
          <a
            href="https://www.instagram.com/VaamKiAawaz"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            instagram.com/VaamKiAawaz
          </a>
        </li>
        <li>
          <strong>X:</strong>{" "}
          <a
            href="https://www.x.com/VaamKiAawaz"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            x.com/VaamKiAawaz
          </a>
        </li>
      </ul>
      <p>
        Third-party social-media platforms are governed by their own terms and
        privacy practices. Communication through those platforms may be visible
        to the platform operator and, depending on privacy settings, to other
        users.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        5. Location and Correspondence Address
      </h2>
      <p>
        <strong>Headquarters:</strong> Kolkata, West Bengal, India.
      </p>
      <p>
        For security and privacy reasons, our full office or postal address is
        not published on this page as a matter of course. Where a full address
        is reasonably required for service of process, formal legal
        correspondence, or another legitimate purpose, it may be provided upon
        appropriate request to{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
        , subject to verification of the requester&apos;s identity and purpose.
      </p>
      <p>
        Unless and until a full address for service is expressly provided in
        writing for a particular matter, email to the address stated above is
        the preferred channel for ordinary Website-related correspondence.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        6. Response Expectations and Abuse of Contact Channels
      </h2>
      <p>
        We may prioritise communications according to urgency, legal
        significance, and completeness of particulars. We may decline to
        continue correspondence that is abusive, threatening, harassing,
        spam-like, vexatious, or that repeatedly seeks remedies already
        considered and refused on reasoned grounds.
      </p>
      <p>
        Do not include unnecessary sensitive personal data, passwords, one-time
        passwords, or payment credentials in unsolicited email. If your
        communication necessarily contains personal data of third parties,
        provide only what is reasonably required for the stated purpose.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        7. Relationship to Other Policies and Governing Law
      </h2>
      <p>
        This page should be read together with our Privacy Policy, Editorial
        Policy, and Corrections Policy. Those policies govern the substance of
        privacy requests, editorial standards, and correction procedures
        respectively.
      </p>
      <p>
        Communications with us in connection with the Website are governed by
        the applicable laws of India. Subject to any mandatory statutory forum
        or jurisdiction that cannot lawfully be excluded, disputes arising out
        of or relating to such communications or this page shall be subject to
        the jurisdiction of the competent courts at Kolkata, West Bengal.
      </p>
      <p>
        We may amend this page from time to time. The revised version will be
        posted here with an updated revision date.
      </p>

      <div className="bg-[var(--surface-soft)] p-4 rounded-lg border border-[var(--line)] mt-8">
        <h2 className="font-bold text-[var(--headline)] mb-2">
          Quick Reference
        </h2>
        <p className="m-0 text-sm">
          Email:{" "}
          <a
            href="mailto:vaamkiaawaz@gmail.com"
            className="text-[var(--primary)] hover:underline"
          >
            vaamkiaawaz@gmail.com
          </a>
          <br />
          Corrections: see Corrections Policy (48-hour review commencement)
          <br />
          Privacy / deletion / unsubscribe: see Privacy Policy (30-day action
          window)
          <br />
          Location: Kolkata, West Bengal, India
        </p>
      </div>
    </StaticPageLayout>
  );
}
