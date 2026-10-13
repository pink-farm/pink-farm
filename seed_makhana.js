const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newMakhanaProducts = [
  {
    name: "Premium Phool Makhana",
    slug: "premium-phool-makhana",
    shortDescription: "Handpicked, light & wholesome",
    description: "Discover pure, wholesome snacking. Our Premium Phool Makhana is handpicked from the finest lotus harvest, gently air-roasted, and minimally processed to preserve maximum protein, calcium, and natural antioxidants.",
    imageUrl: "/images/makhana_sig.jpg",
    basePrice: 19900, // ₹199
    originalPrice: 24900, // ₹249
    sku: "PF-MAK-01",
    category: "Makhana",
    stockQuantity: 150,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    variants: [
      { name: "250g", packSize: "250g", price: 19900, stockQuantity: 80 },
      { name: "500g", packSize: "500g", price: 34900, stockQuantity: 70 },
    ]
  },
  {
    name: "Peri Peri Makhana",
    slug: "peri-peri-makhana",
    shortDescription: "A spicy kick in every crunchy bite.",
    description: "A spicy kick in every crunchy bite. Slow-roasted jumbo makhana tossed in a fiery, zesty Peri Peri seasoning blend for snack lovers who crave bold heat and crisp satisfaction.",
    imageUrl: "/images/makhana_sig.jpg",
    basePrice: 21900, // ₹219
    originalPrice: 25900,
    sku: "PF-MAK-02",
    category: "Makhana",
    stockQuantity: 120,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    variants: [
      { name: "100g", packSize: "100g", price: 11900, stockQuantity: 60 },
      { name: "250g", packSize: "250g", price: 21900, stockQuantity: 60 },
    ]
  },
  {
    name: "Punjabi Tadka Makhana",
    slug: "punjabi-tadka-makhana",
    shortDescription: "Desi tadka, bold flavour, perfect crunch.",
    description: "Desi tadka, bold flavour, perfect crunch. Infused with aromatic roasted cumin, dried mango amchur, and authentic Punjabi spice tadka for a truly lip-smacking snack.",
    imageUrl: "/images/makhana_sig.jpg",
    basePrice: 21900, // ₹219
    originalPrice: 25900,
    sku: "PF-MAK-03",
    category: "Makhana",
    stockQuantity: 120,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    variants: [
      { name: "100g", packSize: "100g", price: 11900, stockQuantity: 60 },
      { name: "250g", packSize: "250g", price: 21900, stockQuantity: 60 },
    ]
  },
  {
    name: "Pudina Makhana",
    slug: "pudina-makhana",
    shortDescription: "Refreshing mint with a chatpata twist.",
    description: "Refreshing mint with a chatpata twist. Crisp roasted makhana seasoned with garden-fresh dried mint leaves and tangy rock salt for a cool, savory teatime crunch.",
    imageUrl: "/images/makhana_sig.jpg",
    basePrice: 21900, // ₹219
    originalPrice: 25900,
    sku: "PF-MAK-04",
    category: "Makhana",
    stockQuantity: 120,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    variants: [
      { name: "100g", packSize: "100g", price: 11900, stockQuantity: 60 },
      { name: "250g", packSize: "250g", price: 21900, stockQuantity: 60 },
    ]
  },
  {
    name: "Caramel Gud Makhana",
    slug: "caramel-gud-makhana",
    shortDescription: "Makhana meets the goodness of gud.",
    description: "Makhana meets the goodness of gud. Naturally sweetened with unrefined traditional jaggery and a hint of sesame, offering rich caramel crunch without refined sugar or artificial additives.",
    imageUrl: "/images/makhana_sig.jpg",
    basePrice: 24900, // ₹249
    originalPrice: 29900,
    sku: "PF-MAK-05",
    category: "Makhana",
    stockQuantity: 100,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    variants: [
      { name: "100g", packSize: "100g", price: 13900, stockQuantity: 50 },
      { name: "250g", packSize: "250g", price: 24900, stockQuantity: 50 },
    ]
  },
  {
    name: "Himalayan Pink Salted Makhana",
    slug: "himalayan-pink-salted-makhana",
    shortDescription: "Simply salted, perfectly crunchy.",
    description: "Simply salted, perfectly crunchy. Lightly roasted with a touch of cold-pressed oil and dusted with pure mineral-rich Himalayan pink salt to accentuate the natural puff and crunch of premium makhana.",
    imageUrl: "/images/makhana_sig.jpg",
    basePrice: 20900, // ₹209
    originalPrice: 24900,
    sku: "PF-MAK-06",
    category: "Makhana",
    stockQuantity: 130,
    lowStockThreshold: 10,
    isAvailable: true,
    isFeatured: true,
    variants: [
      { name: "100g", packSize: "100g", price: 11900, stockQuantity: 65 },
      { name: "250g", packSize: "250g", price: 20900, stockQuantity: 65 },
    ]
  }
];

async function main() {
  console.log("Seeding new Makhana products...");

  // First, demote older products from featured so these 6 take the spotlight
  await prisma.product.updateMany({
    data: { isFeatured: false }
  });

  for (const item of newMakhanaProducts) {
    const { variants, ...prodData } = item;

    // Check if product exists by slug or SKU
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: prodData.slug },
          { sku: prodData.sku },
          { name: prodData.name }
        ]
      }
    });

    let productRecord;
    if (existing) {
      productRecord = await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...prodData,
          isFeatured: true,
          isAvailable: true,
        }
      });
      console.log(`Updated product: ${productRecord.name}`);
    } else {
      productRecord = await prisma.product.create({
        data: {
          ...prodData,
          isFeatured: true,
          isAvailable: true,
        }
      });
      console.log(`Created product: ${productRecord.name}`);
    }

    // Upsert variants
    if (variants && variants.length > 0) {
      // Remove old variants for clean state
      await prisma.productVariant.deleteMany({
        where: { productId: productRecord.id }
      });

      for (const v of variants) {
        await prisma.productVariant.create({
          data: {
            ...v,
            productId: productRecord.id,
            isAvailable: true,
          }
        });
      }
    }
  }

  console.log("Successfully seeded all 6 Makhana products!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
