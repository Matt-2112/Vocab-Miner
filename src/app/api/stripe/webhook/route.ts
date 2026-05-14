import Stripe from "stripe";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tier = sub.status === "active" || sub.status === "trialing" ? "premium" : "free";
      db.prepare("UPDATE users SET tier = ? WHERE stripe_customer_id = ?").run(
        tier,
        sub.customer as string
      );
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      db.prepare("UPDATE users SET tier = 'free' WHERE stripe_customer_id = ?").run(
        sub.customer as string
      );
      break;
    }
  }

  return new Response("ok");
}
