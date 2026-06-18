import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { origin } = new URL(request.url);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
    
    const body = await request.json();
    const { packageId, packageName, amount, price, currency, email } = body;

    if (!packageId || !price || !currency || !email) {
      return NextResponse.json(
        { error: "Missing required fields (packageId, price, currency, email)" },
        { status: 400 }
      );
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const isPaystackConfigured = !!PAYSTACK_SECRET_KEY;

    if (!isPaystackConfigured) {
      // Fallback Mock Paystack Checkout (works for both NGN and USD)
      console.warn("Paystack secret key is missing. Using Mock Paystack Checkout.");
      const mockRedirectUrl = `${siteUrl}/dashboard?payment=success&mock=paystack&amount=${amount}&price=${price}&currency=${currency}`;
      return NextResponse.json({ url: mockRedirectUrl, mode: "mock" });
    }

    // Initialize Paystack checkout session (Paystack expects amount in minor units: price * 100)
    const paystackAmount = Math.round(Number(price) * 100);
    const paystackBody: any = {
      email,
      amount: paystackAmount,
      callback_url: `${siteUrl}/dashboard?payment=success&gateway=paystack&currency=${currency}&amount=${amount}&price=${price}`,
      metadata: {
        package_id: packageId,
        package_name: packageName,
        amount: amount,
      },
    };

    // If currency is USD, pass it explicitly to Paystack
    if (currency === "USD") {
      paystackBody.currency = "USD";
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackBody),
    });

    const paystackData = await paystackResponse.json();
    if (!paystackResponse.ok || !paystackData.status) {
      throw new Error(paystackData.message || "Failed to initialize Paystack transaction.");
    }

    return NextResponse.json({ url: paystackData.data.authorization_url, mode: "live" });
  } catch (error: any) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}

