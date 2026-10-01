import { InspectionRecord, SystemSettings } from '../types';

export function createLineFlexMessage(record: InspectionRecord, settings: SystemSettings) {
  const isAlert = record.isLowStock;
  const statusColor = isAlert ? '#DC2626' : '#059669';
  const statusBg = isAlert ? '#FEF2F2' : '#F0FDF4';
  const statusText = isAlert ? '🚨 ถังเหลือน้อยถึงเกณฑ์สั่งซื้อด่วน!' : '✅ ปริมาณถังออกซิเจนปกติ';
  const headerTitle = isAlert ? '⚠️ แจ้งเตือน: ถังออกซิเจนใกล้หมด' : '🏥 รายงานตรวจเช็คถังออกซิเจน';

  return {
    type: 'flex',
    altText: `${headerTitle} วันที่ ${record.date} (คงเหลือ: ${record.totalReadyTanks} ถัง)`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: statusColor,
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingStart: '20px',
        paddingEnd: '20px',
        contents: [
          {
            type: 'text',
            text: 'BME OXYGEN MONITORING',
            color: '#FFFFFFCC',
            size: 'xxs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: headerTitle,
            color: '#FFFFFF',
            size: 'lg',
            weight: 'bold',
            margin: 'xs',
          },
          {
            type: 'text',
            text: `วันที่ตรวจ: ${record.date} | บันทึก: ${record.timestamp.split(',')[1]?.trim() || ''}`,
            color: '#FFFFFFAA',
            size: 'xs',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        spacing: 'md',
        contents: [
          // Inspector info
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '👤 ผู้ตรวจเช็ค:',
                size: 'sm',
                color: '#64748B',
                flex: 3,
              },
              {
                type: 'text',
                text: record.inspector,
                size: 'sm',
                weight: 'bold',
                color: '#0F172A',
                flex: 5,
                align: 'end',
              },
            ],
          },
          // Alert Badge Banner
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: statusBg,
            cornerRadius: '8px',
            paddingAll: '10px',
            borderWidth: '1px',
            borderColor: isAlert ? '#FCA5A5' : '#86EFAC',
            contents: [
              {
                type: 'text',
                text: statusText,
                size: 'sm',
                weight: 'bold',
                color: statusColor,
                align: 'center',
              },
              ...(isAlert
                ? [
                    {
                      type: 'text',
                      text: `* เกณฑ์ความปลอดภัย: ถังดิจิตอลขั้นต่ำ ${settings.digitalLowThreshold} ถัง หรือ รวมขั้นต่ำ ${settings.totalLowThreshold} ถัง`,
                      size: 'xxs',
                      color: '#B91C1C',
                      wrap: true,
                      margin: 'xs',
                      align: 'center',
                    },
                  ]
                : []),
            ],
          },
          // Stats Grid
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: record.readyDigitalTanks < settings.digitalLowThreshold ? '#FEE2E2' : '#F1F5F9',
                cornerRadius: '8px',
                paddingAll: '10px',
                alignItems: 'center',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: 'ดิจิตอลรุ่นใหม่',
                    size: 'xxs',
                    color: '#64748B',
                  },
                  {
                    type: 'text',
                    text: `${record.readyDigitalTanks}`,
                    size: 'xl',
                    weight: 'bold',
                    color: record.readyDigitalTanks < settings.digitalLowThreshold ? '#DC2626' : '#0F172A',
                  },
                  {
                    type: 'text',
                    text: 'ถังพร้อมใช้',
                    size: 'xxs',
                    color: '#94A3B8',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#F1F5F9',
                cornerRadius: '8px',
                paddingAll: '10px',
                alignItems: 'center',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: 'หัวเกย์รุ่นเก่า',
                    size: 'xxs',
                    color: '#64748B',
                  },
                  {
                    type: 'text',
                    text: `${record.readyGaugeTanks}`,
                    size: 'xl',
                    weight: 'bold',
                    color: '#0F172A',
                  },
                  {
                    type: 'text',
                    text: 'ถังพร้อมใช้',
                    size: 'xxs',
                    color: '#94A3B8',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: isAlert ? '#FEE2E2' : '#E0F2FE',
                cornerRadius: '8px',
                paddingAll: '10px',
                alignItems: 'center',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: 'รวมพร้อมใช้',
                    size: 'xxs',
                    color: '#64748B',
                  },
                  {
                    type: 'text',
                    text: `${record.totalReadyTanks}`,
                    size: 'xl',
                    weight: 'bold',
                    color: isAlert ? '#DC2626' : '#0284C7',
                  },
                  {
                    type: 'text',
                    text: 'ถังทั้งหมด',
                    size: 'xxs',
                    color: '#94A3B8',
                  },
                ],
              },
            ],
          },
          // Separator
          {
            type: 'separator',
            color: '#E2E8F0',
            margin: 'sm',
          },
          // Ward Readings Summary
          {
            type: 'text',
            text: '📍 สถานะแรงดันจุดตรวจประจำวอร์ด:',
            size: 'xs',
            weight: 'bold',
            color: '#475569',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '• Ward 4/9: ' + record.ward4_9, size: 'xxs', color: '#334155', flex: 1 },
                  { type: 'text', text: '• W4/8 ARI: ' + record.ward4_8_ari, size: 'xxs', color: '#334155', flex: 1 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '• อาคาร 4/7 (PT): ' + record.building4_7_pt, size: 'xxs', color: '#334155', flex: 1 },
                  { type: 'text', text: '• Ward 4/6: ' + record.ward4_6, size: 'xxs', color: '#334155', flex: 1 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '• OPD 4/3: ' + record.building4_3_opd, size: 'xxs', color: '#334155', flex: 1 },
                  { type: 'text', text: '• ICU 4/2: ' + record.building4_2_icu, size: 'xxs', color: '#334155', flex: 1 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '• ห้องเก็บ 4/1: ' + record.building4_1_storage, size: 'xxs', color: '#334155', flex: 1 },
                ],
              },
            ],
          },
          // Issues
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F8FAFC',
            cornerRadius: '6px',
            paddingAll: '8px',
            contents: [
              {
                type: 'text',
                text: '🔧 ประเด็นปัญหาที่พบ:',
                size: 'xxs',
                weight: 'bold',
                color: '#64748B',
              },
              {
                type: 'text',
                text: record.issues || 'พร้อมใช้งาน',
                size: 'xs',
                color: record.issues && record.issues !== 'พร้อมใช้งาน' && record.issues !== '-' ? '#D97706' : '#10B981',
                wrap: true,
                weight: 'bold',
                margin: 'xs',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            color: isAlert ? '#DC2626' : '#0D9488',
            action: {
              type: 'uri',
              label: isAlert ? '🚨 เปิดระบบสั่งถังออกซิเจนด่วน' : '📱 เปิดดูข้อมูลระบบ BME',
              uri: typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-hyjdpbq27kzziox35ce4vv-1007627916452.asia-southeast1.run.app',
            },
          },
        ],
      },
    },
  };
}

