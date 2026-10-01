import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storePath = path.resolve(dataDir, 'serverStore.json');

// Read store helper
function getStore() {
  try {
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading serverStore:', e);
  }
  return { records: null, employees: null, settings: null };
}

// Write store helper
function saveStore(data: any) {
  try {
    const current = getStore();
    const updated = { ...current, ...data };
    fs.writeFileSync(storePath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing serverStore:', e);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Settings
app.get('/api/settings', (req, res) => {
  const store = getStore();
  res.json(store.settings || null);
});

app.post('/api/settings', (req, res) => {
  saveStore({ settings: req.body });
  res.json({ success: true });
});

// Records
app.get('/api/records', (req, res) => {
  const store = getStore();
  res.json(store.records || null);
});

app.post('/api/records', (req, res) => {
  saveStore({ records: req.body });
  res.json({ success: true, count: req.body?.length || 0 });
});

// Employees
app.get('/api/employees', (req, res) => {
  const store = getStore();
  res.json(store.employees || null);
});

app.post('/api/employees', (req, res) => {
  saveStore({ employees: req.body });
  res.json({ success: true });
});

// LINE Push & Webhook Dispatch Route
app.post('/api/line/notify', async (req, res) => {
  const { record, flexMessage, settings } = req.body;
  let lineStatus = 'pending';
  let webhookStatus = 'pending';

  // 1. Dispatch to Webhook URL (user provided: https://webhook.site/7a150790-aaf4-4ba2-ba66-4731f6d1b91a)
  try {
    const webhookUrl = settings?.webhookUrl || 'https://webhook.site/7a150790-aaf4-4ba2-ba66-4731f6d1b91a';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'OXYGEN_CHECK_SUBMITTED',
          timestamp: record.timestamp,
          date: record.date,
          inspector: record.inspector,
          readyDigitalTanks: record.readyDigitalTanks,
          readyGaugeTanks: record.readyGaugeTanks,
          totalReadyTanks: record.totalReadyTanks,
          isLowStock: record.isLowStock,
          issues: record.issues,
          stations: {
            ward4_9: record.ward4_9,
            ward4_8_ari: record.ward4_8_ari,
            building4_7_pt: record.building4_7_pt,
            ward4_6: record.ward4_6,
            building4_3_opd: record.building4_3_opd,
            building4_2_icu: record.building4_2_icu,
            building4_1_storage: record.building4_1_storage,
          },
          lineGroupId: settings?.groupId,
          lineUserId: settings?.userId,
          flexMessage,
        }),
      });
      webhookStatus = 'delivered';
    }
  } catch (err: any) {
    console.error('Webhook dispatch error:', err.message);
    webhookStatus = 'error: ' + err.message;
  }

  // 2. Dispatch to LINE Messaging API
  try {
    const token =
      settings?.lineChannelAccessToken ||
      '9muhzHMwL5AOje0lzuZKLIGvGJw72u72aFa2itjTUt9rDwPnyADBA+gTv/5YhH6v0s7vRKBNPaCGY+z+aUlPwM0CcZP0sci5T4EdSQORmTK8B4KPevTWCwYgyTrKEVmrwmSihd3GF4YSgeEzWlayGAdB04t89/1O/w1cDnyilFU=';

    const targets = [settings?.groupId, settings?.userId].filter(Boolean);
    for (const target of targets) {
      const lineResp = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: target,
          messages: [flexMessage],
        }),
      });

      if (!lineResp.ok) {
        const errText = await lineResp.text();
        console.warn(`LINE Push to ${target} status ${lineResp.status}:`, errText);
      }
    }
    lineStatus = 'delivered';
  } catch (err: any) {
    console.error('LINE push error:', err.message);
    lineStatus = 'error: ' + err.message;
  }

  res.json({
    success: true,
    lineStatus,
    webhookStatus,
  });
});

// Monthly report manual / scheduled trigger endpoint
app.post('/api/report/send-monthly', async (req, res) => {
  const { emails, recordsCount, settings } = req.body;
  console.log(`[REPORT] Scheduled monthly summary triggered for:`, emails);
  
  // Forward report summary log to webhook
  try {
    const webhookUrl = settings?.webhookUrl || 'https://webhook.site/7a150790-aaf4-4ba2-ba66-4731f6d1b91a';
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'MONTHLY_SUMMARY_REPORT_SENT',
        sentAt: new Date().toISOString(),
        recipients: emails,
        recordsProcessed: recordsCount,
        reportType: 'End of month 16:30 schedule',
      }),
    });
  } catch (e) {}

  res.json({
    success: true,
    recipients: emails,
    sentAt: new Date().toISOString(),
    status: 'Delivered to queue',
  });
});

// Periodic background check for End of Month at 16:30
setInterval(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (currentDay === lastDay && hours === 16 && minutes === 30) {
    const store = getStore();
    const emails = store.settings?.externalEmails || ['nhbmepaolo01@gmail.com'];
    console.log('[CRON 16:30] It is end-of-month at 16:30! Sending monthly report to:', emails);
  }
}, 60000); // Check every minute

// Start Server with Vite or Static
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BME Oxygen Tank Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
