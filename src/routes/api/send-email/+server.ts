import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import emailjs from '@emailjs/browser';
import { dev } from '$app/environment';

// emailjs configuration - in a real app, these would be environment variables
const EMAILJS_SERVICE_ID = 'service_ncks22q';
const EMAILJS_TEMPLATE_ID = 'template_e7b4728';
const EMAILJS_PUBLIC_KEY = 'WlfbR2f-VQY0I7h9R';
const RECIPIENT_EMAIL = 'jg@aerogenconsulting.com';

export const POST = (async ({ request }) => {
  try {
    const { name, email, message } = await request.json();
    
    // validate form data
    if (!name || !email || !message) {
      return json({ success: false, error: 'All fields are required' }, { status: 400 });
    }
    
    // prepare template parameters for emailjs
    const templateParams = {
      name: name,
      email: email,
      message: message,
      to_email: RECIPIENT_EMAIL,
      reply_to: email,
      subject: `Consulting inquiry from ${name}`
    };
    
    // only log in development mode
    if (dev) {
      console.log('email submission received:');
      console.log('to:', RECIPIENT_EMAIL);
      console.log('from:', email);
      console.log('name:', name);
      console.log('message:', message);
    }
    
    try {
      // in development or without api keys, we'll just log it
      if (!EMAILJS_PUBLIC_KEY) {
        if (dev) {
          console.log('emailjs configuration not complete - email would be sent with params:', templateParams);
        }
      } else {
        // initialize emailjs with public key
        emailjs.init({
          publicKey: EMAILJS_PUBLIC_KEY
        });
        
        // send the email
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );
        
        if (dev) {
          console.log('email sent successfully!');
        }
      }
      
      // return success response
      return json({ success: true });
    } catch (emailError) {
      // always log errors, but with less detail in production
      if (dev) {
        console.error('error sending email via emailjs:', emailError);
      } else {
        console.error('email sending error occurred');
      }
      
      return json({ 
        success: false, 
        error: 'Failed to send email through service' 
      }, { status: 500 });
    }
  } catch (error) {
    // always log errors, but with less detail in production
    if (dev) {
      console.error('error processing email submission:', error);
    } else {
      console.error('email processing error occurred');
    }
    
    return json({ 
      success: false, 
      error: 'Failed to process email request' 
    }, { status: 500 });
  }
}) satisfies RequestHandler; 