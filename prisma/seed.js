const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const users = [
        { email: 'admin@trebound.com', name: 'Admin User', role: 'Admin' },
        { email: 'sales@trebound.com', name: 'Sales User', role: 'Sales' },
        { email: 'ops@trebound.com', name: 'Ops User', role: 'Ops' },
        { email: 'finance@trebound.com', name: 'Finance User', role: 'Finance' },
    ]

    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                name: u.name,
                role: u.role,
                password,
            },
        })
        console.log(`Created user: ${user.email}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
