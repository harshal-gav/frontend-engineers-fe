const clientId = "BAAJOFT4-yanUafaOnYo2zTSENsL_FINHY8H6uQqEHbasJdCFWMeNLGNHEq-d5tG2k9ySngz3PGfpNO24Y";
const secret = "EDPcieQx8y-i7DP-2i8X6iRrCFGEhQnctd187fNDu9TnO6YwLfNSSWldMRq19ZxlxnG2zmP-VbsajJB2";
const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

async function run() {
  console.log("Getting token...");
  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("Failed to get token:", tokenData);
    return;
  }
  const token = tokenData.access_token;

  console.log("Creating product...");
  const prodRes = await fetch("https://api-m.sandbox.paypal.com/v1/catalogs/products", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "prod-" + Date.now()
    },
    body: JSON.stringify({
      name: "Frontend Engineers Pro Membership",
      description: "Premium access to all remote jobs and direct application links",
      type: "DIGITAL",
      category: "SOFTWARE"
    })
  });
  const prodData = await prodRes.json();
  const productId = prodData.id;
  console.log("Product ID:", productId);

  console.log("Creating plan...");
  const planRes = await fetch("https://api-m.sandbox.paypal.com/v1/billing/plans", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "plan-" + Date.now()
    },
    body: JSON.stringify({
      product_id: productId,
      name: "Pro Membership ($9/mo)",
      description: "Monthly subscription for Pro Membership",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: "9.00", currency_code: "USD" }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: "0.00", currency_code: "USD" },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      }
    })
  });
  const planData = await planRes.json();
  console.log("Plan ID:", planData.id);
}
run();
