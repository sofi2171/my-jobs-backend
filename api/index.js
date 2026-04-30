const admin = require('firebase-admin');

// Firebase Admin initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key ki formatting fix karne ke liye
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

module.exports = async (req, res) => {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sirf POST requests allow hain' });
  }

  try {
    const { targetToken, callerName, callerUid, callType } = req.body;

    if (!targetToken) {
      return res.status(400).json({ error: 'Token missing hai' });
    }

    const message = {
      token: targetToken,
      notification: {
        title: `Incoming ${callType} Call`,
        body: `${callerName} is calling you...`,
      },
      data: {
        callerUid: String(callerUid),
        callType: String(callType),
        startCall: "true"
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'high_importance_channel',
          fullScreenIntent: true,
        },
      },
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, messageId: response });

  } catch (error) {
    console.error("FCM Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
      
