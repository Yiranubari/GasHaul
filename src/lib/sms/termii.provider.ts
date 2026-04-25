import type { SmsProvider } from "@/lib/sms/index.js";
import { env } from "@/config/env.js";
import { logger } from "@/utils/logger.js";
import { InternalServerException } from "@/exceptions/app-exceptions.js";

export class TermiiSmsProvider implements SmsProvider {
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly endpoint = "https://api.ng.termii.com/api/sms/send";

  constructor() {
    if (!env.TERMII_API_KEY) {
      throw new InternalServerException(
        "TERMII_API_KEY must be set when SMS_PROVIDER=termii",
      );
    }
    this.apiKey = env.TERMII_API_KEY;
    this.senderId = env.TERMII_SENDER_ID;
  }

  async send({ to, message }: { to: string; message: string }): Promise<void> {
    const body = {
      to,
      from: this.senderId,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: this.apiKey,
    };

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      logger.error("Termii request failed", { err, to });
      throw new InternalServerException("SMS provider unreachable");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "<no body>");
      logger.error("Termii returned non-2xx", {
        status: response.status,
        body: text,
        to,
      });
      throw new InternalServerException("SMS provider returned an error");
    }

    logger.info("SMS sent via Termii", { to });
  }
}
