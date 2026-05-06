import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки для работы с внешними модулями
  serverExternalPackages: [
    "pg",
    "pg-pool",
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcryptjs",
  ],
  
  // Пустая конфигурация Turbopack для подавления предупреждения
  turbopack: {},
  
  // Webpack конфигурация для fallback (если Turbopack отключен)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        pg: "commonjs pg",
        "pg-pool": "commonjs pg-pool",
        "@prisma/client": "commonjs @prisma/client",
        "@prisma/adapter-pg": "commonjs @prisma/adapter-pg",
      });
    }
    return config;
  },
};

export default nextConfig;
