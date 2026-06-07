"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import Select from "@/components/ui/Select";
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";

interface StopListItem {
  id: string;
  reason: string | null;
  stoppedAt: string;
  expectedReturnAt: string | null;
  menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: {
      name: string;
    };
    images: {
      imageUrl: string;
      isPrimary: boolean;
    }[];
  };
  stopper: {
    fullName: string;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: {
    name: string;
  };
  images: {
    imageUrl: string;
  }[];
  stopList: {
    id: string;
  }[];
}

export default function BranchStopListPage() {
  const [stopList, setStopList] = useState<StopListItem[]>([]);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  // Поиск и фильтры
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stoppedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  
  // Модальные окна
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StopListItem | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  
  // Форма добавления
  const [addFormData, setAddFormData] = useState({
    menuItemId: "",
    reason: "",
    expectedReturnAt: "",
  });
  
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchStopList();
    fetchCategories();
    // fetchAvailableItems вызывается в эффекте ниже (срабатывает и на маунте),
    // поэтому здесь его не дублируем.
  }, []);

  useEffect(() => {
    fetchAvailableItems(); // Загрузка меню + обновление при смене фильтра категории
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/branch/categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchStopList = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/branch/stop-list");
      const data = await response.json();

      if (response.ok) {
        setStopList(data.stopList);
      }
    } catch (error) {
      console.error("Error fetching stop list:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      setLoadingMenu(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);
      
      const response = await fetch(`/api/branch/menu?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Фильтруем только доступные блюда (не в стоп-листе)
        const available = data.menuItems.filter((item: MenuItem) => item.stopList.length === 0);
        setAvailableItems(available);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoadingMenu(false);
    }
  };

  const openAddModal = () => {
    setAddFormData({
      menuItemId: "",
      reason: "",
      expectedReturnAt: "",
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedMenuItem(null);
    setShowConfirmAddModal(false);
    setAddFormData({
      menuItemId: "",
      reason: "",
      expectedReturnAt: "",
    });
  };

  const openConfirmAddModal = () => {
    setShowConfirmAddModal(true);
  };

  const closeConfirmAddModal = () => {
    setShowConfirmAddModal(false);
  };

  const handleAddToStopList = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/branch/stop-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: addFormData.menuItemId,
          reason: addFormData.reason || null,
          expectedReturnAt: addFormData.expectedReturnAt || null,
        }),
      });

      if (response.ok) {
        setToast({
          message: "Блюдо добавлено в стоп-лист!",
          type: "success",
        });
        fetchStopList();
        fetchAvailableItems(); // Обновляем список доступных блюд
        closeAddModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при добавлении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error adding to stop list:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  const openRestoreModal = (item: StopListItem) => {
    setSelectedItem(item);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setSelectedItem(null);
  };

  const handleRestore = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch("/api/branch/stop-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id }),
      });

      if (response.ok) {
        setToast({
          message: `Блюдо "${selectedItem.menuItem.name}" восстановлено!`,
          type: "success",
        });
        fetchStopList();
        closeRestoreModal();
      } else {
        setToast({
          message: "Ошибка при восстановлении блюда",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  // Фильтрация и сортировка
  const filteredStopList = stopList.filter(item => {
    const matchesSearch = item.menuItem.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.menuItem.category.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.menuItem.category.name === categories.find(c => c.id === categoryFilter)?.name;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "name":
        aValue = a.menuItem.name.toLowerCase();
        bValue = b.menuItem.name.toLowerCase();
        break;
      case "category":
        aValue = a.menuItem.category.name.toLowerCase();
        bValue = b.menuItem.category.name.toLowerCase();
        break;
      case "price":
        aValue = a.menuItem.price;
        bValue = b.menuItem.price;
        break;
      case "stoppedAt":
        aValue = new Date(a.stoppedAt).getTime();
        bValue = new Date(b.stoppedAt).getTime();
        break;
      default:
        aValue = new Date(a.stoppedAt).getTime();
        bValue = new Date(b.stoppedAt).getTime();
    }
    
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight" style={{ color: 'white' }}>
          Стоп-лист
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#98A2B3' }}>
          Управление недоступными блюдами
        </p>
      </div>

      {/* Search, Filters and Actions - NEW STRUCTURE */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#1A212B', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex flex-col gap-4">
          {/* Row 1: Search + Filters Button + Add Button */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#98A2B3' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск блюд в стоп-листе..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border"
                  style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ 
                backgroundColor: categoryFilter !== "all" ? '#7C8CA5' : '#2A3442' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтры
              <svg 
                className="w-4 h-4 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: showFiltersMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Add Button */}
            <button
              onClick={openAddModal}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center"
              style={{ backgroundColor: '#7C8CA5' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#93A4BF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C8CA5'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить в стоп-лист
            </button>
          </div>

          {/* Row 2: Expandable Filters Container */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              maxHeight: showFiltersMenu ? '1000px' : '0',
              opacity: showFiltersMenu ? 1 : 0
            }}
          >
            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: '#98A2B3' }}>
                  Фильтры и сортировка
                </h3>
                {categoryFilter !== "all" && (
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    Сбросить все
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Sorting Card */}
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                    Сортировка
                  </label>
                  <Select dark="branch"
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      { value: 'stoppedAt', label: 'По дате добавления' },
                      { value: 'name', label: 'По названию' },
                      { value: 'category', label: 'По категории' },
                      { value: 'price', label: 'По цене' },
                    ]}
                  />
                </div>

                {/* Category Filter Card */}
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                    Категория
                  </label>
                  <Select dark="branch"
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[
                      { value: 'all', label: 'Все категории' },
                      ...categories.map(cat => ({ value: cat.id, label: cat.name })),
                    ]}
                  />
                </div>

                {/* Sort Order Toggle */}
                <div className="rounded-xl p-4 border flex-1 flex flex-col justify-end" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                    Порядок
                  </label>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setSortOrder("asc")}
                      className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: sortOrder === "asc" ? '#7C8CA5' : '#1A212B',
                        color: sortOrder === "asc" ? 'white' : '#98A2B3',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: sortOrder === "asc" ? '#7C8CA5' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-sm">А-Я</span>
                    </button>
                    <button
                      onClick={() => setSortOrder("desc")}
                      className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: sortOrder === "desc" ? '#7C8CA5' : '#1A212B',
                        color: sortOrder === "desc" ? 'white' : '#98A2B3',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: sortOrder === "desc" ? '#7C8CA5' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-sm">Я-А</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stop List Content */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1A212B' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto"></div>
            <p className="mt-4 font-semibold" style={{ color: '#98A2B3' }}>Загрузка...</p>
          </div>
        ) : filteredStopList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(24, 31, 56, 0.5)' }}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: 'white' }}>
              {search || categoryFilter !== "all" ? "Ничего не найдено" : "Стоп-лист пуст"}
            </h3>
            <p className="text-slate-300 mb-6">
              {search || categoryFilter !== "all" ? "Попробуйте изменить параметры поиска" : "Все блюда доступны для заказа"}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {filteredStopList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-6 border transition-all"
                  style={{ backgroundColor: '#0B0F14', borderColor: '#ef4444' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f87171'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ef4444'}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl overflow-hidden" style={{ backgroundColor: '#1A212B' }}>
                        {item.menuItem.images[0]?.imageUrl ? (
                          <img src={item.menuItem.images[0].imageUrl} alt={item.menuItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase mb-2" style={{ color: '#98A2B3' }}>
                        {item.menuItem.category.name}
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">{item.menuItem.name}</h3>
                      {item.menuItem.description && (
                        <p className="text-sm mb-3" style={{ color: '#98A2B3' }}>{item.menuItem.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 mb-4">
                        <div className="text-xl font-black" style={{ color: '#7C8CA5' }}>
                          {item.menuItem.price} <span className="text-sm" style={{ color: '#98A2B3' }}>сом</span>
                        </div>
                      </div>

                      {/* Stop Info */}
                      <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
                            Остановлено: {new Date(item.stoppedAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm font-bold" style={{ color: '#98A2B3' }}>
                            Кем: {item.stopper.fullName}
                          </span>
                        </div>

                        {item.reason && (
                          <div className="pt-2 border-t" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <span className="text-xs font-bold uppercase" style={{ color: '#98A2B3' }}>Причина:</span>
                            <p className="text-sm font-bold text-white mt-1">{item.reason}</p>
                          </div>
                        )}

                        {item.expectedReturnAt && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold" style={{ color: '#98A2B3' }}>
                              Ожидается: {new Date(item.expectedReturnAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center">
                      <button
                        onClick={() => openRestoreModal(item)}
                        className="px-6 py-3 rounded-xl font-bold transition-all text-white flex items-center gap-2"
                        style={{ backgroundColor: '#22c55e' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Восстановить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to Stop List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,15,20,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Добавить блюдо в стоп-лист</h3>
                <button onClick={closeAddModal} className="p-2 rounded-lg transition-all" style={{ color: '#98A2B3' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#202937';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#98A2B3';
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedMenuItem ? (
              <form onSubmit={(e) => { e.preventDefault(); openConfirmAddModal(); }} className="p-6 space-y-4">
                {/* Selected Item Preview */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#1A212B' }}>
                      {selectedMenuItem.images[0]?.imageUrl ? (
                        <img src={selectedMenuItem.images[0].imageUrl} alt={selectedMenuItem.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase mb-1" style={{ color: '#98A2B3' }}>{selectedMenuItem.category.name}</p>
                      <h4 className="text-lg font-bold text-white">{selectedMenuItem.name}</h4>
                      <p className="text-sm font-bold" style={{ color: '#7C8CA5' }}>{selectedMenuItem.price} сом</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMenuItem(null)}
                      className="p-2 rounded-lg transition-all"
                      style={{ color: '#98A2B3' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#202937';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#98A2B3';
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Причина (необязательно)</label>
                  <textarea
                    value={addFormData.reason}
                    onChange={(e) => setAddFormData({ ...addFormData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-white border resize-none"
                    style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}
                    placeholder="Например: Закончились ингредиенты"
                  />
                </div>

                {/* Expected Return */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Ожидаемое время возврата (необязательно)</label>
                  <input
                    type="datetime-local"
                    value={addFormData.expectedReturnAt}
                    onChange={(e) => setAddFormData({ ...addFormData, expectedReturnAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white border"
                    style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMenuItem(null)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                    style={{ backgroundColor: '#202937' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A3442'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202937'}
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={openConfirmAddModal}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                    style={{ backgroundColor: '#ef4444' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    Добавить в стоп-лист
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                {/* Available Items List */}
                {loadingMenu ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto" style={{ borderColor: '#202937', borderTopColor: '#7C8CA5' }}></div>
                    <p className="mt-4 font-semibold" style={{ color: '#98A2B3' }}>Загрузка меню...</p>
                  </div>
                ) : availableItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#202937' }}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#F3F5F7' }}>Нет доступных блюд</h3>
                    <p style={{ color: '#98A2B3' }}>Все блюда уже в стоп-листе</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                    {availableItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedMenuItem(item);
                          setAddFormData({ ...addFormData, menuItemId: item.id });
                        }}
                        className="rounded-xl p-4 border transition-all text-left"
                        style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7C8CA5'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#202937'}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#1A212B' }}>
                            {item.images[0]?.imageUrl ? (
                              <img src={item.images[0].imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase mb-1" style={{ color: '#98A2B3' }}>{item.category.name}</p>
                            <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                            <p className="text-sm font-bold" style={{ color: '#7C8CA5' }}>{item.price} сом</p>
                          </div>
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#7C8CA5' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Add to Stop List Modal */}
      {showConfirmAddModal && selectedMenuItem && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ backgroundColor: 'rgba(11,15,20,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ backgroundColor: '#1A212B' }}>
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <svg className="w-6 h-6" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Добавить в стоп-лист?</h3>
                  <p className="text-sm" style={{ color: '#98A2B3' }}>Блюдо станет недоступным</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-white mb-2">
                Вы точно хотите добавить блюдо{' '}
                <span className="font-bold" style={{ color: '#7C8CA5' }}>"{selectedMenuItem.name}"</span>{' '}
                в стоп-лист?
              </p>
              <p className="text-sm mb-4" style={{ color: '#98A2B3' }}>
                Оно станет недоступным для заказа в вашем филиале.
              </p>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p className="text-sm flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Клиенты не смогут заказать это блюдо
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#202937' }}>
              <button
                onClick={closeConfirmAddModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#202937' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A3442'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202937'}
              >
                Отмена
              </button>
              <button
                onClick={(e) => {
                  closeConfirmAddModal();
                  handleAddToStopList(e);
                }}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#ef4444' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Да, добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(11,15,20,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ backgroundColor: '#1A212B' }}>
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                  <svg className="w-6 h-6" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Восстановить блюдо?</h3>
                  <p className="text-sm" style={{ color: '#98A2B3' }}>Это действие можно отменить</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-white mb-2">
                Вы уверены, что хотите восстановить блюдо{' '}
                <span className="font-bold" style={{ color: '#7C8CA5' }}>"{selectedItem.menuItem.name}"</span>?
              </p>
              <p className="text-sm mb-4" style={{ color: '#98A2B3' }}>
                Оно снова станет доступным для заказа в вашем филиале.
              </p>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <p className="text-sm" style={{ color: '#22c55e' }}>
                  ✓ Блюдо появится в меню для клиентов
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#202937' }}>
              <button
                onClick={closeRestoreModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#202937' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A3442'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202937'}
              >
                Отмена
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#22c55e' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
              >
                Восстановить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
