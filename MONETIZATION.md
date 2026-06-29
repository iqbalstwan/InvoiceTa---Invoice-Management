# 💰 Monetization & Subscription System Guide

## Overview

Project ini sudah disetup dengan subscription system yang siap untuk monetisasi. Panduan ini menjelaskan how it works dan bagaimana to implement payment gateway.

---

## 📊 Current Subscription Plans

```
┌─────────────┬────────┬──────────────┬──────────────────────────────┐
│ Plan        │ Price  │ Invoice Limit│ Features                     │
├─────────────┼────────┼──────────────┼──────────────────────────────┤
│ Free        │ Rp 0   │ 5/month      │ Basic features               │
│ Starter     │ 29K    │ 100/month    │ + Custom branding, reminders │
│ Professional│ 79K    │ 1000/month   │ + Team, WhatsApp, payments   │
│ Enterprise  │ 299K   │ Unlimited    │ + API, custom, support       │
└─────────────┴────────┴──────────────┴──────────────────────────────┘
```

---

## 🏗️ How Subscription Works

### 1. Database Structure

**subscription_plans** table:
- Stores plan definitions (name, price, features)
- Data dimulai dari migration queries di SETUP.md

**user_subscriptions** table:
- Links user ke plan
- Tracks subscription status dan dates
- Payment method reference

### 2. Subscription Flow

```
User Signup
    ↓
Auto-assign Free Tier (5 invoices/month)
    ↓
User dapat create max 5 invoices
    ↓
User click "Upgrade Plan"
    ↓
Redirect ke Pricing page
    ↓
User select plan
    ↓
Create subscription in database
    ↓
(Eventually: Process payment via Stripe/Midtrans)
    ↓
Update invoice limit
    ↓
User dapat create sesuai tier
```

### 3. Invoice Limit Checking

Di `CreateInvoice.jsx`:
```javascript
// Check jika user sudah mencapai limit
const checkLimit = async () => {
  const { count } = await supabaseClient
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const limit = subscription?.subscription_plans?.invoice_limit || 5;
  if (limit !== -1 && count >= limit) {
    setCanCreate(false); // Show upgrade prompt
  }
};
```

---

## 💳 Payment Gateway Integration

### Option 1: Stripe (Recommended for Global)

#### A. Setup di Stripe Dashboard

1. Create account di stripe.com
2. Go to API Keys
3. Copy Publishable Key → `VITE_STRIPE_PUBLISHABLE_KEY`

#### B. Install Stripe Libraries

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

#### C. Create Payment Component

```javascript
// src/components/StripePayment.jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StripePayment({ planId, userId }) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async () => {
    // Call your backend API to create payment intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ planId, userId }),
    });

    const { clientSecret } = await response.json();

    // Confirm payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.paymentIntent.status === 'succeeded') {
      // Update subscription in database
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'active' })
        .eq('user_id', userId);
      
      alert('✅ Payment successful!');
    }
  };

  return (
    <div>
      <CardElement />
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
}
```

#### D. Update Pricing.jsx

```javascript
// Di Pricing.jsx, ganti button dari:
<button onClick={() => handleSubscribe(plan.id)}>
  Upgrade
</button>

// Menjadi:
<StripePayment planId={plan.id} userId={user.id} />
```

---

### Option 2: Midtrans (Recommended for Indonesia)

#### A. Setup di Midtrans Dashboard

1. Create account di midtrans.com
2. Copy Server Key dan Client Key
3. Add ke `.env.local`:

```env
VITE_MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_SERVER_KEY=your-server-key (server-side only)
```

#### B. Create Payment Component

```javascript
// src/components/MidtransPayment.jsx
import { useEffect } from 'react';

export default function MidtransPayment({ planId, userId, amount }) {
  useEffect(() => {
    // Load Midtrans snap script
    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    try {
      // Call your backend API
      const response = await fetch('/api/create-midtrans-token', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          userId,
          amount,
        }),
      });

      const { token } = await response.json();

      // Show Midtrans payment modal
      window.snap.pay(token, {
        onSuccess: (result) => {
          // Update subscription
          updateSubscription(userId, planId);
          alert('✅ Payment successful!');
        },
        onPending: () => {
          alert('⏳ Payment pending');
        },
        onError: () => {
          alert('❌ Payment failed');
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <button onClick={handlePayment} className="btn btn-primary">
      Bayar Sekarang
    </button>
  );
}
```

---

## 🔄 Manual Payment Processing (Current)

Current implementation menggunakan "manual" payment method:

