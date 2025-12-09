const supabase = require('../config/supabaseClient');

// Get available tasks for volunteers
exports.getTasks = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('volunteer_tasks')
            .select('*')
            .eq('status', 'pending');

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Accept a task
exports.acceptTask = async (req, res) => {
    const { id } = req.params;
    const { volunteer_id } = req.body;

    try {
        const { data, error } = await supabase
            .from('volunteer_tasks')
            .update({
                volunteer_id,
                status: 'in_progress',
            })
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: 'Task accepted', task: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Complete a task
exports.completeTask = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('volunteer_tasks')
            .update({
                status: 'completed',
                completed_at: new Date(),
            })
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: 'Task completed', task: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
