import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Ensures all guilds have a town before migrating characters
 * Run this BEFORE the schema migration
 */
async function ensureAllGuildsHaveTowns() {
  console.log('🔍 Checking for guilds without towns...');

  const guildsWithoutTowns = await prisma.guild.findMany({
    where: {
      town: null
    }
  });

  console.log(`Found ${guildsWithoutTowns.length} guilds without towns`);

  if (guildsWithoutTowns.length === 0) {
    console.log('✅ All guilds already have towns');
    return;
  }

  for (const guild of guildsWithoutTowns) {
    const town = await prisma.town.create({
      data: {
        name: `${guild.name} - Ville`,
        guildId: guild.id,
        foodStock: 100
      }
    });
    console.log(`✅ Created town "${town.name}" for guild "${guild.name}"`);
  }

  console.log(`\n✅ Migration complete: Created ${guildsWithoutTowns.length} towns`);
}

ensureAllGuildsHaveTowns()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
