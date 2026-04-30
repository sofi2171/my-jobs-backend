const axios = require('axios');

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { targetToken, callerName, callerUid, callType } = req.body;
        
        // Aapki FCM Server Key (Isay Vercel Environment Variable mein 'FCM_KEY' ke naam se save karein)
        const SERVER_KEY = process.env.FCM_KEY;

        const fcmData = {
            to: targetToken,
            notification: {
                title: `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call`,
                body: `${callerName} is calling you...`,
                sound: "default",
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            },
            data: {
                callerUid: callerUid,
                callType: callType,
                startCall: "true"
            },
            priority: "high",
            android: {
                priority: "high"
            }
        };

        const response = await axios.post('https://fcm.googleapis.com/fcm/send', fcmData, {
            headers: {
                'Authorization': `key=${SERVER_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json({ success: true, detail: response.data });

    } catch (error) {
        console.error("Simple FCM Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
};
