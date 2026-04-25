import type { SmsProvider } from "@/lib/sms/index.js";
import { logger } from "@/utils/logger.js";

export class ConsoleSmsProvider implements SmsProvider {
  async send({ to, message }: { to: string; message: string }): Promise<void> {
    logger.info("SMS (console provider)", { to, message });
  }
}
