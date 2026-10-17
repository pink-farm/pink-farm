// eslint-disable-next-line @typescript-eslint/no-require-imports -- standalone CommonJS maintenance script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  {
    nameMatch: ["Premium Phool Makhana", "Raw Premium Phool Makhana"],
    newName: "Raw Premium Phool Makhana",
    newSlug: "raw-premium-phool-makhana",
    description: "Made from carefully selected makhana, kept simple and unflavoured for pure versatility. Roast it, season it, or enjoy creating your own snack!"
  },
  {
    nameMatch: ["Peri Peri Makhana"],
    newName: "Peri Peri Makhana",
    newSlug: "peri-peri-makhana",
    description: "Carefully selected makhana, perfectly coated with a bold peri peri seasoning. Every crunchy bite brings a spicy twist to your everyday snacking!"
  },
  {
    nameMatch: ["Punjabi Tadka Makhana"],
    newName: "Punjabi Tadka Makhana",
    newSlug: "punjabi-tadka-makhana",
    description: "Premium handpicked makhana tossed in a flavourful Punjabi tadka seasoning. Enjoy the perfect desi twist in every crunchy bite!"
  },
  {
    nameMatch: ["Pudina Makhana"],
    newName: "Pudina Makhana",
    newSlug: "pudina-makhana",
    description: "Carefully selected makhana blended with refreshing minty pudina seasoning. A flavourful, chatpata companion for your everyday snack cravings!"
  },
  {
    nameMatch: ["Caramel Gud Makhana"],
    newName: "Caramel Gud Makhana",
    newSlug: "caramel-gud-makhana",
    description: "Premium makhana coated with a delightful caramel-gud flavour for a sweet, crunchy treat. Perfect for satisfying your sweet cravings, one bite at a time!"
  },
  {
    nameMatch: ["Himalayan Pink Salted Makhana", "Himalayan Salted Makhana"],
    newName: "Himalayan Salted Makhana",
    newSlug: "himalayan-salted-makhana",
    description: "Carefully selected makhana seasoned with a simple, savoury Himalayan salt flavour. Light, crunchy and perfect for everyday munching!"
  }
];

async function main() {
  console.log("Updating product descriptions...");

  for (const item of updates) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          ...item.nameMatch.map(n => ({ name: n })),
          { slug: item.newSlug }
        ]
      }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          name: item.newName,
          slug: item.newSlug,
          description: item.description,
        }
      });
      console.log(`Updated "${item.newName}" with exact description.`);
    } else {
      console.log(`Product not found for: ${item.newName}`);
    }
  }

  console.log("All descriptions updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
