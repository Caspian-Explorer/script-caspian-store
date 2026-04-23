/**
 * Render an email template into the sendable HTML shell used by every
 * transactional email. Keeps the look opinionated but minimal — merchants
 * customize via the `EmailSettings` fields (logo, colors, footer) rather
 * than by editing the HTML.
 *
 * The rendered shell is inlined-style only: no <head>, no stylesheets,
 * no layout CSS outside inline `style=""` — the safest baseline across
 * Gmail, Outlook, Apple Mail.
 */

export interface EmailTemplateFields {
  key: string;
  audience: 'admin' | 'customer';
  enabled: boolean;
  subject: string;
  heading: string;
  additionalContent: string;
  recipients: string[];
}

export interface EmailSettingsFields {
  fromName: string;
  fromAddress: string;
  replyTo?: string;
  logoUrl?: string;
  accentColor: string;
  backgroundColor: string;
  footerText: string;
  enabled: boolean;
}

export interface RenderContext {
  siteTitle: string;
  orderNumber: string;
  orderTotal: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
}

/**
 * Resolve all `{placeholder}` tokens in `input` against the context. Unknown
 * tokens are left untouched so merchants can add their own placeholders
 * without the renderer silently eating them.
 */
export function substitutePlaceholders(input: string, ctx: RenderContext): string {
  const map: Record<string, string> = {
    '{site_title}': ctx.siteTitle,
    '{order_number}': ctx.orderNumber,
    '{order_total}': ctx.orderTotal,
    '{order_date}': ctx.orderDate,
    '{customer_name}': ctx.customerName,
    '{customer_email}': ctx.customerEmail,
  };
  return Object.entries(map).reduce(
    (acc, [token, value]) => acc.split(token).join(value),
    input,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderEmail(
  template: Pick<EmailTemplateFields, 'subject' | 'heading' | 'additionalContent'>,
  settings: EmailSettingsFields,
  ctx: RenderContext,
): RenderedEmail {
  const subject = substitutePlaceholders(template.subject, ctx);
  const heading = substitutePlaceholders(template.heading, ctx);
  const body = substitutePlaceholders(template.additionalContent, ctx);

  const bodyParagraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#333;">${escapeHtml(
          p,
        ).replace(/\n/g, '<br />')}</p>`,
    )
    .join('');

  const footerParagraphs = settings.footerText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#888;">${escapeHtml(
          p,
        ).replace(/\n/g, '<br />')}</p>`,
    )
    .join('');

  const logo = settings.logoUrl
    ? `<img src="${escapeHtml(settings.logoUrl)}" alt="${escapeHtml(
        settings.fromName || 'Logo',
      )}" style="max-height:40px;max-width:200px;display:block;" />`
    : `<div style="font-weight:700;font-size:18px;color:${escapeHtml(settings.accentColor)};">${escapeHtml(settings.fromName || 'Store')}</div>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${escapeHtml(settings.backgroundColor)};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${escapeHtml(settings.backgroundColor)};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:16px 0;border-bottom:3px solid ${escapeHtml(settings.accentColor)};">
                ${logo}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 0 8px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#111;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 16px;">
                ${bodyParagraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0 0;border-top:1px solid #eee;">
                ${footerParagraphs}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // Plain-text fallback — matches subject/heading/body paragraphs with blank
  // lines between, suitable for Gmail's clipped fallback rendering.
  const text = [heading, '', body, '', settings.footerText].filter(Boolean).join('\n\n');

  return { subject, html, text };
}
