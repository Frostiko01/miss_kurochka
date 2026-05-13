"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";
import ImageUpload from "@/components/admin/ImageUpload";

type Tab = "categories" | "dishes";

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  branchId: string | null;
  createdAt?: string;
  branch?: {
    name: string;
  } | null;
  _count: {
    menuItems: number;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  weightGrams: number | null;
  cookingTimeMinutes: number | null;
  isActive: boolean;
  categoryId: string;
  createdAt?: string;
  category: {
    name: string;
    branchId: string | null;
  };
  images: {
    imageUrl: string;
    isPrimary: boolean;
  }[];
}

export default function BranchMenuPage() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: string;
    name: string;
    type: "category" | "dish";
  } | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    status: "active",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    status: "active",
  });

  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishFormData, setDishFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    weightGrams: "",
    cookingTimeMinutes: "",
    imageUrl: "",
    isActive: true,
  });

  // Загрузка данных
  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    } else {
      fetchMenuItems();
    }
  }, [activeTab, search, statusFilter, categoryFilter, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/branch/categories?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Сортировка на клиенте
        let sortedCategories = [...data.categories];
        
        sortedCategories.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortBy) {
            case "name":
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case "createdAt":
              aValue = new Date(a.createdAt || 0).getTime();
              bValue = new Date(b.createdAt || 0).getTime();
              break;
            case "items":
              aValue = a._count.menuItems;
              bValue = b._count.menuItems;
              break;
            default:
              aValue = new Date(a.createdAt || 0).getTime();
              bValue = new Date(b.createdAt || 0).getTime();
          }
          
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
        
        setCategories(sortedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);

      const response = await fetch(`/api/branch/menu-items?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Сортировка на клиенте
        let sortedItems = [...data.menuItems];
        
        sortedItems.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortBy) {
            case "name":
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case "price":
              aValue = a.price;
              bValue = b.price;
              break;
            case "category":
              aValue = a.category.name.toLowerCase();
              bValue = b.category.name.toLowerCase();
              break;
            case "createdAt":
              aValue = new Date(a.createdAt || 0).getTime();
              bValue = new Date(b.createdAt || 0).getTime();
              break;
            default:
              aValue = new Date(a.createdAt || 0).getTime();
              bValue = new Date(b.createdAt || 0).getTime();
          }
          
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
        
        setMenuItems(sortedItems);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Открытие модального окна удаления
  const openDeleteModal = (id: string, name: string, type: "category" | "dish") => {
    setDeleteModal({
      show: true,
      id,
      name,
      type,
    });
  };

  // Закрытие модального окна удаления
  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  // Удаление категории или блюда
  const handleDelete = async () => {
    if (!deleteModal) return;

    const { id, name, type } = deleteModal;
    const endpoint = type === "category" ? "/api/branch/categories" : "/api/branch/menu-items";

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setToast({
          message: `${type === "category" ? "Категория" : "Блюдо"} "${name}" успешно удалено!`,
          type: "success",
        });
        
        // Обновляем список
        if (type === "category") {
          fetchCategories();
        } else {
          fetchMenuItems();
        }
        
        closeDeleteModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при удалении",
          type: "error",
        });
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Error deleting:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
      closeDeleteModal();
    }
  };

  // Открытие модального окна редактирования
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      status: category.status,
    });
    setShowEditModal(true);
  };

  // Закрытие модального окна редактирования
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setEditFormData({
      name: "",
      description: "",
      imageUrl: "",
      status: "active",
    });
  };

  // Сохранение изменений категории
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const response = await fetch("/api/branch/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editFormData.name,
          description: editFormData.description || null,
          imageUrl: editFormData.imageUrl || null,
          status: editFormData.status,
        }),
      });

      if (response.ok) {
        setToast({
          message: "Категория успешно обновлена!",
          type: "success",
        });
        fetchCategories();
        closeEditModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при обновлении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  // Открытие модального окна добавления
  const openAddModal = () => {
    setAddFormData({
      name: "",
      description: "",
      imageUrl: "",
      status: "active",
    });
    setShowAddModal(true);
  };

  // Закрытие модального окна добавления
  const closeAddModal = () => {
    setShowAddModal(false);
    setAddFormData({
      name: "",
      description: "",
      imageUrl: "",
      status: "active",
    });
  };

  // Добавление новой категории
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/branch/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: addFormData.name,
          description: addFormData.description || null,
          imageUrl: addFormData.imageUrl || null,
          status: addFormData.status,
        }),
      });

      if (response.ok) {
        setToast({
          message: "Категория успешно добавлена!",
          type: "success",
        });
        fetchCategories();
        closeAddModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при добавлении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  // Открытие модального окна добавления блюда
  const openAddDishModal = () => {
    setDishFormData({
      categoryId: categories.length > 0 ? categories[0].id : "",
      name: "",
      description: "",
      price: "",
      weightGrams: "",
      cookingTimeMinutes: "",
      imageUrl: "",
      isActive: true,
    });
    setShowAddDishModal(true);
  };

  // Закрытие модального окна добавления блюда
  const closeAddDishModal = () => {
    setShowAddDishModal(false);
    setDishFormData({
      categoryId: "",
      name: "",
      description: "",
      price: "",
      weightGrams: "",
      cookingTimeMinutes: "",
      imageUrl: "",
      isActive: true,
    });
  };

  // Добавление нового блюда
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/branch/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: dishFormData.categoryId,
          name: dishFormData.name,
          description: dishFormData.description || null,
          price: parseFloat(dishFormData.price),
          weightGrams: dishFormData.weightGrams ? parseInt(dishFormData.weightGrams) : null,
          cookingTimeMinutes: dishFormData.cookingTimeMinutes ? parseInt(dishFormData.cookingTimeMinutes) : null,
          imageUrl: dishFormData.imageUrl || null,
          isActive: dishFormData.isActive,
        }),
      });

      if (response.ok) {
        setToast({
          message: "Блюдо успешно добавлено!",
          type: "success",
        });
        fetchMenuItems();
        closeAddDishModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при добавлении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error adding dish:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  // Открытие модального окна редактирования блюда
  const openEditDishModal = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishFormData({
      categoryId: dish.categoryId,
      name: dish.name,
      description: dish.description || "",
      price: dish.price.toString(),
      weightGrams: dish.weightGrams?.toString() || "",
      cookingTimeMinutes: dish.cookingTimeMinutes?.toString() || "",
      imageUrl: dish.images[0]?.imageUrl || "",
      isActive: dish.isActive,
    });
    setShowEditDishModal(true);
  };

  // Закрытие модального окна редактирования блюда
  const closeEditDishModal = () => {
    setShowEditDishModal(false);
    setEditingDish(null);
    setDishFormData({
      categoryId: "",
      name: "",
      description: "",
      price: "",
      weightGrams: "",
      cookingTimeMinutes: "",
      imageUrl: "",
      isActive: true,
    });
  };

  // Сохранение изменений блюда
  const handleUpdateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    try {
      const response = await fetch("/api/branch/menu-items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingDish.id,
          categoryId: dishFormData.categoryId,
          name: dishFormData.name,
          description: dishFormData.description || null,
          price: parseFloat(dishFormData.price),
          weightGrams: dishFormData.weightGrams ? parseInt(dishFormData.weightGrams) : null,
          cookingTimeMinutes: dishFormData.cookingTimeMinutes ? parseInt(dishFormData.cookingTimeMinutes) : null,
          imageUrl: dishFormData.imageUrl || null,
          isActive: dishFormData.isActive,
        }),
      });

      if (response.ok) {
        setToast({
          message: "Блюдо успешно обновлено!",
          type: "success",
        });
        fetchMenuItems();
        closeEditDishModal();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || "Ошибка при обновлении",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating dish:", error);
      setToast({
        message: "Ошибка сети. Попробуйте позже.",
        type: "error",
      });
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#F3F5F7' }}>
            Меню
          </h1>
          <p className="font-medium mt-2" style={{ color: '#98A2B3' }}>
            Управление блюдами и напитками
          </p>
        </div>

        {/* Tabs - справа */}
        <div className="rounded-2xl p-2 flex gap-2" style={{ backgroundColor: '#1A212B' }}>
          <button
            onClick={() => setActiveTab("categories")}
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              backgroundColor: activeTab === "categories" ? '#7C8CA5' : 'transparent',
              color: activeTab === "categories" ? 'white' : '#98A2B3'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "categories") {
                e.currentTarget.style.backgroundColor = '#202937';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "categories") {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#98A2B3';
              }
            }}
          >
            Категории
          </button>
          <button
            onClick={() => setActiveTab("dishes")}
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              backgroundColor: activeTab === "dishes" ? '#7C8CA5' : 'transparent',
              color: activeTab === "dishes" ? 'white' : '#98A2B3'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "dishes") {
                e.currentTarget.style.backgroundColor = '#202937';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "dishes") {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#98A2B3';
              }
            }}
          >
            Блюда
          </button>
        </div>
      </div>

      {/* Search, Filters, Add Button - NEW STRUCTURE */}
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
                  placeholder={activeTab === "categories" ? "Поиск категорий..." : "Поиск блюд..."}
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
                backgroundColor: (statusFilter !== "all" || (activeTab === "dishes" && categoryFilter !== "all")) ? '#7C8CA5' : '#2A3442' 
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
              onClick={() => {
                if (activeTab === "categories") {
                  setShowAddModal(true);
                  setAddFormData({
                    name: "",
                    description: "",
                    imageUrl: "",
                    status: "active",
                  });
                } else {
                  setShowAddDishModal(true);
                  setDishFormData({
                    categoryId: categories.length > 0 ? categories[0].id : "",
                    name: "",
                    description: "",
                    price: "",
                    weightGrams: "",
                    cookingTimeMinutes: "",
                    imageUrl: "",
                    isActive: true,
                  });
                }
              }}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center"
              style={{ backgroundColor: '#7C8CA5' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#93A4BF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C8CA5'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {activeTab === "categories" ? "Добавить категорию" : "Добавить блюдо"}
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
                {(statusFilter !== "all" || (activeTab === "dishes" && categoryFilter !== "all")) && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      if (activeTab === "dishes") {
                        setCategoryFilter("all");
                      }
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    Сбросить все
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Sorting Card */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                    Сортировка
                  </label>
                  {activeTab === "categories" ? (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                      style={{ backgroundColor: '#1A212B', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <option value="name" style={{ backgroundColor: '#1A212B' }}>По названию</option>
                      <option value="createdAt" style={{ backgroundColor: '#1A212B' }}>По дате</option>
                      <option value="items" style={{ backgroundColor: '#1A212B' }}>По кол-ву блюд</option>
                    </select>
                  ) : (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                      style={{ backgroundColor: '#1A212B', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <option value="name" style={{ backgroundColor: '#1A212B' }}>По названию</option>
                      <option value="price" style={{ backgroundColor: '#1A212B' }}>По цене</option>
                      <option value="category" style={{ backgroundColor: '#1A212B' }}>По категории</option>
                      <option value="createdAt" style={{ backgroundColor: '#1A212B' }}>По дате</option>
                    </select>
                  )}
                </div>

                {/* Status Filter Card */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                    Статус
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#1A212B', borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <option value="all" style={{ backgroundColor: '#1A212B' }}>Все статусы</option>
                    <option value="active" style={{ backgroundColor: '#1A212B' }}>Активные</option>
                    <option value="inactive" style={{ backgroundColor: '#1A212B' }}>Неактивные</option>
                  </select>
                </div>

                {/* Sort Order Toggle */}
                <div className="rounded-xl p-4 border flex items-end" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
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
                      <span className="text-lg">🔼</span>
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
                      <span className="text-lg">🔽</span>
                      <span className="text-sm">Я-А</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Card (only for dishes) */}
                {activeTab === "dishes" && (
                  <div className="rounded-xl p-4 border" style={{ backgroundColor: '#0B0F14', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#98A2B3' }}>
                      Категория
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                      style={{ backgroundColor: '#1A212B', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <option value="all" style={{ backgroundColor: '#1A212B' }}>Все категории</option>
                      {categories && categories.length > 0 && categories.map(cat => (
                        <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1A212B' }}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1A212B', border: '1px solid #202937' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto" style={{ borderColor: '#202937', borderTopColor: '#7C8CA5' }}></div>
            <p className="mt-4 font-semibold" style={{ color: '#98A2B3' }}>Загрузка...</p>
          </div>
        ) : activeTab === "categories" ? (
          categories.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#202937' }}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#F3F5F7' }}>Категории не найдены</h3>
              <p className="mb-6" style={{ color: '#98A2B3' }}>Добавьте первую категорию для организации меню</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {categories.map((category) => {
                const canEdit = category.branchId !== null;
                return (
                  <div
                    key={category.id}
                    className="rounded-2xl p-6 transition-all border"
                    style={{ 
                      backgroundColor: '#0B0F14', 
                      borderColor: '#202937',
                      opacity: canEdit ? 1 : 0.7
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7C8CA5'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#202937'}
                  >
                    {/* Category Image */}
                    {category.imageUrl ? (
                      <div className="w-full h-40 rounded-xl mb-4 overflow-hidden" style={{ backgroundColor: '#1A212B' }}>
                        <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: '#1A212B' }}>
                        <svg className="w-16 h-16" style={{ color: '#2A3442' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {category.status === "active" ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">Активна</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">Неактивна</span>
                        )}
                        {!canEdit && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">Глобальная</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#F3F5F7' }}>{category.name}</h3>
                    {category.description && (
                      <p className="text-sm mb-4" style={{ color: '#98A2B3' }}>{category.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#202937' }}>
                      <span className="text-sm font-bold" style={{ color: '#98A2B3' }}>
                        {category._count.menuItems} блюд
                      </span>
                      {canEdit && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: '#98A2B3', backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#202937';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#98A2B3';
                            }}
                            title="Редактировать"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(category.id, category.name, "category")}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: '#98A2B3', backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#202937';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#98A2B3';
                            }}
                            title="Удалить"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          menuItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#202937' }}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#98A2B3' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#F3F5F7' }}>Блюда не найдены</h3>
              <p className="mb-6" style={{ color: '#98A2B3' }}>Добавьте первое блюдо в меню</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {menuItems.map((dish) => {
                const canEdit = dish.category.branchId !== null;
                return (
                  <div
                    key={dish.id}
                    className="rounded-2xl p-6 transition-all border"
                    style={{ 
                      backgroundColor: '#0B0F14', 
                      borderColor: '#202937',
                      opacity: canEdit ? 1 : 0.7
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7C8CA5'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#202937'}
                  >
                    {/* Image */}
                    {dish.images[0]?.imageUrl ? (
                      <div className="w-full h-40 rounded-xl mb-4 overflow-hidden" style={{ backgroundColor: '#1A212B' }}>
                        <img src={dish.images[0].imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: '#1A212B' }}>
                        <svg className="w-12 h-12" style={{ color: '#2A3442' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1" style={{ color: '#F3F5F7' }}>{dish.name}</h3>
                        <p className="text-sm font-bold" style={{ color: '#98A2B3' }}>{dish.category.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {dish.isActive ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">Активно</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">Неактивно</span>
                        )}
                        {!canEdit && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">Глобальное</span>
                        )}
                      </div>
                    </div>

                    {dish.description && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#98A2B3' }}>{dish.description}</p>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold" style={{ color: '#7C8CA5' }}>{dish.price}</span>
                        <span className="text-sm font-bold" style={{ color: '#98A2B3' }}>сом</span>
                      </div>
                      {dish.weightGrams && (
                        <span className="text-sm font-bold" style={{ color: '#98A2B3' }}>• {dish.weightGrams}г</span>
                      )}
                      {dish.cookingTimeMinutes && (
                        <span className="text-sm font-bold" style={{ color: '#98A2B3' }}>• {dish.cookingTimeMinutes} мин</span>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#202937' }}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditDishModal(dish)}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: '#98A2B3', backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#202937';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#98A2B3';
                            }}
                            title="Редактировать"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(dish.id, dish.name, "dish")}
                            className="p-2 rounded-lg transition-all"
                            style={{ color: '#98A2B3', backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#202937';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#98A2B3';
                            }}
                            title="Удалить"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Добавить категорию</h3>
                    <p className="text-sm" style={{ color: '#98A2B3' }}>Создайте новую категорию меню</p>
                  </div>
                </div>
                <button onClick={closeAddModal} className="p-2 rounded-lg transition-all" style={{ color: '#98A2B3' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#202937'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#98A2B3'; }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Название <span className="text-red-400">*</span></label>
                <input type="text" value={addFormData.name} onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} placeholder="Например: Горячие блюда" />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Описание</label>
                <textarea value={addFormData.description} onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border resize-none" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} placeholder="Описание категории (необязательно)" />
              </div>
              <ImageUpload label="Изображение категории" value={addFormData.imageUrl} onChange={(url) => setAddFormData({ ...addFormData, imageUrl: url })} />
              <div>
                <label className="block text-sm font-bold text-white mb-2">Статус</label>
                <select value={addFormData.status} onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white focus:outline-none transition-all border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}>
                  <option value="active" style={{ backgroundColor: '#1A212B' }}>Активна</option>
                  <option value="inactive" style={{ backgroundColor: '#1A212B' }}>Неактивна</option>
                  <option value="archived" style={{ backgroundColor: '#1A212B' }}>Архивирована</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeAddModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all" style={{ backgroundColor: '#202937' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A3442'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202937'}>Отмена</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2" style={{ backgroundColor: '#7C8CA5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284C7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C8CA5'}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C8CA5 0%, #93A4BF 100%)' }}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Редактировать категорию</h3>
                    <p className="text-sm" style={{ color: '#98A2B3' }}>Обновите информацию о категории</p>
                  </div>
                </div>
                <button onClick={closeEditModal} className="p-2 rounded-lg transition-all" style={{ color: '#98A2B3' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#202937'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#98A2B3'; }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Название <span className="text-red-400">*</span></label>
                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} placeholder="Название категории" />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Описание</label>
                <textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all border resize-none" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} placeholder="Описание категории (необязательно)" />
              </div>
              <ImageUpload label="Изображение категории" value={editFormData.imageUrl} onChange={(url) => setEditFormData({ ...editFormData, imageUrl: url })} />
              <div>
                <label className="block text-sm font-bold text-white mb-2">Статус</label>
                <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white focus:outline-none transition-all border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}>
                  <option value="active" style={{ backgroundColor: '#1A212B' }}>Активна</option>
                  <option value="inactive" style={{ backgroundColor: '#1A212B' }}>Неактивна</option>
                  <option value="archived" style={{ backgroundColor: '#1A212B' }}>Архивирована</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeEditModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all" style={{ backgroundColor: '#202937' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A3442'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202937'}>Отмена</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all" style={{ backgroundColor: '#7C8CA5' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284C7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C8CA5'}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {showAddDishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Добавить блюдо</h3>
                <button onClick={closeAddDishModal} className="p-2 rounded-lg" style={{ color: '#98A2B3' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleAddDish} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Категория <span className="text-red-400">*</span></label>
                <select value={dishFormData.categoryId} onChange={(e) => setDishFormData({ ...dishFormData, categoryId: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}>
                  {categories.map(cat => <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1A212B' }}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Название <span className="text-red-400">*</span></label>
                <input type="text" value={dishFormData.name} onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} placeholder="Название блюда" />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Описание</label>
                <textarea value={dishFormData.description} onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl text-white border resize-none" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Цена (сом) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={dishFormData.price} onChange={(e) => setDishFormData({ ...dishFormData, price: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Вес (г)</label>
                  <input type="number" value={dishFormData.weightGrams} onChange={(e) => setDishFormData({ ...dishFormData, weightGrams: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Время приготовления (мин)</label>
                <input type="number" value={dishFormData.cookingTimeMinutes} onChange={(e) => setDishFormData({ ...dishFormData, cookingTimeMinutes: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
              </div>
              <ImageUpload label="Изображение блюда" value={dishFormData.imageUrl} onChange={(url) => setDishFormData({ ...dishFormData, imageUrl: url })} />
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={dishFormData.isActive} onChange={(e) => setDishFormData({ ...dishFormData, isActive: e.target.checked })} className="w-5 h-5 rounded" style={{ accentColor: '#7C8CA5' }} />
                  <span className="text-white font-bold">Активное блюдо</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeAddDishModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#202937' }}>Отмена</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#7C8CA5' }}>Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {showEditDishModal && editingDish && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Редактировать блюдо</h3>
                <button onClick={closeEditDishModal} className="p-2 rounded-lg" style={{ color: '#98A2B3' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateDish} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Категория <span className="text-red-400">*</span></label>
                <select value={dishFormData.categoryId} onChange={(e) => setDishFormData({ ...dishFormData, categoryId: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }}>
                  {categories.map(cat => <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1A212B' }}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Название <span className="text-red-400">*</span></label>
                <input type="text" value={dishFormData.name} onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Описание</label>
                <textarea value={dishFormData.description} onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl text-white border resize-none" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Цена (сом) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={dishFormData.price} onChange={(e) => setDishFormData({ ...dishFormData, price: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Вес (г)</label>
                  <input type="number" value={dishFormData.weightGrams} onChange={(e) => setDishFormData({ ...dishFormData, weightGrams: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Время приготовления (мин)</label>
                <input type="number" value={dishFormData.cookingTimeMinutes} onChange={(e) => setDishFormData({ ...dishFormData, cookingTimeMinutes: e.target.value })} className="w-full px-4 py-3 rounded-xl text-white border" style={{ backgroundColor: '#0B0F14', borderColor: '#202937' }} />
              </div>
              <ImageUpload label="Изображение блюда" value={dishFormData.imageUrl} onChange={(url) => setDishFormData({ ...dishFormData, imageUrl: url })} />
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={dishFormData.isActive} onChange={(e) => setDishFormData({ ...dishFormData, isActive: e.target.checked })} className="w-5 h-5 rounded" style={{ accentColor: '#7C8CA5' }} />
                  <span className="text-white font-bold">Активное блюдо</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeEditDishModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#202937' }}>Отмена</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#7C8CA5' }}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ backgroundColor: '#1A212B' }}>
            <div className="p-6 border-b" style={{ borderColor: '#202937' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <svg className="w-6 h-6" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#7C8CA5' }}>Удалить {deleteModal.type === "category" ? "категорию" : "блюдо"}?</h3>
                  <p className="text-sm" style={{ color: '#98A2B3' }}>Это действие нельзя отменить</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-white mb-2">
                Вы уверены, что хотите{' '}
                <span className="font-bold" style={{ color: '#EF4444' }}>удалить</span>
                {' '}{deleteModal.type === "category" ? "категорию" : "блюдо"}?
              </p>
              <p className="font-bold text-white mb-4">"{deleteModal.name}"</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <p className="text-sm" style={{ color: '#EF4444' }}>
                  ⚠️ {deleteModal.type === "category" 
                    ? "Убедитесь, что в категории нет блюд" 
                    : "Это блюдо будет удалено из меню"}
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#202937' }}>
              <button onClick={closeDeleteModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all" style={{ backgroundColor: '#202937' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A3442'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#202937'}>Отмена</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all" style={{ backgroundColor: '#EF4444' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}>Удалить</button>
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
