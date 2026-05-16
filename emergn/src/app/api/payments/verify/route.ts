import { NextResponse } from "next/server";
import { V1_PAYMENTS_DISABLED_REASON } from "@/lib/config/features";

export async function POST() {
  return NextResponse.json(
    { error: V1_PAYMENTS_DISABLED_REASON },
    { status: 503 }
  );
}
