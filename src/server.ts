import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Connected to database");
  } catch (err) {
    logger.error("Failed to connect to database", { err });
    process.exit(1);
  }

  const app = buildApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);

    // stop accepting new connections, wait for in-flight to finish
    server.close(async (err) => {
      if (err) {
        logger.error("Error during server close", { err });
      }

      try {
        await prisma.$disconnect();
        logger.info("Database connection closed");
      } catch (e) {
        logger.error("Error disconnecting from database", { err: e });
      }

      process.exit(err ? 1 : 0);
    });

    // force-exit if shutdown takes too long (10s)
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { err });
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error("Bootstrap failed", { err });
  process.exit(1);
});
