import dotenv from "dotenv";
dotenv.config();

import { CallFrequencySettingService } from "./src/services/callFrequencySetting.service";

async function main() {
  const service = new CallFrequencySettingService();

  try {
    console.log("📌 Testing createSchedule with static cron...");
    const created = await service.createSchedule();
    console.log("Created schedule:", created);

    console.log("\n📌 Testing updateSchedule with static cron...");
    const updated = await service.updateSchedule();
    console.log("Updated schedule:", updated);

    console.log("\n📌 Testing toggleSchedule (DISABLED)...");
    const disabled = await service.toggleSchedule("DISABLED");
    console.log("Disabled schedule:", disabled);

    console.log("\n📌 Testing toggleSchedule (ENABLED)...");
    const enabled = await service.toggleSchedule("ENABLED");
    console.log("Enabled schedule:", enabled);

  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

main();
