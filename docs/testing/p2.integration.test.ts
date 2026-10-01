import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User, Property, Investment, Payout, Transaction, GatewayOrder, Settings, Withdrawal, Notification } from '@/lib/server/models';
import { ledger } from '@/lib/server/services/ledger.service';
import { executePayout, previewPayout } from '@/lib/server/services/payout.service';
import { createTopupOrder, verifyTopup, requestWithdrawal, processWithdrawal } from '@/lib/server/services/wallet.service';
import { getHoldings, getPortfolioSummary } from '@/lib/server/services/portfolio.service';
import { getAdminStats, getFundingTimeline, updateUser, reviewKyc } from '@/lib/server/services/stats.service';
import { POST as sellRoute } from '@/app/api/v1/properties/[id]/sell/route';
import { GET as adminStatsRoute } from '@/app/api/v1/admin/stats/route';
import { seedDemo } from '@/scripts/seed';

const uri = process.env.P2_TEST_MONGODB_URI;
const suite = uri ? describe : describe.skip;
suite('P2 integration against a disposable replica set and P1 contract double', () => {
  let adminId: string, brokerId: string, investorId: string, secondId: string, propertyId: string;
  beforeAll(async () => {
    if (!new URL(uri!.replace(/^mongodb:/, 'http:')).hostname.match(/^(127\.0\.0\.1|localhost)$/)) throw new Error('Integration tests only accept a local disposable MongoDB URI');
    process.env.MOCK_GATEWAY_SECRET = 'isolated-test-demo-hmac-secret';
    process.env.JWT_SECRET = 'isolated-test-jwt-secret-at-least-32-characters';
    await mongoose.connect(uri!);
    for (const model of [User, Property, Investment, Payout, Transaction, GatewayOrder, Settings, Withdrawal, Notification]) await model.init();
  });
  afterAll(async () => { await mongoose.disconnect(); });
  beforeEach(async () => {
    vi.restoreAllMocks();
    for (const name of Object.keys(mongoose.connection.collections)) await mongoose.connection.collection(name).deleteMany({});
    await Settings.create({ platformFeePct: 2, brokerCommissionPct: 1, maxOwnershipPct: 49 });
    const users = await User.create([
      { name: 'Admin', email: 'admin@test.example', role: 'ADMIN' },
      { name: 'Broker', email: 'broker@test.example', role: 'BROKER' },
      { name: 'Aman', email: 'aman@test.example', role: 'INVESTOR' },
      { name: 'Priya', email: 'priya@test.example', role: 'INVESTOR' },
    ]);
    [adminId, brokerId, investorId, secondId] = users.map(user => String(user._id));
    const property = await Property.create({ title: 'Test property', city: 'Noida', status: 'HOLDING', brokerId, valuation: 10000, totalUnits: 100, unitsSold: 100, unitPrice: 100, images: [], expectedAppreciationPct: 8, holdingPeriodMonths: 12 });
    propertyId = String(property._id);
    await Investment.create([{ investorId, propertyId, units: 20, amount: 2000, status: 'ACTIVE' }, { investorId: secondId, propertyId, units: 80, amount: 8000, status: 'ACTIVE' }]);
  });
  async function fund(id: string, amount: number) { const order = await createTopupOrder(id, amount); return verifyTopup(id, { orderId: order.orderId, ...order.mockPayment }); }
  async function balancesReconcile() {
    for (const user of await User.find()) {
      const rows = await Transaction.find({ userId: user._id });
      expect(user.walletBalance).toBe(rows.reduce((sum, row) => sum + (row.direction === 'CREDIT' ? row.amount : -row.amount), 0));
    }
  }
  it('previews without writes and credits sale proceeds once including zero fees', async () => {
    const before = await Transaction.countDocuments();
    const preview = await previewPayout(propertyId, 14000);
    expect(preview.sumCheck).toBe(true); expect(await Transaction.countDocuments()).toBe(before);
    await executePayout(propertyId, 14000, adminId);
    expect(await ledger.getBalance(investorId)).toBe(2744);
    expect(await ledger.getBalance(secondId)).toBe(10976);
    expect(await ledger.getBalance(adminId)).toBe(280);
    expect((await Property.findById(propertyId))?.status).toBe('SOLD');
    expect(await Investment.countDocuments({ status: 'ACTIVE' })).toBe(0);
    expect((await Investment.find({ status: 'EXITED' })).reduce((sum, row) => sum + (row.payoutAmount ?? 0), 0)).toBe(13720);
    await expect(executePayout(propertyId, 14000, adminId)).rejects.toMatchObject({ status: 409, code: 'ALREADY_SOLD' });
    expect(await Transaction.countDocuments()).toBe(3); await balancesReconcile();
  });
  it('allows exactly one concurrent sale with no duplicate ledger entries', async () => {
    const results = await Promise.allSettled([executePayout(propertyId, 14000, adminId), executePayout(propertyId, 14000, adminId)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'ALREADY_SOLD' } });
    expect(await Payout.countDocuments()).toBe(1); expect(await Transaction.countDocuments()).toBe(3); await balancesReconcile();
  });
  it('rolls back property status, payout and every credit on a ledger failure', async () => {
    const realPost = ledger.post;
    vi.spyOn(ledger, 'post').mockImplementation(async input => { if (input.userId === secondId) throw new Error('simulated ledger failure'); return realPost(input); });
    await expect(executePayout(propertyId, 14000, adminId)).rejects.toThrow('simulated');
    expect((await Property.findById(propertyId))?.status).toBe('HOLDING');
    expect(await Payout.countDocuments()).toBe(0); expect(await Transaction.countDocuments()).toBe(0);
    expect(await ledger.getBalance(investorId)).toBe(0);
  });
  it('splits payouts over multiple purchase documents without losing paise', async () => {
    await Investment.deleteMany({ investorId });
    await Investment.create([{ investorId, propertyId, units: 7, amount: 700, status: 'ACTIVE' }, { investorId, propertyId, units: 13, amount: 1300, status: 'ACTIVE' }]);
    await executePayout(propertyId, 14001, adminId);
    const purchases = await Investment.find({ investorId });
    expect(purchases.reduce((sum, row) => sum + (row.payoutAmount ?? 0), 0)).toBe(await ledger.getBalance(investorId));
  });
  it('supports zero fee and zero-paise small holder payouts without invalid ledger rows', async () => {
    await Settings.updateOne({}, { $set: { platformFeePct: 0 } });
    await executePayout(propertyId, 1, adminId);
    expect(await Transaction.countDocuments()).toBe(1);
    expect(await ledger.getBalance(adminId)).toBe(0); expect(await ledger.getBalance(investorId)).toBe(0);
    expect(await ledger.getBalance(secondId)).toBe(1); expect(await Investment.countDocuments({ status: 'EXITED' })).toBe(2);
  });
  it('credits a demo topup exactly once and rejects replay, bad signatures and other owners', async () => {
    const order = await createTopupOrder(investorId, 10000); const payment = { orderId: order.orderId, ...order.mockPayment };
    await expect(verifyTopup(secondId, payment)).rejects.toMatchObject({ status: 404 });
    await expect(verifyTopup(investorId, { ...payment, signature: '0'.repeat(64) })).rejects.toMatchObject({ code: 'INVALID_SIGNATURE' });
    expect(await verifyTopup(investorId, payment)).toEqual({ balance: 10000, mock: true, paymentSuccess: true });
    await expect(verifyTopup(investorId, payment)).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_PAYMENT' });
    expect(await Transaction.countDocuments({ type: 'TOPUP' })).toBe(1); await balancesReconcile();
  });
  it('prevents concurrent topup verification from double-crediting', async () => {
    const order = await createTopupOrder(investorId, 10000); const payment = { orderId: order.orderId, ...order.mockPayment };
    const results = await Promise.allSettled([verifyTopup(investorId, payment), verifyTopup(investorId, payment)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await ledger.getBalance(investorId)).toBe(10000); expect(await Transaction.countDocuments()).toBe(1);
  });
  it('rolls back the PAID marker when crediting fails, permitting a retry', async () => {
    const order = await createTopupOrder(investorId, 10000); const payment = { orderId: order.orderId, ...order.mockPayment };
    const spy = vi.spyOn(ledger, 'post').mockRejectedValueOnce(new Error('simulated credit failure'));
    await expect(verifyTopup(investorId, payment)).rejects.toThrow('simulated');
    expect((await GatewayOrder.findOne({ orderId: order.orderId }))?.status).toBe('CREATED');
    spy.mockRestore(); expect((await verifyTopup(investorId, payment))?.paymentSuccess).toBe(true);
  });
  it('processes a withdrawal once, rechecks balance, and never debits rejected requests', async () => {
    await fund(investorId, 10000);
    const input = { amount: 8000, bankDetails: { accountName: 'Demo Investor', accountNumber: '12345678901', ifsc: 'DEMO0123456' } };
    const first = await requestWithdrawal(investorId, input), second = await requestWithdrawal(investorId, input);
    await processWithdrawal(String(first._id), adminId, { action: 'APPROVE' });
    await expect(processWithdrawal(String(first._id), adminId, { action: 'APPROVE' })).rejects.toMatchObject({ status: 409 });
    await expect(processWithdrawal(String(second._id), adminId, { action: 'APPROVE' })).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
    expect((await Withdrawal.findById(second._id))?.status).toBe('PENDING');
    await processWithdrawal(String(second._id), adminId, { action: 'REJECT', reason: 'Insufficient balance now' });
    expect(await ledger.getBalance(investorId)).toBe(2000); expect(await Transaction.countDocuments({ type: 'WITHDRAWAL' })).toBe(1); await balancesReconcile();
  });
  it('returns a zero portfolio for a fresh investor and 30 days of chart points', async () => {
    await Investment.deleteMany({ investorId });
    expect(await getHoldings(investorId)).toEqual([]);
    expect(await getPortfolioSummary(investorId)).toEqual({ totalInvested: 0, currentValue: 0, totalPayouts: 0, roiPct: 0, walletBalance: 0, allocation: [], recentTransactions: [] });
    expect((await getAdminStats()).charts.fundsRaisedOverTime).toHaveLength(30);
  });
  it('declares admin-only route access and rejects other roles/inactive users via the contract wrapper', async () => {
    for (const id of [investorId, brokerId]) {
      const token = jwt.sign({}, process.env.JWT_SECRET!, { subject: id });
      const req = new Request('http://localhost/api/v1/admin/stats', { headers: { authorization: `Bearer ${token}` } });
      expect((await adminStatsRoute(req)).status).toBe(403);
      expect((await sellRoute(new Request(`http://localhost/api/v1/properties/${propertyId}/sell`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ salePrice: 14000 }) }), { params: { id: propertyId } })).status).toBe(403);
    }
    await User.updateOne({ _id: adminId }, { $set: { isActive: false } });
    const token = jwt.sign({}, process.env.JWT_SECRET!, { subject: adminId });
    expect((await adminStatsRoute(new Request('http://localhost/api/v1/admin/stats', { headers: { authorization: `Bearer ${token}` } }))).status).toBe(401);
  });
  it('blocks broker ownership bypass and admin self-deactivation/demotion', async () => {
    await expect(getFundingTimeline(propertyId, investorId)).rejects.toMatchObject({ status: 404 });
    await expect(updateUser(adminId, adminId, { isActive: false })).rejects.toMatchObject({ status: 403 });
    await expect(updateUser(adminId, adminId, { role: 'INVESTOR' })).rejects.toMatchObject({ status: 403 });
  });
  it('serializes concurrent admin cross-demotions to retain an active admin', async () => {
    const other = await User.create({ name: 'Other admin', email: 'other@test.example', role: 'ADMIN' });
    const otherId = String(other._id);
    const results = await Promise.allSettled([updateUser(adminId, otherId, { role: 'INVESTOR' }), updateUser(otherId, adminId, { role: 'INVESTOR' })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await User.countDocuments({ role: 'ADMIN', isActive: true })).toBe(1);
  });
  it('requires pending KYC and writes approval notifications atomically', async () => {
    await User.updateOne({ _id: investorId }, { $set: { 'kyc.status': 'PENDING' } });
    await reviewKyc(investorId, { action: 'APPROVE' });
    expect((await User.findById(investorId))?.kyc.status).toBe('APPROVED');
    expect(await Notification.countDocuments({ userId: investorId, type: 'KYC' })).toBe(1);
    await expect(reviewKyc(investorId, { action: 'APPROVE' })).rejects.toMatchObject({ status: 409 });
  });
  it('seeds eight properties, nine accounts, correct demo holdings and reconciled wallets', async () => {
    process.env.MONGODB_URI = uri;
    process.argv.push('--reset-demo');
    try { await seedDemo(); } finally { process.argv.pop(); }
    await mongoose.connect(uri!);
    expect(await Property.countDocuments()).toBe(8); expect(await User.countDocuments()).toBe(9);
    const retail = await Property.findOne({ title: 'Retail Shop, Koramangala' });
    expect(retail!.totalUnits - retail!.unitsSold).toBe(10);
    expect((await Property.findOne({ title: '2BHK, Sector 150, Noida' }))?.unitsSold).toBe(470);
    const fresh = await User.findOne({ email: 'fresh@demo.com' });
    expect(fresh?.walletBalance).toBe(0); expect((await getPortfolioSummary(String(fresh!._id))).roiPct).toBe(0);
    expect(await Payout.countDocuments()).toBe(1); await balancesReconcile();
  });
});
