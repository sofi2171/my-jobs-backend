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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { targetToken, callerName, callerUid, callType } = req.body;

    const message = {
      token: targetToken,
      android: {
        priority: 'high',
        notification: {
          title: `Incoming ${callType} Call`,
          body: `${callerName} is calling you...`,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
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
    return res.status(500).json({ error: error.message });
  }
};
