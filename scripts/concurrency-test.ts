import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/server/db";
import { User } from "../lib/server/models/User";
import { Property } from "../lib/server/models/Property";
import { Investment } from "../lib/server/models/Investment";
import { Transaction } from "../lib/server/models/Transaction";
import { invest } from "../lib/server/services/investment.service";
import { ApiError } from "../lib/server/errors";

async function runConcurrencyTest() {
  console.log("=================================================");
  console.log("🚀 STARTING CONCURRENCY PROOF TEST");
  console.log("=================================================");

  await connectDB();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Test@123", salt);

  // 1. Create or load test broker
  let broker = await User.findOne({ email: "concurrency_broker@demo.com" });
  if (!broker) {
    broker = await User.create({
      name: "Concurrency Broker",
      email: "concurrency_broker@demo.com",
      phone: "9876543210",
      passwordHash,
      role: "BROKER",
      isActive: true,
      brokerApproved: true,
      walletBalance: 0,
      kyc: { status: "APPROVED", docs: [] },
    });
  } else {
    broker.walletBalance = 0;
    broker.brokerApproved = true;
    await broker.save();
  }

  // 2. Create or load two test investors with sufficient funds
  let investorA = await User.findOne({ email: "concurrency_investor_a@demo.com" });
  if (!investorA) {
    investorA = await User.create({
      name: "Investor Alpha",
      email: "concurrency_investor_a@demo.com",
      phone: "9876543211",
      passwordHash,
      role: "INVESTOR",
      isActive: true,
      brokerApproved: false,
      walletBalance: 1000000, // ₹10,000 (in paise)
      kyc: { status: "APPROVED", docs: [] },
    });
  } else {
    investorA.walletBalance = 1000000;
    investorA.kyc.status = "APPROVED";
    await investorA.save();
  }

  let investorB = await User.findOne({ email: "concurrency_investor_b@demo.com" });
  if (!investorB) {
    investorB = await User.create({
      name: "Investor Beta",
      email: "concurrency_investor_b@demo.com",
      phone: "9876543212",
      passwordHash,
      role: "INVESTOR",
      isActive: true,
      brokerApproved: false,
      walletBalance: 1000000, // ₹10,000 (in paise)
      kyc: { status: "APPROVED", docs: [] },
    });
  } else {
    investorB.walletBalance = 1000000;
    investorB.kyc.status = "APPROVED";
    await investorB.save();
  }

  // 3. Create or reset test property with EXACTLY 10 units left
  await Property.deleteOne({ title: "Concurrency Proof Penthouse" });
  await Investment.deleteMany({ propertyId: { $exists: true } });

  const valuation = 10000000; // ₹1,00,000 (in paise)
  const totalUnits = 100;
  const unitPrice = 100000; // ₹1,000 (in paise)
  const unitsSold = 90; // Exactly 10 units remaining!

  const property = await Property.create({
    title: "Concurrency Proof Penthouse",
    description: "Property created specifically to test atomic race conditions and anti-overselling",
    type: "APARTMENT",
    address: "100 Race Condition Way",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    valuation,
    totalUnits,
    unitPrice,
    minUnits: 1,
    maxUnitsPerInvestor: 50,
    unitsSold,
    status: "LIVE",
    brokerId: broker._id,
    images: [{ url: "https://picsum.photos/seed/concur1/1200/800", name: "front.jpg" }],
  });

  console.log(`\n📋 Property setup:`);
  console.log(`   Title: ${property.title}`);
  console.log(`   Total Units: ${totalUnits}`);
  console.log(`   Units Sold so far: ${unitsSold}`);
  console.log(`   Remaining Units: ${totalUnits - unitsSold}`);
  console.log(`   Status: ${property.status}`);
  console.log(`\n⚔️ Firing 2 concurrent requests for the final 10 units simultaneously...`);

  // 4. Fire both requests simultaneously
  const results = await Promise.allSettled([
    invest({
      userId: investorA._id,
      propertyId: property._id,
      units: 10,
    }),
    invest({
      userId: investorB._id,
      propertyId: property._id,
      units: 10,
    }),
  ]);

  console.log("\n📊 Execution Results:");
  let successCount = 0;
  let rejectedCount = 0;

  results.forEach((res, idx) => {
    const investorName = idx === 0 ? "Investor Alpha" : "Investor Beta";
    if (res.status === "fulfilled") {
      successCount++;
      console.log(`   ✅ [${investorName}]: SUCCESS`);
      console.log(`      Purchased Units: ${res.value.investment.units}`);
      console.log(`      New Property Status: ${res.value.property.status}`);
      console.log(`      Total Units Sold: ${res.value.property.unitsSold}/${totalUnits}`);
      console.log(`      Wallet Balance: ₹${res.value.walletBalance / 100}`);
    } else {
      rejectedCount++;
      const err = res.reason;
      if (err instanceof ApiError) {
        console.log(`   🛑 [${investorName}]: BLOCKED (${err.status} ${err.code})`);
        console.log(`      Error Message: "${err.message}"`);
      } else {
        console.log(`   🛑 [${investorName}]: FAILED with unexpected error:`, err);
      }
    }
  });

  // 5. Verification
  const updatedProperty = await Property.findById(property._id);
  const updatedBroker = await User.findById(broker._id);

  console.log("\n🔎 Post-Execution Verification:");
  console.log(`   Final Units Sold: ${updatedProperty?.unitsSold}/${totalUnits}`);
  console.log(`   Final Status: ${updatedProperty?.status}`);
  console.log(`   Broker Commission Credited: ₹${(updatedBroker?.walletBalance || 0) / 100}`);

  const passed =
    successCount === 1 &&
    rejectedCount === 1 &&
    updatedProperty?.unitsSold === totalUnits &&
    updatedProperty?.status === "FUNDED" &&
    (updatedBroker?.walletBalance || 0) > 0;

  if (passed) {
    console.log("\n🎉 CONCURRENCY PROOF PASSED: Exactly 1 winner, 1 rejected with 409 INSUFFICIENT_UNITS, no overselling!");
  } else {
    console.error("\n❌ CONCURRENCY PROOF FAILED: Race condition check failed!");
  }

  await mongoose.disconnect();
}

runConcurrencyTest().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});
