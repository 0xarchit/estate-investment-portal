import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const samplePdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const coordinates: Record<string, { lat: number; lng: number }> = {
  Noida: { lat: 28.5355, lng: 77.391 }, Bengaluru: { lat: 12.9716, lng: 77.5946 }, Gurugram: { lat: 28.4595, lng: 77.0266 },
  Pune: { lat: 18.5204, lng: 73.8567 }, Hyderabad: { lat: 17.385, lng: 78.4867 }, Mumbai: { lat: 19.076, lng: 72.8777 },
};

/** Destructive demo reset. Always creates wallets at model-default zero and moves money via ledger.post. */
export async function seedDemo() {
  // Never accidentally erase an existing database: invoke with --reset-demo explicitly.
  if (!process.argv.includes('--reset-demo')) throw new Error('This resets demo collections. Run npm run seed -- --reset-demo against a dedicated demo database.');
  loadEnvConfig(process.cwd());
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required (Atlas or a replica set)');
  // Load the environment before importing P1 modules, which may validate it at import time.
  const [{ User, Property, Investment, Transaction, Payout, Withdrawal, Notification, Settings, GatewayOrder }, { ledger }, { notify }, { executePayout }] = await Promise.all([
    import('@/lib/server/models'),
    import('@/lib/server/services/ledger.service'),
    import('@/lib/server/services/notification.service'),
    import('@/lib/server/services/payout.service'),
  ]);
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const models = [User, Property, Investment, Transaction, Payout, Withdrawal, Notification, Settings, GatewayOrder];
    for (const model of models) await model.init();
    // Mongo transactions require a replica set. Check before wiping any demo data.
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('Seed requires MongoDB Atlas or a replica set for ledger/payout transactions');
    for (const model of models) await mongoose.connection.collection(model.collection.name).deleteMany({});
    await Settings.create({ platformFeePct: 2, brokerCommissionPct: 1, maxOwnershipPct: 49 });
    const admin = await User.create({ name: 'Demo Admin', email: 'admin@demo.com', phone: '9000000001', passwordHash: await bcrypt.hash('Admin@123', 10), role: 'ADMIN', isActive: true });
    const broker = await User.create({ name: 'Rohit Sharma', email: 'rohit@demo.com', phone: '9000000002', passwordHash: await bcrypt.hash('Broker@123', 10), role: 'BROKER', brokerApproved: true, isActive: true });
    await User.create({ name: 'New Broker', email: 'newbroker@demo.com', phone: '9000000003', passwordHash: await bcrypt.hash('Broker@123', 10), role: 'BROKER', brokerApproved: false, isActive: true });
    const investors: Array<{ _id: mongoose.Types.ObjectId }> = [];
    for (const [index, name] of ['Aman', 'Priya', 'Karan', 'Neha', 'Vikram', 'Fresh'].entries()) {
      const user = await User.create({ name: `${name} Demo`, email: `${name.toLowerCase()}@demo.com`, phone: `90000000${index + 10}`, passwordHash: await bcrypt.hash('Investor@123', 10), role: 'INVESTOR', isActive: true,
        kyc: { status: name === 'Fresh' ? 'NOT_SUBMITTED' : 'APPROVED', docs: name === 'Fresh' ? [] : [{ url: samplePdf, name: 'Dummy identity document.pdf' }] } });
      investors.push(user);
      if (name !== 'Fresh') {
        const session = await mongoose.startSession();
        try { await session.withTransaction(async () => { await ledger.post({ userId: String(user._id), type: 'TOPUP', direction: 'CREDIT', amount: 1_000_000_000, note: 'TEST MODE — seed opening funds', session }); }); }
        finally { await session.endSession(); }
      }
    }
    const listings = [
      { title: '2BHK, Sector 150, Noida', city: 'Noida', type: 'APARTMENT', status: 'LIVE', valuation: 1_000_000_000, holdings: [20, 50, 400, 0, 0] },
      { title: 'Retail Shop, Koramangala', city: 'Bengaluru', type: 'COMMERCIAL', status: 'LIVE', valuation: 200_000_000, holdings: [300, 300, 390, 0, 0] },
      { title: 'Golf Course Road Residences', city: 'Gurugram', type: 'APARTMENT', status: 'FUNDED', valuation: 300_000_000, holdings: [200, 200, 200, 200, 200] },
      { title: 'Baner Business Centre', city: 'Pune', type: 'COMMERCIAL', status: 'HOLDING', valuation: 250_000_000, holdings: [200, 200, 200, 200, 200] },
      { title: 'Gachibowli Villa', city: 'Hyderabad', type: 'VILLA', status: 'SOLD', valuation: 1_000_000_000, holdings: [20, 50, 400, 265, 265] },
      { title: 'Powai Lake Apartments', city: 'Mumbai', type: 'APARTMENT', status: 'PENDING_APPROVAL', valuation: 350_000_000, holdings: [0, 0, 0, 0, 0] },
      { title: 'Noida Expressway Plot', city: 'Noida', type: 'PLOT', status: 'REJECTED', valuation: 150_000_000, holdings: [0, 0, 0, 0, 0] },
      { title: 'Whitefield Warehouse', city: 'Bengaluru', type: 'WAREHOUSE', status: 'DRAFT', valuation: 120_000_000, holdings: [0, 0, 0, 0, 0] },
    ];
    const fundedAt = new Date(); fundedAt.setUTCMonth(fundedAt.getUTCMonth() - 6);
    for (const [index, listing] of listings.entries()) {
      const session = await mongoose.startSession();
      let propertyId = '';
      try {
        await session.withTransaction(async () => {
          const unitsSold = listing.holdings.reduce((total, units) => total + units, 0);
          const slug = `demo-${index}`;
          const [property] = await Property.create([{ title: listing.title, description: `Academic demo listing in ${listing.city}. Financial figures are illustrative.`, type: listing.type, address: `${index + 1}, Demo Street`, city: listing.city,
            state: ({ Noida: 'Uttar Pradesh', Bengaluru: 'Karnataka', Gurugram: 'Haryana', Pune: 'Maharashtra', Hyderabad: 'Telangana', Mumbai: 'Maharashtra' } as Record<string, string>)[listing.city], pincode: '201301', geo: coordinates[listing.city], areaSqft: 1500,
            images: Array.from({ length: 4 }, (_, image) => ({ url: `https://picsum.photos/seed/${slug}-${image}/1200/800`, name: `Demo image ${image + 1}` })), documents: [{ url: samplePdf, name: 'Sample property document.pdf' }],
            valuation: listing.valuation, totalUnits: 1000, unitPrice: listing.valuation / 1000, minUnits: 1, maxUnitsPerInvestor: 490, unitsSold,
            expectedAppreciationPct: 8, rentalYieldPct: 4, holdingPeriodMonths: 36, status: listing.status === 'SOLD' ? 'HOLDING' : listing.status, brokerId: broker._id,
            ...(unitsSold === 1000 ? { fundedAt } : {}), ...(['LIVE', 'FUNDED', 'HOLDING', 'SOLD'].includes(listing.status) ? { liveAt: fundedAt, approvedBy: admin._id } : {}),
            ...(listing.status === 'REJECTED' ? { rejectionReason: 'Please upload a legible ownership certificate and correct the plot area.' } : {}),
          }], { session });
          propertyId = String(property._id);
          for (const [investorIndex, units] of listing.holdings.entries()) {
            if (!units) continue;
            const amount = units * property.unitPrice;
            await Investment.create([{ investorId: investors[investorIndex]._id, propertyId: property._id, units, amount, status: 'ACTIVE', createdAt: fundedAt }], { session });
            await ledger.post({ userId: String(investors[investorIndex]._id), type: 'INVESTMENT', direction: 'DEBIT', amount, refType: 'Property', refId: property._id, note: 'Demo seed investment', session });
          }
          if (unitsSold === 1000) await ledger.post({ userId: String(broker._id), type: 'COMMISSION', direction: 'CREDIT', amount: Number(BigInt(listing.valuation) / 100n), refType: 'Property', refId: property._id, session });
        });
      } finally { await session.endSession(); }
      if (listing.status === 'SOLD') await executePayout(propertyId, 1_400_000_000, String(admin._id));
    }
    await User.updateOne({ _id: investors[3]._id }, { $set: { 'kyc.status': 'PENDING' } });
    await Withdrawal.create({ userId: investors[0]._id, amount: 50_000, status: 'PENDING', bankDetails: { accountName: 'Aman Demo', accountNumber: '12345678901', ifsc: 'DEMO0123456' } });
    for (const investor of investors.slice(0, 5)) await notify(String(investor._id), { type: 'WELCOME', title: 'Welcome to the demo', body: 'All balances and payments are simulated.', link: '/investor' });
    // Assert the demo wallets reconcile exactly with their append-only ledger.
    const users = await User.find().select('email role walletBalance');
    for (const user of users) {
      const rows = await Transaction.find({ userId: user._id });
      const balance = rows.reduce((total, row) => total + (row.direction === 'CREDIT' ? row.amount : -row.amount), 0);
      if (balance !== user.walletBalance) throw new Error(`Ledger mismatch for ${user.email}`);
    }
    console.table(users.map(user => ({ email: user.email, role: user.role, password: user.role === 'ADMIN' ? 'Admin@123' : user.role === 'BROKER' ? 'Broker@123' : 'Investor@123', walletPaise: user.walletBalance })));
    console.table((await Property.find()).map(property => ({ title: property.title, status: property.status, unitsSold: property.unitsSold, remainingUnits: property.totalUnits - property.unitsSold })));
    console.log('Demo seed complete. All wallet balances reconcile with the ledger. No real payments.');
  } finally { await mongoose.disconnect(); }
}
// Compatible with tsx's CommonJS mode and import-based test runners.
if (process.argv[1] && /(?:^|[\\/])seed\.ts$/.test(process.argv[1])) seedDemo().catch(error => { console.error(error instanceof Error ? error.message : 'Seed failed'); process.exitCode = 1; });
