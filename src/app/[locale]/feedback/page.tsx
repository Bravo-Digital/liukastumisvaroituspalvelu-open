"use client"

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { submitFeedback, type FeedbackFormData } from '@/actions/feedback';

const FeedbackPage: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    contactBack: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isPending, startTransition] = useTransition();

  const categories = [
    { value: 'bug-report', label: 'Bug Report' },
    { value: 'feature-request', label: 'Feature Request' },
    { value: 'general-feedback', label: 'General Feedback' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    startTransition(async () => {
      // Clear previous errors and messages
      setErrors({});
      setSubmitError('');
      setSubmitMessage('');

      try {
        const result = await submitFeedback(formData);
        
        if (result.success) {
          setSubmitMessage(result.message);
          setIsSubmitted(true);
        } else {
          if (result.errors) {
            setErrors(result.errors);
          }
          setSubmitError(result.message);
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    });
  };

  const handleInputChange = (field: keyof FeedbackFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      category: '',
      subject: '',
      message: '',
      contactBack: false,
    });
    setErrors({});
    setIsSubmitted(false);
    setSubmitMessage('');
    setSubmitError('');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center bg-white p-8 rounded-lg shadow-sm">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              {submitMessage}
            </p>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              Submit Another Feedback
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl p-5">
      <div className="w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">We Value Your Feedback</h1>
          <p className="text-gray-600">
            Help us improve by sharing your thoughts, suggestions, or reporting issues.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Form</h2>
            <p className="text-gray-600">
              Please fill out the form below. All fields marked with an asterisk (*) are required.
            </p>
          </div>

          {/* Global Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-6">

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name (optional)
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email {formData.contactBack ? <span className="text-red-500">*</span> : '(optional)'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Contact Back Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contactBack"
                checked={formData.contactBack}
                onCheckedChange={(checked) => handleInputChange('contactBack', checked as boolean)}
                disabled={isPending}
              />
              <Label htmlFor="contactBack" className="text-sm font-medium">
                I'd like to be contacted about this feedback
              </Label>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
                disabled={isPending}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Brief description of your feedback"
                className={errors.subject ? 'border-red-500' : ''}
                disabled={isPending}
              />
              {errors.subject && (
                <p className="text-sm text-red-500">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Please provide detailed feedback..."
                rows={5}
                className={errors.message ? 'border-red-500' : ''}
                disabled={isPending}
              />
              {errors.message && (
                <p className="text-sm text-red-500">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Submit Feedback</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;