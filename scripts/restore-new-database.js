// Script to restore all Pink Farm products, store settings, and administrator account into a new MongoDB cluster.
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

function getImageDataUri(relPath, mimeType = "image/jpeg") {
  const fullPath = path.join(__dirname, "..", "public", relPath);
  if (fs.existsSync(fullPath)) {
    const buf = fs.readFileSync(fullPath);
    return `data:${mimeType};base64,${buf.toString("base64")}`;
  }
  return `/images/${relPath}`;
}

async function restoreDatabase() {
  console.log("Checking MongoDB connection...");
  try {
    await prisma.$connect();
    console.log("Connected to MongoDB successfully!");
  } catch (err) {
    console.error("Failed to connect to MongoDB. Please check DATABASE_URL in your .env file.\nError:", err.message);
    process.exit(1);
  }

  // 1. Prepare Images
  console.log("Encoding product images from public/images/products/...");
  const rawImage = getImageDataUri("images/products/premium-raw-phool-makhana.jpg");
  const rawAdditional0 = getImageDataUri("images/products/premium-raw-additional-0.jpg");
  const periPeriImage = getImageDataUri("images/products/peri-peri-makhana.jpg");
  const punjabiTadkaImage = getImageDataUri("images/products/punjabi-tadka-makhana.jpg");
  const pudinaImage = getImageDataUri("images/products/pudina-makhana.jpg");
  const caramelGudImage = getImageDataUri("images/products/caramel-gud-makhana.jpg");
  const himalayanSaltImage = getImageDataUri("images/products/himalayan-pink-salted-makhana.jpg");

  // 2. Products Data
  const productsToRestore = [
    {
      id: "6ace66660e17322c6617b388",
      name: "Peri Peri Makhana",
      slug: "peri-peri-makhana",
      shortDescription: "A spicy kick in every crunchy bite.",
      description: "Carefully selected makhana, perfectly coated with a bold peri peri seasoning. Every crunchy bite brings a spicy twist to your everyday snacking!",
      imageUrl: periPeriImage,
      additionalImages: "[]",
      basePrice: 18900,
      originalPrice: 21000,
      sku: "PF-MAK-02",
      category: "Makhana",
      stockQuantity: 120,
      lowStockThreshold: 10,
      isAvailable: true,
      isFeatured: true,
      tags: "[]",
      highlights: "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.8 g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!",
      variants: [
        {
          id: "6ace66660e17322c6617b389",
          name: "70 gms",
          packSize: "70 gms",
          price: 18900,
          originalPrice: 21000,
          stockQuantity: 120,
          isAvailable: true,
        },
      ],
    },
    {
      id: "6ace66670e17322c6617b38b",
      name: "Punjabi Tadka Makhana",
      slug: "punjabi-tadka-makhana",
      shortDescription: "Desi tadka, bold flavour, perfect crunch.",
      description: "Premium handpicked makhana tossed in a flavourful Punjabi tadka seasoning. Enjoy the perfect desi twist in every crunchy bite!",
      imageUrl: punjabiTadkaImage,
      additionalImages: "[]",
      basePrice: 18900,
      originalPrice: 21000,
      sku: "PF-MAK-03",
      category: "Makhana",
      stockQuantity: 120,
      lowStockThreshold: 10,
      isAvailable: true,
      isFeatured: true,
      tags: "[]",
      highlights: "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.19g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!",
      variants: [
        {
          id: "adb26549-0d45-4868-baaf-a15e7efbd1df",
          name: "70 gms",
          packSize: "70 gms",
          price: 18900,
          originalPrice: 21000,
          stockQuantity: 120,
          isAvailable: true,
        },
      ],
    },
    {
      id: "6ace66670e17322c6617b38e",
      name: "Pudina Makhana",
      slug: "pudina-makhana",
      shortDescription: "Refreshing mint with a chatpata twist.",
      description: "Carefully selected makhana blended with refreshing minty pudina seasoning. A flavourful, chatpata companion for your everyday snack cravings!",
      imageUrl: pudinaImage,
      additionalImages: "[]",
      basePrice: 18900,
      originalPrice: 21000,
      sku: "PF-MAK-04",
      category: "Makhana",
      stockQuantity: 120,
      lowStockThreshold: 10,
      isAvailable: true,
      isFeatured: true,
      tags: "[]",
      highlights: "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.2 g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!",
      variants: [
        {
          id: "b877b820-9f21-49c2-8c4a-03b26482d25b",
          name: "70 gms",
          packSize: "70 gms",
          price: 18900,
          originalPrice: 21000,
          stockQuantity: 120,
          isAvailable: true,
        },
      ],
    },
    {
      id: "6ace66670e17322c6617b391",
      name: "Caramel Gud Makhana",
      slug: "caramel-gud-makhana",
      shortDescription: "Makhana meets the goodness of gud.",
      description: "Premium makhana coated with a delightful caramel-gud flavour for a sweet, crunchy treat. Perfect for satisfying your sweet cravings, one bite at a time!",
      imageUrl: caramelGudImage,
      additionalImages: "[]",
      basePrice: 20700,
      originalPrice: 23000,
      sku: "PF-MAK-05",
      category: "Makhana",
      stockQuantity: 100,
      lowStockThreshold: 10,
      isAvailable: true,
      isFeatured: true,
      tags: "[]",
      highlights: "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 6.2 gm protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!",
      variants: [
        {
          id: "4cd1eb9f-31a7-4a15-b400-d5b88ccbd868",
          name: "70 gms",
          packSize: "70 gms",
          price: 20700,
          originalPrice: 23000,
          stockQuantity: 100,
          isAvailable: true,
        },
      ],
    },
    {
      id: "6ace66680e17322c6617b394",
      name: "Himalayan Pink Salted Makhana",
      slug: "himalayan-pink-salted-makhana",
      shortDescription: "Simply salted, perfectly crunchy.",
      description: "Carefully selected makhana seasoned with a simple, savoury Himalayan salt flavour. Light, crunchy and perfect for everyday munching!",
      imageUrl: himalayanSaltImage,
      additionalImages: "[]",
      basePrice: 18000,
      originalPrice: 20000,
      sku: "PF-MAK-06",
      category: "Makhana",
      stockQuantity: 130,
      lowStockThreshold: 10,
      isAvailable: true,
      isFeatured: true,
      tags: "[]",
      highlights: "0% Palm Oil — Crafted with clean ingredients, zero trans fats\nRoasted Not Fried — Handcrafted slow-roasting for guilt-free crunch\nPlant Protein — 7.4 g protein per 100 gm\nNo Artificial Colours, Just Authentic Seasonings!",
      variants: [
        {
          id: "ae43c275-8693-47fd-81cf-568ba65e4fd6",
          name: "70 gms",
          packSize: "70 gms",
          price: 18000,
          originalPrice: 20000,
          stockQuantity: 130,
          isAvailable: true,
        },
      ],
    },
    {
      id: "6ad62b968609b9f88c080426",
      name: "Premium Raw Phool Makhana",
      slug: "premium-raw-phool-makhana",
      shortDescription: "Handpicked, light & wholesome",
      description: "Made from carefully selected makhana, kept simple and unflavoured for pure versatility. Roast it, season it, or enjoy creating your own snack!",
      imageUrl: rawImage,
      additionalImages: JSON.stringify([rawAdditional0]),
      basePrice: 37425,
      originalPrice: 49900,
      sku: "PF-MAK-01",
      category: "Makhana",
      stockQuantity: 150,
      lowStockThreshold: 10,
      isAvailable: true,
      isFeatured: true,
      tags: "[]",
      highlights: "0% Palm Oil — Pure, raw, unroasted fox nuts\nHigh Plant Protein — 9.7 g protein per 100 gm\n100% Natural & Gluten-Free\nIdeal for home roasting, seasoning, and traditional curries",
      variants: [
        {
          id: "bd351ab6-2af0-4a21-ada8-3cd5a15ccc3d",
          name: "200 gms",
          packSize: "200 gms",
          price: 37425,
          originalPrice: 49900,
          stockQuantity: 150,
          isAvailable: true,
        },
      ],
    },
  ];

  console.log("Restoring products...");
  for (const item of productsToRestore) {
    const { id: preferredId, variants, ...prodData } = item;
    const existing = await prisma.product.findUnique({ where: { slug: prodData.slug } });
    let currentId = existing?.id;

    if (!existing) {
      const created = await prisma.product.create({ data: { id: preferredId, ...prodData } });
      currentId = created.id;
      console.log(` Created product: ${prodData.name}`);
    } else {
      await prisma.product.update({ where: { slug: prodData.slug }, data: prodData });
      console.log(` Updated product: ${prodData.name}`);
    }

    if (variants && currentId) {
      for (const variant of variants) {
        const { id: _vid, ...variantData } = variant;
        const existingVariant = await prisma.productVariant.findFirst({
          where: { productId: currentId, packSize: variant.packSize },
        });
        if (!existingVariant) {
          await prisma.productVariant.create({
            data: {
              ...variantData,
              productId: currentId,
            },
          });
        } else {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              price: variant.price,
              originalPrice: variant.originalPrice,
              stockQuantity: variant.stockQuantity,
              isAvailable: variant.isAvailable,
            },
          });
        }
      }
    }
  }

  // 3. Store Settings
  console.log("Restoring Store Settings...");
  const settingsData = {
    id: "default",
    storeName: "Pink Farm",
    announcementText: "Welcome to Pink Farm — Goodness in Every Bite.",
    bottomAnnouncementText: "Welcome to Pink Farm — Goodness in Every Bite.",
    bottomAnnouncementEnabled: false,
    heroMainImage: "/images/hero_makhana_bowl.jpg",
    heroVideoOpacity: 16,
    heartProductId: "6ace66660e17322c6617b388",
    heartProductTitle: "Peri Peri Makhana",
    heartProductTagline: "Why not? You deserve the best.",
    heartProductButtonText: "Shop Now",
    heartProductButtonUrl: "/products/peri-peri-makhana",
    heartProductSubtitle: "Our Heart Product",
    featuredProductId: "6ace66660e17322c6617b388",
    featuredProductHeading: "Meet Your New Favourite Snack.",
    featuredProductDescription: "A spicy kick in every crunchy bite.",
    featuredProductButtonText: "View Details & Add to Cart",
    founderName: "Dt Anjali",
    founderRole: "Founder & Dietitian",
    founderStoryFirst:
      "Anjali started her journey as a trained dietitian — someone who spent years understanding the deep connection between what we eat and how we feel. She knew that truly good food doesn't need artificial anything. It just needs care, intention, and the right source.",
    founderStorySecond:
      "That belief became the seed of Pink Farm. What began as a personal mission to bring honest, nutritious snacks to her own family soon turned into something much bigger — a food brand built on trust, quality, and a quiet promise to never cut corners.",
    founderQuote: "Pure in nature, good for you. Simple food, stronger you.",
    founderTags: ["Nutrition", "Food Science", "Innovation", "Entrepreneur", "Founder", "Curator"],
    supportPhone: "+91 8437504040",
    supportEmail: "wecare@pinkfarm.in",
    businessAddress: "Dugri, Ludhiana, Punjab - 141003",
    fssaiNumber: "22126026000144",
    deliveryFee: 6000,
    freeDeliveryThreshold: 99900,
    isAcceptingOrders: true,
    comboEnabled: true,
    comboEyebrow: "Make Your Own Combo",
    comboTitlePrefix: "Curate Your",
    comboTitleHighlight: "Pink Farm Combo",
    comboSubtitle:
      "Mix & match your favourite flavoured makhanas. Add multiple packs of any flavour — combo discounts apply directly on the original MRP!",
    comboTier1Count: 3,
    comboTier1Discount: 11,
    comboTier1Label: "Trio Combo",
    comboTier1Tagline: "Pick any 3 — save 11% on MRP",
    comboTier1Badge: "✦ 11% OFF",
    comboTier1Emoji: "🌿",
    comboTier2Count: 5,
    comboTier2Discount: 15,
    comboTier2Label: "Penta Combo",
    comboTier2Tagline: "Pick any 5 — save 15% on MRP",
    comboTier2Badge: "✦ 15% OFF",
    comboTier2Emoji: "🌸",
    comboButtonText: "Shop My Combo",
    comboFooterNote: "✦ Combo discount applies to total MRP ✦ Multiples allowed ✦",
    comboProductIds: [
      "6ace66660e17322c6617b388",
      "6ace66670e17322c6617b38b",
      "6ace66670e17322c6617b38e",
      "6ace66670e17322c6617b391",
      "6ace66680e17322c6617b394",
      "6ad62b968609b9f88c080426",
    ],
    storeCategories: ["Makhana"],
  };

  const existingSettings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  if (!existingSettings) {
    await prisma.storeSettings.create({ data: settingsData });
    console.log(" Created StoreSettings record.");
  } else {
    await prisma.storeSettings.update({ where: { id: "default" }, data: settingsData });
    console.log(" Updated StoreSettings record.");
  }

  // 4. Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "manijit070@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "PinkFarmAdmin2026!";
  console.log(`Setting up Admin User (${adminEmail})...`);
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        name: "Pink Farm Admin",
      },
    });
    console.log(` Created AdminUser: ${adminEmail}`);
  } else {
    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: { password: passwordHash },
    });
    console.log(` Updated AdminUser password: ${adminEmail}`);
  }

  console.log("\n All products, variants, images, settings, and admin user successfully restored to MongoDB!");
}

restoreDatabase()
  .catch((e) => {
    console.error("Restoration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
