// Next.js calls this once per process at server boot. We use it to
// start the email queue worker (#307) and the DB wedge heartbeat. The
// Edge runtime is skipped — only the Node runtime can reach MySQL and
// Node SMTP.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { bootstrapMailWorker } = await import("./lib/mail");
  bootstrapMailWorker();
  const { startDbHealthCheck } = await import("./lib/dbHealth");
  startDbHealthCheck();
}