export async function sendLineAndWebhookNotifications(
  record: InspectionRecord,
  settings: SystemSettings
): Promise<{ success: boolean; lineStatus: string; webhookStatus: string; sentMessageId?: string; error?: string }> {
  const flexMessage = createLineFlexMessage(record, settings);

  const payload = {
    record,
    flexMessage,
    settings: {
      groupId: settings.lineGroupId,
      userId: settings.lineUserId,
      lineChannelAccessToken: settings.lineChannelAccessToken,
      webhookUrl: settings.webhookUrl,
      sheetId: settings.sheetId,
    },
  };

  try {
    // Send via backend proxy server (avoids browser CORS & token exposure)
    const response = await fetch('/api/line/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: data.success,
        lineStatus: data.lineStatus,
        webhookStatus: data.webhookStatus,
        sentMessageId: data.sentMessageId,
      };
    } else {
      const errText = await response.text();
      return {
        success: false,
        lineStatus: `HTTP ${response.status}`,
        webhookStatus: 'error',
        error: errText,
      };
    }
  } catch (err: any) {
    console.error('Failed to notify via /api/line/notify:', err);

    // Fallback: Dispatch to Webhook directly with no-cors so webhook.site receives it
    try {
      if (settings.webhookUrl) {
        await fetch(settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
      }
    } catch {}

    return {
      success: false,
      lineStatus: 'connection_failed',
      webhookStatus: 'fallback_sent',
      error: err.message,
    };
  }
}
