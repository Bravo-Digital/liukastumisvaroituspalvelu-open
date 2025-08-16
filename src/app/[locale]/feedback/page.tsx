"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle } from 'lucide-react';
import { submitFeedback, type FeedbackFormData, type ActionResult } from '@/actions/feedback';

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

export default function FeedbackForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    feedback: '',
    wantsResponse: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<ActionResult | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      wantsResponse: checked
    }));
    
    // Clear email error when checkbox changes
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: undefined
      }));
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    // Feedback is always required
    if (!formData.feedback.trim()) {
      newErrors.feedback = 'Please provide your feedback';
    }
    
    // Email validation based on checkbox state
    if (formData.wantsResponse) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required when requesting a response';
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else {
      // If email is provided but checkbox is not checked, still validate format
      if (formData.email.trim() && !isValidEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Call the server action
      const result = await submitFeedback({
        name: formData.name,
        email: formData.email,
        feedback: formData.feedback,
        wantsResponse: formData.wantsResponse
      });
      
      setSubmitResult(result);
      
      if (result.success) {
        setIsSubmitted(true);
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            feedback: '',
            wantsResponse: false
          });
          setIsSubmitted(false);
          setSubmitResult(null);
        }, 5000);
      } else {
        // Handle server-side validation errors
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ submit: result.message });
        }
      }
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
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
                <p className="font-semibold">Feedback submitted successfully!</p>
                <p>{submitResult.message}</p>
                {formData.wantsResponse && formData.email && (
                  <p className="text-sm">
                    📧 Check your email at <strong>{formData.email}</strong> for confirmation.
                  </p>
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
        <CardTitle className="text-2xl font-bold">Share Your Feedback</CardTitle>
        <CardDescription className="text-base">
          Help us improve by sharing your thoughts and suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email 
              {formData.wantsResponse ? (
                <span className="text-destructive ml-1">*</span>
              ) : (
                <span className="text-muted-foreground text-xs ml-1">(optional)</span>
              )}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full transition-colors ${
                errors.email ? 'border-destructive focus:border-destructive' : ''
              } ${
                formData.wantsResponse ? 'border-blue-300 focus:border-blue-500' : ''
              }`}
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="w-1 h-1 bg-destructive rounded-full"></span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Response Checkbox */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-muted">
            <Checkbox
              id="wants-response"
              checked={formData.wantsResponse}
              onCheckedChange={handleCheckboxChange}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label
                htmlFor="wants-response"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                I would like a response to my feedback
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.wantsResponse 
                  ? "We'll reply to your email address" 
                  : "Check this if you want us to get back to you"
                }
              </p>
            </div>
          </div>

          {/* Feedback Field */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium">
              Feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback"
              name="feedback"
              placeholder="Tell us what you think, what could be improved, or any suggestions you have..."
              value={formData.feedback}
              onChange={handleInputChange}
              className={`min-h-[120px] resize-none transition-colors ${
                errors.feedback ? 'border-destructive focus:border-destructive' : ''
              }`}
            />
            {errors.feedback && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="w-1 h-1 bg-destructive rounded-full"></span>
                {errors.feedback}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.feedback.length}/1000 characters
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center gap-2">
                <span className="w-2 h-2 bg-destructive rounded-full"></span>
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="button"
            onClick={handleSubmit}
            className="w-full h-11 text-base font-medium" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Feedback...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            * Required fields
          </p>
        </div>
      </CardContent>
    </Card>
  );
}