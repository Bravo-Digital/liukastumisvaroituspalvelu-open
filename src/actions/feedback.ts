"use server";

import { db } from "@/lib/db";
import { feedbackTable } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

export interface FeedbackFormData {
  name: string;
  email: string;
  feedback: string;
  wantsResponse: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., 'smtp.gmail.com'
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // your email
      pass: process.env.SMTP_PASS, // your email password or app password
    },
  });
};

// Send email notification
async function sendEmailNotification(formData: FeedbackFormData) {
  const transporter = createTransporter();
  
  // Email to admin/team
  const adminMailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: `New Feedback from ${formData.name || 'Anonymous User'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          New Feedback Received
        </h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4f46e5; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${formData.name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${formData.email || 'Not provided'}</p>
          <p><strong>Wants Response:</strong> ${formData.wantsResponse ? 'Yes' : 'No'}</p>
        </div>
        
        <div style="background: #fff; padding: 20px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Feedback Message</h3>
          <p style="line-height: 1.6; color: #555;">${formData.feedback.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>This feedback was submitted on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(adminMailOptions);

  // Send confirmation email to user if they want a response and provided an email
  if (formData.wantsResponse && formData.email) {
    const userMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: formData.email,
      subject: 'We received your feedback - Thank you!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
            Thank you for your feedback!
          </h2>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1;">
              <strong>Hi ${formData.name || 'there'},</strong>
            </p>
            <p style="margin: 15px 0 0 0; line-height: 1.6; color: #0369a1;">
              We've received your feedback and appreciate you taking the time to help us improve. 
              Our team will review your message and get back to you soon.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4f46e5; margin-top: 0;">Your Feedback</h3>
            <p style="line-height: 1.6; color: #555; font-style: italic;">
              "${formData.feedback.replace(/\n/g, '<br>')}"
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Note:</strong> Please don't reply to this email. 
              If you have additional questions, please submit a new feedback form on our website.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>Best regards,<br>The Support Team</p>
            <p>Submitted on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(userMailOptions);
  }
}

export async function submitFeedback(formData: FeedbackFormData): Promise<ActionResult> {
  try {
    // Validate form data
    const errors: Record<string, string> = {};
    
    if (!formData.feedback.trim()) {
      errors.feedback = 'Please provide your feedback';
    }
    
    if (formData.wantsResponse && !formData.email.trim()) {
      errors.email = 'Email address is required when requesting a response';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Please fix the validation errors',
        errors
      };
    }

    // Insert feedback into database
    await db.insert(feedbackTable).values({
      subject: formData.name.trim(),
      message: formData.feedback.trim(),
      category: formData.wantsResponse ? "response_requested" : "general",
      email: formData.email.trim(),
      created_at: new Date(),
      // Add other required fields according to your feedbackTable schema
    });

    // Send email notifications
    try {
      await sendEmailNotification(formData);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the entire operation if email fails
      // You might want to log this to a monitoring service
    }

    // Revalidate any relevant paths if needed
    revalidatePath('/feedback');
    
    return {
      success: true,
      message: formData.wantsResponse 
        ? 'Your feedback has been submitted successfully! We\'ve sent a confirmation to your email and will get back to you soon.'
        : 'Your feedback has been submitted successfully. Thank you for helping us improve!'
    };

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: 'An error occurred while submitting your feedback. Please try again.'
    };
  }
}