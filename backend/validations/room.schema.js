const { z } = require('zod');

exports.createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    type: z.string(),
    pricePerNight: z.number().positive(),
    capacity: z.number().positive().optional(),
    description: z.string().optional(),
    accommodations: z.string().optional(),
    facilities: z.array(z.string()).optional(),
    images: z.array(
      z.string().url().refine(
        (url) => url.startsWith('https://'),
        { message: 'Image URLs must use HTTPS' }
      )
    ).max(10, 'Maximum 10 images allowed').optional(),
    status: z.enum(['available', 'occupied', 'maintenance']).optional(),
    isActive: z.boolean().optional()
  })
});

exports.updateRoomSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    type: z.string().optional(),
    pricePerNight: z.number().positive().optional(),
    capacity: z.number().positive().optional(),
    description: z.string().optional(),
    accommodations: z.string().optional(),
    facilities: z.array(z.string()).optional(),
    images: z.array(
      z.string().url().refine(
        (url) => url.startsWith('https://'),
        { message: 'Image URLs must use HTTPS' }
      )
    ).max(10, 'Maximum 10 images allowed').optional(),
    status: z.enum(['available', 'occupied', 'maintenance']).optional(),
    isActive: z.boolean().optional()
  })
});
