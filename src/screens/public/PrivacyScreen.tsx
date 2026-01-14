import { PageHeader } from '@/components/form/page-header'

// Simple section header component with minimal styling
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-medium py-2 border-b mb-3">{title}</h2>
  )
}

export function PrivacyScreen() {
  return (
    <div className='legal-page relative overflow-hidden'>
      <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />

      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
            <PageHeader
              title='Privacy Policy'
              subtitle='This policy describes how we collect, use, and protect your information.'
            />

            <div className='mt-8 space-y-6'>
              <div className='text-sm text-muted-foreground'>Last Updated: January 11, 2026</div>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    This policy applies to products IndianPGManagement.com of Satz Techno Solutions, a partnership incorporated under the Companies Act, 1956 with its registered office at No 1/50, P.K Street Mettu Kantigai, Gudapakkam, Chennai, Thiruvallur, Tamil Nadu, Pin : 600124, India
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="1. Introduction" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    This policy describes how IndianPGManagement.com collects, stores, uses and otherwise processes your Personal Information through our websites, Applications, m-sites, chatbots, notifications or any other medium used by us to provide its services to you (hereinafter referred to as the "Platform"). By visiting, downloading, using PG Manager Platform, and/or, providing your information or availing our product/services, you expressly agree to be bound by this Privacy Policy ("Policy") and the applicable service/product terms and conditions. We value the trust you place in us and respect your privacy, maintaining the highest standards for secure transactions and protection of your personal information.
                  </p>

                  <p>
                    This Privacy Policy is published and shall be construed in accordance with the provisions of Indian laws and regulations including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 under the Information Technology Act, 2000, the Aadhaar Act, 2016 and its Amendments, including the Aadhaar Regulations; that require publishing of the privacy policy for collection, use, storage, transfer, disclosure of Personal Information. Personal Information means and includes all information that can be linked to a specific individual and also includes Sensitive Personal Information (all Personal Information which requires heightened data protection measures due to its sensitive and personal nature), both, hereinafter referred to as "Personal Information", excluding any information that is freely available or accessible in public domain. Please note, we do not offer any product/service under our Platform outside India. If you do not agree with this Privacy Policy, please do not use or access our Platform.
                  </p>

                  <p>
                    This privacy policy has been compiled to better serve those who are concerned with how their 'Personally Identifiable Information' (PII) is being used online. PII, as described in privacy law and information security, is information that can be used on its own or with other information to identify, contact, or locate a single person, or to identify an individual in context. Please read our privacy policy carefully to get a clear understanding of how we collect, use, protect or otherwise handle your Personally Identifiable Information in accordance with our website.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="2. Information We Collect" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <h3 className="font-medium">What personal information do we collect?</h3>
                  <p>
                    We may collect your Personal Information when you use our services or Platform or otherwise interact with us during the course of our relationship. We collect Personal Information which is relevant and absolutely necessary for providing the services requested by you and to continually improve the IndianPGManagement.com
                  </p>

                  <p>
                    Personal and Sensitive Personal Information collected, as applicable, includes, but are not limited to:
                  </p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>name, age, gender, photo, address, phone number, e-mail id, address, your contacts, workplace, references and their phone number</li>
                    <li>PAN card number, KYC related information such as videos or other online/ offline verification documents as mandated by relevant regulatory authorities, your business-related information</li>
                    <li>Aadhaar information including Aadhaar number or Virtual ID for the purposes of e-KYC authentication with the Unique Identification Authority of India (UIDAI). Note that submission of Aadhaar information is not mandatory for e-KYC authentication, you can also use other types of information, such as your PAN or GST number</li>
                    <li>OTP sent to you by your bank or IndianPGManagement.com</li>
                    <li>wallet balance, wallet transaction history</li>
                    <li>your device details such as device identifier, internet bandwidth, mobile device model, browser plug-ins, and cookies or similar technologies that may identify your browser/IndianPGManagement.com App and plug-ins, and time spent, IP address and location, activity logs</li>
                  </ul>

                  <p>
                    In addition to your information, you might be asked to provide the same set of information of your tenants/inmates like name, email address, phone number, address, workplace for which you will be solely responsible unless your users accept and are aware of our privacy policies.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="3. When We Collect Information" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>Information may be collected at various stages of your usage of our Platform such as:</p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>visiting IndianPGManagement.com platform[either apps or wibsite]</li>
                    <li>registering on IndianPGManagement.com as an "user/owner" or "tenant/inmate" or any other relationship that may be governed by terms and conditions listed on IndianPGManagement.com</li>
                    <li>accessing links, e-mails, chat conversations, feedbacks, notifications sent or owned by IndianPGManagement.com and if you opt to participate in our occasional surveys</li>
                    <li>otherwise dealing with any of the IndianPGManagement.com Entities/Subsidiaries</li>
                    <li>while applying for career opportunities with IndianPGManagement.com</li>
                  </ul>

                  <p>
                    We and our service providers or business partners may also collect your Personal Information from third parties or information made publicly available, as applicable, including but not limited to:
                  </p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>your resume, your past employment and educational qualification for background checks and verifications, through online or offline databases that are otherwise legitimately obtained in case you apply for employment opportunities with IndianPGManagement.com or during police verifications</li>
                    <li>your demographic and photo information including but not limited to Aadhaar number, address, gender, and date of birth as a response received from UIDAI upon successful Aadhaar e-KYC</li>
                  </ul>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="4. How We Use Your Information" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    We may use the information we collect from you when you register, make a purchase, sign up for our newsletter, respond to a survey or marketing communication, surf the website, or use certain other site features in the following ways:
                  </p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>creation of your account and verification of your identity and access privileges</li>
                    <li>provide you access to the products and services being offered by us, merchants, entities, subsidiaries, sellers, logistic partners, or business partners</li>
                    <li>to allow us to better service you in responding to your customer service requests</li>
                    <li>to conduct the KYC compliance process as a mandatory prerequisite as per the requirements of various regulatory bodies, including UIDAI under the Aadhaar Act and its Regulations</li>
                    <li>to validate, process and/or share your KYC information, nominee details with other intermediaries, Regulated Entities (REs) or AMCs or financial institutions or with any other service providers as may be required</li>
                    <li>to process payments on your behalf and on your instructions; communicate with you for your queries, transactions, and/or any other regulatory requirement, etc.</li>
                    <li>to authenticate a transaction request; confirming a payment made via the services</li>
                    <li>enhancing your user experience in various processes/submission of applications/availment of product/service offerings by analysing user behaviour on an aggregated basis</li>
                    <li>to monitor and review products/services from time to time; customize the services to make your experience safer and easier, and conducting audits</li>
                    <li>to allow third parties to contact you for products and services availed/requested by you on our Platform or third-party links</li>
                    <li>to inform you about online and offline offers, products, services, and updates</li>
                    <li>to resolve disputes; troubleshoot problems; technical support and fixing bugs</li>
                    <li>to identify security breaches and attacks; investigating, preventing, and taking action on illegal or suspected fraud</li>
                    <li>to ask for ratings and reviews of services or products</li>
                    <li>to run adds for you on our listing site</li>
                    <li>to meet legal obligations</li>
                  </ul>

                  <p>
                    Please note that when providing you with account aggregator services, we do not store, use, process, or have access to any financial information that you choose to transmit under our services.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="5. Information Sharing and Disclosures" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    Your Personal Information is shared as allowed under applicable laws, after following due diligence and in line with the purposes set out in this Policy.
                  </p>
                  <p>
                    We may share your Personal Information in the course of your transaction with different categories of recipients such as business partners, service providers, sellers, logistic partners, merchants, entities, subsidiaries, legally recognized authorities, regulatory bodies, governmental authorities, financial institutions, internal teams such as marketing, security, investigation team, etc.
                  </p>

                  <p>Personal Information will be shared, as applicable, on need-to-know basis, for the following purposes:</p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>for enabling the provision of the products/services availed by you and facilitating the services between you and the service provider, sellers, logistic partners, as requested</li>
                    <li>for the Aadhaar authentication process by submitting Aadhaar information to Central Identities Data Repository (CIDR)</li>
                    <li>for complying with applicable laws as well as meeting the Know Your Customer (KYC) requirements as mandated by various regulatory bodies, whose regulated service/product you opt through our services/Platforms</li>
                    <li>for completing a payment transaction initiated by you on a merchant site, where based on your instructions, the merchant requests to fetch your Personal Information from us</li>
                    <li>if it is required by financial institutions to verify, mitigate, or prevent fraud or to manage risk or recover funds in accordance with applicable laws/regulations</li>
                    <li>for services related to communication, marketing, data and information storage, transmission, security, analytics, fraud detection, risk assessment and research</li>
                    <li>enforce our Terms or Privacy Policy; respond to claims that an advertisement, posting, or other content violates the rights of a third party; or protect the rights, property or personal safety of our users or the general public</li>
                    <li>if required to do so by law or in good faith we believe that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process</li>
                    <li>if requested by government authorities for government initiatives and benefits</li>
                    <li>for grievance redressal and resolution of disputes</li>
                    <li>with the internal investigation department within Satz Techno Solutions or agencies appointed by Satz Tehnco Solutions for investigation purposes</li>
                    <li>should we (or our assets) plan to merge with, or be acquired by any business entity, or re-organization, amalgamation, restructuring of our business then with such other business entity</li>
                    <li>with SAM and Payment service providers in order to facilitate registration, online payments etc</li>
                  </ul>

                  <p>
                    While the information is shared with third parties as per purposes set out in this Policy, processing of your Personal Information is governed by their policies. We ensure stricter or no less stringent privacy protection obligations are cast on these third-parties, wherever applicable and to the extent possible. However, we may share Personal Information with third-parties such as legally recognized authorities, regulatory bodies, governmental authorities, and financial institutions as per purposes set out in this Policy or as per applicable laws. We do not accept any responsibility or liability for usage of your Personal Information by these third parties or their policies.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="6. Data Storage and Retention" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    To the extent applicable, we store Personal Information within India and retain it in accordance with applicable laws and for a period no longer than it is required for the purpose for which it was collected. However, we may retain Personal Information related to you if we believe it may be necessary to prevent fraud or future abuse or if required by law such as in the event of the pendency of any legal/regulatory proceeding or receipt of any legal and/or regulatory direction to that effect or for other legitimate purposes.
                  </p>
                  <p>
                    Once the Personal Information has reached its retention period, it shall be deleted in compliance with applicable laws.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="7. How We Protect Your Information" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    We have deployed administrative, technical, and physical security measures to safeguard user's Personal Information and Sensitive Personal Information. Specifically, in order to safeguard your Aadhaar information, we have implemented applicable security controls as given under and required by the Aadhaar Regulations. We understand that as effective as our security measures are, no security system is impenetrable. Hence, as part of our reasonable security practices, we undergo strict internal and external reviews to ensure appropriate information security encryption or controls are placed for both data in motion and data at rest within our network and servers respectively. The database is stored on servers secured behind a firewall; access to the servers is password-protected and is strictly limited.
                  </p>
                  <p>
                    Further, you are responsible for maintaining the confidentiality and security of your login id and password. Please do not share your login, password, and OTP details with anybody. It shall be your responsibility to intimate us in case of any actual or suspected compromise to your Personal Information.
                  </p>
                  <p>
                    We have provided multiple levels of security to safeguard the IndianPGManagement.com Application by login/logout option and IndianPGManagement.com Application lock feature ("Biometric Authentication") that can be enabled by you. We have preventive controls implemented to ensure you use IndianPGManagement.com Application on your device and the same login credentials cannot be used on different device without any additional authentication/OTP.
                  </p>
                  <p>
                    Our website is scanned on a regular basis for security holes and known vulnerabilities in order to make your visit to our site as safe as possible. We use regular Malware Scanning and a standard SSL certificate. All data transmitted over internet is encrypted.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="8. Cookies and Tracking" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <h3 className="font-medium">Do we use 'cookies'?</h3>
                  <p>We use cookies for tracking purposes.</p>
                  <p>
                    You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies. You do this through your browser settings. Since browser is a little different, look at your browser's help menu to learn the correct way to modify your cookies.
                  </p>
                  <p>
                    If you turn cookies off, Some of the features that make your site experience more efficient may not function properly.
                  </p>

                  <h3 className="font-medium">How does our site handle Do Not Track signals?</h3>
                  <p>We honor Do Not Track signals and Do Not Track, plant cookies, or use advertising when a Do Not Track (DNT) browser mechanism is in place.</p>

                  <h3 className="font-medium">Does our site allow third-party behavioral tracking?</h3>
                  <p>It's also important to note that we do not allow third-party behavioral tracking.</p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="9. Third-Party Disclosure and Links" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    When you are availing products and services of service providers on our Platform, Personal Information may be collected by respective service providers and such Personal Information shall be governed by their privacy policy. You may refer to their privacy policy and terms of service to understand how your Personal Information will be handled by such service providers.
                  </p>
                  <p>
                    Our services may include links to other websites or applications when you visit our Platform. Such websites or applications are governed by their respective privacy policies, which are beyond our control. Once you leave our servers (you can tell where you are by checking the URL in the location bar on your browser or on the m-site you are redirected to), use of any Personal Information that you provide on these websites or applications is governed by the privacy policy of the operator of the application/website, you are visiting. That policy may differ from ours and you are requested to review those policies or seek access to the policies from the domain owner before proceeding to use those applications or websites.
                  </p>
                  <p>
                    We do not sell, or otherwise trade to outside parties your Personally Identifiable Information.
                  </p>
                  <p>We may include or offer third-party products or services on our website.</p>

                  <h3 className="font-medium">We have implemented the following</h3>
                  <p>Demographics and Interests Reporting</p>
                  <p>
                    We, along with third-party vendors such as Google use first-party cookies (such as the Google Analytics cookies) and third-party cookies (such as the DoubleClick cookie) or other third-party identifiers together to compile data regarding user interactions with ad impressions and other ad service functions as they relate to our website.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="10. Your Consent and Rights" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    We process your Personal Information with consent. By using our Platform or services and/or by providing your Personal Information, you consent to the processing of your Personal Information by IndianPGManagement.com and PG Cloud in accordance with this Privacy Policy. If you disclose to us any Personal Information relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
                  </p>

                  <h3 className="font-medium">Opting out</h3>
                  <p>
                    We provide all users with the opportunity to opt-out of receiving any of our services or non-essential (promotional, marketing-related) communications from us, after setting up an account. If you want to remove your contact information from all our lists and newsletters or discontinue any our services, please click on the unsubscribe button on the emailers and/or contact us over email on info@IndianPGManagement.com
                  </p>

                  <h3 className="font-medium">Personal Information Access/Rectification and Consent</h3>
                  <p>
                    You can access and review your Personal Information shared by you by placing a request with us. In addition, you may at any time revoke consent given to us to store your e-KYC information, collected as part of the Aadhaar-based e-KYC process. Upon such revocation, you may lose access to services that were availed on the basis of the consent provided. In some cases, we may continue to retain your information as per the 'Storage and Retention' section of this Policy. To raise any of the above requests, you may write to us using the contact information provided under the 'Contact Us' section of this Policy.
                  </p>
                  <p>
                    In case you wish to delete your account or Personal Information, please use the 'Profile' section of the IndianPGManagement.com Platform. However, retention of your Personal Information will be subject to applicable laws.
                  </p>
                  <p>
                    For the above requests, we may need to request specific information from you to confirm your identity and ensure authentication. This is a security measure to ensure that Personal Information is not disclosed to any person who does not have a right to receive it or is not incorrectly modified or deleted.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="11. Children Information" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    We do not knowingly solicit or collect Personal Information from children under the age of 18 and use of our Platform is available only to persons who can form a legally binding contract under the Indian Contract Act, 1872. If you are under the age of 18 years then you must use the Platform or services under the supervision of your parent, legal guardian, or any responsible adult.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="12. Policy Changes" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    Since our business changes constantly, so will our policies. We reserve the right, at our sole discretion, to change, modify, add, or remove portions of this Privacy Policy at any time without any prior written notice to you. We may, however, reasonably endeavour to notify you of the changes, it is your responsibility to review the Privacy Policy periodically for updates/changes. Your continued use of our services/Platform, following the posting of changes will mean that you accept and agree to the revisions. We will never make changes to policies in order to make it less protective of Personal Information already shared by you.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="13. Data Breach Response" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>In order to be in line with Fair Information Practices we will take the following responsive action, should a data breach occur:</p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>We will notify you via email within 7 business days</li>
                    <li>We will notify the users via in-site notification within 7 business days</li>
                  </ul>
                  <p>
                    We also agree to the Individual Redress Principle which requires that individuals have the right to legally pursue enforceable rights against data collectors and processors who fail to adhere to the law. This principle requires not only that individuals have enforceable rights against data users, but also that individuals have recourse to courts or government agencies to investigate and/or prosecute non-compliance by data processors.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="14. CAN SPAM Act Compliance" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    The CAN-SPAM Act is a law that sets the rules for commercial email, establishes requirements for commercial messages, gives recipients the right to have emails stopped from being sent to them, and spells out tough penalties for violations.
                  </p>
                  <p>To be in accordance with CANSPAM, we agree to the following:</p>
                  <ul className="list-disc ps-5 space-y-1">
                    <li>Not use false or misleading subjects or email addresses.</li>
                    <li>Identify the message as an advertisement in some reasonable way.</li>
                    <li>Include the physical address of our business or site headquarters.</li>
                    <li>Monitor third-party email marketing services for compliance, if one is used.</li>
                    <li>Honor opt-out/unsubscribe requests quickly.</li>
                    <li>Allow users to unsubscribe by using the link at the bottom of each email.</li>
                  </ul>

                  <p>
                    If at any time you would like to unsubscribe from receiving future emails, you can email us at info@IndianPGManagement.com<br />
                    Follow the instructions at the bottom of each email.<br />
                    and we will promptly remove you from ALL correspondence.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="15. Contact Us" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>
                    If there are any questions regarding this privacy policy, you may contact us using the information below.<br />
                    info@IndianPGManagement.com
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
