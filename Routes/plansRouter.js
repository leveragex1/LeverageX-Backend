const express = require('express');
const router = express.Router();
const User = require('../Models/userModel');

// POST: Select and Pay for a Plan
router.post('/purchase', async (req, res) => {
    try {
        const { userId, plan } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if user has already purchased the Rapid plan
        if (plan === 'Rapid' && user.hasBoughtRapidPlan) {
            return res.status(400).json({ msg: 'You have already purchased the Rapid plan and cannot buy it again!' });
        }

        // Process the plan purchase and store the current plan
        if (plan === 'Rapid') {
            user.hasBoughtRapidPlan = true;  // Prevent further Rapid plan purchases
            user.plan = 'Rapid';  // Store the current plan
        } else if (plan === 'Evolution' || plan === 'Prime') {
            user.plan = plan;  // Store the current plan for Evolution or Prime
        }

        await user.save();

        res.status(200).json({ msg: 'Plan purchased successfully', hasBoughtRapidPlan: user.hasBoughtRapidPlan, plan: user.plan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET: Check if the user has already purchased a plan
router.get('/user-plan/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json({ hasBoughtRapidPlan: user.hasBoughtRapidPlan, plan: user.plan });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
