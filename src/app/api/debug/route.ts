import { NextRequest, NextResponse } from "next/server";
import { getCurrentUTCISO } from "@/app/helpers/dateUtils";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: "API funcionando",
      timestamp: getCurrentUTCISO(),
      status: "success"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 