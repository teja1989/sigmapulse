import { createFileRoute } from "@tanstack/react-router";
import { deskJobAuthorized } from "@/lib/market/job-auth";
import { runDeskSession } from "@/lib/market/session-job";

export const Route = createFileRoute("/api/desk-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!deskJobAuthorized(request)) {
          return Response.json({ error: "Unauthorized." }, { status: 401 });
        }
        const result = await runDeskSession();
        return Response.json(result, { status: result.error ? 500 : 200 });
      },
    },
  },
});
