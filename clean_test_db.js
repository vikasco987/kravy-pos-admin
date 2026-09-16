const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    try {
        const user = await prisma.user.findUnique({ where: { email: 'testmerchant@example.com' } });
        if (user) {
            console.log("Found test user:", user.id);
            await prisma.item.deleteMany({ where: { userId: user.id } });
            await prisma.category.deleteMany({ where: { clerkId: user.clerkId } });
            await prisma.businessProfile.deleteMany({ where: { userId: user.clerkId } });
            await prisma.user.delete({ where: { id: user.id } });
            console.log("Test user and associated data deleted successfully!");
        } else {
            console.log("Test user not found.");
        }
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
