'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/common/Button';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Web Development',
    message: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    
    setStatus('loading');
    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setFormData({ name: '', email: '', projectType: 'Web Development', message: '' });
    } catch (error) {
      console.error('Error adding document: ', error);
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again later.');
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
          
          {/* Contact Info */}
          <div className="w-full lg:w-1/3">
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <p className="text-gray-600 mb-8">
              Whether you have a question about our web development services, pricing, or anything else, our team is ready to answer all your questions.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[var(--primary)] shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">frontendengineersupport@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              
              {status === 'success' && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200" role="alert">
                  Your message has been successfully sent! We will get back to you soon.
                </div>
              )}
              
              {status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200" role="alert">
                  {errorMessage}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 outline-none transition-all" 
                      placeholder="John Doe" 
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 outline-none transition-all" 
                      placeholder="john@example.com" 
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                  <select 
                    id="projectType" 
                    value={formData.projectType} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 outline-none transition-all bg-white"
                  >
                    <option value="Web Development">Custom Web Development</option>
                    <option value="E-commerce">E-commerce Development</option>
                    <option value="Web Application">Web Application Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Website Redesign">Website Redesign</option>
                    <option value="SEO Optimization">SEO Optimization</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Project Details *</label>
                  <textarea 
                    id="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    rows="5" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 outline-none transition-all resize-none" 
                    placeholder="Tell us about your project goals, timeline, and budget..." 
                    required
                  ></textarea>
                </div>
                
                <Button type="submit" size="lg" className="w-full" icon={Send} disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
