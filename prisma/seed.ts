import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.user.upsert({ where: { email: 'user@foodorder.com' }, update: {}, create: { email: 'user@foodorder.com', password: 'password123' } })
  const products = [
    ['Nasi Goreng Spesial', 20000, 10, 'Makanan', 'Nasi goreng gurih dengan telur, ayam suwir, dan sayuran segar.'],
    ['Mie Ayam', 18000, 8, 'Makanan', 'Mie kenyal dengan topping ayam berbumbu dan pangsit renyah.'],
    ['Ayam Geprek', 22000, 15, 'Makanan', 'Ayam crispy dengan sambal geprek pedas yang menggugah selera.'],
    ['Es Teh', 5000, 20, 'Minuman', 'Teh manis dingin yang menyegarkan untuk menemani makanmu.'],
    ['Jus Alpukat', 12000, 12, 'Minuman', 'Jus alpukat creamy dengan rasa manis alami dan segar.'],
  ] as const
  for (const [index, [name, price, stock, category, description]] of products.entries()) await prisma.product.upsert({ where: { id: index + 1 }, update: { name, price, stock, category, description, image: '' }, create: { id: index + 1, name, price, stock, category, description, image: '' } })
}
main().finally(() => prisma.$disconnect())
