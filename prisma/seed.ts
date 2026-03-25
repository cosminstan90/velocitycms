import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const passwordHash = await bcrypt.hash('changeme123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@velocitycms.local' },
    update: {},
    create: {
      email: 'admin@velocitycms.local',
      name: 'Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  })
  console.log('Created admin user:', admin.email)

  // Create default site
  const site = await prisma.site.upsert({
    where: { domain: 'localhost:3000' },
    update: {},
    create: {
      name: 'My Site',
      domain: 'localhost:3000',
      description: 'Default VelocityCMS site',
      timezone: 'Europe/Bucharest',
      language: 'ro',
      isActive: true,
    },
  })
  console.log('Created site:', site.name)

  // Create UserSiteAccess
  await prisma.userSiteAccess.upsert({
    where: { userId_siteId: { userId: admin.id, siteId: site.id } },
    update: {},
    create: {
      userId: admin.id,
      siteId: site.id,
      role: Role.ADMIN,
    },
  })
  console.log('Linked admin to site')

  // Create default SeoSettings
  await prisma.seoSettings.upsert({
    where: { siteId: site.id },
    update: {},
    create: {
      siteId: site.id,
      siteName: 'My Site',
      siteUrl: 'http://localhost:3000',
      gscConnected: false,
    },
  })
  console.log('Created SEO settings')

  // Create default SiteScheduleSettings
  await prisma.siteScheduleSettings.upsert({
    where: { siteId: site.id },
    update: {},
    create: {
      siteId: site.id,
      maxPerDay: 3,
      preferredTimes: ['09:00', '14:00', '18:00'],
      timezone: 'Europe/Bucharest',
      isActive: true,
    },
  })
  console.log('Created schedule settings')

  // Seed breed-specific fields for divet sites (one-time only)
  if (site.domain.includes('divet')) {
    const currentCount = await prisma.fieldDefinition.count({ where: { siteId: site.id } })
    if (currentCount === 0) {
      await prisma.fieldDefinition.createMany({
        data: [
          {
            siteId: site.id,
            postType: 'POST',
            fieldKey: 'breed',
            fieldLabel: 'Rasă',
            fieldType: 'TEXT',
            isRequired: false,
            showInSchema: true,
            schemaProperty: 'breed',
            sortOrder: 1,
          },
          {
            siteId: site.id,
            postType: 'POST',
            fieldKey: 'size',
            fieldLabel: 'Talie',
            fieldType: 'SELECT',
            fieldOptions: JSON.stringify([
              { value: 'mica', label: 'Mică' },
              { value: 'medie', label: 'Medie' },
              { value: 'mare', label: 'Mare' },
              { value: 'f-mare', label: 'Foarte mare' },
            ]),
            isRequired: false,
            showInSchema: false,
            schemaProperty: null,
            sortOrder: 2,
          },
          {
            siteId: site.id,
            postType: 'POST',
            fieldKey: 'lifespan',
            fieldLabel: 'Speranță de viață',
            fieldType: 'TEXT',
            isRequired: false,
            showInSchema: true,
            schemaProperty: 'lifespan',
            sortOrder: 3,
          },
          {
            siteId: site.id,
            postType: 'POST',
            fieldKey: 'temperament',
            fieldLabel: 'Temperament',
            fieldType: 'TEXTAREA',
            isRequired: false,
            showInSchema: false,
            schemaProperty: null,
            sortOrder: 4,
          },
          {
            siteId: site.id,
            postType: 'POST',
            fieldKey: 'weight',
            fieldLabel: 'Greutate medie',
            fieldType: 'TEXT',
            isRequired: false,
            showInSchema: true,
            schemaProperty: 'weight',
            sortOrder: 5,
          },
        ],
      })
      console.log('Seeded divet breed-specific field definitions')
    }
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
