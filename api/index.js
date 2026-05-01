const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    if (serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'")) { serviceAccountStr = serviceAccountStr.slice(1, -1); }
    if (serviceAccountStr.startsWith('"') && serviceAccountStr.endsWith('"')) { serviceAccountStr = serviceAccountStr.slice(1, -1); }
    const serviceAccount = JSON.parse(serviceAccountStr);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) { console.error("Firebase Admin Init Error:", error); }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { targetToken, callerName, callerUid, callType, action } = req.body;
    if (!targetToken) return res.status(400).json({ error: "Missing targetToken" });

    let message;

    // 🔥 AGAR CALL CANCEL HO GAYI HAI (Missed Call)
    if (action === 'cancel') {
        message = {
            token: targetToken,
            data: { action: "cancel_call", callerUid: String(callerUid) },
            android: { priority: 'high' } // Silent push to wake up JS listener
        };
    } 
    // 📞 AGAR NEW CALL AAYI HAI
    else {
        message = {
            token: targetToken,
            notification: {
                title: `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call`,
                body: `${callerName || 'Someone'} is calling you...`
            },
            data: {
                callerUid: String(callerUid), callType: String(callType), startCall: "true", isCall: "true"
            },
            android: {
                priority: 'high',
                notification: { channelId: "high_importance_channel", priority: "high", visibility: "public" }
            }
        };
    }

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, messageId: response });

  } catch (error) { return res.status(500).json({ error: error.message }); }
};
