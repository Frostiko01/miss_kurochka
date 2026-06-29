'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';

interface BannerItem {
  id: string;
  type: 'menu_item' | 'combo';
  name: string;
  description: string;
  image: string | null;
  price: number;
  oldPrice?: number | null;
  discount?: number;
  badge?: string;
}

interface SmartHeroBannerProps {
  onItemClick?: (id: string, type: 'menu_item' | 'combo') => void;
}

export default function SmartHeroBanner({ onItemClick }: SmartHeroBannerProps) {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Загрузка баннеров
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/smart-banner');
      const data = await res.json();
      if (data.success && data.banners) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error('Ошибка загрузки баннеров:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Автоматическая смена каждые 5 секунд
  useEffect(() => {
    if (banners.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  };

  const handleBannerClick = () => {
    const currentBanner = banners[currentIndex];
    if (!currentBanner) return;

    if (onItemClick) {
      onItemClick(currentBanner.id, currentBanner.type);
    } else {
      // По умолчанию переходим на страницу товара
      if (currentBanner.type === 'menu_item') {
        router.push(`/menu?item=${currentBanner.id}`);
      } else {
        router.push(`/menu?combo=${currentBanner.id}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="surface overflow-hidden relative h-[200px] animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-soft)] to-[var(--brand-tint)]" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="surface overflow-hidden relative h-[200px] group cursor-pointer"
      onClick={handleBannerClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        background: currentBanner.image
          ? 'transparent'
          : 'linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%)',
      }}
    >
      {/* Фоновое изображение */}
      {currentBanner.image && (
        <div className="absolute inset-0">
          <img
            src={currentBanner.image}
            alt={currentBanner.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ objectFit: 'cover' }}
          />
          {/* Градиентный оверлей для читаемости текста */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Контент баннера */}
      <div className="relative h-full flex items-center justify-between px-5 sm:px-8 gap-4">
        {/* Левая часть - текст */}
        <div className="flex-1 z-10">
          {/* Бейджик */}
          {currentBanner.badge && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-extrabold mb-3 animate-fade-in backdrop-blur-md"
              style={{
                background: 'rgba(255, 77, 0, 0.9)',
                boxShadow: '0 4px 16px rgba(255, 77, 0, 0.4)',
              }}
            >
              {currentBanner.badge === 'Популярное' && (
                <Flame className="w-3.5 h-3.5" />
              )}
              {currentBanner.badge === 'Новинка' && (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {currentBanner.badge}
            </span>
          )}

          {/* Название */}
          <h2
            className={`text-2xl sm:text-3xl font-black leading-tight mb-2 animate-slide-up ${
              currentBanner.image ? 'text-white' : 'text-[var(--fg)]'
            }`}
            style={{
              textShadow: currentBanner.image
                ? '0 2px 12px rgba(0,0,0,0.5)'
                : 'none',
            }}
          >
            {currentBanner.name}
          </h2>

          {/* Описание */}
          {currentBanner.description && (
            <p
              className={`text-sm mb-3 max-w-md line-clamp-2 animate-fade-in ${
                currentBanner.image
                  ? 'text-white/90'
                  : 'text-[var(--fg-muted)]'
              }`}
              style={{
                textShadow: currentBanner.image
                  ? '0 1px 8px rgba(0,0,0,0.4)'
                  : 'none',
              }}
            >
              {currentBanner.description}
            </p>
          )}

          {/* Цена */}
          <div className="flex items-center gap-3 mb-4">
            {currentBanner.oldPrice && currentBanner.discount && (
              <div className="flex flex-col">
                <span
                  className={`text-xs line-through font-semibold ${
                    currentBanner.image
                      ? 'text-white/60'
                      : 'text-[var(--fg-subtle)]'
                  }`}
                >
                  {currentBanner.oldPrice} сом
                </span>
                <span
                  className="inline-block px-2 py-0.5 rounded-md text-xs font-extrabold"
                  style={{
                    background: '#ff4d00',
                    color: 'white',
                  }}
                >
                  −{currentBanner.discount}%
                </span>
              </div>
            )}
            <div>
              <span
                className={`text-3xl sm:text-4xl font-black ${
                  currentBanner.image ? 'text-white' : 'text-[var(--brand)]'
                }`}
                style={{
                  textShadow: currentBanner.image
                    ? '0 2px 16px rgba(255, 77, 0, 0.8)'
                    : 'none',
                }}
              >
                {currentBanner.price}
              </span>
              <span
                className={`text-sm font-bold ml-1 ${
                  currentBanner.image ? 'text-white/80' : 'text-[var(--fg-muted)]'
                }`}
              >
                сом
              </span>
            </div>
          </div>

          {/* Кнопка заказать */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBannerClick();
            }}
            className="btn btn-primary shadow-lg hover:shadow-xl transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ff4d00 0%, #d62300 100%)',
              border: 'none',
            }}
          >
            Заказать
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Правая часть - изображение товара (если нет фона) */}
        {!currentBanner.image && (
          <div className="hidden sm:block w-32 h-32 shrink-0 animate-float">
            <div className="w-full h-full text-7xl flex items-center justify-center">
              🍗
            </div>
          </div>
        )}
      </div>

      {/* Кнопки навигации */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            aria-label="Предыдущий"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            aria-label="Следующий"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Индикаторы */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 3000);
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/40 w-1.5 hover:bg-white/60'
              }`}
              aria-label={`Баннер ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Анимации */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
