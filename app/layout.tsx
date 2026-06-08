import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  applicationName: "Miss Kurochka",
  title: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
  description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке. Заказывайте хрустящие крылышки Янгнём, Кандян, бургеры и картофель фри с доставкой на дом.",
  keywords: ["мисс курочка", "мисс курочка бишкек", "miss kurochka", "корейская курочка бишкек", "доставка еды бишкек", "хрустящая курочка", "янгнём", "кандян", "доставка курочки бишкек", "корейская кухня бишкек"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Miss Kurochka",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Мисс Курочка",
    title: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
    description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке. Заказывайте хрустящие крылышки Янгнём, Кандян, бургеры и картофель фри с доставкой на дом.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
    description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке. Заказывайте хрустящие крылышки Янгнём, Кандян, бургеры и картофель фри с доставкой на дом.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#d62300",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} h-full antialiased light`}
    >
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
