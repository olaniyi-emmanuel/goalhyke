import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated. Please log in." },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const body = await request.json();
    const { reference, amount, price, currency } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing transaction reference." },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate crediting (idempotency check)
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (existingTx) {
      if (existingTx.status === "success") {
        // Fetch user's current token balance to return
        const { data: profile } = await supabase
          .from("profiles")
          .select("tokens")
          .eq("id", user.id)
          .single();

        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          amount: existingTx.amount_tokens,
          balance: profile?.tokens ?? 0,
        });
      } else {
        return NextResponse.json(
          { error: `Transaction already processed with status: ${existingTx.status}` },
          { status: 400 }
        );
      }
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const isMock = reference.startsWith("mock-") || reference.includes("mock");

    let finalAmountTokens = Number(amount) || 0;
    let finalPricePaid = Number(price) || 0;
    let finalCurrency = currency || "USD";
    let isSuccess = false;

    // 4. Secure Verification with Paystack API
    if (PAYSTACK_SECRET_KEY && !isMock) {
      console.log(`Verifying live Paystack reference: ${reference}`);
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const paystackData = await paystackResponse.json();

      if (!paystackResponse.ok || !paystackData.status) {
        throw new Error(paystackData.message || "Paystack verification request failed.");
      }

      const txData = paystackData.data;
      
      // Paystack check status
      if (txData.status === "success") {
        isSuccess = true;
        // Verify from metadata (tokens count) or calculate as fallback
        finalAmountTokens = txData.metadata?.amount ? Number(txData.metadata.amount) : finalAmountTokens;
        finalPricePaid = txData.amount ? (txData.amount / 100) : finalPricePaid;
        finalCurrency = txData.currency || finalCurrency;
      } else {
        console.warn(`Paystack transaction status is: ${txData.status}`);
      }
    } else {
      // Mock payment verification (sandbox/fallback)
      console.log(`Verifying mock payment reference: ${reference}`);
      isSuccess = true; // Mock is always successful
    }

    if (!isSuccess) {
      // Record transaction as failed
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount_tokens: finalAmountTokens,
        price_paid: finalPricePaid,
        currency: finalCurrency,
        reference: reference,
        status: "failed",
      });

      return NextResponse.json(
        { error: "Payment verification failed or transaction is not successful." },
        { status: 400 }
      );
    }

    // 5. Update user balance in public.profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", user.id)
      .single();

    const currentTokens = profile?.tokens ?? 0;
    const newBalance = currentTokens + finalAmountTokens;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ tokens: newBalance })
      .eq("id", user.id);

    if (profileError) {
      throw new Error(`Failed to credit tokens: ${profileError.message}`);
    }

    // 6. Log transaction into transactions table
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount_tokens: finalAmountTokens,
        price_paid: finalPricePaid,
        currency: finalCurrency,
        reference: reference,
        status: "success",
      });

    if (txError) {
      console.error("Failed to log transaction history:", txError);
    }

    return NextResponse.json({
      success: true,
      amount: finalAmountTokens,
      balance: newBalance,
    });
  } catch (error: any) {
    console.error("Payment verification route failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
