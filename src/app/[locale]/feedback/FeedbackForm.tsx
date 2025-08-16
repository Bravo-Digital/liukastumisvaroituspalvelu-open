"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, CheckCircle } from "lucide-react";
import { submitFeedback, type ActionResult } from "@/actions/feedback";

interface FormData {
  name: string;
  email: string;
  feedback: string;
  wantsResponse: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  feedback?: string;
  submit?: string;
}

interface FeedbackFormProps {
  translations: {
    title: string;
    description: string;
    nameLabel: string;
    emailLabel: string;
    emailOptional: string;
    wantsResponseLabel: string;
    wantsResponseDescOn: string;
    wantsResponseDescOff: string;
    feedbackLabel: string;
    feedbackPlaceholder: string;
    feedbackCharCount: string;
    submitButton: string;
    submittingButton: string;
    feedbackSubmitted: string;
    requiredFieldsText: string;
  };
}

export default function FeedbackForm({ translations }: FeedbackFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    feedback: "",
    wantsResponse: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<ActionResult | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, wantsResponse: checked }));
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.feedback.trim()) newErrors.feedback = translations.feedbackLabel + " is required";
    if (formData.wantsResponse) {
      if (!formData.email.trim()) newErrors.email = "Email is required when requesting a response";
      else if (!isValidEmail(formData.email)) newErrors.email = "Please enter a valid email address";
    } else if (formData.email.trim() && !isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await submitFeedback(formData);
      setSubmitResult(result);

      if (result.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setFormData({ name: "", email: "", feedback: "", wantsResponse: false });
          setIsSubmitted(false);
          setSubmitResult(null);
        }, 5000);
      } else {
        setErrors(result.errors || { submit: result.message });
      }
    } catch (err) {
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && submitResult?.success) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-6">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-semibold">{translations.feedbackSubmitted}</p>
                <p>{submitResult.message}</p>
                {formData.wantsResponse && formData.email && (
                  <p className="text-sm">📧 Check your email at <strong>{formData.email}</strong></p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{translations.title}</CardTitle>
        <CardDescription className="text-base">{translations.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {translations.nameLabel}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {translations.emailLabel}
              {formData.wantsResponse ? <span className="text-destructive ml-1">*</span> : <span className="text-muted-foreground text-xs ml-1">{translations.emailOptional}</span>}
            </Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full ${errors.email ? "border-destructive focus:border-destructive" : ""}`}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {/* Checkbox */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-muted">
            <Checkbox id="wants-response" checked={formData.wantsResponse} onCheckedChange={handleCheckboxChange} className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="wants-response" className="text-sm font-medium leading-none cursor-pointer">
                {translations.wantsResponseLabel}
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.wantsResponse ? translations.wantsResponseDescOn : translations.wantsResponseDescOff}
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium">
              {translations.feedbackLabel} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback"
              name="feedback"
              value={formData.feedback}
              onChange={handleInputChange}
              className={`min-h-[120px] resize-none ${errors.feedback ? "border-destructive focus:border-destructive" : ""}`}
              placeholder={translations.feedbackPlaceholder}
            />
            {errors.feedback && <p className="text-sm text-destructive">{errors.feedback}</p>}
            <p className="text-xs text-muted-foreground">{formData.feedback.length}{translations.feedbackCharCount}</p>
          </div>

          {/* Submit errors */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="button" onClick={handleSubmit} className="w-full h-11 text-base font-medium" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {translations.submittingButton}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> {translations.submitButton}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">{translations.requiredFieldsText}</p>
        </div>
      </CardContent>
    </Card>
  );
}
