import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  typescript: true,
});

export const getStripeSession = async ({
  priceId,
  userId,
  email,
}: {
  priceId: string;
  userId: string;
  email: string;
}) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
};
