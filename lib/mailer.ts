import nodemailer from "nodemailer";
import { env } from "./env";
import { type JSONContent } from "@tiptap/react";

// Create a transporter using Gmail SMTP
export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

// Convert TipTap JSON content to HTML for emails
const convertTipTapJSONToHTML = (content: JSONContent): string => {
  if (!content) return '';
  
  let html = '';
  
  switch (content.type) {
    case 'doc':
      html = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      break;
    
    case 'paragraph':
      const paragraphContent = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      const textAlign = content.attrs?.textAlign;
      const style = textAlign ? ` style="text-align: ${textAlign}; margin: 12px 0;"` : ' style="margin: 12px 0;"';
      html = paragraphContent ? `<p${style}>${paragraphContent}</p>` : `<p${style}></p>`;
      break;
    
    case 'heading':
      const headingContent = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      const level = content.attrs?.level || 1;
      const headingTextAlign = content.attrs?.textAlign;
      const headingStyle = headingTextAlign 
        ? ` style="text-align: ${headingTextAlign}; margin: 20px 0 12px 0; color: #1f2937;"` 
        : ' style="margin: 20px 0 12px 0; color: #1f2937;"';
      html = `<h${level}${headingStyle}>${headingContent}</h${level}>`;
      break;
    
    case 'bulletList':
      const bulletItems = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      html = `<ul style="margin: 16px 0; padding-left: 24px;">${bulletItems}</ul>`;
      break;
    
    case 'orderedList':
      const orderedItems = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      html = `<ol style="margin: 16px 0; padding-left: 24px;">${orderedItems}</ol>`;
      break;
    
    case 'listItem':
      const listItemContent = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      html = `<li style="margin: 4px 0;">${listItemContent}</li>`;
      break;
    
    case 'text':
      let textContent = content.text || '';
      
      // Apply marks (formatting)
      if (content.marks) {
        content.marks.forEach(mark => {
          switch (mark.type) {
            case 'bold':
              textContent = `<strong>${textContent}</strong>`;
              break;
            case 'italic':
              textContent = `<em>${textContent}</em>`;
              break;
            case 'code':
              textContent = `<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace;">${textContent}</code>`;
              break;
            case 'strike':
              textContent = `<s>${textContent}</s>`;
              break;
            case 'underline':
              textContent = `<u>${textContent}</u>`;
              break;
          }
        });
      }
      
      html = textContent;
      break;
    
    case 'hardBreak':
      html = '<br>';
      break;
    
    case 'codeBlock':
      const codeContent = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      html = `<pre style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 16px 0;"><code>${codeContent}</code></pre>`;
      break;
    
    case 'blockquote':
      const quoteContent = content.content?.map(node => convertTipTapJSONToHTML(node)).join('') || '';
      html = `<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">${quoteContent}</blockquote>`;
      break;
    
    default:
      // For unknown types, try to render content if it exists
      if (content.content) {
        html = content.content.map(node => convertTipTapJSONToHTML(node)).join('');
      } else if (content.text) {
        html = content.text;
      }
      break;
  }
  
  return html;
};

