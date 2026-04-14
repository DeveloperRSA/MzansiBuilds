# MzansiBuilds

MzansiBuilds is a platform that enables developers to build in public by sharing their projects, tracking progress through milestones, and collaborating with other developers.

### Problem solved

Many developers build in isolation and miss support, accountability, and exposure. MzansiBuilds makes project progress visible and collaboration-friendly. This is the "TryHackMe" platform for developers :)

### Target users

- Student developers
- Junior developers building portfolios
- Professional/Senior developers building side projects in public

### Core features

- Account registration and login
- Project creation with stage and support needed
- Live feed of developer projects
- Milestone updates and comments for collaboration
- Celebration wall for completed projects

## Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS (green/white/black design theme)
- **Backend:** Next.js API Routes + File-based JSON storage
- **Security:** Password hashing with bcryptjs
- **Database:** JSON file storage (easily migratable to PostgreSQL)

## Extra Features:

## Team Collaboration Support

MzansiBuilds now supports the ability for users to create or join teams, making it easier to collaborate on projects. A team can consist of multiple members, allowing developers, students, or hackathon groups to work together within a shared workspace (note that the celebration wall is separate for teams and individual users to ensure fairness).

## Each team includes:

- The team owner/leader (admin)
- Multiple team members
- Shared access to projects and updates

## This feature makes the platform suitable for:

- Hackathon teams
- Student group projects
- Teams from different companies
- Startup teams
- Collaborative software development

The team structure is designed to scale, with future enhancements such as role-based permissions, activity tracking, and shared project dashboards.

## Run locally

```bash
# Clone and install
git clone https://github.com/DeveloperRSA/mzansi-builds.git
cd mzansi-builds
npm install

# Start development server
npm run dev

## Author
DeveloperRSA
Nomfundo Luyanda Mtiyane

## Repository structure

```text
mzansi-builds/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   └── login/route.ts
│   │   ├── projects/route.ts
│   │   ├── projects/[id]/route.ts
│   │   ├── feed/route.ts
│   │   ├── comments/route.ts
│   │   └── celebration/route.ts
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── ProjectForm.tsx
│   ├── Feed.tsx
│   ├── CelebrationWall.tsx
│   └── UpdateProgress.tsx
├── lib/
│   ├── db.ts
│   └── auth.ts
├── types/
│   └── index.ts
├── data/
│   └── db.json (auto-generated)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── postcss.config.js


