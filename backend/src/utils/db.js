const { PrismaClient, Prisma } = require('@prisma/client');

let prisma;
try {
	prisma = new PrismaClient();
} catch (err) {
	// Provide a clearer runtime error to help debugging on platforms like Vercel
	if (err instanceof Prisma.PrismaClientInitializationError || /Prisma has detected that this project was built on Vercel/.test(err.message)) {
		console.error('\n\nPrisma Client failed to initialize. This commonly happens when the Prisma client was not generated in the build step (for example when Vercel caches dependencies).');
		console.error('Fix: run `prisma generate --schema=./prisma/schema.prod.prisma` during your build (add `vercel-build` or `postinstall` script).');
		console.error('See: https://pris.ly/d/vercel-build\n\n');
	}
	throw err;
}

module.exports = prisma;