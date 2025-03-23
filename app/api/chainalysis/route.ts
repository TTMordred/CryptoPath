import { NextResponse } from "next/server";
import axios from "axios";

const CHAINALYSIS_API_KEY = process.env.CHAINALYSIS_API_KEY;
const CHAINALYSIS_BASE_URL = "https://public.chainalysis.com/api/v1";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 });
    }

    const headers = {
      "X-API-Key": CHAINALYSIS_API_KEY,
      "Accept": "application/json",
    };

    const response = await axios.get(`${CHAINALYSIS_BASE_URL}/address/${address}`, {
      headers,
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching Chainalysis data:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch Chainalysis data", details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}