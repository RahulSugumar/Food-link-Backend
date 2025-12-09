const supabase = require('../config/supabaseClient');

// Get all fridges
exports.getFridges = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('fridges')
            .select('*');

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get fridge details
exports.getFridgeById = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('fridges')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// Report an issue with a fridge
exports.reportIssue = async (req, res) => {
    const { id } = req.params;
    const { issue_type, description, reported_by } = req.body;

    try {
        const { data, error } = await supabase
            .from('fridge_reports')
            .insert([
                {
                    fridge_id: id,
                    issue_type, // 'full', 'dirty', 'broken'
                    description,
                    reported_by,
                    status: 'pending',
                },
            ]);

        if (error) throw error;

        res.status(201).json({ message: 'Issue reported successfully', report: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Add a new fridge (Admin/Volunteer)
exports.addFridge = async (req, res) => {
    const { name, location, capacity } = req.body;

    try {
        const { data, error } = await supabase
            .from('fridges')
            .insert([
                {
                    name,
                    location,
                    capacity,
                    status: 'active',
                },
            ]);

        if (error) throw error;

        res.status(201).json({ message: 'Fridge added successfully', fridge: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
