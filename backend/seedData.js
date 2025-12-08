const mongoose = require("mongoose");
const Service = require("./models/Service");

const INITIAL_SERVICES = [
  { 
    name: "Signature Haircut", 
    price: 50, 
    duration: 60, 
    rating: 4.8, 
    image: "fa-scissors", 
    category: "Hair", 
    description: "Precision cut with styling and wash." 
  },
  { 
    name: "Deep Tissue Massage", 
    price: 90, 
    duration: 90, 
    rating: 4.9, 
    image: "fa-spa", 
    category: "Wellness", 
    description: "Relieves muscle tension and stress." 
  },
  { 
    name: "Facial Rejuvenation", 
    price: 75, 
    duration: 60, 
    rating: 4.7, 
    image: "fa-spray-can-sparkles", 
    category: "Skincare", 
    description: "Cleansing and moisturizing treatment." 
  },
  { 
    name: "Dental Consultation", 
    price: 40, 
    duration: 30, 
    rating: 4.9, 
    image: "fa-tooth", 
    category: "Medical", 
    description: "General checkup and cleaning advice." 
  },
  { 
    name: "Bridal Makeup", 
    price: 150, 
    duration: 120, 
    rating: 5.0, 
    image: "fa-wand-magic-sparkles", 
    category: "Beauty", 
    description: "Full makeup service for your special day." 
  },
  { 
    name: "Nutrition Plan", 
    price: 60, 
    duration: 45, 
    rating: 4.6, 
    image: "fa-apple-whole", 
    category: "Wellness", 
    description: "Personalized diet and health plan." 
  }
];

async function seedData() {
  try {
    await mongoose.connect("mongodb://localhost:27017/salonbooking");
    console.log("Connected to MongoDB");

    // Clear existing services
    await Service.deleteMany({});
    console.log("Cleared existing services");

    // Insert initial services
    await Service.insertMany(INITIAL_SERVICES);
    console.log("Seeded initial services successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();


