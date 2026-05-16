import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.vercel.production", override: true });
const prisma = new PrismaClient();

const email = "jou1d@hotmail.com";
const user = await prisma.user.findUnique({ where: { email } });
console.log("by email:", user ? { id: user.id, email: user.email, phone: user.phone } : null);

const phone = user?.phone ?? "joud@hotmail.com";
const byPhone = await prisma.user.findUnique({ where: { phone } });
console.log("by phone:", byPhone ? { id: byPhone.id, phone: byPhone.phone } : null);

await prisma.$disconnect();
