// throwaway test in any file you're working in
import { smsProvider } from "@/lib/sms/index.js";
await smsProvider.send({ to: "+2349138547686", message: "Hello from Gashaul" });
// should log: "SMS (console provider) {"to":"+2348030000001","message":"Hello from Gashaul"}"
