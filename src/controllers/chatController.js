const supabase = require('../config/supabaseClient');

// Send a message
exports.sendMessage = async (req, res) => {
    const { sender_id, receiver_id, donation_id, message } = req.body;

    // Basic validation
    if (!sender_id || !receiver_id || !donation_id || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                sender_id,
                receiver_id,
                donation_id,
                message,
                is_read: false
            }])
            .select() // Returning inserted row
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get messages for a specific donation (Context-aware chat)
exports.getMessages = async (req, res) => {
    const { donationId } = req.params;

    try {
        // Fetch messages related to this specific donation
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(name),
                receiver:receiver_id(name)
            `)
            .eq('donation_id', donationId)
            .order('created_at', { ascending: true }); // Oldest first to show conversation flow

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(400).json({ error: error.message });
    }
};
