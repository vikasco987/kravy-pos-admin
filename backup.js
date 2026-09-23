const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database to start backup...');
  
  const users = await prisma.user.findMany();
  console.log(`Backed up ${users.length} users.`);
  
  const categories = await prisma.category.findMany();
  console.log(`Backed up ${categories.length} categories.`);
  
  const items = await prisma.item.findMany();
  console.log(`Backed up ${items.length} items.`);
  
  const backupData = {
    users,
    categories,
    items,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('database_backup.json', JSON.stringify(backupData, null, 2));
  console.log('Backup saved to database_backup.json successfully!');
}

main()
  .catch(e => {
    console.error('Backup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
