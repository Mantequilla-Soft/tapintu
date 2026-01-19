# Tapintu

**Blogmaxxing Tools for Hive**

A Node.js Express application that displays Hive posts from creators supported by @commentrewarder. Tapintu helps surface quality content that rewards engagement and comments.

## What It Does

Tapintu automatically:
1. Fetches accounts followed by @commentrewarder
2. Checks their latest posts (up to 20 per account)
3. Displays only posts that have @commentrewarder as a beneficiary
4. Filters out posts older than 7 days (already paid out)
5. Shows the beneficiary percentage given to commentrewarder

## Features

- 🎨 **Beautiful UI** - Clean, modern design with Tailwind CSS
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 💬 **Comment Rewards** - Shows posts that reward comments via commentrewarder
- 📊 **Beneficiary Display** - See the percentage allocated to commentrewarder
- 🔗 **Multi-Frontend Links** - View posts on Snapie, PeakD, Ecency, or Hive.blog
- ⚡ **Fast API** - Powered by HAFsql for quick data retrieval
- 📱 **Responsive** - Works great on desktop and mobile

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Mantequilla-Soft/tapintu.git
cd tapintu
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Adjust settings if needed (default port is 3000)

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

- `GET /api/feed` - Get feed of posts from @commentrewarder supported creators
- `GET /api/post/:author/:permlink` - Get specific post details

## Environment Variables

- `PORT` - Server port (default: 3000)
- `HIVE_API_URL` - HAFsql API endpoint (default: https://api.syncad.com)

## Technologies

- **Backend**: Node.js, Express, Axios
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **API**: HAFsql by Syncad
- **Blockchain**: Hive

## About

Built with ❤️ by [@meno](https://hive.blog/@meno) and [@ankapolo](https://hive.blog/@ankapolo)

Support [@snapie](https://vote.hive.uno/@snapie) for witness!

## License

MIT
