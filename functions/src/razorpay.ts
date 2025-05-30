import Razorpay from 'razorpay';
import crypto from 'crypto';
import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import { corsMiddleware } from './config';

export const createRazorpayOrder = async (req: Request, res: Response) => {
  // Apply CORS middleware
  return corsMiddleware(req, res, async () => {
    try {
      console.log('Creating Razorpay order with data:', req.body);
      
      const { amount, currency, receipt, notes } = req.body;
      if (!amount || !currency || !receipt) {
        console.error('Missing required fields:', { amount, currency, receipt });
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: { amount, currency, receipt }
        });
      }

      const razorpay = new Razorpay({
        key_id: functions.config().razorpay.key_id,
        key_secret: functions.config().razorpay.key_secret
      });

      console.log('Initializing Razorpay order creation...');
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt,
        notes
      });

      console.log('Razorpay order created successfully:', order.id);
      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      return res.status(500).json({ 
        error: `Failed to create order: ${error.message}`,
        details: error
      });
    }
  });
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  // Apply CORS middleware
  return corsMiddleware(req, res, async () => {
    try {
      console.log('Verifying Razorpay payment with data:', req.body);
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error('Missing required fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        });
      }

      const expectedSignature = crypto
        .createHmac('sha256', functions.config().razorpay.key_secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      console.log('Verifying signature...');
      if (expectedSignature !== razorpay_signature) {
        console.error('Invalid signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      console.log('Payment verified successfully');
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      return res.status(500).json({ 
        error: `Payment verification failed: ${error.message}`,
        details: error
      });
    }
  });
}; 