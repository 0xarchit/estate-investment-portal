// Runs before server modules read env. Only the explicit disposable-test URI is used.
if (process.env.P2_TEST_MONGODB_URI) process.env.MONGODB_URI = process.env.P2_TEST_MONGODB_URI;
process.env.JWT_SECRET = 'p2-local-regression-jwt-key-at-least-32-characters';
process.env.MOCK_GATEWAY_SECRET = 'p2-local-regression-demo-hmac-key';
