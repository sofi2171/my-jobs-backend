const admin = require('firebase-admin');

// Firebase Admin ko initialize karna
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key mein \n ko theek se replace karna bohat zaroori hai
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
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

    // Modern FCM HTTP v1 Message (Data Only Payload for Background Wake-up)
    const message = {
      token: targetToken,
      android: {
        priority: 'high',
      },
      data: {
        title: `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call`,
        body: `${callerName} is calling you...`,
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
