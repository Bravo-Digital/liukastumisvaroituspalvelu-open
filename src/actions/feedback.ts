"use server";

import { db } from "@/lib/db";
import { feedbackTable } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export interface FeedbackFormData {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  contactBack: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export async function submitFeedback(formData: FeedbackFormData): Promise<ActionResult> {
  try {
    // Validate form data
    const errors: Record<string, string> = {};

    if (formData.contactBack && !formData.email.trim()) {
      errors.email = 'Email is required when requesting contact back';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
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
      name: formData.name.trim() || null,
      email: formData.email.trim() || null,
      category: formData.category,
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      contactBack: formData.contactBack,
    });

    // Revalidate any relevant paths if needed
    revalidatePath('/feedback');

    return {
      success: true,
      message: 'Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.'
    };

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: 'An error occurred while submitting your feedback. Please try again.'
    };
  }
}