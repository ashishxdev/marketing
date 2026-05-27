export const metadata = {
  title: 'Privacy Policy — AdPulse AI',
  description: 'Privacy Policy for AdPulse AI. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  const lastUpdated = 'May 27, 2025';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#fff',
          }}>A</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>AdPulse AI</span>
        </a>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '60px 24px 100px' }}>
        <h1 style={{
          fontSize: 40, fontWeight: 800, marginBottom: 8,
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Privacy Policy</h1>
        <p style={{ color: '#94a3b8', marginBottom: 48, fontSize: 15 }}>Last updated: {lastUpdated}</p>

        <Section title="1. Introduction">
          AdPulse AI ("we", "us", or "our") operates as an AI-powered advertising analytics platform.
          This Privacy Policy explains how we collect, use, disclose, and protect your information when
          you use our services at adpulseai.com and related services.
          <br /><br />
          By using AdPulse AI, you agree to the collection and use of information in accordance with this policy.
        </Section>

        <Section title="2. Information We Collect">
          <strong style={{ color: '#c4b5fd' }}>Account Information:</strong> When you register, we collect your
          email address, name, and company information.<br /><br />
          <strong style={{ color: '#c4b5fd' }}>Meta (Facebook) Ads Data:</strong> With your explicit permission via
          OAuth, we access your Facebook Ad account data including campaigns, spend, impressions, clicks, and CTR.
          We only access data you explicitly authorize through the Facebook Login flow.<br /><br />
          <strong style={{ color: '#c4b5fd' }}>Google Ads Data:</strong> With your explicit permission via OAuth,
          we access your Google Ads account data including campaigns, performance metrics, and account identifiers.
          We only access data you explicitly authorize through the Google OAuth flow.<br /><br />
          <strong style={{ color: '#c4b5fd' }}>Usage Data:</strong> We may collect information on how our service
          is accessed and used, including browser type, pages visited, and timestamps.
        </Section>

        <Section title="3. How We Use Your Information">
          We use the collected data exclusively to:
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li>Provide AI-powered analysis of your advertising campaigns</li>
            <li>Generate daily and weekly performance reports</li>
            <li>Send automated insights via Telegram or other configured channels</li>
            <li>Improve and personalize your experience on our platform</li>
            <li>Respond to your customer support requests</li>
          </ul>
          <br />
          We do <strong>not</strong> sell, rent, or trade your personal information or advertising data to third parties.
        </Section>

        <Section title="4. Meta (Facebook) Data Usage">
          AdPulse AI uses the Facebook Marketing API to access your ad account data.
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li>We request only the minimum permissions needed: <code style={{ background: 'rgba(108,99,255,0.15)', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>ads_read</code> and <code style={{ background: 'rgba(108,99,255,0.15)', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>ads_management</code></li>
            <li>Your Facebook access tokens are stored securely and never shared</li>
            <li>You can revoke access at any time via Facebook Settings → Apps and Websites</li>
            <li>We comply with Meta's Platform Terms and Developer Policies</li>
          </ul>
        </Section>

        <Section title="5. Google Ads Data Usage">
          AdPulse AI uses the Google Ads API to access your advertising data.
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li>We request access to <code style={{ background: 'rgba(108,99,255,0.15)', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>https://www.googleapis.com/auth/adwords</code> scope only</li>
            <li>Your Google OAuth tokens are stored securely and used only for data retrieval</li>
            <li>You can revoke access at any time via Google Account → Third-party apps</li>
            <li>We comply with Google's API Services User Data Policy</li>
          </ul>
        </Section>

        <Section title="6. Data Storage & Security">
          Your data is stored securely using Supabase (hosted on AWS infrastructure). We implement
          industry-standard security measures including:
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Secure token storage with row-level security</li>
            <li>Regular security reviews</li>
          </ul>
          <br />
          We retain your data for as long as your account is active or as needed to provide services.
          You can request deletion of your data at any time by contacting us.
        </Section>

        <Section title="7. Data Sharing">
          We do not sell or share your personal data with third parties, except:
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li><strong style={{ color: '#c4b5fd' }}>Google Gemini AI</strong> — anonymized ad metrics are sent to generate reports (no personal identifiers included)</li>
            <li><strong style={{ color: '#c4b5fd' }}>Supabase</strong> — our database provider for secure data storage</li>
            <li><strong style={{ color: '#c4b5fd' }}>Legal requirements</strong> — if required by law or legal process</li>
          </ul>
        </Section>

        <Section title="8. Your Rights">
          You have the right to:
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 2 }}>
            <li><strong style={{ color: '#c4b5fd' }}>Access</strong> — Request a copy of your personal data</li>
            <li><strong style={{ color: '#c4b5fd' }}>Correction</strong> — Request correction of inaccurate data</li>
            <li><strong style={{ color: '#c4b5fd' }}>Deletion</strong> — Request deletion of your account and data</li>
            <li><strong style={{ color: '#c4b5fd' }}>Revoke Access</strong> — Disconnect Meta or Google at any time</li>
            <li><strong style={{ color: '#c4b5fd' }}>Portability</strong> — Request an export of your data</li>
          </ul>
          <br />
          To exercise any of these rights, contact us at the email below.
        </Section>

        <Section title="9. Cookies">
          AdPulse AI uses minimal cookies essential for authentication and session management.
          We do not use third-party tracking or advertising cookies.
        </Section>

        <Section title="10. Children's Privacy">
          AdPulse AI is not intended for users under the age of 16. We do not knowingly collect
          personal information from children.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes by posting the new policy on this page and updating the "Last updated" date.
          Continued use of the service after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="12. Contact Us">
          If you have any questions about this Privacy Policy or want to exercise your rights, contact us at:
          <div style={{
            marginTop: 16,
            padding: '20px 24px',
            background: 'rgba(108,99,255,0.08)',
            borderRadius: 12,
            border: '1px solid rgba(108,99,255,0.2)',
            lineHeight: 2,
          }}>
            <strong style={{ color: '#c4b5fd' }}>AdPulse AI</strong><br />
            📧 Email: <a href="mailto:ashishrana2004@gmail.com" style={{ color: '#a78bfa' }}>ashishrana2004@gmail.com</a><br />
            🌐 Website: <a href="/" style={{ color: '#a78bfa' }}>adpulseai.com</a>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 40px',
        textAlign: 'center',
        color: '#475569',
        fontSize: 14,
      }}>
        © {new Date().getFullYear()} AdPulse AI. All rights reserved.
        &nbsp;·&nbsp;
        <a href="/privacy" style={{ color: '#6c63ff', textDecoration: 'none' }}>Privacy Policy</a>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: '#e2e8f0',
        marginBottom: 14, paddingBottom: 10,
        borderBottom: '1px solid rgba(108,99,255,0.2)',
      }}>{title}</h2>
      <div style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 15 }}>
        {children}
      </div>
    </div>
  );
}