```javascript
// In useSubscription hook
const createSubscription = async (userId, planId, paymentMethod = 'manual') => {
  const { data } = await supabaseClient
    .from('user_subscriptions')
    .insert([{
      user_id: userId,
      plan_id: planId,
      status: 'active',  // ← Immediately active!
      payment_method: paymentMethod,
    }])
    .select();
  
  return data?.[0];
};
```

### How to Handle Manual Payments:

1. **Option A: Payment After** (Freemium model)
   ```
   User upgrade → Immediately get access
   → Send payment reminder email
   → Mark as paid when payment received
   ```

2. **Option B: Payment Before** (Secure)
   ```
   User upgrade → Generate payment link
   → User pays → Activate subscription
   → If not paid in 24h, deactivate
   ```

### Implement Payment Reminders

```javascript
// src/utils/paymentReminder.js
export const sendPaymentReminder = async (userId, planName, amount) => {
  const response = await fetch('/api/send-reminder', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      planName,
      amount,
    }),
  });
  return response.json();
};
```

---

## 📧 Email Integration (Optional)

### Setup dengan Supabase Email (Free)

1. Supabase → Auth → Email Templates
2. Customize templates
3. Send dari Supabase functions

### Setup dengan SendGrid/Mailgun

```bash
npm install @sendgrid/mail
```

```javascript
// src/utils/email.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

export const sendPaymentInvoice = async (email, plan, amount) => {
  await sgMail.send({
    to: email,
    from: 'billing@dapooerku.com',
    subject: `Invoice for ${plan} Plan`,
    html: `
      <h2>Payment Invoice</h2>
      <p>Plan: ${plan}</p>
      <p>Amount: Rp ${amount.toLocaleString('id-ID')}</p>
      <p>Please transfer to BCA: 7380724370</p>
    `,
  });
};
```

---

## 🛡️ Security Considerations

### 1. Never expose Server Keys
```javascript
// ❌ WRONG - expose di client
VITE_STRIPE_SECRET_KEY=sk_test_xxx

// ✅ CORRECT - server-side only
// Set di environment variables (Vercel, Netlify, etc)
```

### 2. Verify Payments Server-Side
```javascript
// src/pages/api/verify-payment.js (server endpoint)
export default async function handler(req, res) {
  const { transactionId } = req.body;
  
  // Verify dengan payment provider
  const result = await stripe.paymentIntents.retrieve(transactionId);
  
  if (result.status === 'succeeded') {
    // Update database
    await updateSubscriptionPaid(result.metadata.userId);
    return res.status(200).json({ success: true });
  }
  
  return res.status(400).json({ success: false });
}
```

### 3. Use Webhooks untuk Async Events
```javascript
// Stripe sends webhook saat payment confirmed
// Safer daripada rely on client-side confirmation
```

---

## 📊 Analytics & Monitoring

### Track Subscription Metrics

```javascript
// src/utils/analytics.js
export const trackSubscriptionEvent = async (userId, event, data) => {
  await supabaseClient
    .from('analytics_events')
    .insert([{
      user_id: userId,
      event_type: event, // upgrade, downgrade, cancel, etc
      event_data: data,
      timestamp: new Date().toISOString(),
    }]);
};

// Usage:
trackSubscriptionEvent(user.id, 'upgrade', {
  from_plan: 'Free',
  to_plan: 'Starter',
  amount: 29000,
});
```

### Monitor Churn

```javascript
// Find inactive subscriptions
const inactiveSubscriptions = await supabaseClient
  .from('user_subscriptions')
  .select('*')
  .lt('end_date', new Date().toISOString());

// Send retention email
inactiveSubscriptions.forEach(sub => {
  sendRetentionEmail(sub.user_id);
});
```

---

## 🎁 Promotional Features (Future)

### Discount Codes
```javascript
// src/pages/Pricing.jsx
const [discountCode, setDiscountCode] = useState('');
const [discount, setDiscount] = useState(0);

const applyDiscount = async (code) => {
  const { data } = await supabaseClient
    .from('discount_codes')
    .select('percentage')
    .eq('code', code)
    .single();
  
  if (data) {
    setDiscount(data.percentage);
  }
};
```

### Referral Program
```javascript
// Generate referral link
const referralLink = `${window.location.origin}?ref=${user.id}`;

// Track referral signup
if (searchParams.ref) {
  await trackReferral(searchParams.ref, newUserId);
}
```

