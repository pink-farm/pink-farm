import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Check if store settings exist
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) {
    await prisma.storeSettings.create({
      data: {
        id: "default",
        storeName: "Pink Farm",
        supportPhone: "+91 8437504040",
        supportEmail: "wecare@pinkfarm.in",
        businessAddress: "Dugri, Ludhiana, Punjab - 141003",
      }
    });
  } else {
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        supportPhone: "+91 8437504040",
        supportEmail: "wecare@pinkfarm.in",
        businessAddress: "Dugri, Ludhiana, Punjab - 141003",
      }
    });
  }

  // Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 16) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters before seeding.");
  }
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        name: "Pink Farm Admin"
      }
    });
  }

  // The 6 Makhana Products
  const products = [
    {
      name: "Premium Raw Phool Makhana",
      slug: "premium-raw-phool-makhana",
      shortDescription: "Handpicked, light & wholesome",
      description: "Made from carefully selected makhana, kept simple and unflavoured for pure versatility. Roast it, season it, or enjoy creating your own snack!",
      imageUrl: "/images/makhana_sig.jpg",
      basePrice: 37425,
      originalPrice: 49900,
      sku: "PF-MAK-01",
      category: "Makhana",
      stockQuantity: 150,
      isAvailable: true,
      isFeatured: true,
      variants: [
        { name: "200 gms", packSize: "200 gms", price: 37425, originalPrice: 49900, stockQuantity: 150 }
      ]
    },
    {
      name: "Peri Peri Makhana",
      slug: "peri-peri-makhana",
      shortDescription: "A spicy kick in every crunchy bite.",
      description: "Carefully selected makhana, perfectly coated with a bold peri peri seasoning. Every crunchy bite brings a spicy twist to your everyday snacking!",
      imageUrl: "/images/makhana_sig.jpg",
      basePrice: 18900,
      originalPrice: 21000,
      sku: "PF-MAK-02",
      category: "Makhana",
      stockQuantity: 120,
      isAvailable: true,
      isFeatured: true,
      variants: [
        { name: "70 gms", packSize: "70 gms", price: 18900, originalPrice: 21000, stockQuantity: 120 }
      ]
    },
    {
      name: "Punjabi Tadka Makhana",
      slug: "punjabi-tadka-makhana",
      shortDescription: "Desi tadka, bold flavour, perfect crunch.",
      description: "Premium handpicked makhana tossed in a flavourful Punjabi tadka seasoning. Enjoy the perfect desi twist in every crunchy bite!",
      imageUrl: "/images/makhana_sig.jpg",
      basePrice: 18900,
      originalPrice: 21000,
      sku: "PF-MAK-03",
      category: "Makhana",
      stockQuantity: 120,
      isAvailable: true,
      isFeatured: true,
      variants: [
        { name: "70 gms", packSize: "70 gms", price: 18900, originalPrice: 21000, stockQuantity: 120 }
      ]
    },
    {
      name: "Pudina Makhana",
      slug: "pudina-makhana",
      shortDescription: "Refreshing mint with a chatpata twist.",
      description: "Carefully selected makhana blended with refreshing minty pudina seasoning. A flavourful, chatpata companion for your everyday snack cravings!",
      imageUrl: "/images/makhana_sig.jpg",
      basePrice: 18900,
      originalPrice: 21000,
      sku: "PF-MAK-04",
      category: "Makhana",
      stockQuantity: 120,
      isAvailable: true,
      isFeatured: true,
      variants: [
        { name: "70 gms", packSize: "70 gms", price: 18900, originalPrice: 21000, stockQuantity: 120 }
      ]
    },
    {
      name: "Caramel Gur Makhana",
      slug: "caramel-gud-makhana",
      shortDescription: "Makhana meets the goodness of gur.",
      description: "Premium makhana coated with a delightful caramel-gur flavour for a sweet, crunchy treat. Perfect for satisfying your sweet cravings, one bite at a time!",
      imageUrl: "/images/makhana_sig.jpg",
      basePrice: 20700,
      originalPrice: 23000,
      sku: "PF-MAK-05",
      category: "Makhana",
      stockQuantity: 100,
      isAvailable: true,
      isFeatured: true,
      variants: [
        { name: "70 gms", packSize: "70 gms", price: 20700, originalPrice: 23000, stockQuantity: 100 }
      ]
    },
    {
      name: "Himalayan Pink Salted Makhana",
      slug: "himalayan-pink-salted-makhana",
      shortDescription: "Simply salted, perfectly crunchy.",
      description: "Carefully selected makhana seasoned with a simple, savoury Himalayan salt flavour. Light, crunchy and perfect for everyday munching!",
      imageUrl: "/images/makhana_sig.jpg",
      basePrice: 18000,
      originalPrice: 20000,
      sku: "PF-MAK-06",
      category: "Makhana",
      stockQuantity: 130,
      isAvailable: true,
      isFeatured: true,
      variants: [
        { name: "70 gms", packSize: "70 gms", price: 18000, originalPrice: 20000, stockQuantity: 130 }
      ]
    },
  ];

  for (const prod of products) {
    const existingProduct = await prisma.product.findUnique({
      where: { slug: prod.slug }
    });

    if (!existingProduct) {
      const { variants, ...productData } = prod;
      const createdProduct = await prisma.product.create({
        data: productData
      });

      if (variants) {
        for (const variant of variants) {
          await prisma.productVariant.create({
            data: {
              ...variant,
              productId: createdProduct.id
            }
          });
        }
      }
    }
  }

  console.log("Database seeded with 6 Makhana products and default settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
