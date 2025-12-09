const supabase = require('../config/supabaseClient');

// Create a new donation
exports.createDonation = async (req, res) => {
    const { donor_id, food_type, quantity, expiry_time, location, description } = req.body;

    try {
        // 1. Insert Donation
        const { data, error } = await supabase
            .from('donations')
            .insert([
                {
                    donor_id,
                    food_type,
                    quantity,
                    expiry_time,
                    location, // JSON: { lat, lng, address }
                    description,
                    status: 'available', // available, reserved, completed
                },
            ])
            .select(); // Ensure we get the inserted data back

        if (error) throw error;

        const donation = data[0];

        // --- NOTIFICATION LOGIC START ---
        // 2. Fetch all receivers
        console.log('Fetching receivers for notification...');
        const { data: receivers } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'receiver');

        console.log('Receivers found:', receivers ? receivers.length : 0);

        if (receivers) {
            const NOTIFICATION_RADIUS_KM = 10;
            const notifications = [];

            receivers.forEach(receiver => {
                // Check if receiver has a valid location
                if (receiver.location && receiver.location.lat && receiver.location.lng && location && location.lat && location.lng) {
                    const distance = calculateDistance(
                        location.lat, location.lng,
                        receiver.location.lat, receiver.location.lng
                    );

                    console.log(`Checking receiver ${receiver.id}: Distance = ${distance}km`);

                    if (distance <= NOTIFICATION_RADIUS_KM) {
                        notifications.push({
                            user_id: receiver.id,
                            message: `New donation available near you: ${quantity} of ${food_type}`,
                            type: 'match_alert',
                            related_id: donation.id
                        });
                    }
                } else {
                    console.log(`Skipping receiver ${receiver.id}: Invalid location data`, receiver.location);
                }
            });

            console.log('Notifications to send:', notifications.length);

            if (notifications.length > 0) {
                const { error: notifError } = await supabase.from('notifications').insert(notifications);
                if (notifError) console.error('Error sending notifications:', notifError);
                else console.log('Notifications sent successfully!');
            }
        }
        // --- NOTIFICATION LOGIC END ---

        res.status(201).json({ message: 'Donation created successfully', donation: donation });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all available donations
exports.getDonations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles:donor_id(name, phone)') // Join with profiles to get donor info
            .eq('status', 'available');

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get specific donation details
exports.getDonationById = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles:donor_id(name, phone)')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// Update donation status (e.g., when reserved or completed)
exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const { data, error } = await supabase
            .from('donations')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.status(200).json({ message: 'Donation status updated', data });
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
