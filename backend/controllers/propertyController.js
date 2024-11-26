const verifyToken = require('../middlewares/verifyToken');
const Property = require('../models/Property');
const User = require('../models/User');
const propertyController = require('express').Router();

// Get all properties
propertyController.get('/getAll', async (req, res) => {
    try {
        const properties = await Property.find({}).populate("currentOwner", '-password');
        return res.status(200).json(properties);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Get featured properties
propertyController.get('/find/featured', async (req, res) => {
    try {
        const featuredProperties = await Property.find({ featured: true }).populate("currentOwner", '-password');
        return res.status(200).json(featuredProperties);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Get all properties by type
propertyController.get('/find', async (req, res) => {
    const type = req.query;
    try {
        const properties = type ? 
            await Property.find({ type }).populate("currentOwner", '-password') :
            await Property.find({});
        return res.status(200).json(properties);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Fetch types of properties
propertyController.get('/find/types', async (req, res) => {
    try {
        const beachType = await Property.countDocuments({ type: 'beach' });
        const mountainType = await Property.countDocuments({ type: 'mountain' });
        const villageType = await Property.countDocuments({ type: 'village' });
        return res.status(200).json({ beach: beachType, mountain: mountainType, village: villageType });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Fetch my properties
propertyController.get('/find/my-properties', verifyToken, async (req, res) => {
    try {
        const properties = await Property.find({ currentOwner: req.user.id });
        return res.status(200).json(properties);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Fetch bookmarked properties
propertyController.get('/find/bookmarked-properties', verifyToken, async (req, res) => {
    try {
        const properties = await Property.find({ bookmarkedUsers: { $in: [req.user.id] } });
        return res.status(200).json(properties);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Fetch individual property by ID
propertyController.get('/find/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('currentOwner', '-password');
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        return res.status(200).json(property);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Create new property
propertyController.post('/', verifyToken, async (req, res) => {
    try {
        const newProperty = await Property.create({ ...req.body, currentOwner: req.user.id });
        return res.status(201).json(newProperty);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Update property
propertyController.put('/:id', verifyToken, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property.currentOwner.toString() !== req.user.id) {
            return res.status(403).json({ error: "You are not allowed to update other people's properties" });
        }
        const updatedProperty = await Property.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        return res.status(200).json(updatedProperty);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Bookmark/unbookmark property
propertyController.put('/bookmark/:id', verifyToken, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.currentOwner.toString() === req.user.id) {
            return res.status(403).json({ error: "You are not allowed to bookmark your own property" });
        }

        // Toggle bookmark status
        const index = property.bookmarkedUsers.indexOf(req.user.id);
        if (index !== -1) {
            property.bookmarkedUsers.splice(index, 1); // Unbookmark
        } else {
            property.bookmarkedUsers.push(req.user.id); // Bookmark
        }

        await property.save();
        return res.status(200).json(property);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Delete property
propertyController.delete('/:id', verifyToken, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property.currentOwner.toString() !== req.user.id) {
            return res.status(403).json({ error: "You are not allowed to delete other people's properties" });
        }
        await property.delete();
        return res.status(200).json({ msg: "Successfully deleted property" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = propertyController;
