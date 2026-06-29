'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import { 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Clock,
  TrendingUp,
  Zap,
  Package,
  Settings as SettingsIcon,
  Save,
  RefreshCw
} from 'lucide-react';

interface BannerSettings {
  enabled: boolean;
  autoRotateSeconds: number;
  showPopularOnly: boolean;
  showPromotionsOnly: boolean;
  showCombosOnly: boolean;
  minOrderCount: number;
  maxBanners: number;
}

interface BannerPreview {
  id: string;
  type: string;
  name: string;
  price: number;
  discount?: number;
  badge?: string;
}

export default function SmartBannerAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<BannerSettings>({
    enabled: true,
    autoRotateSeconds: 5,
    showPopularOnly: false,
    showPromotionsOnly: false,
    showCombosOnly: false,
    minOrderCount: 5,
    maxBanners: 5,
  });
  const [preview, setPreview] = useState<BannerPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/home');
      } else {
        loadSettings();
        loadPreview();
      }
    }
  }, [status, session, router]);

  const loadSettings = async () => {
    try {
      // Загружаем настройки из системных настроек
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        const smartBannerSettings = data.settings.find(
          (s: any) => s.key === 'smart_banner'
        );
        if (smartBannerSettings) {
          setSettings(JSON.parse(smartBannerSettings.value));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    try {
      const res = await fetch('/api/smart-banner');
      const data = await res.json();
      if (data.success) {
        setPreview(data.banners.slice(0, 3));
      }
    } catch (error) {
      console.error('Ошибка загрузки превью:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'smart_banner',
          value: JSON.stringify(settings),
        }),
      });
      if (res.ok) {
        alert('Настройки сохранены');
        loadPreview(); // Обновляем превью после сохранения
      } else {
        alert('Ошибка сохранения настроек');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-muted)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--brand)] mx-auto mb-2" />
          <p className="text-sm text-[var(--fg-muted)]">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-muted)]">
      <AdminHeader />
      
      <div className="container-page max-w-6xl py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Smart Hero Banner</h1>
              <p className="text-sm text-[var(--fg-muted)]">
                Автоматический баннер на основе популярных товаров
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Основные настройки */}
          <div className="surface p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Основные настройки
                </h2>
                <p className="text-sm text-[var(--fg-muted)] mt-1">
                  Управление отображением и поведением баннера
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Включить/Выключить */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)]">
                <div>
                  <p className="font-bold text-sm">Включить Smart Banner</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Показывать баннер на главной странице
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
                  }
                  className="transition-all active:scale-95"
                >
                  {settings.enabled ? (
                    <ToggleRight className="w-12 h-12 text-[var(--brand)]" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-[var(--fg-subtle)]" />
                  )}
                </button>
              </div>

              {/* Время автопрокрутки */}
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[var(--brand)]" />
                  <p className="font-bold text-sm">Время автопрокрутки</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    step="1"
                    value={settings.autoRotateSeconds}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoRotateSeconds: Number(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="font-bold text-sm w-12 text-right">
                    {settings.autoRotateSeconds} сек
                  </span>
                </div>
              </div>

              {/* Количество баннеров */}
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-[var(--brand)]" />
                  <p className="font-bold text-sm">Количество баннеров</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={settings.maxBanners}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        maxBanners: Number(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="font-bold text-sm w-12 text-right">
                    {settings.maxBanners}
                  </span>
                </div>
              </div>

              {/* Минимальное количество заказов */}
              <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
                  <p className="font-bold text-sm">
                    Минимальное количество заказов
                  </p>
                </div>
                <p className="text-xs text-[var(--fg-muted)] mb-3">
                  Товар должен быть заказан минимум N раз для попадания в баннер
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.minOrderCount}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        minOrderCount: Number(e.target.value),
                      }))
                    }
                    className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-white"
                  />
                  <span className="text-xs text-[var(--fg-muted)]">заказов</span>
                </div>
              </div>
            </div>
          </div>

          {/* Фильтры */}
          <div className="surface p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" />
              Фильтры отображения
            </h2>
            <p className="text-sm text-[var(--fg-muted)] mb-5">
              Выберите, какие товары показывать в баннере
            </p>

            <div className="grid gap-3">
              <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] cursor-pointer hover:bg-[var(--bg)] transition">
                <div>
                  <p className="font-bold text-sm">Только популярные</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Показывать только товары с высоким рейтингом
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPopularOnly}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      showPopularOnly: e.target.checked,
                    }))
                  }
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] cursor-pointer hover:bg-[var(--bg)] transition">
                <div>
                  <p className="font-bold text-sm">Только акции</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Показывать только товары со скидками
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPromotionsOnly}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      showPromotionsOnly: e.target.checked,
                    }))
                  }
                  className="w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-muted)] cursor-pointer hover:bg-[var(--bg)] transition">
                <div>
                  <p className="font-bold text-sm">Только комбо</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                    Показывать только комбо-предложения
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showCombosOnly}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      showCombosOnly: e.target.checked,
                    }))
                  }
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          {/* Превью */}
          <div className="surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Превью баннеров</h2>
              <button
                onClick={loadPreview}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </button>
            </div>
            <p className="text-sm text-[var(--fg-muted)] mb-5">
              Первые 3 баннера, которые будут показаны пользователям
            </p>

            {preview.length > 0 ? (
              <div className="grid gap-3">
                {preview.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-muted)]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[var(--fg-muted)]">
                        {item.type === 'combo' ? 'Комбо' : 'Товар'} · {item.price} сом
                        {item.discount && ` · Скидка ${item.discount}%`}
                      </p>
                    </div>
                    {item.badge && (
                      <span className="badge badge-brand shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--fg-muted)]">
                <p className="text-sm">Нет доступных баннеров</p>
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить настройки
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
