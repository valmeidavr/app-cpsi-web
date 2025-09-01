import { NextResponse } from "next/server";
import { getCurrentUTCISO } from "@/app/helpers/dateUtils";

export async function GET() {
  try {
    return NextResponse.json({
      message: "API funcionando",
      timestamp: getCurrentUTCISO(),
      status: "success"
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 