
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
  } catch (error) {
    console.error("[DB-CHECK]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      { status: 500 },
    );
  }
}

