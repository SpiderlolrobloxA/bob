import "dotenv/config";
import express from "express";
import cors from "cors";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Dynamic import routes to avoid loading server-only dependencies during Vite config load
  const { handleDemo } = await import("./routes/demo");
  app.get("/api/demo", handleDemo);

  try {
    const { paypalWebhook } = await import("./routes/paypal");
    app.post("/api/webhooks/paypal", paypalWebhook);
  } catch (e) {
    // If paypal route fails to load (missing deps), log and continue
    // eslint-disable-next-line no-console
    console.warn("Could not load paypal webhook route:", e?.message || e);
  }

  try {
    const { createPaymentIntent } = await import("./routes/stripe");
    app.post("/api/stripe/create-payment-intent", createPaymentIntent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Could not load stripe route:", e?.message || e);
  }

  try {
    const { moderateHandler } = await import("./routes/moderation");
    app.post("/api/moderate", moderateHandler);
  } catch (e) {
    console.warn("Could not load moderation route:", e?.message || e);
  }

  try {
    const { processPendingSales } = await import("./routes/pending");
    app.post("/api/process-pending", processPendingSales);
  } catch (e) {
    console.warn("Could not load pending processor:", e?.message || e);
  }

  try {
    const { handleUpload } = await import("./routes/upload");
    app.post("/api/upload", handleUpload);
  } catch (e) {
    console.warn("Could not load upload proxy:", e?.message || e);
  }

  return app;
}
