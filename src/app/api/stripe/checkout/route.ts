import Stripe from "stripe";
import { auth } from "@/auth";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email ?? undefined;

  // Already premium — nothing to do
  if (session.user.tier === "premium") {
    return Response.json({ error: "Already premium" }, { status: 400 });
  }

  const user = db
    .prepare("SELECT stripe_customer_id FROM users WHERE id = ?")
    .get(userId) as { stripe_customer_id: string | null } | undefined;

  let customerId = user?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { userId } });
    customerId = customer.id;
    db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, userId);
  }

  const origin = new URL(request.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/generate?upgraded=1`,
    cancel_url: `${origin}/#pricing`,
  });

  return Response.json({ url: checkoutSession.url });
}
