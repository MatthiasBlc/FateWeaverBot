import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migrates existing characters to the new multi-character system
 * Run this AFTER the schema migration
 * 
 * This script:
 * 1. Sets the first character as active for each user-town combination
 * 2. Sets all other characters as inactive
 * 3. Initializes isDead and canReroll fields
 */
async function migrateCharactersToTowns() {
  console.log('🔄 Starting character migration to multi-character system...');

  // Get all characters
  const characters = await prisma.character.findMany({
    include: {
      user: {
        select: {
          username: true,
          discordId: true
        }
      },
      town: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`Found ${characters.length} characters to process`);

  if (characters.length === 0) {
    console.log('✅ No characters to migrate');
    return;
  }

  // Group characters by user and town
  const userTownMap = new Map<string, Array<{ id: string; createdAt: Date; name: string }>>();

  for (const char of characters) {
    const key = `${char.userId}-${char.townId}`;
    if (!userTownMap.has(key)) {
      userTownMap.set(key, []);
    }
    userTownMap.get(key)!.push({
      id: char.id,
      createdAt: char.createdAt,
      name: char.name
    });
  }

  console.log(`\nFound ${userTownMap.size} unique user-town combinations`);

  // Process each user-town combination
  let activeCount = 0;
  let inactiveCount = 0;

  for (const [key, characterList] of userTownMap.entries()) {
    const [userId, townId] = key.split('-');
    
    // Sort by creation date (oldest first)
    characterList.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Get user and town info for logging
    const firstChar = characters.find(c => c.id === characterList[0].id);
    const username = firstChar?.user.username || 'Unknown';
    const townName = firstChar?.town.name || 'Unknown';

    // Set first character as active
    await prisma.character.update({
      where: { id: characterList[0].id },
      data: {
        isActive: true,
        isDead: false,
        canReroll: false
      }
    });
    activeCount++;
    console.log(`✅ Set "${characterList[0].name}" as active for ${username} in ${townName}`);

    // Set remaining characters as inactive
    if (characterList.length > 1) {
      for (let i = 1; i < characterList.length; i++) {
        await prisma.character.update({
          where: { id: characterList[i].id },
          data: {
            isActive: false,
            isDead: false,
            canReroll: false
          }
        });
        inactiveCount++;
        console.log(`   ℹ️  Set "${characterList[i].name}" as inactive`);
      }
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   - Total characters: ${characters.length}`);
  console.log(`   - Active characters: ${activeCount}`);
  console.log(`   - Inactive characters: ${inactiveCount}`);
  console.log(`   - User-town combinations: ${userTownMap.size}`);

  // Verify migration
  console.log('\n🔍 Verifying migration...');

  const activeCharacters = await prisma.character.findMany({
    where: { isActive: true }
  });

  console.log(`   - Found ${activeCharacters.length} active characters`);

  // Check for duplicate active characters per user-town
  const activeMap = new Map<string, number>();
  for (const char of activeCharacters) {
    const key = `${char.userId}-${char.townId}`;
    activeMap.set(key, (activeMap.get(key) || 0) + 1);
  }

  const duplicates = Array.from(activeMap.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.error('❌ ERROR: Found duplicate active characters:');
    for (const [key, count] of duplicates) {
      console.error(`   - ${key}: ${count} active characters`);
    }
    throw new Error('Migration verification failed: duplicate active characters found');
  }

  console.log('   ✅ No duplicate active characters found');
  console.log('\n✅ Migration complete!');
}

migrateCharactersToTowns()
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
