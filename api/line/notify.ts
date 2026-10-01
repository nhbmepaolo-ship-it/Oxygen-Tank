// Vercel Serverless Function: /api/line/notify
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { record, flexMessage, settings } = req.body || {};
  let lineStatus = 'pending';
  let webhookStatus = 'pending';
  let sentMessageId: string | null = null;
  let lineErrorDetails: any = null;

  const token = (
    settings?.lineChannelAccessToken ||
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    '9muhzHMwL5AOje0lzuZKLIGvGJw72u72aFa2itjTUt9rDwPnyADBA+gTv/5YhH6v0s7vRKBNPaCGY+z+aUlPwM0CcZP0sci5T4EdSQORmTK8B4KPevTWCwYgyTrKEVmrwmSihd3GF4YSgeEzWlayGAdB04t89/1O/w1cDnyilFU='
  ).trim();

  const groupId = settings?.groupId || 'C0d56d86a30886df48499737f53e60b28';
  const userId = settings?.userId || 'Ub95fbfe9db3b57c45039abe293c42453';
  const webhookUrl = settings?.webhookUrl || 'https://webhook.site/7a150790-aaf4-4ba2-ba66-4731f6d1b91a';

  // 1. Dispatch to Webhook URL
  try {
    if (webhookUrl && webhookUrl.startsWith('http')) {
      const webhookResp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'OXYGEN_CHECK_SUBMITTED',
          timestamp: record?.timestamp || new Date().toISOString(),
          date: record?.date || new Date().toLocaleDateString('th-TH'),
          inspector: record?.inspector || 'ระบบ',
          readyDigitalTanks: record?.readyDigitalTanks,
          readyGaugeTanks: record?.readyGaugeTanks,
          totalReadyTanks: record?.totalReadyTanks,
          isLowStock: record?.isLowStock,
          issues: record?.issues,
          stations: {
            ward4_9: record?.ward4_9,
            ward4_8_ari: record?.ward4_8_ari,
            building4_7_pt: record?.building4_7_pt,
            ward4_6: record?.ward4_6,
            building4_3_opd: record?.building4_3_opd,
            building4_2_icu: record?.building4_2_icu,
            building4_1_storage: record?.building4_1_storage,
          },
          lineGroupId: groupId,
          lineUserId: userId,
          flexMessage,
        }),
      });
      webhookStatus = webhookResp.ok ? 'delivered' : `http_${webhookResp.status}`;
    }
  } catch (err: any) {
    webhookStatus = 'error: ' + (err.message || 'webhook error');
  }

  // 2. Dispatch to LINE Messaging API
  try {
    const targets = [groupId, userId].filter(Boolean);
    const messageToSend = flexMessage || {
      type: 'text',
      text: `🏥 แจ้งเตือนตรวจเช็คถังออกซิเจน BME: ผู้ตรวจ ${record?.inspector || 'เจ้าหน้าที่'} วันที่ ${record?.date || ''} คงเหลือ ${record?.totalReadyTanks || 0} ถัง`,
    };

    let anySuccess = false;

    for (const target of targets) {
      const lineResp = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: target,
          messages: [messageToSend],
        }),
      });

      const lineBody = await lineResp.text();
      if (lineResp.ok) {
        anySuccess = true;
        lineStatus = 'delivered';
        try {
          const parsed = JSON.parse(lineBody);
          sentMessageId = parsed.sentMessages?.[0]?.id || 'delivered';
        } catch {}
      } else {
        if (!anySuccess) {
          lineStatus = `error_${lineResp.status}`;
          lineErrorDetails = lineBody;
        }
      }
    }

    if (anySuccess) {
      return res.status(200).json({
        success: true,
        lineStatus: 'delivered',
        webhookStatus,
        sentMessageId,
      });
    } else {
      return res.status(500).json({
        success: false,
        lineStatus,
        webhookStatus,
        error: lineErrorDetails || 'Failed to send to LINE',
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      lineStatus: 'error',
      webhookStatus,
      error: err.message,
    });
  }
}
