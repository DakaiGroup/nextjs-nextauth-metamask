# NextJs Metamask Authentication with NextAuth

Made by [<img src="https://github.com/DakaiGroup/nextjs-nextauth-metamask/raw/main/dakai-logo.png" height="18" />](https://www.dakai.io/).

## Purpose

This project demonstrates how to authenticate with [Metamask](https://metamask.io/) using [Next.js](https://nextjs.org) and [NextAuth.js](https://next-auth.js.org).

The same structure and idea can be used for authentication using any other crypto wallet that has a browser extension.

This example stores the generated nonce in a database with the user data. To use a database with NextAuth you need to set up an adapter. See the [docs](https://next-auth.js.org/adapters/overview) for more information about the available adapters. For this example we used [Prisma](https://www.prisma.io/) with SQLite for ease of implementation. For production environments please don't use SQLite.

## Getting Started

### Prerequisites

- [NodeJS ^18.15](https://nodejs.org/en/)
- [Yarn ^1.22](https://yarnpkg.com/)

### Quickstart

```bash
git clone https://github.com/DakaiGroup/nextjs-nextauth-metamask.git
cd nextjs-nextauth-metamask
yarn
yarn dev
```

## How it works

See blogpost?