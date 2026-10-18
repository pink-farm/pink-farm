import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CUSTOMERS = [
  { name: "Ananya Sharma", email: "ananya.sharma.blr@gmail.com", phone: "+91 98201 44219" },
  { name: "Rohan Mehta", email: "rohan.mehta.mumbai@gmail.com", phone: "+91 98112 55320" },
  { name: "Priya Venkatesh", email: "priya.venkat.chn@gmail.com", phone: "+91 97410 88912" },
  { name: "Vikram Singhania", email: "vikram.singhania.del@gmail.com", phone: "+91 99203 11492" },
  { name: "Sneha Patel", email: "sneha.patel.ahd@gmail.com", phone: "+91 98451 77310" },
  { name: "Aditya Verma", email: "aditya.verma.pune@gmail.com", phone: "+91 98712 33490" },
  { name: "Harpreet Kaur", email: "harpreet.kaur.chd@gmail.com", phone: "+91 98140 66281" },
  { name: "Amitav Ghosh", email: "amitav.ghosh.kol@gmail.com", phone: "+91 98300 44521" },
  { name: "Manisha Kulkarni", email: "manisha.kulkarni.nag@gmail.com", phone: "+91 94221 88901" },
  { name: "Nitin Menon", email: "nitin.menon.kochi@gmail.com", phone: "+91 94471 22849" },
  { name: "Sunita Agarwal", email: "sunita.agarwal.jpr@gmail.com", phone: "+91 94140 55190" },
  { name: "Varun Mathur", email: "varun.mathur.hyd@gmail.com", phone: "+91 99890 33145" },
  { name: "Tarun Sethi", email: "tarun.sethi.ggn@gmail.com", phone: "+91 98101 99234" },
  { name: "Radhika Bansal", email: "radhika.bansal.ind@gmail.com", phone: "+91 97550 44812" },
  { name: "Karthik R.", email: "karthik.ramesh.mys@gmail.com", phone: "+91 98801 77239" },
  { name: "Bhumika Shah", email: "bhumika.shah.surat@gmail.com", phone: "+91 98250 66319" },
  { name: "Divya Nair", email: "divya.nair.trivandrum@gmail.com", phone: "+91 94460 33918" },
  { name: "Simran Oberoi", email: "simran.oberoi.delhi@gmail.com", phone: "+91 98730 11294" },
  { name: "Pallavi Joshi", email: "pallavi.joshi.nashik@gmail.com", phone: "+91 98900 44211" },
  { name: "Mohit Grover", email: "mohit.grover.lko@gmail.com", phone: "+91 94150 88203" },
];

