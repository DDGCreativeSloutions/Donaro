const { PrismaClient, Prisma } = require('@prisma/client');

let prisma;
try {
	prisma = new PrismaClient();
} catch (err) {
	// Provide a clearer runtime error to help debugging on platforms like Vercel/Railway
	if (err instanceof Prisma.PrismaClientInitializationError) {
		console.error('\n🚨 DATABASE CONNECTION ISSUE DETECTED');
		console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.error('Prisma Client failed to initialize. This commonly happens when:');
		console.error('1. The Prisma client was not generated during build');
		console.error('2. DATABASE_URL environment variable is not set');
		console.error('3. The database server is not accessible');
		console.error('');
		console.error('🔧 TO FIX THIS:');
		console.error('1. Ensure nixpacks.toml includes Prisma generation:');
		console.error('   [phases.build]');
		console.error('   cmds = ["npx prisma generate --schema=./prisma/schema.prod.prisma"]');
		console.error('');
		console.error('2. Set DATABASE_URL in Railway dashboard (for PostgreSQL)');
		console.error('3. Redeploy the application');
		console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

		// For development, throw the error to fail fast
		if (process.env.NODE_ENV !== 'production') {
			throw err;
		}
	}
	throw err;
}

module.exports = prisma;