import { useState } from 'react';
import { Send, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import Header from '@/components/Header';

const supportSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  subject: z.string()
    .trim()
    .min(1, { message: "Subject is required" })
    .max(200, { message: "Subject must be less than 200 characters" }),
  message: z.string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be less than 2000 characters" }),
});

type SupportFormData = z.infer<typeof supportSchema>;

const Support = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SupportFormData, string>>>({});

  const handleChange = (field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = supportSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Partial<Record<keyof SupportFormData, string>> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as keyof SupportFormData] = err.message;
        }
      });
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: validation.data,
      });

      if (error) throw error;

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending support email:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={32} className="text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4">Contact Support</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Have a question or need help? Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Mail size={20} className="text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-3">
                For general inquiries and support
              </p>
              <a href="mailto:support@metodic.io" className="text-primary hover:underline text-sm font-medium">
                support@metodic.io
              </a>
            </div>

            <div className="bg-accent/50 rounded-xl p-6 border border-primary/20">
              <h3 className="font-bold text-foreground mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-2 bg-card rounded-xl shadow-lg p-8 border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your name"
                    className={errors.name ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={errors.email ? 'border-destructive' : ''}
                    maxLength={255}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="text-foreground">Subject *</Label>
                <Input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="What's this about?"
                  className={errors.subject ? 'border-destructive' : ''}
                  maxLength={200}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive mt-1">{errors.subject}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message" className="text-foreground">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Tell us what you need help with..."
                  className={`min-h-[150px] ${errors.message ? 'border-destructive' : ''}`}
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-1">
                  <div>
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length}/2000 characters
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
