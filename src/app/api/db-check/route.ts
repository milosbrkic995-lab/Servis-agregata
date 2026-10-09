
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        current_schema() AS schema_name,
        to_regclass('public."user"') AS user_table
    `);

    return NextResponse.json({
      ok: true,
      result: result.rows,
    });
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      cause?: {
        message?: string;
        code?: string;
        detail?: string;
      };
      code?: string;
      detail?: string;
    };

    console.error("[DB-CHECK]", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      causeMessage: err.cause?.message,
      causeCode: err.cause?.code,
      causeDetail: err.cause?.detail,
    });

    return NextResponse.json(
      {
        ok: false,
        message: err.message,
        code: err.code ?? err.cause?.code ?? null,
        detail: err.detail ?? err.cause?.detail ?? null,
        cause: err.cause?.message ?? null,
      },
      { status: 500 },
    );
  }
}
