import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import emailjs from '@emailjs/browser';

// EmailJS configuration - in a real app, these would be environment variables
const EMAILJS_SERVICE_ID = 'service_mc1ruf6';
const EMAILJS_TEMPLATE_ID = 'template_ku692pa'; // Updated with correct template ID
const EMAILJS_PUBLIC_KEY = 'eiQxZEm_9uv9OWC5f';
const RECIPIENT_EMAIL = 'collinwcollins@gmail.com';

export const POST = (async ({ request }) => {
  try {
    const { name, email, message } = await request.json();
    
    // Validate form data
    if (!name || !email || !message) {
      return json({ success: false, error: 'All fields are required' }, { status: 400 });
    }
    
    // Prepare template parameters for EmailJS
    const templateParams = {
      name: name,
      email: email,
      message: message,
      to_email: RECIPIENT_EMAIL,
      reply_to: email,
      subject: `Consulting inquiry from ${name}`
    };
    
    // Log the email submission (for debugging)
    console.log('Email submission received:');
    console.log('To:', RECIPIENT_EMAIL);
    console.log('From:', email);
    console.log('Name:', name);
    console.log('Message:', message);
    
    try {
      // In development or without API keys, we'll just log it
      if (!EMAILJS_PUBLIC_KEY) {
        console.log('EmailJS configuration not complete - email would be sent with params:', templateParams);
      } else {
        // Initialize EmailJS with public key
        emailjs.init({
          publicKey: EMAILJS_PUBLIC_KEY
        });
        
        // Send the email
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );
        
        console.log('Email sent successfully!');
      }
      
      // Return success response
      return json({ success: true });
    } catch (emailError) {
      console.error('Error sending email via EmailJS:', emailError);
      return json({ 
        success: false, 
        error: 'Failed to send email through service' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing email submission:', error);
    return json({ 
      success: false, 
      error: 'Failed to process email request' 
    }, { status: 500 });
  }
}) satisfies RequestHandler; 