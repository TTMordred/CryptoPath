// app/ap1/service/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCoins } from "@/lib/api/coinApi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const perPage = Number(searchParams.get("perPage")) || 20;

  try {
    const coins = await getCoins(page, perPage);
    return NextResponse.json(coins, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch coins" },
      { status: 500 }
    );
  }
}