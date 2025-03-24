const express = require('express');
const router = express.Router();
const { z } = require('zod');
const authMiddleware = require('../middleware/auth');
const prisma = require('../prisma/client');

// Define Zod schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Validation middleware using safeParse
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.format(),
    });
  }
  
  // Add the validated data to the request
  req.validatedData = result.data;
  next();
};

// Check if user is a donor
const isDonor = (req, res, next) => {
  if (req.user.role !== 'DONOR') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Donor role required',
    });
  }
  next();
};

// Protect all donor routes
router.use(authMiddleware);
router.use(isDonor);

// Get donor profile
router.get('/profile', async (req, res) => {
  try {
    const donor = await prisma.donor.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor profile not found',
      });
    }

    // Remove password from response
    const { password, ...userData } = donor.user;
    
    res.status(200).json({
      success: true,
      message: 'Donor profile retrieved successfully',
      data: {
        ...donor,
        user: userData,
      },
    });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donor profile',
    });
  }
});

// Update donor profile
router.put('/profile', validate(updateProfileSchema), async (req, res) => {
  try {
    const { name, phone, address } = req.validatedData;
    
    // Update user if name is provided
    if (name) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
      });
    }
    
    // Update donor profile
    const updatedDonor = await prisma.donor.update({
      where: { userId: req.user.id },
      data: {
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
      },
      include: { user: true },
    });
    
    // Remove password from response
    const { password, ...userData } = updatedDonor.user;
    
    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      data: {
        ...updatedDonor,
        user: userData,
      },
    });
  } catch (error) {
    console.error('Update donor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating donor profile',
    });
  }
});


module.exports = router; 