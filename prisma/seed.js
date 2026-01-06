const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const defaultPassword = await bcrypt.hash('password123', 10)
    const arunPassword = await bcrypt.hash('arun4321', 10)

    const users = [
        { email: 'admin@trebound.com', name: 'Admin User', role: 'Admin', pwd: defaultPassword },
        { email: 'sales@trebound.com', name: 'Sales User', role: 'Sales', pwd: defaultPassword },
        { email: 'ops@trebound.com', name: 'Ops User', role: 'Ops', pwd: defaultPassword },
        { email: 'finance@trebound.com', name: 'Finance User', role: 'Finance', pwd: defaultPassword },
        { email: 'arun@trebound.com', name: 'Arun (Admin)', role: 'Admin', pwd: arunPassword },
    ]

    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                role: u.role,
                password: u.pwd // Ensure password matches if updating
            },
            create: {
                email: u.email,
                name: u.name,
                role: u.role,
                password: u.pwd,
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
