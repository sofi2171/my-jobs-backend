const admin = require('firebase-admin');

// Firebase Admin ko initialize karna
if (!admin.apps.length) {
  try {
    // 1. Aapki .env file se pura JSON uthana
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    
    // 2. Agar .env upload karte waqt bahar single quotes (' ') lag gaye the, toh unhein hata dein
    if (serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'")) {
      serviceAccountStr = serviceAccountStr.slice(1, -1);
    }

    // 3. JSON ko parse karna
    const serviceAccount = JSON.parse(serviceAccountStr);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin Init Error (Check .env JSON format):", error);
  }
}

module.exports = async (req, res) => {
  // CORS Headers (App se API call allow karne ke liye)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request handle karna
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { targetToken, callerName, callerUid, callType } = req.body;

    if (!targetToken) {
      return res.status(400).json({ error: "Missing targetToken" });
    }

    // Modern FCM HTTP v1 Message (Data Only Payload)
    const message = {
      token: targetToken,
      android: {
        priority: 'high',
      },
      data: {
        title: `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call`,
        body: `${callerName || 'User'} is calling you...`,
        callerUid: String(callerUid),
        callType: String(callType),
        startCall: "true",
        isCall: "true"
      },
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error("FCM Send Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
