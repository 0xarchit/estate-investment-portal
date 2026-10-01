import { ClientSession } from "mongoose";
import { Settings, ISettings } from "@/lib/server/models/Settings";
import { env } from "@/lib/server/config/env";

export async function getSettings(
  session?: ClientSession
): Promise<{ platformFeePct: number; brokerCommissionPct: number; maxOwnershipPct: number }> {
  let doc = await Settings.findOne().session(session || null);
  if (!doc) {
    const [created] = await Settings.create(
      [
        {
          platformFeePct: env.PLATFORM_FEE_PCT,
          brokerCommissionPct: env.BROKER_COMMISSION_PCT,
          maxOwnershipPct: env.MAX_OWNERSHIP_PCT,
        },
      ],
      { session }
    );
    doc = created;
  }

  return {
    platformFeePct: doc.platformFeePct,
    brokerCommissionPct: doc.brokerCommissionPct,
    maxOwnershipPct: doc.maxOwnershipPct,
  };
}
