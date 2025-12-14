const supabase = require('../config/supabaseClient');

// Create a new donation
exports.createDonation = async (req, res) => {
    const { donor_id, food_type, quantity, expiry_time, location, description } = req.body;

    console.log(" Received Donation Request:", req.body); // DEBUG LOG

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
                    receiver_id: null,
                    volunteer_id: null
                },
            ])
            .select(); // Ensure we get the inserted data back

        if (error) {
            console.error(" Supabase Insert Error:", error); // DEBUG LOG
            throw error;
        }

        const donation = data ? data[0] : null;

        if (!donation) {
            console.error(" Error: Donation inserted but no data returned!");
            throw new Error("Donation creation failed (no data returned).");
        }

        console.log(" Donation Created:", donation.id);

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
                try {
                    // Safe check for location
                    const rLoc = receiver.location;
                    if (rLoc && typeof rLoc === 'object' && rLoc.lat && rLoc.lng && location && location.lat && location.lng) {
                        const distance = calculateDistance(
                            location.lat, location.lng,
                            rLoc.lat, rLoc.lng
                        );

                        console.log(`[Notification Debug] Receiver: ${receiver.name} | Dist: ${distance.toFixed(2)}km`);

                        if (distance <= NOTIFICATION_RADIUS_KM) {
                            notifications.push({
                                user_id: receiver.id,
                                message: `New donation available near you: ${quantity} of ${food_type}`,
                                type: 'match_alert',
                                related_id: donation.id
                            });
                        }
                    }
                } catch (loopErr) {
                    console.error(" Error in notification loop processing:", loopErr);
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
        console.error(" FINAL ERROR in createDonation:", error); // CRITICAL LOG
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

// Get donations by specific donor
exports.getDonationsByDonor = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .eq('donor_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get recent donations (Community Feed)
exports.getRecentDonations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles:donor_id(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
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

// Delete donation (and return details for final view)
exports.deleteDonation = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('donations')
            .delete()
            .eq('id', id)
            .select('*, profiles:donor_id(name, phone)') // Return info one last time
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Donation claimed and removed', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Claim a donation (Soft update)
exports.claimDonation = async (req, res) => {
    const { id } = req.params;
    const { receiver_id, delivery_needed } = req.body; // Accept delivery_needed flag

    try {
        // 1. Verify donation is available
        const { data: donation, error: fetchError } = await supabase
            .from('donations')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        if (donation.status !== 'available') {
            return res.status(400).json({ error: 'Donation is already claimed or not available' });
        }

        // 2. Update status and set receiver_id
        const { data, error } = await supabase
            .from('donations')
            .update({
                status: 'claimed',
                receiver_id: receiver_id,
                delivery_needed: delivery_needed || false // Save preference
            })
            .eq('id', id)
            .select('*, profiles:donor_id(name, phone)')
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Donation successfully claimed', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get claims by specific receiver
exports.getClaimsByReceiver = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles:donor_id(name, phone)')
            .eq('receiver_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
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

// Volunteer: Accept a task
exports.acceptTask = async (req, res) => {
    const { id } = req.params;
    const { volunteer_id } = req.body;

    try {
        const { data, error } = await supabase
            .from('donations')
            .update({
                status: 'in_transit',
                volunteer_id: volunteer_id
            })
            .eq('id', id)
            .eq('status', 'claimed') // Can only accept if currently 'claimed' (waiting)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ message: 'Task accepted', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Volunteer: Mark as Delivered
exports.completeDelivery = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('donations')
            .update({ status: 'delivered' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ message: 'Delivery completed', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Volunteer: Get available tasks (claimed + need delivery) AND my active tasks (in_transit)
exports.getVolunteerTasks = async (req, res) => {
    const { volunteerId } = req.params;

    try {
        // Logic: 
        // 1. Status is 'claimed' AND delivery_needed is TRUE (pool of tasks)
        // 2. OR Status is 'in_transit' AND volunteer_id is ME (my active tasks)
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles:donor_id(name, phone, location)')
            .or(`and(status.eq.claimed,delivery_needed.eq.true),and(status.eq.in_transit,volunteer_id.eq.${volunteerId})`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
