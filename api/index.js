const axios = require('axios');

module.exports = async (req, res) => {
    // CORS Settings (Taake aapki app isay call kar sakay)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    const { targetToken, callerName, callerUid, callType } = req.body;
    const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY; // Yeh Vercel ki settings mein daalenge

    try {
        const response = await axios.post('https://fcm.googleapis.com/fcm/send', {
            to: targetToken,
            priority: "high",
            data: {
                title: "Incoming " + callType + " Call",
                body: "Call from " + callerName,
                callerUid: callerUid,
                isCall: "true"
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`
            }
        });

        res.status(200).json({ success: true, messageId: response.data.message_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
