import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createUnavailablePrisma(): PrismaClient {
	const handler: ProxyHandler<object> = {
		get() {
			return () => {
				throw new Error('Prisma is unavailable in this runtime.')
			}
		},
	}
	return new Proxy({}, handler) as PrismaClient
}

let prismaInstance: PrismaClient
try {
	prismaInstance = globalForPrisma.prisma ?? new PrismaClient()
	if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
		globalForPrisma.prisma = prismaInstance
	}
} catch {
	prismaInstance = createUnavailablePrisma()
}

export const prisma = prismaInstance