// Generate verification email HTML template
const generateVerificationEmailHTML = (verificationCode: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeBreakers Email Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f6f8fa;
            padding: 40px 20px;
            color: #24292f;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #d0d7de;
            border-radius: 6px;
        }
        
        .header {
            text-align: center;
            padding: 40px 20px 20px;
        }
        
        .CodeBreakers-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 24px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            color: #24292f;
            line-height: 1.5;
        }
        
        .content {
            padding: 0 40px 40px;
        }
        
        .code-box {
            background-color: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 24px;
            margin: 24px 0;
        }
        
        .code-label {
            font-size: 14px;
            color: #57606a;
            margin-bottom: 16px;
        }
        
        .verification-code {
            font-size: 32px;
            font-weight: 600;
            letter-spacing: 8px;
            color: #24292f;
            text-align: center;
            margin: 16px 0;
            font-family: 'Courier New', monospace;
        }
        
        .info-text {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
            margin: 16px 0;
        }
        
        .warning {
            font-weight: 600;
            color: #24292f;
        }
        
        .signature {
            margin-top: 24px;
        }
        
        .signature p {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .disclaimer {
            padding: 24px 40px;
            background-color: #f6f8fa;
            border-top: 1px solid #d0d7de;
            font-size: 12px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #57606a;
        }
        
        .footer-divider {
            margin: 0 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dw47ib0sh/image/upload/v1764077429/mydzalimrmzbscn0bmue.png" alt="CodeBreakers Logo" class="CodeBreakers-logo" />
            <h1>Please verify your identity for <strong>CodeBreakers</strong></h1>
        </div>
        
        <div class="content">
            <div class="code-box">
                <p class="code-label">Here is your CodeBreakers verification code:</p>
                <div class="verification-code">${verificationCode}</div>
                <p class="info-text">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
                <p class="info-text"><span class="warning">Please don't share this code with anyone:</span> we'll never ask for it on the phone or via email.</p>
            </div>
            
            <div class="signature">
                <p>Thanks,</p>
                <p>The CodeBreakers Team</p>
            </div>
        </div>
        
        <div class="disclaimer">
            <p>You're receiving this email because a verification code was requested for your CodeBreakers account. If this wasn't you, please ignore this email.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>CodeBreakers 2025 <span class="footer-divider">·</span> Government College of Engineering Kalahandi <span class="footer-divider">·</span> Bhawanipatna, Odisha</p>
    </div>
</body>
</html>`;
};

// Send verification email function with beautiful template
export const sendVerificationEmail = async ({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) => {
  try {
    const html = generateVerificationEmailHTML(otp);
    
    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>` : env.GMAIL_USER,
      to,
      subject: 'Verify your email address',
      html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Generate confirmation email HTML template
const generateConfirmationEmailHTML = ({
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  participantEmail,
  registrationDetails,
}: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  participantEmail: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 48px 40px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;">✅ Registration Confirmed!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">You're all set for the event</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px;">Hello <strong>${participantName}</strong>,</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #444444;">
                Congratulations! Your registration for <strong>${eventTitle}</strong> has been confirmed. Your payment has been verified and you're officially registered for the event.
              </p>

              <!-- Attachment Notice -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #22c55e; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #166534; font-weight: 600;">📎 Registration Details Attached</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #166534;">A detailed PDF with your complete registration information is attached to this email for your records.</p>
              </div>

              <!-- Event Details -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #0c4a6e;">📅 Event Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Event:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Venue:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventVenue}</td>
                  </tr>
                </table>
              </div>

              <!-- Registration Details -->
              <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #92400e;">👤 Your Registration Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Name:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                    <td style="padding: 8px 0; color: #111827;">${participantEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Mobile:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.mobileNumber}</td>
                  </tr>
                  ${registrationDetails.whatsappNumber ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">WhatsApp:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.whatsappNumber}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">College:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.collegeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Location:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.district}, ${registrationDetails.state}</td>
                  </tr>
                </table>
              </div>

              <!-- Important Instructions -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #dc2626;">📋 Important Instructions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Please arrive at the venue at least 30 minutes before the event starts</li>
                  <li style="margin-bottom: 8px;">Bring a valid government-issued photo ID for verification</li>
                  <li style="margin-bottom: 8px;">Keep this confirmation email handy for check-in</li>
                  <li style="margin-bottom: 8px;">For any queries, contact our support team using the details below</li>
                </ul>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #444444;">
                We're excited to see you at the event! If you have any questions or need assistance, please don't hesitate to reach out to our team.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="mailto:${env.GMAIL_USER}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Contact Support</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">Need help? Contact us at 
                <a href="mailto:${env.GMAIL_USER}" style="color: #10b981; text-decoration: none;">${env.GMAIL_USER}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">© 2025 ${env.GMAIL_FROM_NAME || 'Event Management Platform'}. All rights reserved.</p>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This confirmation email was sent automatically. Please keep it for your records.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send confirmation email function with attachment
export const sendConfirmationEmailWithAttachment = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  registrationDetails,
  attachmentBuffer,
  attachmentFilename
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
  attachmentBuffer?: Buffer;
  attachmentFilename?: string;
}) => {
  try {
    const html = generateConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      registrationDetails,
    });
    
    const mailOptions: any = {
      from: env.GMAIL_FROM_NAME ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>` : env.GMAIL_USER,
      to,
      subject: `🎉 Registration Confirmed - ${eventTitle}`,
      html,
    };

    // Add attachment if provided
    if (attachmentBuffer && attachmentFilename) {
      mailOptions.attachments = [
        {
          filename: attachmentFilename,
          content: attachmentBuffer,
          contentType: 'application/pdf'
        }
      ];
    }
    
    const info = await mailer.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send confirmation email with attachment:', error);
    throw error;
  }
};

// Send confirmation email function
export const sendConfirmationEmail = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  registrationDetails,
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  try {
    const html = generateConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      registrationDetails,
    });
    
    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>` : env.GMAIL_USER,
      to,
      subject: `🎉 Registration Confirmed - ${eventTitle}`,
      html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw error;
  }
};

