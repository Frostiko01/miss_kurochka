"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Компонент для управления звуковыми уведомлениями о новых заказах филиала.
 * 
 * Логика работы:
 * 1. При появлении нового оплаченного заказа со статусом "pending" запускается циклическое воспроизведение звука
 * 2. Звук повторяется бесконечно (loop = true) пока сотрудник не примет заказ
 * 3. При принятии заказа (изменении статуса с "pending") звук останавливается
 * 4. Учитывает ограничения браузеров на автовоспроизведение (User Gesture Policy)
 */

const POLL_INTERVAL = 10_000; // Проверка каждые 10 секунд

export default function OrderSoundNotification() {
  const { data: session, status } = useSession();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const pendingOrderIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // Инициализация аудио элемента
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/uvedomlenie.mp3");
      audio.loop = true; // Зацикливаем звук
      audio.preload = "auto"; // Предзагрузка для мобильных
      audio.volume = 1.0; // Максимальная громкость
      
      // Важно для мобильных: добавляем атрибуты
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      
      audioRef.current = audio;

      // Обработчики событий для отслеживания состояния
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      const handleError = (e: Event) => {
        console.error("Ошибка загрузки звука:", e);
      };
      
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      
      // 🔊 ИСПРАВЛЕНИЕ: Разблокировка аудио на мобильных устройствах
      // При первом действии пользователя инициализируем AudioContext и воспроизводим пустой звук
      const unlockAudio = async () => {
        try {
          // Инициализация AudioContext (обязательно для iOS/Android)
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            const buffer = audioContext.createBuffer(1, 1, 22050);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(0);
            await audioContext.resume();
          }
          
          // Загружаем и пробуем воспроизвести реальный звук (с mute)
          if (audioRef.current) {
            audioRef.current.load();
            const originalVolume = audioRef.current.volume;
            audioRef.current.volume = 0; // Беззвучно
            try {
              await audioRef.current.play();
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            } catch {}
            audioRef.current.volume = originalVolume; // Восстанавливаем громкость
          }
          
          console.log("✅ Аудио разблокировано на мобильном устройстве");
        } catch (error) {
          console.warn("⚠️ Не удалось разблокировать аудио:", error);
        }
      };
      
      // Слушаем любое взаимодействие пользователя
      document.addEventListener("touchstart", unlockAudio, { once: true });
      document.addEventListener("click", unlockAudio, { once: true });
      document.addEventListener("keydown", unlockAudio, { once: true });

      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, []);

  // Функция для получения количества новых заказов
  const fetchPendingOrders = async () => {
    if (!mountedRef.current || status !== "authenticated") return;
    
    try {
      const response = await fetch("/api/branch/orders?status=pending");
      if (!response.ok) return;
      
      const data = await response.json();
      const orders = data.orders || [];
      const count = orders.length;
      
      if (!mountedRef.current) return;
      
      // Создаём Set из текущих ID pending заказов
      const currentPendingIds = new Set<string>(orders.map((o: any) => o.id));
      
      setPendingOrdersCount(count);

      // Если есть новые pending заказы (которых не было раньше) и звук включен
      const hasNewOrders = Array.from(currentPendingIds).some(
        id => !pendingOrderIdsRef.current.has(id)
      );

      if (hasNewOrders && count > 0 && isSoundEnabled && audioRef.current) {
        // Запускаем звук
        try {
          // Убеждаемся что звук загружен
          if (audioRef.current.readyState < 2) {
            await audioRef.current.load();
          }
          await audioRef.current.play();
        } catch (error) {
          console.warn("Не удалось воспроизвести звук уведомления:", error);
          // Если автовоспроизведение заблокировано - НЕ отключаем звук
          // Пользователь включил его сознательно
        }
      }
      
      // Если pending заказов больше нет - останавливаем звук
      if (count === 0 && isPlaying && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Обновляем сохранённый список ID
      pendingOrderIdsRef.current = currentPendingIds;
    } catch (error) {
      console.error("Ошибка при получении заказов:", error);
    }
  };

  // Polling для проверки новых заказов
  useEffect(() => {
    if (status !== "authenticated" || !isSoundEnabled) return;

    mountedRef.current = true;
    
    // Первая проверка сразу
    fetchPendingOrders();
    
    // Регулярная проверка
    const interval = setInterval(fetchPendingOrders, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [status, isSoundEnabled]);

  // Обработчик включения/выключения звука
  const toggleSound = async () => {
    if (!isSoundEnabled) {
      // Включаем звук - это User Gesture, теперь autoplay будет работать
      setIsSoundEnabled(true);
      
      // Пробуем сразу воспроизвести если есть pending заказы
      if (pendingOrdersCount > 0 && audioRef.current) {
        try {
          // Сначала загружаем
          await audioRef.current.load();
          // Потом воспроизводим
          await audioRef.current.play();
        } catch (error) {
          console.warn("Не удалось воспроизвести звук:", error);
          // Показываем пользователю что нужно дать разрешение
          alert("Для воспроизведения звука необходимо разрешение браузера. Пожалуйста, включите звук в настройках сайта.");
        }
      }
    } else {
      // Выключаем звук
      setIsSoundEnabled(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  // Не показываем кнопку для не-филиалов
  if (status !== "authenticated" || session?.user?.role !== "branch") {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {/* Индикатор активных уведомлений */}
      {isPlaying && pendingOrdersCount > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg animate-pulse"
          style={{
            backgroundColor: "rgba(251, 191, 36, 0.15)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#fbbf24" }}
          />
          <span
            className="text-xs font-bold"
            style={{ color: "#fbbf24" }}
          >
            {pendingOrdersCount} {pendingOrdersCount === 1 ? "новый" : "новых"}
          </span>
        </div>
      )}

      {/* Кнопка управления звуком */}
      <button
        onClick={toggleSound}
        className="p-2 rounded-lg transition-all relative"
        style={{
          backgroundColor: isSoundEnabled ? "rgba(124, 140, 165, 0.2)" : "#0B0F14",
          color: isSoundEnabled ? "#7C8CA5" : "#98A2B3",
          border: `1px solid ${isSoundEnabled ? "#7C8CA5" : "#2A3442"}`,
        }}
        title={isSoundEnabled ? "Выключить звуковые уведомления" : "Включить звуковые уведомления"}
        aria-label={isSoundEnabled ? "Выключить звук" : "Включить звук"}
      >
        {isSoundEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
        
        {/* Индикатор воспроизведения */}
        {isPlaying && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping"
            style={{ backgroundColor: "#fbbf24" }}
          />
        )}
      </button>
    </div>
  );
}
