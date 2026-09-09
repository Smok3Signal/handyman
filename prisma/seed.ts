import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 12);

  // Lagos coordinates (center point for employer)
  // 6.5244° N, 3.3792° E
  const technicians = [
    // PLUMBERS
    {
      name: "Chukwuemeka Obi",
      email: "chukwu.plumber@gmail.com",
      phone: "08031234501",
      latitude: 6.5350, longitude: 3.3900, // ~1.5km away
      profile: {
        businessName: "Obi Plumbing Services",
        serviceCategory: "Plumber",
        yearsOfExperience: 8,
        basePrice: 15000,
        description: "Expert in pipe installation, leak repairs, and bathroom fitting. Available 24/7 for emergencies.",
        averageRating: 4.8,
        totalReviews: 34,
      },
    },
    {
      name: "Taiwo Adeyemi",
      email: "taiwo.plumber@gmail.com",
      phone: "08031234502",
      latitude: 6.8900, longitude: 3.7200, // ~48km away
      profile: {
        businessName: "Adeyemi Pipes & Fittings",
        serviceCategory: "Plumber",
        yearsOfExperience: 5,
        basePrice: 12000,
        description: "Specializing in borehole installation, plumbing repairs and water system maintenance.",
        averageRating: 4.5,
        totalReviews: 21,
      },
    },

    // ELECTRICIANS
    {
      name: "Biodun Fashola",
      email: "biodun.electric@gmail.com",
      phone: "08031234503",
      latitude: 6.5100, longitude: 3.3600, // ~2km away
      profile: {
        businessName: "Fashola Electrical Works",
        serviceCategory: "Electrician",
        yearsOfExperience: 10,
        basePrice: 20000,
        description: "Certified electrician handling wiring, installations, generator repairs and solar panel setup.",
        averageRating: 4.9,
        totalReviews: 56,
      },
    },
    {
      name: "Emeka Nwosu",
      email: "emeka.electric@gmail.com",
      phone: "08031234504",
      latitude: 6.9200, longitude: 3.6800, // ~50km away
      profile: {
        businessName: "Nwosu Power Solutions",
        serviceCategory: "Electrician",
        yearsOfExperience: 7,
        basePrice: 18000,
        description: "Expert in industrial and residential electrical installations, inverter setup and maintenance.",
        averageRating: 4.6,
        totalReviews: 29,
      },
    },

    // PAINTERS
    {
      name: "Seun Afolabi",
      email: "seun.painter@gmail.com",
      phone: "08031234505",
      latitude: 6.5400, longitude: 3.4100, // ~5km away
      profile: {
        businessName: "Afolabi Paint Masters",
        serviceCategory: "Painter",
        yearsOfExperience: 6,
        basePrice: 25000,
        description: "Professional interior and exterior painting, wallpaper installation and texture finishes.",
        averageRating: 4.7,
        totalReviews: 18,
      },
    },
    {
      name: "Kola Balogun",
      email: "kola.painter@gmail.com",
      phone: "08031234506",
      latitude: 6.8500, longitude: 3.5900, // ~40km away
      profile: {
        businessName: "Balogun Decor & Paint",
        serviceCategory: "Painter",
        yearsOfExperience: 4,
        basePrice: 20000,
        description: "Affordable quality painting services for homes, offices and commercial buildings.",
        averageRating: 4.3,
        totalReviews: 12,
      },
    },

    // MECHANICS
    {
      name: "Tunde Ogunleye",
      email: "tunde.mechanic@gmail.com",
      phone: "08031234507",
      latitude: 6.5200, longitude: 3.3500, // ~3km away
      profile: {
        businessName: "Ogunleye Auto Repairs",
        serviceCategory: "Mechanic",
        yearsOfExperience: 12,
        basePrice: 10000,
        description: "All vehicle repairs, diagnostics, engine overhaul and routine maintenance for all car brands.",
        averageRating: 4.8,
        totalReviews: 67,
      },
    },
    {
      name: "Ifeanyi Okeke",
      email: "ifeanyi.mechanic@gmail.com",
      phone: "08031234508",
      latitude: 6.9000, longitude: 3.8000, // ~52km away
      profile: {
        businessName: "Okeke Motors",
        serviceCategory: "Mechanic",
        yearsOfExperience: 9,
        basePrice: 8000,
        description: "Specializing in Toyota, Honda and Hyundai repairs. Fast and reliable service guaranteed.",
        averageRating: 4.5,
        totalReviews: 43,
      },
    },

    // CLEANERS
    {
      name: "Amaka Eze",
      email: "amaka.cleaner@gmail.com",
      phone: "08031234509",
      latitude: 6.5300, longitude: 3.4000, // ~4km away
      profile: {
        businessName: "Amaka Sparkle Cleaning",
        serviceCategory: "Cleaner",
        yearsOfExperience: 3,
        basePrice: 8000,
        description: "Deep cleaning, post-construction cleanup, office cleaning and home sanitation services.",
        averageRating: 4.9,
        totalReviews: 25,
      },
    },
    {
      name: "Blessing Okafor",
      email: "blessing.cleaner@gmail.com",
      phone: "08031234510",
      latitude: 6.8700, longitude: 3.6500, // ~45km away
      profile: {
        businessName: "Blessing Clean Team",
        serviceCategory: "Cleaner",
        yearsOfExperience: 5,
        basePrice: 10000,
        description: "Professional cleaning company with a team of trained staff for residential and commercial spaces.",
        averageRating: 4.6,
        totalReviews: 31,
      },
    },

    // CARPENTERS
    {
      name: "Gbenga Adebayo",
      email: "gbenga.carpenter@gmail.com",
      phone: "08031234511",
      latitude: 6.5150, longitude: 3.3700, // ~2km away
      profile: {
        businessName: "Adebayo Wood Works",
        serviceCategory: "Carpenter",
        yearsOfExperience: 15,
        basePrice: 30000,
        description: "Custom furniture making, door and window installation, kitchen cabinets and wardrobes.",
        averageRating: 4.9,
        totalReviews: 48,
      },
    },
    {
      name: "Chidi Nnadi",
      email: "chidi.carpenter@gmail.com",
      phone: "08031234512",
      latitude: 6.9100, longitude: 3.7500, // ~50km away
      profile: {
        businessName: "Nnadi Furniture & Fittings",
        serviceCategory: "Carpenter",
        yearsOfExperience: 8,
        basePrice: 25000,
        description: "Bespoke furniture design and carpentry works for homes and offices at competitive prices.",
        averageRating: 4.4,
        totalReviews: 19,
      },
    },

    // AC TECHNICIANS
    {
      name: "Rotimi Adeleke",
      email: "rotimi.ac@gmail.com",
      phone: "08031234513",
      latitude: 6.5450, longitude: 3.3850, // ~3km away
      profile: {
        businessName: "Adeleke Cooling Systems",
        serviceCategory: "AC Technician",
        yearsOfExperience: 7,
        basePrice: 15000,
        description: "AC installation, servicing, gas refilling and repairs for all brands including LG, Samsung and Daikin.",
        averageRating: 4.7,
        totalReviews: 38,
      },
    },
    {
      name: "Uche Nwachukwu",
      email: "uche.ac@gmail.com",
      phone: "08031234514",
      latitude: 6.8800, longitude: 3.7000, // ~47km away
      profile: {
        businessName: "Nwachukwu HVAC Services",
        serviceCategory: "AC Technician",
        yearsOfExperience: 10,
        basePrice: 18000,
        description: "Expert HVAC engineer handling commercial and residential AC systems, chillers and ventilation.",
        averageRating: 4.8,
        totalReviews: 52,
      },
    },

    // OTHER
    {
      name: "Funmi Oladipo",
      email: "funmi.other@gmail.com",
      phone: "08031234515",
      latitude: 6.5250, longitude: 3.3650, // ~2km away
      profile: {
        businessName: "Oladipo Home Services",
        serviceCategory: "Other",
        yearsOfExperience: 4,
        basePrice: 10000,
        description: "General handyman services including tiling, grouting, minor repairs and home maintenance.",
        averageRating: 4.5,
        totalReviews: 14,
      },
    },
    {
      name: "Musa Ibrahim",
      email: "musa.other@gmail.com",
      phone: "08031234516",
      latitude: 6.8600, longitude: 3.6200, // ~43km away
      profile: {
        businessName: "Ibrahim General Services",
        serviceCategory: "Other",
        yearsOfExperience: 6,
        basePrice: 12000,
        description: "Versatile handyman for odd jobs, repairs, installations and general maintenance work.",
        averageRating: 4.3,
        totalReviews: 9,
      },
    },
  ];

  for (const tech of technicians) {
    // Check if user already exists to avoid duplicates
    const existing = await prisma.user.findUnique({
      where: { email: tech.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          name: tech.name,
          email: tech.email,
          password,
          phone: tech.phone,
          role: "TECHNICIAN",
          latitude: tech.latitude,
          longitude: tech.longitude,
          technicianProfile: {
            create: tech.profile,
          },
        },
      });
      console.log(`✅ Created technician: ${tech.name}`);
    } else {
      console.log(`⏭️ Skipped (already exists): ${tech.name}`);
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });