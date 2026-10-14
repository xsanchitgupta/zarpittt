const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for bulk updates
);

const ASSETS_DIR = path.join(__dirname, 'zarpitServiceAssets');

const mapping = [
  { file: 'Sweeping & Mopping.png', name: 'Sweeping % Mopping' },
  { file: 'Dusting & Wiping.png', name: 'Dusting % Wiping' },
  { file: 'Bathroom Cleaning.png', name: 'Bathroom Cleaning' },
  { file: 'Kitchen Cleaning.png', name: 'Kitchen Cleaning' },
  { file: 'Utensils Cleaning.png', name: 'Utensils Cleaning' },
  { file: 'Balcony Cleaning.png', name: 'Balcony Cleaning' },
  { file: 'Door Cleaning.png', name: 'Door Cleaning' },
  { file: 'Window Cleaning.png', name: 'Window Cleaning' },
  { file: 'Appliances Cleaning.png', name: 'Appliances Cleaning' },
  { file: 'Staircase Cleaning.png', name: 'Staircase Cleaning' },
  { file: 'Terrace Cleaning.png', name: 'Terrace Cleaning' },
  { file: 'Wardrobe Cleaning & Arrangement.png', name: 'Wardrobe % arrangement' },
  { file: 'Baby Care Website (7).png', name: 'Baby Care %' },
  { file: 'Bike Mechanic (11).png', name: 'Bike Mechanic' },
  { file: 'Cooking Website (9).png', name: 'Cook' },
  { file: 'Doctor at Home Website (8).png', name: 'Doctor at home' },
  { file: 'Hair Cut (13).png', name: 'Haircut' },
  { file: 'Laundry Service Website (2).png', name: 'Laundry' },
  { file: 'Mover-Packers (12).png', name: 'Luggage Shifter' },
  { file: 'Old Parents Website (6).png', name: 'Old Parents Care' },
  { file: 'Pandit Ji Website (3).png', name: 'Pandit' },
  { file: 'Pet Walker Website (5).png', name: 'Pet Walker' },
  { file: 'Prengnancy Care Website (4).png', name: 'Pregnancy Care' },
  { file: 'Safety Person (10).png', name: 'Safety Person' }
];

async function run() {
  console.log('Starting bulk upload...');

  for (const item of mapping) {
    const filePath = path.join(ASSETS_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${item.file}`);
      continue;
    }

    try {
      console.log(`Uploading ${item.file} for service "${item.name}"...`);
      
      const uploadRes = await cloudinary.uploader.upload(filePath, {
        folder: 'zarpit_services',
        use_filename: true,
        unique_filename: false
      });

      console.log(`Uploaded! URL: ${uploadRes.secure_url}`);

      const { error } = await supabase
        .from('services')
        .update({ image_url: uploadRes.secure_url })
        .ilike('name', `%${item.name}%`);

      if (error) {
        console.error(`DB Update failed for ${item.name}:`, error.message);
      } else {
        console.log(`Successfully updated ${item.name} in database.`);
      }
    } catch (err) {
      console.error(`Failed to process ${item.file}:`, err.message);
    }
  }

  console.log('Bulk upload complete!');
}

run();
