const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = async (req, res) => {
  // --- CORS HEADERS START ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Ya specific domain: 'https://healthjobs-portal.web.app'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS request ko foran handle karein (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- CORS HEADERS END ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { targetToken, callerName, callerUid, callType } = req.body;

    const message = {
      token: targetToken,
      android: {
        priority: 'high',
        notification: {
          title: `Incoming ${callType} Call`,
          body: `${callerName} is calling you...`,
        },
      },
      data: {
        callerUid: String(callerUid),
        callType: String(callType),
        startCall: "true"
      },
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error("FCM Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
