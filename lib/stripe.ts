
export async function createCheckoutSession(env: any, userId: string, priceId: string) {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }

    // Stripe API is form-urlencoded
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId); // e.g., price_H5ggYJDq4oG1
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${env.APP_URL}/?stripe=success`);
    params.append('cancel_url', `${env.APP_URL}/?stripe=cancel`);
    params.append('client_reference_id', userId);

    // Auth header
    const auth = btoa(`${env.STRIPE_SECRET_KEY}:`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Stripe Error: ${err}`);
    }

    return await response.json();
}
