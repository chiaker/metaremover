import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || '';

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export async function sendSignInCodeEmail(email: string, code: string) {
  const client = getResendClient();

  if (!client) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        devCode: code,
      };
    }

    throw new Error('Missing RESEND_API_KEY for auth emails.');
  }

  const from = process.env.AUTH_FROM_EMAIL || 'MetaRemover <noreply@metaremover.tech>';

  await client.emails.send({
    from,
    to: email,
    subject: 'Your MetaRemover sign-in code',
    text: `Your MetaRemover sign-in code is ${code}. It expires in 15 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>MetaRemover</h2><p>Your sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>This code expires in 15 minutes.</p></div>`,
  });

  return {
    devCode: null,
  };
}
