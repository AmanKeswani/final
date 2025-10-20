import { PrismaClient, UserRole, AssetStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default admin users
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@company.com' },
    update: {},
    create: {
      email: 'superadmin@company.com',
      name: 'Super Administrator',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log('✅ Super Admin created:', superAdmin.email)

  // Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      name: 'Asset Manager',
      password: hashedPassword,
      role: UserRole.MANAGER,
    },
  })
  console.log('✅ Manager created:', manager.email)

  // Create Asset Types
  const assetTypes = [
    {
      name: 'Laptop',
      description: 'Portable computing devices',
      category: 'Computing',
      configurations: [
        { name: 'Processor', dataType: 'select', options: JSON.stringify(['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9']), isRequired: true, displayOrder: 1 },
        { name: 'RAM', dataType: 'select', options: JSON.stringify(['4GB', '8GB', '16GB', '32GB', '64GB']), isRequired: true, displayOrder: 2 },
        { name: 'Storage', dataType: 'select', options: JSON.stringify(['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD', '2TB HDD']), isRequired: true, displayOrder: 3 },
        { name: 'Screen Size', dataType: 'select', options: JSON.stringify(['13 inch', '14 inch', '15 inch', '16 inch', '17 inch']), isRequired: false, displayOrder: 4 },
        { name: 'Graphics Card', dataType: 'select', options: JSON.stringify(['Integrated', 'NVIDIA GTX 1650', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'AMD Radeon']), isRequired: false, displayOrder: 5 },
        { name: 'Operating System', dataType: 'select', options: JSON.stringify(['Windows 11', 'Windows 10', 'macOS', 'Ubuntu Linux']), isRequired: true, displayOrder: 6 }
      ]
    },
    {
      name: 'Desktop',
      description: 'Desktop computing workstations',
      category: 'Computing',
      configurations: [
        { name: 'Processor', dataType: 'select', options: JSON.stringify(['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9']), isRequired: true, displayOrder: 1 },
        { name: 'RAM', dataType: 'select', options: JSON.stringify(['8GB', '16GB', '32GB', '64GB', '128GB']), isRequired: true, displayOrder: 2 },
        { name: 'Storage', dataType: 'select', options: JSON.stringify(['512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD', '2TB HDD', '4TB HDD']), isRequired: true, displayOrder: 3 },
        { name: 'Graphics Card', dataType: 'select', options: JSON.stringify(['Integrated', 'NVIDIA GTX 1660', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'NVIDIA RTX 4070', 'NVIDIA RTX 4080']), isRequired: false, displayOrder: 4 },
        { name: 'Form Factor', dataType: 'select', options: JSON.stringify(['Mini ITX', 'Micro ATX', 'ATX', 'All-in-One']), isRequired: false, displayOrder: 5 },
        { name: 'Operating System', dataType: 'select', options: JSON.stringify(['Windows 11', 'Windows 10', 'Ubuntu Linux', 'CentOS']), isRequired: true, displayOrder: 6 }
      ]
    },
    {
      name: 'Phone',
      description: 'Mobile communication devices',
      category: 'Mobile',
      configurations: [
        { name: 'Brand', dataType: 'select', options: JSON.stringify(['iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus', 'Xiaomi']), isRequired: true, displayOrder: 1 },
        { name: 'Storage', dataType: 'select', options: JSON.stringify(['64GB', '128GB', '256GB', '512GB', '1TB']), isRequired: true, displayOrder: 2 },
        { name: 'Screen Size', dataType: 'select', options: JSON.stringify(['5.4 inch', '6.1 inch', '6.4 inch', '6.7 inch', '6.8 inch']), isRequired: false, displayOrder: 3 },
        { name: 'Operating System', dataType: 'select', options: JSON.stringify(['iOS', 'Android']), isRequired: true, displayOrder: 4 },
        { name: 'Camera Quality', dataType: 'select', options: JSON.stringify(['Standard', 'Pro', 'Pro Max']), isRequired: false, displayOrder: 5 }
      ]
    },
    {
      name: 'Monitor',
      description: 'Display screens and monitors',
      category: 'Peripherals',
      configurations: [
        { name: 'Screen Size', dataType: 'select', options: JSON.stringify(['21 inch', '24 inch', '27 inch', '32 inch', '34 inch', '49 inch']), isRequired: true, displayOrder: 1 },
        { name: 'Resolution', dataType: 'select', options: JSON.stringify(['1920x1080 (FHD)', '2560x1440 (QHD)', '3840x2160 (4K)', '5120x1440 (Ultrawide)']), isRequired: true, displayOrder: 2 },
        { name: 'Panel Type', dataType: 'select', options: JSON.stringify(['IPS', 'VA', 'TN', 'OLED']), isRequired: false, displayOrder: 3 },
        { name: 'Refresh Rate', dataType: 'select', options: JSON.stringify(['60Hz', '75Hz', '144Hz', '165Hz', '240Hz']), isRequired: false, displayOrder: 4 },
        { name: 'Connectivity', dataType: 'select', options: JSON.stringify(['HDMI', 'DisplayPort', 'USB-C', 'VGA']), isRequired: false, displayOrder: 5 }
      ]
    },
    {
      name: 'Tablet',
      description: 'Portable tablet devices',
      category: 'Mobile',
      configurations: [
        { name: 'Brand', dataType: 'select', options: JSON.stringify(['iPad', 'Samsung Galaxy Tab', 'Microsoft Surface', 'Amazon Fire']), isRequired: true, displayOrder: 1 },
        { name: 'Screen Size', dataType: 'select', options: JSON.stringify(['8 inch', '10 inch', '11 inch', '12 inch', '13 inch']), isRequired: true, displayOrder: 2 },
        { name: 'Storage', dataType: 'select', options: JSON.stringify(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']), isRequired: true, displayOrder: 3 },
        { name: 'Connectivity', dataType: 'select', options: JSON.stringify(['Wi-Fi', 'Wi-Fi + Cellular']), isRequired: true, displayOrder: 4 },
        { name: 'Operating System', dataType: 'select', options: JSON.stringify(['iPadOS', 'Android', 'Windows']), isRequired: true, displayOrder: 5 }
      ]
    }
  ]

  for (const assetTypeData of assetTypes) {
    const { configurations, ...typeData } = assetTypeData
    
    const assetType = await prisma.assetType.upsert({
      where: { name: typeData.name },
      update: typeData,
      create: typeData,
    })
    
    console.log(`✅ Asset type created: ${assetType.name}`)
    
    // Create configurations for this asset type
    for (const configData of configurations) {
      await prisma.assetConfiguration.upsert({
        where: {
          // Use a composite unique constraint simulation
          id: `${assetType.id}-${configData.name}`.replace(/[^a-zA-Z0-9]/g, '-')
        },
        update: {
          ...configData,
          assetTypeId: assetType.id,
        },
        create: {
          ...configData,
          assetTypeId: assetType.id,
        },
      })
    }
    
    console.log(`  ✅ Configurations created for ${assetType.name}`)
  }

  // Create 4 unassigned assets (AVAILABLE)
  await prisma.asset.createMany({
    data: [
      {
        name: 'MacBook Pro 16"',
        brand: 'Apple',
        model: 'MacBook Pro',
        serialNumber: 'MBP-001-2025',
        category: 'Computing',
        status: AssetStatus.AVAILABLE,
      },
      {
        name: 'iPhone 15 Pro',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        serialNumber: 'IPH-001-2025',
        category: 'Mobile',
        status: AssetStatus.AVAILABLE,
      },
      {
        name: 'Dell 27" Monitor',
        brand: 'Dell',
        model: 'U2720Q',
        serialNumber: 'DL-27M-001-2025',
        category: 'Peripherals',
        status: AssetStatus.AVAILABLE,
      },
      {
        name: 'ThinkPad X1 Carbon',
        brand: 'Lenovo',
        model: 'X1 Carbon Gen 10',
        serialNumber: 'THINK-001-2025',
        category: 'Computing',
        status: AssetStatus.AVAILABLE,
      },
    ],
  })
  console.log('✅ Created 4 unassigned assets')

  console.log('🎉 Database seeding completed!')
  console.log('\n📋 Default Credentials:')
  console.log('Super Admin: superadmin@company.com / admin123')
  console.log('Manager: manager@company.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })