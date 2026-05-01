const admin = require('firebase-admin');

// Firebase Admin ko initialize karna (Single JSON approach)
if (!admin.apps.length) {
  try {
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    
    // Clean string if it has extra quotes from .env upload
    if (serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'")) {
      serviceAccountStr = serviceAccountStr.slice(1, -1);
    }
    if (serviceAccountStr.startsWith('"') && serviceAccountStr.endsWith('"')) {
      serviceAccountStr = serviceAccountStr.slice(1, -1);
    }

    const serviceAccount = JSON.parse(serviceAccountStr);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
  }
}

module.exports = async (req, res) => {
  // CORS Headers (App aur Vercel ka connection allow karne ke liye)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request (Browser/App security check)
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

    // Modern FCM HTTP v1 Message (System Tray Notification + Data Intent)
    const message = {
      token: targetToken,
      // Yeh hissa tab dikhta hai jab app background mein ho ya band ho
      notification: {
        title: `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call`,
        body: `${callerName || 'Someone'} is calling you...`
      },
      // Yeh hissa app ki JavaScript ko wake-up signal bhejta hai
      data: {
        callerUid: String(callerUid),
        callType: String(callType),
        startCall: "true",
        isCall: "true"
      },
      android: {
        priority: 'high',
        notification: {
          channelId: "high_importance_channel", // Android channel for high priority
          priority: "high",
          visibility: "public"
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log("Push sent successfully:", response);
    return res.status(200).json({ success: true, messageId: response });

  } catch (error) {
    console.error("FCM Send Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
