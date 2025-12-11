const supabase = require('../config/supabaseClient');

// Register a new user
exports.register = async (req, res) => {
    const { email, password, role, name, phone, location } = req.body;

    try {
        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        // 2. Create user profile in 'profiles' table
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        email,
                        role, // 'donor', 'receiver', 'volunteer'
                        name,
                        phone,
                        location, // JSON object { lat, lng, address }
                    },
                ]);

            if (profileError) throw profileError;
        }

        res.status(201).json({ message: 'User registered successfully', user: authData.user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Verify role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            // If profile not found, something is wrong, but we can't verify role logic
            throw new Error('User profile not found.');
        }

        if (profile.role !== role) {
            // Log out immediately if role mismatch
            await supabase.auth.signOut();
            return res.status(403).json({ error: `Access denied. Registered as ${profile.role}, cannot login as ${role}.` });
        }

        res.status(200).json({ message: 'Login successful', session: data.session, user: { ...data.user, role: profile.role } });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

// Get current user profile
exports.getMe = async (req, res) => {
    const { userId } = req.params; // Assuming middleware extracts this

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        res.status(200).json({ user: data });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};
