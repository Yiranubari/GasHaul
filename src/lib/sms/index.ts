import { env } from "@/config/env.js";
import { ConsoleSmsProvider } from "@/lib/sms/console.provider.js";
import { TermiiSmsProvider } from "@/lib/sms/termii.provider.js";

export interface SmsProvider {
  send(input: { to: string; message: string }): Promise<void>;
}

function createSmsProvider(): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case "termii":
      return new TermiiSmsProvider();
    case "console":
      return new ConsoleSmsProvider();
  }
}

export const smsProvider = createSmsProvider();
