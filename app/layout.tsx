import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import StructuredData from "@/components/StructuredData";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://miss-kurochka.com'),
  applicationName: "Miss Kurochka",
  title: {
    default: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
    template: "%s | Miss Kurochka",
  },
  description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке. Заказывайте хрустящие крылышки Янгнём, Кандян, бургеры и картофель фри с доставкой на дом. ☎️ Звоните для заказа!",
  keywords: [
    "мисс курочка",
    "мисс курочка бишкек", 
    "miss kurochka",
    "корейская курочка бишкек",
    "доставка еды бишкек",
    "хрустящая курочка",
    "янгнём",
    "кандян",
    "доставка курочки бишкек",
    "корейская кухня бишкек",
    "бургеры бишкек",
    "картофель фри бишкек",
    "крылышки бишкек",
    "фастфуд бишкек",
    "еда на дом бишкек",
  ],
  authors: [{ name: "Miss Kurochka" }],
  creator: "Miss Kurochka",
  publisher: "Miss Kurochka",
  manifest: "/favicon/site.webmanifest",
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
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Мисс Курочка",
    title: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
    description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке. Заказывайте хрустящие крылышки Янгнём, Кандян, бургеры и картофель фри с доставкой на дом.",
    images: [
      {
        url: "/logo.png",
        width: 500,
        height: 500,
        alt: "Miss Kurochka Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Мисс Курочка Бишкек | Доставка корейской хрустящей курочки",
    description: "Официальный сайт сети заведений Мисс Курочка в Бишкеке. Заказывайте хрустящие крылышки Янгнём, Кандян, бургеры и картофель фри с доставкой на дом.",
    images: ["/logo.png"],
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
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "google-site-verification-code", // Замените на ваш код после регистрации в Google Search Console
    yandex: "0575424bed77977e", // Yandex уже настроен
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
        <StructuredData />
        <Providers>
          {children}
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
