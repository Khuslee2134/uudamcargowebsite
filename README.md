# Uudam Cargo - Local Run Instructions

1. Install dependencies:

```bash
cd uudamcargowebsite
npm install
```

2. Start server:

```bash
npm start
```

3. Open http://localhost:3000 in browser. The server serves static files and provides API endpoints:

- POST `/api/send-otp` {phone}
- POST `/api/verify-otp` {phone,code}
- POST `/api/register-cargo` {tracking,phone,status,meta}
- GET `/api/my-cargos` (requires `x-session-token` header)

Notes: SMS sending is mocked to console. For production, integrate a real SMS provider and replace in `server.js`.
# uudamcargowebsite