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

        if (authError) {
            // Handle "User already registered" case
            if (authError.message.includes('already registered') || authError.status === 400) {
                // Try to sign in to verify it's the same user trying to "recover" or "re-register"
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (loginError) {
                    // Valid existing user, but wrong password provided during this "registration" attempt
                    throw new Error('User already exists. Please login.');
                }

                // If login successful, we have the User ID. Check if profile exists.
                if (loginData.user) {
                    const { data: existingProfile, error: existingProfileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', loginData.user.id)
                        .single();

                    if (!existingProfile) {
                        // ORPHANED ACCOUNT DETECTED! Re-create the profile.
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .insert([
                                {
                                    id: loginData.user.id,
                                    email,
                                    role,
                                    name,
                                    phone,
                                    location,
                                },
                            ]);
                        if (profileError) throw profileError;
                        return res.status(200).json({ message: 'Profile recovered and registered successfully', user: loginData.user });
                    } else {
                        // Profile exists, so just a normal "User exists" error
                        throw new Error('User already registered.');
                    }
                }
            }
            throw authError;
        }

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
        // Customize error message if possible
        const msg = error.message === 'User already registered' ? error.message : error.message;
        res.status(400).json({ error: msg });
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
exports.getProfile = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    const { id } = req.params;
    const { name, phone, location } = req.body;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ name, phone, location })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Profile updated successfully', user: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
