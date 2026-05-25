import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EXTRA_VENDORS, generateExpandedProducts, productImageUrl } from "./seed-expanded";
import { tryOnImageForStep } from "./tryon-images";

const prisma = new PrismaClient();

/** White-background studio-style product image (reliable CDN). */
function productImage(seed: string, label: string) {
  const text = encodeURIComponent(label.slice(0, 24));
  return `https://placehold.co/600x800/f5f5f5/2d2d2d/png?text=${text}&font=roboto`;
}

function shopImage(seed: string, w: number, h: number) {
  return `https://placehold.co/${w}x${h}/f0f0f0/333333/png?text=${encodeURIComponent(seed)}`;
}

const VENDORS = [
  {
    email: "vendor@um.fashion",
    password: "vendor123",
    name: "Alex Rivera",
    businessName: "Luxe Threads Co.",
    slug: "luxe-threads",
    tagline: "Premium futuristic essentials",
    city: "New York",
    rating: 4.8,
    description: "Curated luxury streetwear with iridescent finishes and premium fabrics.",
  },
  {
    email: "neon@um.fashion",
    password: "vendor123",
    name: "Jordan Lee",
    businessName: "Neon Kicks",
    slug: "neon-kicks",
    tagline: "Footwear from the future",
    city: "Los Angeles",
    rating: 4.7,
    description: "Bold sneakers and runners with neon accents and performance tech.",
  },
  {
    email: "velvet@um.fashion",
    password: "vendor123",
    name: "Sofia Chen",
    businessName: "Velvet Scents",
    slug: "velvet-scents",
    tagline: "Fragrances that linger",
    city: "Paris",
    rating: 4.9,
    description: "Artisan perfumes and colognes with amber, iris, and oud notes.",
  },
  {
    email: "glow@um.fashion",
    password: "vendor123",
    name: "Mia Thompson",
    businessName: "Glow Beauty Lab",
    slug: "glow-beauty",
    tagline: "Radiance redefined",
    city: "London",
    rating: 4.6,
    description: "Clean makeup and skincare for a luminous, futuristic glow.",
  },
  {
    email: "street@um.fashion",
    password: "vendor123",
    name: "Tyler Brooks",
    businessName: "Street Circuit",
    slug: "street-circuit",
    tagline: "Urban techwear",
    city: "Chicago",
    rating: 4.5,
    description: "Technical streetwear built for city life — waterproof, breathable, bold.",
  },
  {
    email: "noir@um.fashion",
    password: "vendor123",
    name: "Elena Voss",
    businessName: "Atelier Noir",
    slug: "atelier-noir",
    tagline: "Dark elegance",
    city: "Milan",
    rating: 4.9,
    description: "Monochrome tailoring and avant-garde evening wear.",
  },
  {
    email: "solar@um.fashion",
    password: "vendor123",
    name: "Chris Park",
    businessName: "Solar Active",
    slug: "solar-active",
    tagline: "Move in style",
    city: "Miami",
    rating: 4.4,
    description: "Performance athleisure with UV-reactive details.",
  },
  {
    email: "wool@um.fashion",
    password: "vendor123",
    name: "James Hart",
    businessName: "Heritage Wool",
    slug: "heritage-wool",
    tagline: "Timeless craft",
    city: "Edinburgh",
    rating: 4.7,
    description: "Heritage knitwear and wool coats with modern cuts.",
  },
];

