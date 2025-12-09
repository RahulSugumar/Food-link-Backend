const supabase = require('../config/supabaseClient');

// Create a food request
exports.createRequest = async (req, res) => {
    const { receiver_id, food_type_needed, quantity_needed, location } = req.body;

    try {
        const { data, error } = await supabase
            .from('requests')
            .insert([
                {
                    receiver_id,
                    food_type_needed,
                    quantity_needed,
                    location,
                    status: 'active',
                },
            ])
            .select();

        if (error) throw error;

        const request = data[0];

        // --- NOTIFICATION LOGIC START ---
        // 2. Fetch all donors
        const { data: donors } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'donor');

        if (donors) {
            const NOTIFICATION_RADIUS_KM = 10;
            const notifications = [];

            donors.forEach(donor => {
                // Check if donor has a valid location
                if (donor.location && donor.location.lat && donor.location.lng && location && location.lat && location.lng) {
                    const distance = calculateDistance(
                        location.lat, location.lng,
                        donor.location.lat, donor.location.lng
                    );

                    if (distance <= NOTIFICATION_RADIUS_KM) {
                        notifications.push({
                            user_id: donor.id,
                            message: `New food request near you: ${quantity_needed} of ${food_type_needed}`,
                            type: 'match_alert',
                            related_id: request.id
                        });
                    }
                }
            });

            if (notifications.length > 0) {
                const { error: notifError } = await supabase.from('notifications').insert(notifications);
                if (notifError) console.error('Error sending notifications:', notifError);
            }
        }
        // --- NOTIFICATION LOGIC END ---

        res.status(201).json({ message: 'Request created successfully', request: request });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Helper function to calculate Haversine distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Get all active requests
exports.getRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('requests')
            .select('*, profiles:receiver_id(name, phone)')
            .eq('status', 'active');

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