// Generate announcement notification email HTML template
const generateAnnouncementEmailHTML = ({
  title,
  description,
  category,
  priority,
  publishDate,
  expiryDate,
  relatedEvent,
  hasAttachments,
  hasImages,
  isUpdate = false,
}: {
  title: string;
  description: string | JSONContent;
  category: string;
  priority: string;
  publishDate: string;
  expiryDate?: string;
  relatedEvent?: { title: string; date: string; };
  hasAttachments: boolean;
  hasImages: boolean;
  isUpdate?: boolean;
}) => {
  // Convert description to HTML if it's JSON content, otherwise use as string
  const descriptionHTML = typeof description === 'string' 
    ? description 
    : convertTipTapJSONToHTML(description);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isUpdate ? 'Updated Announcement' : 'New Announcement'} - ${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f6f8fa;
            padding: 40px 20px;
            color: #24292f;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #d0d7de;
            border-radius: 6px;
        }
        
        .header {
            text-align: center;
            padding: 40px 20px 20px;
            border-bottom: 1px solid #d0d7de;
        }
        
        .announcement-icon {
            max-width: 200px;
            height: auto;
            margin-bottom: 16px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            color: #24292f;
            line-height: 1.5;
            margin-bottom: 8px;
        }
        
        .badges {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background-color: #f6f8fa;
            border: 1px solid #d0d7de;
            color: #57606a;
        }
        
        .badge.urgent {
            background-color: #ffebe9;
            border-color: #fd8c73;
            color: #d1242f;
        }
        
        .badge.important {
            background-color: #fff5b4;
            border-color: #d1cc00;
            color: #644d00;
        }
        
        .content {
            padding: 32px 40px;
        }
        
        .content h2 {
            font-size: 18px;
            font-weight: 600;
            color: #24292f;
            margin-bottom: 16px;
            line-height: 1.4;
        }
        
        .description {
            font-size: 14px;
            line-height: 1.6;
            color: #57606a;
            margin: 16px 0 24px;
            padding: 16px;
            background-color: #f6f8fa;
            border-radius: 6px;
            border: 1px solid #d0d7de;
        }
        
        .info-section {
            margin: 24px 0;
            padding: 20px;
            background-color: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
        }
        
        .info-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #24292f;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #d0d7de;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 14px;
            align-items: center;
        }
        
        .info-label {
            font-weight: 600;
            color: #57606a;
            min-width: 100px;
            margin-right: 16px;
        }
        
        .info-value {
            color: #24292f;
            flex: 1;
        }
        
        .attachment-notice {
            padding: 16px;
            background-color: #dafbe1;
            border: 1px solid #2da44e;
            border-radius: 6px;
            margin: 24px 0;
            text-align: center;
        }
        
        .attachment-notice p {
            font-size: 14px;
            color: #1a7f37;
            margin: 0;
        }
        
        .update-notice {
            padding: 16px;
            background-color: #fff5b4;
            border: 1px solid #d1cc00;
            border-radius: 6px;
            margin: 0 0 24px;
            text-align: center;
        }
        
        .update-notice p {
            font-size: 14px;
            color: #644d00;
            margin: 0;
            font-weight: 600;
        }
        
        .signature {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #d0d7de;
        }
        
        .signature p {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .footer {
            padding: 24px 40px;
            background-color: #f6f8fa;
            border-top: 1px solid #d0d7de;
            font-size: 12px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .footer-info {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #57606a;
        }
        
        .footer-divider {
            margin: 0 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dw47ib0sh/image/upload/v1764077429/mydzalimrmzbscn0bmue.png" alt="CodeBreakers Logo" class="announcement-icon" />
            <h1>CodeBreakers ${isUpdate ? '- 🔁 Updated Announcement' : '- 🔈 New Announcement'}</h1>
            <div class="badges">
                <span class="badge ${priority.toLowerCase() === 'urgent' ? 'urgent' : priority.toLowerCase() === 'important' ? 'important' : ''}">${priority} Priority</span>
                <span class="badge">${category.replace('_', ' ')}</span>
            </div>
        </div>
        
        <div class="content">
            ${isUpdate ? `
            <div class="update-notice">
                <p>🔄 This announcement has been updated. Please review the changes below.</p>
            </div>
            ` : ''}
            
            <h2>${title}</h2>
            
            <div class="description">
                ${descriptionHTML}
            </div>
            
            ${hasAttachments || hasImages ? `
            <div class="attachment-notice">
                <p>📎 ${hasAttachments ? 'Files and documents' : ''}${hasAttachments && hasImages ? ' and ' : ''}${hasImages ? 'images' : ''} are attached to this announcement.</p>
            </div>
            ` : ''}
            
            ${relatedEvent ? `
            <div class="info-section">
                <h3>🎯 Related Event</h3>
                <div class="info-row">
                    <span class="info-label">Event:</span>
                    <span class="info-value">${relatedEvent.title}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${relatedEvent.date}</span>
                </div>
            </div>
            ` : ''}
            
            <div class="info-section" style="margin-top: 32px;">
                <h3>📅 Announcement Details</h3>
                <div class="info-row">
                    <span class="info-label">Published:</span>
                    <span class="info-value">${publishDate}</span>
                </div>
                ${expiryDate ? `
                <div class="info-row">
                    <span class="info-label">Expires:</span>
                    <span class="info-value">${expiryDate}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${category.replace('_', ' ')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Priority:</span>
                    <span class="info-value">${priority}</span>
                </div>
            </div>
            
            <div class="signature">
                <p>Stay updated with all the latest announcements and information. If you have any questions, please contact our support team at <strong>${env.GMAIL_USER}</strong>.</p>
                <p style="margin-top: 16px;">Thanks,<br>The CodeBreakers Team</p>
            </div>
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you're subscribed to CodeBreakers announcements. If this wasn't intended for you, please ignore this email.</p>
        </div>
    </div>
    
    <div class="footer-info">
        <p>CodeBreakers 2025 <span class="footer-divider">·</span> Government College of Engineering Kalahandi <span class="footer-divider">·</span> Bhawanipatna, Odisha</p>
    </div>
</body>
</html>`;
};

// Send announcement notification email to multiple recipients
export const sendAnnouncementNotification = async ({
  recipients,
  title,
  description,
  category,
  priority,
  publishDate,
  expiryDate,
  relatedEvent,
  attachments,
  isUpdate = false,
}: {
  recipients: string[];
  title: string;
  description: string | JSONContent;
  category: string;
  priority: string;
  publishDate: string;
  expiryDate?: string;
  relatedEvent?: { title: string; date: string; };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
  isUpdate?: boolean;
}) => {
  try {
    const html = generateAnnouncementEmailHTML({
      title,
      description,
      category,
      priority,
      publishDate,
      expiryDate,
      relatedEvent,
      hasAttachments: attachments ? attachments.some(att => !att.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) : false,
      hasImages: attachments ? attachments.some(att => att.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) : false,
      isUpdate,
    });
    
    const mailOptions: any = {
      from: env.GMAIL_FROM_NAME ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>` : env.GMAIL_USER,
      bcc: recipients, // Use BCC to protect recipient privacy
      subject: `${isUpdate ? '🔄 UPDATED' : '📢'} ${priority === 'URGENT' ? '🚨 URGENT: ' : priority === 'IMPORTANT' ? '⚠️ IMPORTANT: ' : ''}${title}`,
      html,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }
    
    const info = await mailer.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId, recipientCount: recipients.length };
  } catch (error) {
    console.error('Failed to send announcement notification:', error);
    throw error;
  }
};

// Generic send email function with optional attachments
export const sendEmail = async ({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}) => {
  try {
    const mailOptions: any = {
      from: env.GMAIL_FROM_NAME ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>` : env.GMAIL_USER,
      to,
      subject,
      html,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }
    
    const info = await mailer.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Generate payment confirmation email HTML template
const generatePaymentConfirmationEmailHTML = ({
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  participantEmail,
  invoiceNumber,
  paymentAmount,
  registrationDetails,
}: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  participantEmail: string;
  invoiceNumber: string;
  paymentAmount: number;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 48px 40px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;">💰 Payment Confirmed!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">Your registration is now complete</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px;">Dear <strong>${participantName}</strong>,</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #444444;">
                Great news! Your payment for <strong>${eventTitle}</strong> has been verified and confirmed by our team. 
                Your registration is now complete and you're officially enrolled for the event.
              </p>

              <!-- Payment Status -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                <div style="font-size: 18px; font-weight: 600; color: #047857; margin-bottom: 8px;">✅ Payment Status: VERIFIED</div>
                <div style="font-size: 14px; color: #047857;">Amount Paid: ₹${paymentAmount}</div>
                <div style="font-size: 12px; color: #059669; margin-top: 5px;">Invoice #${invoiceNumber}</div>
              </div>

              <!-- Invoice Notice -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #f59e0b; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 600;">📄 Payment Invoice Attached</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">Your official payment invoice is attached to this email for tax and record purposes.</p>
              </div>

              <!-- Event Details -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #0c4a6e;">📅 Your Event Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Event:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Venue:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventVenue}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Amount Paid:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">₹${paymentAmount}</td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #64748b;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #475569;">🎯 What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Save the attached invoice for your records</li>
                  <li style="margin-bottom: 8px;">Mark your calendar for ${eventDate}</li>
                  <li style="margin-bottom: 8px;">Bring a valid government-issued photo ID</li>
                  <li style="margin-bottom: 8px;">Arrive at the venue 30 minutes before the event starts</li>
                  <li style="margin-bottom: 8px;">Check your email for any event updates</li>
                </ul>
              </div>

              <!-- Important Notice -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #dc2626;">⚠️ Important Reminders</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">This invoice serves as your proof of payment</li>
                  <li style="margin-bottom: 8px;">Registration is non-transferable and non-refundable</li>
                  <li style="margin-bottom: 8px;">Keep this email and invoice accessible on your phone</li>
                  <li style="margin-bottom: 8px;">Contact support if you have any questions</li>
                </ul>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #444444;">
                We're thrilled to have you join us for this amazing event! If you have any questions or need assistance, 
                please don't hesitate to reach out to our support team.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="mailto:${env.GMAIL_USER}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Contact Support</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">Need help? Contact us at 
                <a href="mailto:${env.GMAIL_USER}" style="color: #059669; text-decoration: none;">${env.GMAIL_USER}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">© 2025 ${env.GMAIL_FROM_NAME || 'CodeBreakers 2025, GCEK'}. All rights reserved.</p>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This payment confirmation was sent automatically. Please keep this invoice for tax and accounting purposes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send payment confirmation email with invoice attachment
export const sendPaymentConfirmationEmail = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  invoiceNumber,
  paymentAmount,
  registrationDetails,
  invoiceBuffer,
  invoiceFilename
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  invoiceNumber: string;
  paymentAmount: number;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
  invoiceBuffer: Buffer;
  invoiceFilename: string;
}) => {
  try {
    const html = generatePaymentConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      invoiceNumber,
      paymentAmount,
      registrationDetails,
    });
    
    const mailOptions = {
      from: env.GMAIL_FROM_NAME ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>` : env.GMAIL_USER,
      to,
      subject: `💰 Payment Confirmed - ${eventTitle} | Invoice #${invoiceNumber}`,
      html,
      attachments: [
        {
          filename: invoiceFilename,
          content: invoiceBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    const info = await mailer.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    throw error;
  }
};