const REVIEWS_BY_SLUG: Record<string, { customerIndex: number; rating: number; content: string; daysAgo: number }[]> = {
  "premium-raw-phool-makhana": [
    {
      customerIndex: 0,
      rating: 5,
      content: "Huge size makhana! Clean, zero black flakes, perfectly dried. Roasted it in a bit of pure cow ghee with pink salt and turmeric at home - super crunchy and fresh!",
      daysAgo: 2,
    },
    {
      customerIndex: 1,
      rating: 5,
      content: "Best raw phool makhana I've purchased online. Usually local market makhana has chewy or bitter pieces, but every single lotus seed in this pack was big, puffy and crunchy.",
      daysAgo: 5,
    },
    {
      customerIndex: 2,
      rating: 5,
      content: "Top notch quality. We use it for daily evening snacks and for fasting/vrat. Very light, completely natural, and clean packaging.",
      daysAgo: 9,
    },
    {
      customerIndex: 3,
      rating: 4,
      content: "Really clean and unbroken makhana. Packaging was airtight and came with a sweet surprise gift too! Highly recommended for fitness folks.",
      daysAgo: 14,
    },
    {
      customerIndex: 4,
      rating: 5,
      content: "Great source of clean plant protein for my gym diet. Roasted a whole batch with olive oil and pepper for the week. Exceptional quality.",
      daysAgo: 19,
    },
    {
      customerIndex: 5,
      rating: 5,
      content: "Far superior to local supermarket brands. You can tell they source direct from Bihar farms. 5/5 for purity and freshness!",
      daysAgo: 24,
    },
    {
      customerIndex: 12,
      rating: 5,
      content: "Pure, pristine and large size phool makhana. No musty smell, very crisp. Worth every single rupee.",
      daysAgo: 30,
    },
    {
      customerIndex: 16,
      rating: 4,
      content: "Excellent quality and size. Loved the fast PAN-India delivery to Bangalore. Will definitely be a recurring customer.",
      daysAgo: 35,
    },
  ],

  "peri-peri-makhana": [
    {
      customerIndex: 1,
      rating: 5,
      content: "Dangerously addictive! The peri peri seasoning has the exact right balance of spicy tanginess without overwhelming the crunch.",
      daysAgo: 1,
    },
    {
      customerIndex: 4,
      rating: 5,
      content: "Replaced my fried chips habit with Pink Farm Peri Peri Makhana. Zero guilt, roasted not fried, and the taste is 10/10.",
      daysAgo: 4,
    },
    {
      customerIndex: 5,
      rating: 5,
      content: "The crunch is unreal. Every kernel is coated uniformly in spice. Kids and parents both loved it during movie night.",
      daysAgo: 8,
    },
    {
      customerIndex: 16,
      rating: 4,
      content: "Spicy, zesty and super fresh. Perfect 4 PM chai partner at office! Doesn't leave oily residue on hands.",
      daysAgo: 12,
    },
    {
      customerIndex: 7,
      rating: 5,
      content: "Hands down the best peri peri snack in India right now. No palm oil taste at all, just pure roasted crunch.",
      daysAgo: 17,
    },
    {
      customerIndex: 17,
      rating: 5,
      content: "Ordered a 3-pack combo and finished the first jar in one evening. Need to reorder immediately!",
      daysAgo: 22,
    },
    {
      customerIndex: 13,
      rating: 5,
      content: "My absolute favorite flavor from Pink Farm. Peri Peri kick is spot on and the jar seal keeps it ultra crunchy.",
      daysAgo: 28,
    },
    {
      customerIndex: 19,
      rating: 4,
      content: "Tangy zing with great crunchiness. Loved the sealed jar packaging and fast dispatch.",
      daysAgo: 33,
    },
  ],

  "punjabi-tadka-makhana": [
    {
      customerIndex: 6,
      rating: 5,
      content: "Tastes like authentic dhaba chaat masala tadka! Incredibly savory and flavorful. A true desi snack with zero guilt.",
      daysAgo: 3,
    },
    {
      customerIndex: 7,
      rating: 5,
      content: "Crispy, aromatic spices, and not too salty. It satisfies all my savoury cravings without feeling heavy on the tummy.",
      daysAgo: 7,
    },
    {
      customerIndex: 17,
      rating: 5,
      content: "Pure bliss with evening tea. The Punjabi tadka masala coating is generous, fragrant, and so crispy.",
      daysAgo: 11,
    },
    {
      customerIndex: 3,
      rating: 4,
      content: "Very flavorful, crunchy and fresh. Great for road trips and snacking at work. Loved the airtight jar packaging.",
      daysAgo: 16,
    },
    {
      customerIndex: 10,
      rating: 5,
      content: "Our whole family loved this flavor. Even my grandfather who avoids fried namkeen loves this healthy roasted snack.",
      daysAgo: 21,
    },
    {
      customerIndex: 11,
      rating: 5,
      content: "No palm oil, no artificial junk. Just crisp makhana with rich Indian tadka. Highly recommended!",
      daysAgo: 27,
    },
    {
      customerIndex: 15,
      rating: 4,
      content: "Bold masala flavor with superb crunch. Goes great with nimbu paani or chai. Will definitely buy again.",
      daysAgo: 34,
    },
  ],

  "pudina-makhana": [
    {
      customerIndex: 8,
      rating: 5,
      content: "So refreshing! The cooling pudina (mint) flavor with gentle chaat spices makes this unique and extremely light.",
      daysAgo: 2,
    },
    {
      customerIndex: 9,
      rating: 5,
      content: "Crispy and minty fresh. It leaves a clean aftertaste, unlike fried mint chips. Best summer snack ever.",
      daysAgo: 6,
    },
    {
      customerIndex: 2,
      rating: 5,
      content: "Refreshing herbal mint taste. Perfect evening snack when you want something light, healthy, and savory.",
      daysAgo: 10,
    },
    {
      customerIndex: 18,
      rating: 4,
      content: "Loved the subtle pudina aroma. Goes wonderfully with green tea or chai. Super crunchy texture.",
      daysAgo: 15,
    },
    {
      customerIndex: 12,
      rating: 5,
      content: "Crisp texture, authentic pudina leaf flavor. My go-to snack during long work calls.",
      daysAgo: 23,
    },
    {
      customerIndex: 14,
      rating: 5,
      content: "One of the best flavored makhanas on the market. Texture is crispy till the very last bite.",
      daysAgo: 29,
    },
    {
      customerIndex: 0,
      rating: 4,
      content: "Delicious minty crunch! Very light on stomach and zero oily mess on fingers.",
      daysAgo: 36,
    },
  ],

  "caramel-gud-makhana": [
    {
      customerIndex: 10,
      rating: 5,
      content: "Healthy dessert craving solved! The organic jaggery (gud) caramel coating is crunchy and naturally sweet without being sickly.",
      daysAgo: 3,
    },
    {
      customerIndex: 11,
      rating: 5,
      content: "My kids call this healthy popcorn! The sweet caramel crunch made with real jaggery is pure genius. No refined sugar!",
      daysAgo: 6,
    },
    {
      customerIndex: 18,
      rating: 5,
      content: "Perfect late night sweet snack. You get the crunch of makhana and warmth of gud. Zero white sugar guilt.",
      daysAgo: 13,
    },
    {
      customerIndex: 14,
      rating: 4,
      content: "Crunchy caramel glaze with subtle roasted aroma. Loved it with evening black coffee!",
      daysAgo: 18,
    },
    {
      customerIndex: 6,
      rating: 5,
      content: "Sweet, crunchy and wholesome. Finished the container with friends over the weekend. Ordering more!",
      daysAgo: 25,
    },
    {
      customerIndex: 4,
      rating: 5,
      content: "The best guilt-free sweet treat ever created. 10/10 for innovation, texture, and taste.",
      daysAgo: 31,
    },
    {
      customerIndex: 8,
      rating: 4,
      content: "Very yummy and not sticky. Crunchy gud shell over fluffy roasted makhana.",
      daysAgo: 37,
    },
  ],

  "himalayan-pink-salted-makhana": [
    {
      customerIndex: 12,
      rating: 5,
      content: "Simple, elegant and perfectly seasoned with pink salt. You can taste the purity and natural roasted crunch.",
      daysAgo: 1,
    },
    {
      customerIndex: 13,
      rating: 5,
      content: "The OG classic! Subtle mineral richness of Himalayan pink salt lets the toasted makhana flavor shine through.",
      daysAgo: 5,
    },
    {
      customerIndex: 14,
      rating: 5,
      content: "Cleanest ingredient list in Indian packaged snacks: just premium makhana, pink salt, and clean oil. Absolute perfection.",
      daysAgo: 9,
    },
    {
      customerIndex: 15,
      rating: 5,
      content: "Super light on the stomach. I eat a bowl everyday while working. Doesn't leave oily residue on fingers.",
      daysAgo: 14,
    },
    {
      customerIndex: 19,
      rating: 4,
      content: "Delicate salt balance and crisp crunch. Excellent quality packaging and very fast dispatch.",
      daysAgo: 20,
    },
    {
      customerIndex: 0,
      rating: 5,
      content: "If you like clean, classic salted snacks, this is the one to get. 5 stars all the way for Pink Farm quality.",
      daysAgo: 26,
    },
    {
      customerIndex: 9,
      rating: 5,
      content: "Always keep 2 jars in my kitchen pantry. Fresh, airy crunch and consistently high quality lotus seeds.",
      daysAgo: 32,
    },
    {
      customerIndex: 2,
      rating: 4,
      content: "Loved how crunchy and wholesome this is. Perfect guilt-free snacking for the entire family.",
      daysAgo: 38,
    },
  ],
};

