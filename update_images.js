// eslint-disable-next-line @typescript-eslint/no-require-imports -- standalone CommonJS maintenance script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.product.update({
    where: { slug: 'pink-farm-signature-makhana' },
    data: { imageUrl: '/images/makhana_sig.jpg' }
  });
  await prisma.product.update({
    where: { slug: 'classic-salted-makhana' },
    data: { imageUrl: '/images/makhana_sig.jpg' }
  });
  await prisma.product.update({
    where: { slug: 'premium-almonds' },
    data: { imageUrl: '/images/almonds.jpg' }
  });
  await prisma.product.update({
    where: { slug: 'whole-cashews' },
    data: { imageUrl: '/images/almonds.jpg' }
  });
  await prisma.product.update({
    where: { slug: 'organic-jaggery-powder' },
    data: { imageUrl: '/images/makhana_sig.jpg' }
  });
  await prisma.product.update({
    where: { slug: 'cold-pressed-mustard-oil' },
    data: { imageUrl: '/images/ghee.jpg' }
  });
  await prisma.product.update({
    where: { slug: 'a2-gir-cow-bilona-ghee' },
    data: { imageUrl: '/images/ghee.jpg' }
  });
  console.log("Images updated!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
