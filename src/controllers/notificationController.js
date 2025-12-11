const supabase = require('../config/supabaseClient');

// Get notifications for a specific user
exports.getNotifications = async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Mark as read (optional, but good practice)
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
