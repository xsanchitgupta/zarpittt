import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const oldCategories = [
  { slug: "cleaning", name: "Cleaning", image: "/images/cleaning.png" },
  { slug: "laundry", name: "Laundry", image: "/images/laundry.png" },
  { slug: "pandit", name: "Pandit ji", image: "/images/Pandit Ji.png" },
  { slug: "cooking", name: "Cook", image: "/images/Cooking.png" },
  { slug: "safety-person", name: "Safety Person", image: "/images/Safety Person.png" },
  { slug: "baby-care", name: "Baby Care Helper", image: "/images/Baby care.png" },
  { slug: "pregnancy-care", name: "Pregnancy Care", image: "/images/Pregnancy Care.png" },
  { slug: "old-parents-care", name: "Old Parents Care", image: "/images/Old Parents Care.png" },
  { slug: "pet-walker", name: "Pet Walker", image: "/images/Pet Walker.png" },
  { slug: "doctor", name: "Doctor at home", image: "/images/doctor.png" },
  { slug: "luggage-shifter", name: "Luggage Shifter", image: "/images/luggage-shifter.png" },
  { slug: "mechanic", name: "Bike Mechanic", image: "/images/mechanic.png" },
  { slug: "haircut", name: "Haircut", image: "/images/salon.png" },
];

const servicePricing = {
  'cleaning': { price: 499, duration: '2-3 hrs', description: 'Professional deep cleaning for your home.' },
  'laundry': { price: 299, duration: '24 hrs pickup', description: 'Wash, dry, fold and deliver laundry service.' },
  'pandit': { price: 1100, duration: '1-3 hrs', description: 'Experienced Pandit Ji for all puja and ceremonies.' },
  'cooking': { price: 399, duration: '2-3 hrs', description: 'Professional home cook for daily meals or events.' },
  'safety-person': { price: 799, duration: 'Per day', description: 'Trained safety personnel for your premises.' },
  'baby-care': { price: 599, duration: 'Per day', description: 'Experienced and gentle baby care helpers.' },
  'pregnancy-care': { price: 899, duration: 'Per day', description: 'Compassionate pregnancy care assistants.' },
  'old-parents-care': { price: 699, duration: 'Per day', description: 'Caring companions for elderly parents.' },
  'pet-walker': { price: 199, duration: '1 hr', description: 'Reliable pet walking and care service.' },
  'doctor': { price: 999, duration: '30-60 min', description: 'Qualified doctor consultation at your home.' },
  'luggage-shifter': { price: 1499, duration: '3-6 hrs', description: 'Professional packing and shifting service.' },
  'mechanic': { price: 349, duration: '1-2 hrs', description: 'Expert bike mechanic at your doorstep.' },
  'haircut': { price: 249, duration: '30-45 min', description: 'Professional salon-quality haircut at home.' },
};

async function migrate() {
  console.log("Starting Migration to Cloudinary...");
  let sqlChunks = [];

  for (const cat of oldCategories) {
    try {
      console.log(`Processing: ${cat.name}...`);
      
      const localImagePath = path.join(process.cwd(), 'public', cat.image);
      let cloudinaryUrl = null;

      if (fs.existsSync(localImagePath)) {
        console.log(`  -> Uploading to Cloudinary...`);
        const uploadRes = await cloudinary.uploader.upload(localImagePath, {
          folder: 'zarpit_admin',
        });
        cloudinaryUrl = uploadRes.secure_url;
      } else {
        console.warn(`  -> WARNING: Local image not found: ${localImagePath}`);
        cloudinaryUrl = ''; // Default if not found
      }

      // Prepare Category Insert SQL via UUID generation dynamically inside SQL or rely on auto-gen
      // We will generate the category with a fixed UUID to link services easily
      const catUuid = crypto.randomUUID();
      
      sqlChunks.push(`INSERT INTO categories (id, name, slug, icon) VALUES ('${catUuid}', '${cat.name.replace(/'/g, "''")}', '${cat.slug}', '${cloudinaryUrl}');`);

      // Prepare Service Insert SQL
      const pricing = servicePricing[cat.slug];
      if (pricing) {
        sqlChunks.push(`INSERT INTO services (category_id, name, description, price, duration, image_url) VALUES ('${catUuid}', '${cat.name.replace(/'/g, "''")} Service', '${pricing.description.replace(/'/g, "''")}', ${pricing.price}, '${pricing.duration}', '${cloudinaryUrl}');`);
      }

    } catch (e) {
      console.error(`Error processing ${cat.name}:`, e);
    }
  }

  const outputSql = sqlChunks.join('\n');
  fs.writeFileSync('insert_legacy_data.sql', outputSql);
  console.log("Migration Complete! SQL generated at insert_legacy_data.sql");
}

migrate();
