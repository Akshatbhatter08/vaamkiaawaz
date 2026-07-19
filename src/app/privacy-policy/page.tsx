import { StaticPageLayout } from "@/components/StaticPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Vaam Ki Aawaz",
  description: "Privacy Policy for Vaam Ki Aawaz (vaamkiaawaz.in).",
};

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="Privacy Policy">
      <p>
        <strong>Last updated: 19 July 2026</strong>
      </p>

      <p>
        This Privacy Policy describes how <strong>[REGISTERED ENTITY NAME]</strong>
        (&quot;Vaam Ki Aawaz&quot;, &quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;) collects, uses, stores, discloses, and otherwise processes
        information in connection with <strong>vaamkiaawaz.in</strong>, its pages,
        features, and related communications (collectively, the
        &quot;Website&quot;).
      </p>

      <p>
        We operate a digital news and public-interest journalism platform. This
        Policy applies to readers, commenters, newsletter subscribers, persons
        who contact or submit material to us, and authorised contributors,
        administrators, and other account holders. It does not govern the
        independent practices of third-party websites or services that may be
        linked to or embedded within the Website.
      </p>

      <p>
        For the purposes of applicable data-protection law, including the Digital
        Personal Data Protection Act, 2023 and rules brought into force under it,
        <strong> [REGISTERED ENTITY NAME]</strong> is the person responsible for
        determining the purposes and means of processing personal data through
        the Website, except where a third-party provider processes information
        for its own independently determined purposes.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        1. Information We Collect
      </h2>
      <p>
        The nature of the information we collect depends upon how you interact
        with the Website.
      </p>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        1.1 Information provided directly by you
      </h3>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>Newsletter subscription information.</strong> If you submit
          the newsletter subscription form, we collect your name, email address,
          telephone number, one-time-password verification information, and the
          date and time associated with your subscription record. Newsletter
          delivery is not presently active. Information submitted through the
          subscription form may nevertheless be retained to administer your
          subscription request and enable the service when it is introduced. We
          do not guarantee any particular commencement date, delivery frequency,
          or uninterrupted availability of the newsletter.
        </li>
        <li>
          <strong>Comments.</strong> When you comment on an article, we collect
          the name, email address, and comment text you submit, together with the
          relevant article and submission time. Your name, comment, and
          submission date may be displayed publicly. Your email address is
          stored for administration, security, and abuse-prevention purposes but
          is not included in the public comment display.
        </li>
        <li>
          <strong>Communications, complaints, and requests.</strong> If you
          contact us by email or another available channel, we may collect your
          name, contact information, the contents and metadata of your
          communication, supporting documents, and any other information you
          choose to provide.
        </li>
        <li>
          <strong>Editorial submissions.</strong> If you submit an article,
          report, image, document, correction, tip, or other material, we may
          process the submitted material, your identity and contact information,
          authorship details, source and attribution information, and any
          correspondence concerning review, publication, correction, removal,
          or legal rights in that material.
        </li>
        <li>
          <strong>Contributor and administrative account information.</strong>{" "}
          For authorised accounts created by us, we process information such as
          the account holder&apos;s email address, cryptographically hashed
          password, role, account status, permissions, author name, pen name,
          profile image, contributor identifier, articles or files uploaded,
          and account creation and modification timestamps.
        </li>
      </ul>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        1.2 Information collected automatically
      </h3>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>Technical and usage information.</strong> We and our service
          providers may process internet protocol address, browser type, device
          type, operating system, referring and exit pages, pages viewed,
          approximate time and date of access, interactions, and similar
          technical or usage information.
        </li>
        <li>
          <strong>Security and rate-limiting information.</strong> The Website
          processes internet protocol addresses and request information to
          detect misuse, limit repeated requests, and protect authentication,
          comments, reactions, newsletter, and other endpoints. Certain
          rate-limiting information is maintained temporarily in server memory.
          Hosting, proxy, and infrastructure providers may maintain separate
          access or security logs under their own operational practices.
        </li>
        <li>
          <strong>Article readership.</strong> We record aggregate article-view
          and interaction counts to operate readership and reporting features.
        </li>
        <li>
          <strong>Reactions.</strong> If you use an article&apos;s like or
          dislike feature, the Website generates a random pseudonymous visitor
          identifier in your browser and stores that identifier, the relevant
          article, your selected reaction, and a timestamp. The identifier is
          intended to distinguish browser installations and is not, by itself,
          intended to identify you by name.
        </li>
      </ul>

      <h3 className="mt-6 text-xl font-bold text-[var(--headline)]">
        1.3 Information we do not intentionally collect
      </h3>
      <p>
        The Website does not presently operate a payment, donation, checkout, or
        subscription-billing facility, and we do not intentionally collect
        payment-card or bank-account information through the Website. We do not
        request precise device geolocation, biometric information, or
        government-issued identity numbers through ordinary reader features.
        You should not include sensitive or unnecessary personal information in
        comments, submissions, or correspondence.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        2. Cookies, Local Storage, and Similar Technologies
      </h2>
      <p>
        The Website and third-party services use cookies, browser storage, and
        similar technologies to provide functionality, remember settings,
        measure use, maintain security, and support services integrated with the
        Website. These technologies may include:
      </p>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>Authentication cookie.</strong> An authorised contributor or
          administrator who signs in receives an <code>auth_token</code> cookie.
          It is configured as an HttpOnly cookie, uses SameSite=Lax, and
          ordinarily expires after approximately 24 hours.
        </li>
        <li>
          <strong>Google Translate cookie and session storage.</strong> Google
          Translate may use the <code>googtrans</code> cookie. The Website also
          uses session storage to remember translation scope and language state
          during a browsing session.
        </li>
        <li>
          <strong>Local storage.</strong> The Website may store a pseudonymous
          reaction identifier, theme preference, article-click state, and
          category-display preferences in the browser. For authorised
          contributors, an unpublished article draft and related form content
          may be stored locally in that contributor&apos;s browser. Browser
          storage ordinarily remains until it is cleared by the user, overwritten
          by the Website, or removed by the browser.
        </li>
        <li>
          <strong>Google technologies.</strong> Google Analytics, the Google
          AdSense integration, Google Translate, and other Google-hosted
          resources may use cookies, tags, pixels, or comparable technologies
          in accordance with Google&apos;s policies and the applicable service
          configuration.
        </li>
      </ul>

      <p>
        You may block or delete cookies and browser storage through your browser
        or device settings. Doing so may impair translation, authentication,
        reactions, preferences, and other Website functions. At present, the
        Website does not provide a separate in-page cookie-preference centre.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        3. Purposes for Which We Process Information
      </h2>
      <p>We may process information for the following purposes:</p>
      <ul className="list-disc pl-6 space-y-3">
        <li>to operate, maintain, secure, troubleshoot, and improve the Website;</li>
        <li>
          to publish and administer articles, author profiles, comments,
          reactions, events, categories, and resources;
        </li>
        <li>
          to create and administer authorised contributor and administrative
          accounts and enforce roles and permissions;
        </li>
        <li>
          to receive, verify, record, and administer newsletter subscription
          requests and, when the service becomes active, send requested
          communications;
        </li>
        <li>
          to communicate with you regarding inquiries, submissions, complaints,
          correction requests, privacy requests, or legal notices;
        </li>
        <li>
          to measure readership, understand Website performance, and produce
          aggregate analytics and internal reports;
        </li>
        <li>
          to prevent spam, fraud, unauthorised access, security incidents, and
          abuse of Website features;
        </li>
        <li>
          to establish, exercise, or defend legal rights, preserve relevant
          records, and comply with applicable law and binding legal process; and
        </li>
        <li>
          for another specific purpose disclosed to you when the information is
          collected, where permitted by law.
        </li>
      </ul>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        4. Grounds for Processing and Consent
      </h2>
      <p>
        Where applicable law requires consent, we seek to process personal data
        on the basis of your consent as expressed through an affirmative action,
        such as voluntarily submitting a form, requesting a newsletter
        subscription, posting a comment, contacting us, or otherwise requesting
        a specified service. In other circumstances, we may process information
        where necessary for a lawful purpose, to provide a service you have
        requested, to perform editorial and administrative functions, to protect
        the Website and its users, to comply with law, or as otherwise permitted
        under applicable law.
      </p>
      <p>
        You may withdraw consent for future processing by contacting us as
        described below. Withdrawal does not affect processing already
        undertaken before withdrawal and does not require deletion where
        continued retention is required or permitted by law, including for
        legal claims, compliance records, fraud prevention, or legitimate
        editorial and archival purposes.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        5. Publicly Available Information
      </h2>
      <p>
        Information that you choose to publish or submit for publication may be
        accessible to an unrestricted audience and may be copied, indexed,
        quoted, archived, or redistributed by search engines, social networks,
        other websites, or members of the public beyond our control. This
        includes comment names and text, author or pen names, author profile
        images, bylines, and published editorial submissions. Removal from our
        Website cannot guarantee removal of copies held by independent third
        parties, search-engine caches, archives, or persons who previously
        accessed the material.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        6. Third-Party Services and Disclosures
      </h2>
      <p>
        We do not sell personal data. We may disclose or make information
        available to service providers and third parties to the limited extent
        reasonably necessary for the purposes described in this Policy. These
        parties may include:
      </p>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>Hosting, database, network, and technical providers</strong>{" "}
          that host or support the Website, store information, deliver content,
          provide security, or maintain infrastructure.
        </li>
        <li>
          <strong>Google Analytics</strong>, which is presently integrated to
          measure Website traffic and usage. Google may receive technical and
          usage information, including online identifiers and information about
          pages and interactions, subject to the applicable Google Analytics
          configuration and Google&apos;s terms and policies.
        </li>
        <li>
          <strong>Google AdSense.</strong> The Website presently loads a Google
          AdSense integration, but the AdSense account is pending Google&apos;s
          approval and advertisements are not currently being served. The
          integration may nevertheless cause requests to be made to Google and
          may permit Google to process technical information under its policies.
          If approval is granted and advertising is activated, we presently
          intend to use non-personalised advertising. Non-personalised
          advertising may still use cookies or similar technologies for matters
          such as frequency capping, aggregated reporting, fraud prevention,
          security, and contextual advertisement delivery. We will update this
          Policy if our advertising practices materially change.
        </li>
        <li>
          <strong>Google Translate</strong>, which provides automated
          translation and may process page content, language selections, and
          technical information when the service loads or is used.
        </li>
        <li>
          <strong>Google-hosted fonts and resources</strong>, which may receive
          technical request information when resources are retrieved.
        </li>
        <li>
          <strong>Email service providers, including Gmail/SMTP</strong>, which
          process recipient email addresses and message contents to deliver
          one-time passwords and, if activated, newsletter or administrative
          communications.
        </li>
        <li>
          <strong>Make.com or a configured automation provider.</strong> When a
          new article is published, public article metadata—such as the title,
          excerpt, public URL, author name, and category—may be transmitted to a
          configured automation webhook for publishing or notification
          workflows.
        </li>
        <li>
          <strong>Embedded-content providers.</strong> Articles may contain
          content from YouTube or Vimeo. Loading or interacting with such
          content may allow the relevant provider to receive your internet
          protocol address, device or browser information, page URL, and
          interaction data under its own policies.
        </li>
        <li>
          <strong>Social and external services.</strong> If you choose to use a
          sharing link or visit an external social-media profile, your browser
          communicates directly with that service. The relevant provider may
          receive the shared page URL and other information under its own
          policies.
        </li>
        <li>
          <strong>Professional advisers and authorities.</strong> We may
          disclose information to legal counsel, auditors, insurers,
          investigators, courts, regulators, law-enforcement bodies, or
          government authorities where reasonably necessary to obtain advice,
          protect rights or safety, investigate wrongdoing, comply with law, or
          respond to valid and binding legal process.
        </li>
        <li>
          <strong>Organisational transactions.</strong> If the Website or its
          operating organisation is reorganised, merged, transferred, or
          succeeded by another operator, relevant records may be disclosed or
          transferred subject to applicable law and appropriate safeguards.
        </li>
      </ul>

      <p>
        Information about Google&apos;s use of data from sites that use its
        services is available at{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noreferrer"
        >
          policies.google.com/technologies/partner-sites
        </a>
        . Google advertising controls are available at{" "}
        <a
          href="https://adssettings.google.com"
          target="_blank"
          rel="noreferrer"
        >
          adssettings.google.com
        </a>
        .
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        7. International Processing
      </h2>
      <p>
        Some third-party providers may process or store information on systems
        located outside India. Where information is transferred or made
        accessible across borders, we intend to do so subject to applicable
        Indian law, including any restrictions notified by the Government of
        India. Third-party providers remain responsible for their independent
        processing practices under their respective terms and applicable law.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        8. Data Retention
      </h2>
      <p>
        We retain personal data while the relevant relationship continues—for
        example, while a person remains a subscriber, commenter, contributor,
        administrator, correspondent, or requester—and for a reasonable period
        thereafter, or until a valid deletion request is received, whichever
        occurs earlier. We may retain information for a longer period where
        reasonably necessary or required for compliance with law, an ongoing or
        reasonably anticipated dispute, the establishment or defence of legal
        claims, security and fraud prevention, enforcement of our rights,
        regulatory cooperation, or another purpose permitted by law.
      </p>
      <p>
        Retention periods may differ according to the nature, sensitivity,
        context, and purpose of the information. One-time-password records and
        technical security information may be retained beyond their functional
        expiry for a reasonable administrative, security, or evidentiary period.
        Browser storage remains on your device until removed by you, by the
        Website, or by the browser. Third-party providers may apply their own
        retention schedules.
      </p>
      <p>
        Published articles may remain part of our editorial and historical
        record after an author, contributor, or account holder ceases their
        relationship with us. Articles removed from public view may be retained
        internally in a hidden or restricted form for editorial accountability,
        audit, record-preservation, dispute resolution, and legal-defence
        purposes. This does not authorise us to retain unrelated personal data
        indefinitely where retention is no longer lawful or necessary.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        9. Your Requests and Choices
      </h2>
      <p>
        Subject to applicable law and any lawful exceptions, you may request
        information about personal data we process concerning you, correction
        of inaccurate or incomplete personal data, withdrawal of consent,
        cessation of newsletter communications, or deletion of personal data
        that is no longer required for a lawful purpose.
      </p>
      <p>
        To unsubscribe from the newsletter or make a privacy or deletion
        request, email{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
        . We will act upon a genuine and sufficiently verified request within
        <strong> 30 days</strong> of receiving the information reasonably
        required to process it. We may ask you to verify control of the relevant
        email address or provide other proportionate information to prevent
        unauthorised access, alteration, or deletion.
      </p>
      <p>
        A request may be restricted or refused to the extent permitted or
        required by law, including where we cannot reasonably verify the
        requester, the request concerns another person&apos;s rights, the
        information must be preserved for legal or security purposes, or the
        request would require deletion of a lawful editorial or public record.
        Where appropriate and legally required, we will explain the basis for
        such a decision.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        10. Children&apos;s Privacy
      </h2>
      <p>
        The Website is a general-audience news platform and is not directed or
        designed specifically for children. Reading publicly available articles
        does not require an account or an age declaration. We do not ask
        newsletter subscribers or commenters to state their age and therefore
        do not independently verify their age through those features.
      </p>
      <p>
        Contributor and administrative accounts are restricted to persons who
        are at least 18 years old. If we become aware that a child&apos;s personal
        data has been provided through a reader-facing feature in circumstances
        requiring parental consent or other special treatment under applicable
        law, we may restrict the relevant feature, seek appropriate
        authorisation, or delete the data, as legally appropriate. A parent or
        lawful guardian who believes that a child has provided personal data may
        contact us at{" "}
        <a
          href="mailto:vaamkiaawaz@gmail.com"
          className="text-[var(--primary)] hover:underline"
        >
          vaamkiaawaz@gmail.com
        </a>
        . We may require reasonable verification of the requester&apos;s identity
        and authority in order to protect the child and the data concerned.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        11. Information Security
      </h2>
      <p>
        We use reasonable administrative and technical measures appropriate to
        the nature of the Website and the information processed. Existing
        controls include cryptographic password hashing, time-limited
        authentication and one-time-password mechanisms, role and permission
        checks, input validation, content sanitisation, file-type and size
        validation, rate limiting, and security-related browser headers.
      </p>
      <p>
        No internet transmission, information system, or storage method is
        completely secure. We therefore cannot warrant absolute security or
        guarantee that information will never be accessed, disclosed, altered,
        lost, or destroyed without authorisation. If a personal-data breach
        occurs, we will assess and address it and provide notifications where
        required by applicable law.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        12. Automated Translation and Decision-Making
      </h2>
      <p>
        Google Translate provides automated translations for convenience.
        Translation may involve automated processing of page content and may
        contain errors. We do not use the Website&apos;s ordinary reader features
        to make solely automated decisions producing legal or similarly
        significant effects concerning readers. Aggregate analytics and
        automated security or rate-limiting controls may nevertheless affect
        the availability of particular requests or features.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        13. External Links and Third-Party Content
      </h2>
      <p>
        The Website may contain links to external websites, embedded media, and
        material supplied by third parties. We do not control and are not
        responsible for the privacy, security, availability, or data practices
        of those independent parties. You should review the applicable
        third-party privacy notice before providing information or using the
        relevant service.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        14. Legal Requests and Preservation
      </h2>
      <p>
        We may preserve, use, or disclose information where we reasonably
        believe this is necessary to comply with applicable law, a valid court
        order, or other binding legal process; respond to lawful requests by
        competent authorities; investigate suspected illegality or misuse;
        protect the rights, safety, or property of the Website, our personnel,
        users, sources, or the public; or establish, exercise, or defend legal
        claims. Nothing in this Policy requires voluntary disclosure in response
        to a request that is not legally valid or binding.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        15. Changes to This Policy
      </h2>
      <p>
        We may amend this Policy to reflect changes in law, regulatory guidance,
        technology, service providers, Website functionality, or our processing
        practices. The revised Policy will be posted on this page with an
        updated revision date. Where required by law, we will provide additional
        notice or obtain consent before materially different processing begins.
        You should review this page periodically.
      </p>

      <h2 className="mt-8 text-2xl font-bold text-[var(--headline)]">
        16. Governing Law
      </h2>
      <p>
        This Policy is governed by the applicable laws of India. Subject to any
        mandatory statutory forum, regulatory authority, or jurisdiction that
        cannot lawfully be excluded, disputes concerning this Policy or our
        processing practices shall be subject to the jurisdiction of the
        competent courts at Kolkata, West Bengal.
      </p>

      <div className="bg-[var(--surface-soft)] p-4 rounded-lg border border-[var(--line)] mt-8">
        <h2 className="font-bold text-[var(--headline)] mb-2">
          Privacy Contact
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
          This contact is provided for privacy questions and requests. It is not
          a representation that a statutory Grievance Officer has been appointed
          where no such appointment has yet been made.
        </p>
      </div>
    </StaticPageLayout>
  );
}
