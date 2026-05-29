import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем standalone режим для оптимизации Docker-образа
  output: 'standalone',

  // Разрешаем ngrok-хост и локальный IP для HMR в dev-режиме
  allowedDevOrigins: [
    'balcony-puppy-carless.ngrok-free.dev',
    '192.168.0.165',
    '192.168.0.165:3000',
  ],

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
