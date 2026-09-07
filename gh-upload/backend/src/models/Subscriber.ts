/**
 * models/Subscriber.ts
 *
 * Subscritor de alertas — pode ser:
 *  - um device mobile (FCM token)
 *  - um número de telefone (SMS/WhatsApp)
 */
import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
  fcmToken: { type: String, required: true, unique: true, index: true },
  location: { type: String, required: true, index: true },
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  radiusKm: { type: Number, default: 50 },
  channels: {
    type: [String],
    enum: ['push', 'sms', 'whatsapp'],
    default: ['push'],
  },
  phoneNumber: String,          // E.164: +258840000000
  consentSms: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

SubscriberSchema.index({ coordinates: '2dsphere' });

export const Subscriber = mongoose.model('Subscriber', SubscriberSchema);
