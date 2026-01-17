module.exports = {
  apps: [
    {
      name: "memeverse",

      // Next.js production server
      script: "node_modules/next/dist/bin/next",
      args: "start -p 5500",

      cwd: "/home/ubuntu/memeverse",

      instances: 1,
      autorestart: true,
      watch: false,

      env: {
        // Core
        NODE_ENV: "production",

        // Frontend site URL (SEO, canonical, sharing)
        NEXT_PUBLIC_SITE_URL: "https://memeverse.in",

        // Backend API base (Server + Client fetch)
        NEXT_PUBLIC_BACKEND_API_BASE: "https://memeverse.in/api",
      },
    },
  ],
};
