import Razorpay from 'razorpay';
import crypto from 'crypto';
import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    if (!amount || !currency || !receipt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const razorpay = new Razorpay({
      key_id: functions.config().razorpay.key_id,
      key_secret: functions.config().razorpay.key_secret
    });
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      notes
    });
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    return res.status(500).json({ error: `Failed to create order: ${error.message}` });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', functions.config().razorpay.key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: `Payment verification failed: ${error.message}` });
  }
}; 