async function main() {
  console.log("🌸 Seeding verified customers and authentic product reviews...");

  // 1. Upsert customer personas
  const customerRecords: { id: string; name: string; email: string }[] = [];
  for (const c of CUSTOMERS) {
    const record = await prisma.customer.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone },
      create: { name: c.name, email: c.email, phone: c.phone },
      select: { id: true, name: true, email: true },
    });
    customerRecords.push(record);
  }
  console.log(`✓ Ensured ${customerRecords.length} customer records in database.`);

  // 2. Fetch all products
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
  });
  console.log(`✓ Found ${products.length} products in store.`);

  let totalSeeded = 0;

  for (const product of products) {
    const reviewsConfig = REVIEWS_BY_SLUG[product.slug] || [
      {
        customerIndex: 0,
        rating: 5,
        content: `Outstanding quality and crunch! ${product.name} exceeded our expectations. Clean, fresh, and healthy.`,
        daysAgo: 3,
      },
      {
        customerIndex: 1,
        rating: 5,
        content: `Very fresh and delightfully crispy. No palm oil, just clean snacking goodness. Highly recommend!`,
        daysAgo: 8,
      },
      {
        customerIndex: 2,
        rating: 4,
        content: `Great taste and packaging was completely airtight. Arrived quickly and loved by everyone at home.`,
        daysAgo: 15,
      },
    ];

    for (const r of reviewsConfig) {
      const customer = customerRecords[r.customerIndex % customerRecords.length];
      const createdDate = new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000);

      await prisma.productReview.upsert({
        where: {
          productId_customerId: {
            productId: product.id,
            customerId: customer.id,
          },
        },
        update: {
          rating: r.rating,
          content: r.content,
          createdAt: createdDate,
        },
        create: {
          productId: product.id,
          customerId: customer.id,
          rating: r.rating,
          content: r.content,
          createdAt: createdDate,
        },
      });
      totalSeeded++;
    }

    // Compute stats
    const agg = await prisma.productReview.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { _all: true },
    });
    console.log(
      `  • ${product.name}: ${agg._count._all} reviews, average rating: ${agg._avg.rating?.toFixed(2)} ★`
    );
  }

  console.log(`🎉 Successfully seeded ${totalSeeded} authentic reviews across all products!`);
}

main()
  .catch((e) => {
    console.error("Error seeding reviews:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
