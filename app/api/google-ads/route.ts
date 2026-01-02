import { GoogleAdsApi } from 'google-ads-api'; // Ye library Google Ads se baat karti hai
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Connection Setup: Google ko apni pehchan dikhana
    const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    // 2. Manager Account se connect hona
    const customer = client.Customer({
      customer_id: '4558289319', 
      login_customer_id: '3519909221',
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    // 3. Sab Accounts ka Data mangwana (The Query)
    // Hum "customer_client" use kar rahe hain taake MCC ke saare child accounts mil jayein
 const result = await customer.query(`
  SELECT
    customer_client.descriptive_name,
    customer_client.id,
    customer_client.resource_name
  FROM customer_client
  WHERE customer_client.level <= 1
`);

    // 4. Data ko Dashboard ke liye tayyar karna
const cleanedData = result.map((row: any) => ({
  name: row.customer_client.descriptive_name || "Test Account",
  id: row.customer_client.id,
  clicks: 0,
  spend: 0,
  orders: 0
}));

    return NextResponse.json({ success: true, data: cleanedData });

  } catch (error: any) {
    console.error("Google Ads API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}