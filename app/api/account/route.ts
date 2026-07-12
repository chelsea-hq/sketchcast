import { accountSummary } from "@/lib/creator-cloud";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await accountSummary(), {
    headers: { "Cache-Control": "no-store" },
  });
}