const PRODUCT_TEMPLATES: Record<string, Array<{
  name: string;
  description: string;
  category: "CLOTHING" | "ACCESSORIES" | "FRAGRANCES" | "MAKEUP" | "FOOTWEAR";
  vendorPrice: number;
  outfitStep?: string;
  seed: string;
}>> = {
  "luxe-threads": [
    { name: "Neo Slim Fit Chinos", description: "Stretch chinos with subtle sheen", category: "CLOTHING", vendorPrice: 45, outfitStep: "PANTS", seed: "lt1" },
    { name: "Cyber Silk Shirt", description: "Iridescent silk blend shirt", category: "CLOTHING", vendorPrice: 55, outfitStep: "SHIRT", seed: "lt2" },
    { name: "Quantum Bomber Jacket", description: "Weather-resistant bomber", category: "CLOTHING", vendorPrice: 120, outfitStep: "JACKET", seed: "lt3" },
    { name: "Holo Snapback Cap", description: "Reflective holographic cap", category: "ACCESSORIES", vendorPrice: 28, outfitStep: "HAT", seed: "lt4" },
    { name: "Nova Crossbody Bag", description: "Minimalist crossbody with LED trim", category: "ACCESSORIES", vendorPrice: 65, outfitStep: "ACCESSORIES", seed: "lt5" },
    { name: "Mercury Dress Shirt", description: "Liquid-metal finish oxford", category: "CLOTHING", vendorPrice: 68, outfitStep: "SHIRT", seed: "lt6" },
    { name: "Void Black Jeans", description: "Deep black coated denim", category: "CLOTHING", vendorPrice: 72, outfitStep: "PANTS", seed: "lt7" },
    { name: "Prism Windbreaker", description: "Lightweight color-shift shell", category: "CLOTHING", vendorPrice: 89, outfitStep: "JACKET", seed: "lt8" },
  ],
  "neon-kicks": [
    { name: "Pulse Runner Sneakers", description: "Neon-accent performance runners", category: "FOOTWEAR", vendorPrice: 85, outfitStep: "FOOTWEAR", seed: "nk1" },
    { name: "Voltage High-Tops", description: "Electric purple high-tops", category: "FOOTWEAR", vendorPrice: 95, outfitStep: "FOOTWEAR", seed: "nk2" },
    { name: "Flux Slip-Ons", description: "Minimal slip-ons with glow sole", category: "FOOTWEAR", vendorPrice: 65, outfitStep: "FOOTWEAR", seed: "nk3" },
    { name: "Gridlock Boots", description: "Cyberpunk combat boots", category: "FOOTWEAR", vendorPrice: 110, outfitStep: "FOOTWEAR", seed: "nk4" },
    { name: "Aero Sprint Trainers", description: "Featherweight gym trainers", category: "FOOTWEAR", vendorPrice: 78, outfitStep: "FOOTWEAR", seed: "nk5" },
    { name: "Neon Laces Pack", description: "3-pack glow laces", category: "ACCESSORIES", vendorPrice: 12, outfitStep: "ACCESSORIES", seed: "nk6" },
  ],
  "velvet-scents": [
    { name: "Ethereal Eau de Parfum", description: "Amber and iris unisex scent", category: "FRAGRANCES", vendorPrice: 75, outfitStep: "FRAGRANCE", seed: "vs1" },
    { name: "Midnight Oud", description: "Deep oud and rose", category: "FRAGRANCES", vendorPrice: 95, outfitStep: "FRAGRANCE", seed: "vs2" },
    { name: "Citrus Nova", description: "Bright bergamot and vetiver", category: "FRAGRANCES", vendorPrice: 55, outfitStep: "FRAGRANCE", seed: "vs3" },
    { name: "Velvet Musk", description: "Soft skin musk", category: "FRAGRANCES", vendorPrice: 68, outfitStep: "FRAGRANCE", seed: "vs4" },
    { name: "Solar Bloom", description: "Floral solar accord", category: "FRAGRANCES", vendorPrice: 62, outfitStep: "FRAGRANCE", seed: "vs5" },
  ],
  "glow-beauty": [
    { name: "Luminous Glow Foundation", description: "Natural finish foundation", category: "MAKEUP", vendorPrice: 32, outfitStep: "FRAGRANCE", seed: "gb1" },
    { name: "Holo Highlighter", description: "Iridescent cheek glow", category: "MAKEUP", vendorPrice: 24, outfitStep: "FRAGRANCE", seed: "gb2" },
    { name: "Cyber Lip Lacquer", description: "Long-wear vinyl lip", category: "MAKEUP", vendorPrice: 18, outfitStep: "FRAGRANCE", seed: "gb3" },
    { name: "Aura Setting Spray", description: "24h glow setting mist", category: "MAKEUP", vendorPrice: 22, outfitStep: "FRAGRANCE", seed: "gb4" },
    { name: "Neon Eyeshadow Palette", description: "8-shade editorial palette", category: "MAKEUP", vendorPrice: 38, outfitStep: "FRAGRANCE", seed: "gb5" },
    { name: "Prism Brow Gel", description: "Tinted brow sculpt", category: "MAKEUP", vendorPrice: 16, outfitStep: "FRAGRANCE", seed: "gb6" },
  ],
  "street-circuit": [
    { name: "Circuit Cargo Pants", description: "Multi-pocket tech cargos", category: "CLOTHING", vendorPrice: 58, outfitStep: "PANTS", seed: "sc1" },
    { name: "Grid Hoodie", description: "Reflective grid print hoodie", category: "CLOTHING", vendorPrice: 48, outfitStep: "SHIRT", seed: "sc2" },
    { name: "Signal Puffer Vest", description: "Lightweight insulated vest", category: "CLOTHING", vendorPrice: 75, outfitStep: "JACKET", seed: "sc3" },
    { name: "Data Runner Gloves", description: "Touchscreen tech gloves", category: "ACCESSORIES", vendorPrice: 22, outfitStep: "ACCESSORIES", seed: "sc4" },
    { name: "Urban Tech Belt", description: "Modular utility belt", category: "ACCESSORIES", vendorPrice: 35, outfitStep: "ACCESSORIES", seed: "sc5" },
    { name: "Night Vision Cap", description: "Reflective 5-panel cap", category: "ACCESSORIES", vendorPrice: 26, outfitStep: "HAT", seed: "sc6" },
    { name: "Transit Shell Jacket", description: "Waterproof city shell", category: "CLOTHING", vendorPrice: 98, outfitStep: "JACKET", seed: "sc7" },
  ],
  "atelier-noir": [
    { name: "Obsidian Blazer", description: "Structured midnight blazer", category: "CLOTHING", vendorPrice: 185, outfitStep: "JACKET", seed: "an1" },
    { name: "Silk Noir Shirt", description: "Black silk dress shirt", category: "CLOTHING", vendorPrice: 88, outfitStep: "SHIRT", seed: "an2" },
    { name: "Shadow Trousers", description: "Tailored wool trousers", category: "CLOTHING", vendorPrice: 95, outfitStep: "PANTS", seed: "an3" },
    { name: "Onyx Cufflinks", description: "Matte black cufflinks", category: "ACCESSORIES", vendorPrice: 45, outfitStep: "WATCHES", seed: "an4" },
    { name: "Eclipse Overcoat", description: "Full-length wool overcoat", category: "CLOTHING", vendorPrice: 220, outfitStep: "JACKET", seed: "an5" },
    { name: "Noir Leather Belt", description: "Italian leather belt", category: "ACCESSORIES", vendorPrice: 55, outfitStep: "ACCESSORIES", seed: "an6" },
    { name: "Phantom Loafers", description: "Patent leather loafers", category: "FOOTWEAR", vendorPrice: 130, outfitStep: "FOOTWEAR", seed: "an7" },
  ],
  "solar-active": [
    { name: "UV React Tank", description: "Sun-reactive gym tank", category: "CLOTHING", vendorPrice: 28, outfitStep: "SHIRT", seed: "sa1" },
    { name: "Flex Training Shorts", description: "4-way stretch shorts", category: "CLOTHING", vendorPrice: 32, outfitStep: "PANTS", seed: "sa2" },
    { name: "Solar Windbreaker", description: "Packable running shell", category: "CLOTHING", vendorPrice: 55, outfitStep: "JACKET", seed: "sa3" },
    { name: "Pulse Sports Watch", description: "Fitness tracking watch", category: "ACCESSORIES", vendorPrice: 89, outfitStep: "WATCHES", seed: "sa4" },
    { name: "Compression Leggings", description: "High-rise compression", category: "CLOTHING", vendorPrice: 42, outfitStep: "PANTS", seed: "sa5" },
    { name: "Hydro Gym Bottle", description: "Smart hydration bottle", category: "ACCESSORIES", vendorPrice: 25, outfitStep: "ACCESSORIES", seed: "sa6" },
  ],
  "heritage-wool": [
    { name: "Highland Wool Coat", description: "Classic herringbone coat", category: "CLOTHING", vendorPrice: 195, outfitStep: "JACKET", seed: "hw1" },
    { name: "Cable Knit Sweater", description: "Scottish wool cable knit", category: "CLOTHING", vendorPrice: 78, outfitStep: "SHIRT", seed: "hw2" },
    { name: "Tartan Scarf", description: "Merino wool tartan scarf", category: "ACCESSORIES", vendorPrice: 38, outfitStep: "ACCESSORIES", seed: "hw3" },
    { name: "Wool Flat Cap", description: "Heritage tweed cap", category: "ACCESSORIES", vendorPrice: 32, outfitStep: "HAT", seed: "hw4" },
    { name: "Donegal Trousers", description: "Wool blend trousers", category: "CLOTHING", vendorPrice: 72, outfitStep: "PANTS", seed: "hw5" },
    { name: "Cedar Wool Cardigan", description: "Button-front cardigan", category: "CLOTHING", vendorPrice: 85, outfitStep: "SHIRT", seed: "hw6" },
    { name: "Brogue Boots", description: "Leather brogue boots", category: "FOOTWEAR", vendorPrice: 145, outfitStep: "FOOTWEAR", seed: "hw7" },
  ],
};

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", commissionRate: 0.15, siteName: "UM Fashion" },
  });

  const superadminPassword = await bcrypt.hash("superadmin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@um.fashion" },
    update: {},
    create: {
      email: "admin@um.fashion",
      passwordHash: superadminPassword,
      name: "Super Admin",
      role: Role.SUPERADMIN,
    },
  });

  const userPassword = await bcrypt.hash("user123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "user@um.fashion" },
    update: {},
    create: {
      email: "user@um.fashion",
      passwordHash: userPassword,
      name: "Demo User",
      role: Role.USER,
    },
  });

  const vendorIds: Record<string, string> = {};

  for (const v of VENDORS) {
    const passwordHash = await bcrypt.hash(v.password, 12);
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: { role: Role.VENDOR },
      create: {
        email: v.email,
        passwordHash,
        name: v.name,
        role: Role.VENDOR,
      },
    });

    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {
        businessName: v.businessName,
        slug: v.slug,
        tagline: v.tagline,
        city: v.city,
        rating: v.rating,
        description: v.description,
        logoUrl: shopImage(`${v.slug}-logo`, 200, 200),
        bannerUrl: shopImage(`${v.slug}-banner`, 1200, 400),
        status: "APPROVED",
      },
      create: {
        userId: user.id,
        businessName: v.businessName,
        slug: v.slug,
        tagline: v.tagline,
        city: v.city,
        rating: v.rating,
        description: v.description,
        logoUrl: shopImage(`${v.slug}-logo`, 200, 200),
        bannerUrl: shopImage(`${v.slug}-banner`, 1200, 400),
        status: "APPROVED",
      },
    });

    vendorIds[v.slug] = vendor.id;

    const products = PRODUCT_TEMPLATES[v.slug] || [];
    let pi = 0;
    for (const p of products) {
      const existing = await prisma.product.findFirst({
        where: { name: p.name, vendorId: vendor.id },
      });
      const step = p.outfitStep || "SHIRT";
      const assets = productImageUrl(p.name, step, pi++);
      const tryOn =
        assets.tryOnImageUrl ||
        (p.outfitStep && p.outfitStep !== "FRAGRANCE"
          ? tryOnImageForStep(p.outfitStep, pi)
          : null);
      if (!existing) {
        await prisma.product.create({
          data: {
            vendorId: vendor.id,
            name: p.name,
            description: p.description,
            category: p.category,
            vendorPrice: p.vendorPrice,
            stock: 50 + Math.floor(Math.random() * 50),
            sizes: p.category === "FOOTWEAR" ? ["7", "8", "9", "10", "11"] : ["S", "M", "L", "XL"],
            colors: ["Black", "White", "Navy"],
            images: tryOn ? [tryOn] : [productImage(p.seed, p.name)],
            tryOnImageUrl: tryOn,
            scenarioTags: ["casual", v.city?.toLowerCase() || "karachi"],
            genderTarget: "unisex",
            outfitStep: p.outfitStep as never,
          },
        });
      }
    }
  }

  for (const ev of EXTRA_VENDORS) {
    const passwordHash = await bcrypt.hash("vendor123", 12);
    const user = await prisma.user.upsert({
      where: { email: ev.email },
      update: { role: Role.VENDOR },
      create: {
        email: ev.email,
        passwordHash,
        name: ev.businessName,
        role: Role.VENDOR,
      },
    });
    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: { businessName: ev.businessName, slug: ev.slug, city: ev.city, status: "APPROVED" },
      create: {
        userId: user.id,
        businessName: ev.businessName,
        slug: ev.slug,
        city: ev.city,
        tagline: `${ev.businessName} — PK fashion`,
        status: "APPROVED",
        logoUrl: shopImage(`${ev.slug}-logo`, 200, 200),
        bannerUrl: shopImage(`${ev.slug}-banner`, 1200, 400),
      },
    });
    const expanded = generateExpandedProducts(ev.slug, ev.city);
    let ei = 0;
    for (const p of expanded) {
      const existing = await prisma.product.findFirst({
        where: { name: p.name, vendorId: vendor.id },
      });
      const step = p.outfitStep || "SHIRT";
      const assets = productImageUrl(p.name, step, ei++);
      if (!existing) {
        await prisma.product.create({
          data: {
            vendorId: vendor.id,
            name: p.name,
            description: p.description,
            category: p.category,
            vendorPrice: p.vendorPrice,
            stock: 30 + Math.floor(Math.random() * 70),
            sizes: p.category === "FOOTWEAR" ? ["7", "8", "9", "10", "11"] : ["S", "M", "L", "XL"],
            colors: ["Black", "Navy", "White", "Beige"],
            images: assets.images,
            tryOnImageUrl: assets.tryOnImageUrl,
            scenarioTags: p.scenarioTags,
            genderTarget: p.genderTarget,
            season: p.season,
            outfitStep: p.outfitStep as never,
          },
        });
      }
    }
  }

  // Sample reviews
  const someProducts = await prisma.product.findMany({ take: 12 });
  for (let i = 0; i < someProducts.length; i++) {
    const p = someProducts[i];
    await prisma.review.upsert({
      where: { userId_productId: { userId: demoUser.id, productId: p.id } },
      update: {},
      create: {
        userId: demoUser.id,
        productId: p.id,
        rating: 4 + (i % 2),
        comment: ["Absolutely fire!", "Great quality", "Perfect fit", "Love the design"][i % 4],
      },
    });
  }

  const total = await prisma.product.count();
  console.log(`Seed completed — ${total} products across all vendors`);
  console.log("Superadmin: admin@um.fashion / superadmin123");
  console.log("User: user@um.fashion / user123");
  console.log("Vendors: vendor@um.fashion, neon@um.fashion, etc. / vendor123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
