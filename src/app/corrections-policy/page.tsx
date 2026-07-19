import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corrections Policy | Vaam Ki Aawaz",
  description: "Corrections and Clarifications Policy for Vaam Ki Aawaz (vaamkiaawaz.in).",
};

export default function CorrectionsPolicy() {
  return (
    <StaticPageLayout title="Corrections and Clarifications Policy">
      <p>
        <strong>Last updated: 19 July 2026</strong>
      </p>

      <p>
        This Corrections and Clarifications Policy describes how{" "}
        <strong>[REGISTERED ENTITY NAME]</strong> (&quot;Vaam Ki Aawaz&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) addresses alleged
        errors, omissions, and ambiguities in editorial content published on{" "}
        <strong>vaamkiaawaz.in</strong> (the &quot;Website&quot;).
      </p>

      <p>
        Accuracy is a core editorial obligation. Journalism is produced under
        time pressure and through human judgement. Errors may nevertheless
        occur. When a material error, misleading presentation, or ambiguity is
        identified, we will take corrective action proportionate to the nature
        and seriousness of the issue.
      </p>

      <p>
        This Policy applies to news reports, analysis, interviews, opinion
        pieces, guest contributions, and other editorial material published by
        or through the Website. It does not convert every disagreement of
        interpretation, political disagreement, or contested opinion into an
        actionable error. Reader comments are not editorial content and are
        addressed under our separate moderation and contact arrangements.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        1. Guiding Principles
      </h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          We correct material errors promptly once they are verified to our
          reasonable satisfaction.
        </li>
        <li>
          Corrections and clarifications should be clear, proportionate, and
          understandable to a reasonable reader.
        </li>
        <li>
          We do not silently alter the historical meaning of a report in a
          manner that conceals a significant factual change, except where
          immediate legal, safety, or privacy considerations require temporary
          restriction of access pending further action.
        </li>
        <li>
          A correction is not an admission of liability beyond the facts
          corrected, and does not waive any legal defence available to us or to
          any author.
        </li>
        <li>
          We may refuse requests that are abusive, vexatious, unverifiable,
          disproportionate, or that seek suppression of lawful and accurate
          reporting of public importance.
        </li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        2. Categories of Remedial Action
      </h2>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.1 Minor non-substantive errors
      </h3>
      <p>
        Spelling, grammar, punctuation, formatting, typographical, and similar
        non-substantive errors that do not alter the meaning of a statement may
        be corrected without a separate public correction notice.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.2 Meaning-affecting language errors
      </h3>
      <p>
        Where a linguistic or typographical error changed, or was reasonably
        capable of changing, the meaning of a material statement, we will
        correct the text and ordinarily add a brief note at the end of the
        article describing the nature of the change.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.3 Material factual errors
      </h3>
      <p>
        Where an article contains a material factual error—including, without
        limitation, an incorrect name, date, figure, quotation, attribution,
        location, status of a legal proceeding, or other significant
        fact—we will correct the error and publish a visible{" "}
        <strong>Correction</strong> or <strong>Update</strong> note. The note
        will ordinarily identify what was previously stated and what has been
        corrected, unless doing so would itself create an unnecessary risk of
        further harm, prejudice, or unlawful disclosure.
      </p>
      <p>
        Depending on the seriousness of the error and the structure of the
        article, the note may appear near the beginning of the article, near
        the end, or in another position reasonably calculated to come to a
        reader&apos;s attention.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.4 Clarifications
      </h3>
      <p>
        Where a report is factually accurate but may reasonably be misunderstood
        because of ambiguity, incomplete context, or potentially misleading
        wording, we may revise the language and publish a{" "}
        <strong>Clarification</strong> note explaining the clarification.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.5 Updates
      </h3>
      <p>
        Where subsequent developments render earlier accurate reporting
        incomplete rather than incorrect, we may publish an{" "}
        <strong>Update</strong> adding later information. An update is not
        necessarily a correction.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        2.6 Retraction, restriction, or removal
      </h3>
      <p>
        In exceptional cases—particularly where continued publication would be
        unlawful, seriously misleading, unsafe, or unjustifiably harmful—we may
        withdraw, substantially rewrite, restrict access to, or remove an
        article from public view. Where appropriate and practicable, we may
        publish a short public note explaining that the article has been
        corrected, updated, or withdrawn. Content removed from public view may
        be retained internally in a restricted form for audit, accountability,
        and legal-defence purposes.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        3. How Corrections Are Implemented
      </h2>
      <p>
        Corrections, clarifications, and updates are ordinarily implemented by
        authorised editorial personnel editing the published article and, where
        required by this Policy, inserting a visible note into the article text.
        The Website does not presently maintain a separate public revision
        history, automated correction log, or dedicated correction database
        field. The current published version of the article, including any
        correction or clarification note, is the operative public record.
      </p>
      <p>
        Where an error appears in a headline, social-media caption, excerpt, or
        other distribution text under our control, we will take reasonable steps
        to correct that text as well. We cannot control caches, screenshots,
        republishing, or archives maintained by independent third parties.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        4. How to Report an Alleged Error
      </h2>
      <p>
        Any person who believes that content on the Website contains a factual
        error, a misleading statement, or an ambiguity requiring clarification
        may report it by email to{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
        .
      </p>
      <p>To assist prompt review, the report should, where practicable, include:</p>
      <ul className="list-disc pl-6 space-y-3">
        <li>the full URL of the article or other content concerned;</li>
        <li>the specific passage alleged to be incorrect or misleading;</li>
        <li>
          a concise statement of the alleged error and the correct information,
          if known;
        </li>
        <li>
          supporting evidence, such as documents, official records, or
          contemporaneous sources; and
        </li>
        <li>
          the requester&apos;s name and a working contact email address.
        </li>
      </ul>
      <p>
        Anonymous reports may be considered, but the absence of contact details
        or supporting material may limit our ability to investigate or respond.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        5. Review Timeline and Process
      </h2>
      <p>
        Upon receipt of a genuine and intelligible report, our editorial team
        will endeavour to commence review within{" "}
        <strong>48 hours</strong>. &quot;Commence review&quot; means that the
        report will be acknowledged internally and assigned for examination; it
        does not guarantee that a final decision or published correction will be
        completed within 48 hours in every case.
      </p>
      <p>
        The time required to complete a review depends on the complexity of the
        issue, the availability of sources, the need for legal or editorial
        consultation, and whether the report concerns an active dispute or
        sensitive subject. Where a material error is verified, we will correct
        it as soon as reasonably practicable.
      </p>
      <p>
        We may contact the requester for further particulars, consult the
        author or uploader, examine source materials, and seek independent
        corroboration. We may also decline to act where the report is not
        substantiated, where the contested statement is fair comment or
        protected reportage, or where the requested remedy would itself be
        inaccurate, unlawful, or contrary to the public interest.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        6. Requests by Persons Named or Affected
      </h2>
      <p>
        A person or organisation named or otherwise identifiable in an article
        may request a correction, clarification, update, or right of reply. We
        will consider such requests in good faith. Where a reply is warranted,
        we may publish a concise response, incorporate relevant points into an
        update, or take other proportionate editorial action.
      </p>
      <p>
        A request for reply does not oblige us to publish defamatory, abusive,
        irrelevant, unlawful, or disproportionately lengthy material. Nor does
        it require us to withdraw accurate reporting of public importance
        solely because the subject objects to it.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        7. Relationship to Legal Notices and Complaints
      </h2>
      <p>
        This Policy provides an editorial mechanism for addressing alleged
        errors. It does not replace formal legal notices, statutory remedies, or
        proceedings under applicable law. Where a communication is expressly
        framed as a legal notice, intellectual-property claim, or privacy
        request, we may handle it under the applicable legal process in addition
        to, or instead of, this Policy.
      </p>
      <p>
        The email channel identified in this Policy is an editorial and
        administrative contact method. It is not a representation that a
        statutory Grievance Officer has been appointed where no such appointment
        has yet been made.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        8. Preservation of Records
      </h2>
      <p>
        We may retain correspondence relating to alleged errors, internal review
        notes, and prior versions or restricted copies of content where
        reasonably necessary for editorial accountability, audit, compliance,
        and the establishment or defence of legal claims. Retention of such
        records is governed by our Privacy Policy and applicable law.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        9. Relationship to Other Policies and Governing Law
      </h2>
      <p>
        This Policy should be read together with our Editorial Policy and
        Privacy Policy. In the event of inconsistency on an editorial-standards
        matter, the Editorial Policy prevails for that matter. In the event of
        inconsistency on a privacy matter, the Privacy Policy prevails for that
        matter.
      </p>
      <p>
        This Policy is governed by the applicable laws of India. Subject to any
        mandatory statutory forum or jurisdiction that cannot lawfully be
        excluded, disputes arising out of or relating to this Policy shall be
        subject to the jurisdiction of the competent courts at Kolkata, West
        Bengal.
      </p>
      <p>
        We may amend this Policy from time to time. The revised version will be
        posted on this page with an updated revision date.
      </p>

      <div className="bg-[var(--surface-soft)] p-4 rounded-lg border border-[var(--line)] mt-8">
        <h2 className="font-bold text-[var(--headline)] mb-2">
          Corrections Contact
        </h2>
        <p className="m-0 text-sm">
          Operator: <strong>[REGISTERED ENTITY NAME]</strong>
          <br />
          Location: Kolkata, West Bengal, India
          <br />
          Email:{" "}
          <a
            href="mailto:vaamkiaawaz@gmail.com"
            className="text-[var(--primary)] hover:underline"
          >
            vaamkiaawaz@gmail.com
          </a>
        </p>
        <p className="mt-3 mb-0 text-sm">
          Please include the article URL and supporting particulars to enable
          timely review.
        </p>
      </div>
    </StaticPageLayout>
  );
}
