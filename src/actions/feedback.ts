"use server";

import { db } from "@/lib/db";
import { feedbackTable } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Avoid header injection in mail subjects
function sanitizeHeader(input: string): string {
  return input.replace(/[\r\n]+/g, " ").trim();
}

type Locale = "fi" | "sv" | "en";

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value;
  return raw === "fi" || raw === "sv" || raw === "en" ? raw : "en";
}

async function getEmailT(locale: Locale) {
  return getTranslations({ locale, namespace: "FeedbackEmail" });
}
async function getReturnT(locale: Locale) {
  return getTranslations({ locale, namespace: "FeedbackReturn" });
}

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
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email notification
async function sendEmailNotification(formData: FeedbackFormData) {
  const transporter = createTransporter();

  // --- sanitize user input for HTML/email headers ---
  const rawName = formData.name || "";
  const rawEmail = formData.email || "";
  const rawFeedback = formData.feedback || "";

  const subjectName = rawName || "Anonymous User";
  const safeSubjectName = sanitizeHeader(subjectName);

  const safeNameHtml = rawName ? escapeHtml(rawName) : "Not provided";
  const safeEmailHtml = rawEmail ? escapeHtml(rawEmail) : "Not provided";
  const safeWantsResponseHtml = formData.wantsResponse ? "Yes" : "No";

  const feedbackHtmlAdmin = escapeHtml(rawFeedback).replace(/\n/g, "<br>");

  // 1) Admin/team notification (English)
  const adminMailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: `New Feedback from ${safeSubjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid rgb(0, 166, 255); padding-bottom: 10px;">
          New Feedback Received
        </h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4f46e5; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${safeNameHtml}</p>
          <p><strong>Email:</strong> ${safeEmailHtml}</p>
          <p><strong>Wants Response:</strong> ${safeWantsResponseHtml}</p>
        </div>
        <div style="background: #fff; padding: 20px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Feedback Message</h3>
          <p style="line-height: 1.6; color: #555;">${feedbackHtmlAdmin}</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>Submitted on ${new Date().toISOString()}</p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(adminMailOptions);

  // 2) User confirmation (localized)
  if (formData.wantsResponse && formData.email) {
    const locale = await getLocale();
    const t = await getEmailT(locale);

    const nameShownRaw =
      (formData.name && formData.name.trim()) || t("there"); // localized fallback
    const dateStr = new Date().toLocaleString(
      locale === "fi" ? "fi-FI" : locale === "sv" ? "sv-FI" : "en-GB"
    );

    // Plain-text version uses raw text (safe, no HTML)
    const text = [
      `${t("greeting", { name: nameShownRaw })}`,
      "",
      t("intro"),
      "",
      `${t("yourFeedback")}:`,
      `"${rawFeedback}"`,
      "",
      t("submittedOn", { date: dateStr }),
      "",
      t("noreplyNote"),
    ].join("\n");

    // HTML version escapes everything user-controlled
    const greetingHtml = escapeHtml(t("greeting", { name: nameShownRaw }));
    const feedbackHtmlUser = escapeHtml(rawFeedback).replace(/\n/g, "<br>");

    const subject = sanitizeHeader(t("subject"));

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          ${escapeHtml(t("thanksTitle"))}
        </h2>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0369a1;">
            <strong>${greetingHtml}</strong>
          </p>
          <p style="margin: 15px 0 0 0; line-height: 1.6; color: #0369a1;">
            ${escapeHtml(t("intro"))}
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4f46e5; margin-top: 0;">${escapeHtml(t("yourFeedback"))}</h3>
          <p style="line-height: 1.6; color: #555; font-style: italic;">
            "${feedbackHtmlUser}"
          </p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">${escapeHtml(t("noreplyNote"))}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>${escapeHtml(t("submittedOn", { date: dateStr }))}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: formData.email, // MUST stay raw so it's a valid address
      subject,
      text,
      html,
    });
  }
}


export async function submitFeedback(formData: FeedbackFormData): Promise<ActionResult> {
  try {
    // Validate form data
    const errors: Record<string, string> = {};

    if (!formData.feedback?.trim()) {
      errors.feedback = "Please provide your feedback";
    }
    if (formData.wantsResponse && !formData.email?.trim()) {
      errors.email = "Email address is required when requesting a response";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    const locale = await getLocale();
    const tReturn = await getReturnT(locale);

    if (Object.keys(errors).length > 0) {
      return { success: false, message: tReturn("errorGeneric"), errors };
    }

    // Insert feedback into database
    await db.insert(feedbackTable).values({
      subject: (formData.name ?? "").trim(),
      message: (formData.feedback ?? "").trim(),
      category: formData.wantsResponse ? "response_requested" : "general",
      email: (formData.email ?? "").trim(),
      createdAt: new Date(),
    });

    // Send emails (best-effort)
    try {
      await sendEmailNotification(formData);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    revalidatePath("/feedback");

    return {
      success: true,
      message: formData.wantsResponse
        ? tReturn("successWithResponse")
        : tReturn("success"),
    };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    const tReturn = await getReturnT(await getLocale());
    return { success: false, message: tReturn("errorGeneric") };
  }
}