### Free Trial
```javascript
// Auto-set 14-day trial
const endDate = new Date();
endDate.setDate(endDate.getDate() + 14);

await createSubscription(userId, planId, 'trial', endDate);
```

---

## 🔄 Subscription Management

### Auto-Renewal Logic

```javascript
// Run daily via cron job / scheduled function
export const checkAndRenewSubscriptions = async () => {
  const expiring = await supabaseClient
    .from('user_subscriptions')
    .select('*')
    .lt('end_date', tomorrow)
    .eq('status', 'active');

  for (const sub of expiring) {
    if (sub.payment_method === 'stripe') {
      // Charge automatically
      await chargeStripe(sub.stripe_subscription_id);
    } else {
      // Send payment reminder
      await sendRenewalReminder(sub.user_id);
    }
  }
};
```

### Cancellation Flow

```javascript
export const cancelSubscription = async (userId) => {
  // Downgrade to Free tier
  await supabaseClient
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId);
  
  // Create new Free subscription
  await createSubscription(userId, FREE_PLAN_ID);
  
  // Send cancellation survey
  await sendCancellationSurvey(userId);
};
```

---

## 📱 InApp Messaging

### Upsell Prompts

```javascript
// Di CreateInvoice.jsx saat hit limit
if (invoiceCount >= limit) {
  return (
    <div className="upgrade-prompt">
      <h3>🎉 You've hit your {plan} limit!</h3>
      <p>Upgrade to {nextPlan} for {nextLimit} invoices</p>
      <button onClick={() => navigateTo('pricing')}>
        See Plans
      </button>
    </div>
  );
}
```

### Seasonal Offers

```javascript
// Show discount banner on holidays
if (isBlackFriday()) {
  return <PromoHeader offer="30% off annual plans!" />;
}
```

---

## 📈 Growth Strategy

### 1. Freemium Model (Current)
- ✅ Free tier hooks users
- ✅ Invoice limit encourages upgrade
- ✅ Low friction to start

### 2. Tiered Pricing
- ✅ Starter untuk SME
- ✅ Professional untuk agencies
- ✅ Enterprise untuk corporations

### 3. Annual Billing
```javascript
// Discount untuk yearly
const isAnnual = billingCycle === 'yearly';
const discount = isAnnual ? 0.15 : 0; // 15% discount
const finalPrice = monthlyPrice * 12 * (1 - discount);
```

### 4. Team Features
- Unlock di Professional plan
- Enable collaboration features
- Track per-team usage

---

## 🎯 Implementation Roadmap

### Phase 1: Manual Payments (Current)
- ✅ Subscription database
- ✅ Invoice limits
- ✅ Plan selection UI
- ⏳ Payment verification (manual)

### Phase 2: Payment Gateway (Next)
- ⏳ Stripe integration
- ⏳ Automatic billing
- ⏳ Invoice generation

### Phase 3: Advanced (Future)
- ⏳ Webhooks
- ⏳ Analytics
- ⏳ Dunning management
- ⏳ Refunds

---

## 💡 Best Practices

1. **Always verify server-side** - Never trust client payment confirmation
2. **Use webhooks** - More reliable than callbacks
3. **Clear communication** - Tell users exact features included
4. **Easy upgrade/downgrade** - Reduce friction
5. **Prorate charges** - Fair billing for mid-cycle changes
6. **Retention focus** - Keep customers happy
7. **Test thoroughly** - Payment flows are critical

---

## 🆘 Payment Gateway Comparison

```
┌──────────┬──────────┬──────────┬────────────┬─────────────┐
│ Provider │ Fee      │ Global   │ Indonesia  │ Ease        │
├──────────┼──────────┼──────────┼────────────┼─────────────┤
│ Stripe   │ 2.2%+30¢ │ ✅ Excellent │ ✅ Good    │ Medium      │
│ Midtrans │ 2.95%    │ ✅ Good      │ ✅ Perfect │ Easy        │
│ Doku     │ 2%       │ ❌ No       │ ✅ Perfect │ Medium      │
│ PayPal   │ 3.49%    │ ✅ Good      │ ❌ No      │ Easy        │
└──────────┴──────────┴──────────┴────────────┴─────────────┘
```

**Recommendation untuk Indonesia:** Midtrans (terintegrasi dengan semua bank)

---

## 📚 References

- [Stripe Docs](https://stripe.com/docs)
- [Midtrans Docs](https://midtrans.com/documentation)
- [Supabase Docs](https://supabase.com/docs)
- [SaaS Pricing Guide](https://www.pricing-psychology.com)

---

**Happy monetizing! 💰**
