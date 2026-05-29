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
  cookingTimeMinutes: number | null;
  ingredients: string | null;
  spicyLevel: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  categoryId: string;
  createdAt?: string;
  category: {
    name: string;
    branchId: string | null;
    branch?: { name: string } | null;
  };
  images: { imageUrl: string; isPrimary: boolean }[];
  sizes: { id: string; name: string; price: number; weightGrams: number | null; sortOrder: number }[];
  spices: { id: string; name: string; price: number; sortOrder: number }[];
  stopList: { id: string; branchId: string; branch: { name: string } }[];
}

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [branches, setBranches] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [stopListBranchFilter, setStopListBranchFilter] = useState("all");
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
  const [newlyCreatedDishId, setNewlyCreatedDishId] = useState<string | null>(null);

  const defaultDishForm = {
    categoryId: "",
    name: "",
    description: "",
    cookingTimeMinutes: "",
    imageUrl: "",
    isActive: true,
  };
  const [dishFormData, setDishFormData] = useState(defaultDishForm);
  // Размеры и специи хранятся отдельно
  const [dishSizes, setDishSizes] = useState<{ name: string; price: string; weightGrams: string }[]>([
    { name: "Стандарт", price: "", weightGrams: "" },
  ]);
  const [dishSpices, setDishSpices] = useState<{ name: string; price: string }[]>([]);

  // Загрузка филиалов при монтировании
  useEffect(() => {
    fetchBranches();
  }, []);

  // Загрузка категорий при открытии модального окна добавления блюда
  useEffect(() => {
    if (showAddDishModal || showEditDishModal) {
      fetchCategories();
    }
  }, [showAddDishModal, showEditDishModal]);

  // Загрузка данных
  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    } else {
      fetchMenuItems();
    }
  }, [activeTab, search, statusFilter, branchFilter, stopListBranchFilter, categoryFilter, sortBy, sortOrder]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches');
      const data = await response.json();
      if (response.ok && data.branches) {
        setBranches(data.branches.map((b: any) => ({ id: b.id, name: b.name })));
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/admin/categories?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories);
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
      if (branchFilter !== "all") params.append("branchId", branchFilter);
      if (stopListBranchFilter !== "all") params.append("stopListBranchId", stopListBranchFilter);
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/admin/menu-items?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMenuItems(data.menuItems);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ color: 'white' }}>
            Меню
          </h1>
          <p className="font-semibold mt-2" style={{ color: '#78819d' }}>
            Управление блюдами и напитками
          </p>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl p-2 flex gap-2" style={{ backgroundColor: '#181f38' }}>
          <button
            onClick={() => setActiveTab("categories")}
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              backgroundColor: activeTab === "categories" ? '#4047ee' : 'transparent',
              color: activeTab === "categories" ? 'white' : '#78819d'
            }}
          >
            Категории
          </button>
          <button
            onClick={() => setActiveTab("dishes")}
            className="px-6 py-3 rounded-xl font-bold transition-all"
            style={{
              backgroundColor: activeTab === "dishes" ? '#4047ee' : 'transparent',
              color: activeTab === "dishes" ? 'white' : '#78819d'
            }}
          >
            Блюда
          </button>
        </div>
      </div>

      {/* Временная заглушка */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#181f38' }}>
        <div className="flex flex-col gap-4">
          {/* Search and Buttons Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#78819d' }}
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
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-slate-300 focus:outline-none transition-all border"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                />
              </div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersMenu(!showFiltersMenu)}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center lg:justify-start"
              style={{ 
                backgroundColor: (
                  statusFilter !== "all" || 
                  (activeTab === "dishes" && (branchFilter !== "all" || stopListBranchFilter !== "all" || categoryFilter !== "all"))
                ) ? '#4047ee' : '#242b47' 
              }}
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
                  setDishFormData(defaultDishForm);
                  setDishSizes([{ name: "Стандарт", price: "", weightGrams: "" }]);
                  setDishSpices([]);
                }
              }}
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center gap-2 justify-center"
              style={{ backgroundColor: '#4047ee' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {activeTab === "categories" ? "Добавить категорию" : "Добавить блюдо"}
            </button>
          </div>

          {/* Expandable Filters Container */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              maxHeight: showFiltersMenu ? '1000px' : '0',
              opacity: showFiltersMenu ? 1 : 0
            }}
          >
            <div className="pt-4 border-t" style={{ borderColor: '#242b47' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase" style={{ color: '#78819d' }}>
                  Фильтры и сортировка
                </h3>
                {(
                  statusFilter !== "all" || 
                  (activeTab === "dishes" && (branchFilter !== "all" || stopListBranchFilter !== "all" || categoryFilter !== "all"))
                ) && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      if (activeTab === "dishes") {
                        setBranchFilter("all");
                        setStopListBranchFilter("all");
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

              <div className="flex flex-wrap gap-4">
                {/* Sorting Card */}
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Сортировка
                  </label>
                  {activeTab === "categories" ? (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                      style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                    >
                      <option value="name" style={{ backgroundColor: '#181f38' }}>По названию</option>
                      <option value="createdAt" style={{ backgroundColor: '#181f38' }}>По дате</option>
                      <option value="items" style={{ backgroundColor: '#181f38' }}>По кол-ву блюд</option>
                    </select>
                  ) : (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                      style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                    >
                      <option value="name" style={{ backgroundColor: '#181f38' }}>По названию</option>
                      <option value="price" style={{ backgroundColor: '#181f38' }}>По цене</option>
                      <option value="category" style={{ backgroundColor: '#181f38' }}>По категории</option>
                      <option value="createdAt" style={{ backgroundColor: '#181f38' }}>По дате</option>
                      <option value="branch" style={{ backgroundColor: '#181f38' }}>По филиалу</option>
                      <option value="stopList" style={{ backgroundColor: '#181f38' }}>По стоп-листу</option>
                    </select>
                  )}
                </div>

                {/* Status Filter Card */}
                <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Статус
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                    style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                  >
                    <option value="all" style={{ backgroundColor: '#181f38' }}>Все статусы</option>
                    <option value="active" style={{ backgroundColor: '#181f38' }}>Активные</option>
                    <option value="inactive" style={{ backgroundColor: '#181f38' }}>Неактивные</option>
                  </select>
                </div>

                {/* Sort Order Toggle */}
                <div className="rounded-xl p-4 border flex-1 flex flex-col justify-end" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                  <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                    Порядок
                  </label>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setSortOrder("asc")}
                      className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: sortOrder === "asc" ? '#4047ee' : '#181f38',
                        color: sortOrder === "asc" ? 'white' : '#78819d',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: sortOrder === "asc" ? '#4047ee' : '#242b47'
                      }}
                    >
                      <span className="text-lg">🔼</span>
                      <span className="text-sm">А-Я</span>
                    </button>
                    <button
                      onClick={() => setSortOrder("desc")}
                      className="flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: sortOrder === "desc" ? '#4047ee' : '#181f38',
                        color: sortOrder === "desc" ? 'white' : '#78819d',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: sortOrder === "desc" ? '#4047ee' : '#242b47'
                      }}
                    >
                      <span className="text-lg">🔽</span>
                      <span className="text-sm">Я-А</span>
                    </button>
                  </div>
                </div>

                {/* Additional filters for dishes tab */}
                {activeTab === "dishes" && (
                  <>
                    {/* Branch Filter Card */}
                    <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                      <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                        Филиал
                      </label>
                      <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                        style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                      >
                        <option value="all" style={{ backgroundColor: '#181f38' }}>Все филиалы</option>
                        <option value="global" style={{ backgroundColor: '#181f38' }}>Глобальные блюда</option>
                        {branches && branches.length > 0 && branches.map(branch => (
                          <option key={branch.id} value={branch.id} style={{ backgroundColor: '#181f38' }}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stop List Branch Filter Card */}
                    <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                      <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                        В стоп-листе филиала
                      </label>
                      <select
                        value={stopListBranchFilter}
                        onChange={(e) => setStopListBranchFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                        style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                      >
                        <option value="all" style={{ backgroundColor: '#181f38' }}>Все блюда</option>
                        {branches && branches.length > 0 && branches.map(branch => (
                          <option key={branch.id} value={branch.id} style={{ backgroundColor: '#181f38' }}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category Filter Card */}
                    <div className="rounded-xl p-4 border flex-1 min-w-[200px]" style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}>
                      <label className="block text-xs font-bold uppercase mb-3" style={{ color: '#78819d' }}>
                        Категория
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-all border"
                        style={{ backgroundColor: '#181f38', borderColor: '#242b47' }}
                      >
                        <option value="all" style={{ backgroundColor: '#181f38' }}>Все категории</option>
                        {categories && categories.length > 0 && categories.map(cat => (
                          <option key={cat.id} value={cat.id} style={{ backgroundColor: '#181f38' }}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#181f38' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#4047ee' }}></div>
          </div>
        ) : activeTab === "categories" ? (
          // Categories Grid
          !categories || categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold" style={{ color: '#78819d' }}>
                Категории не найдены
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl p-4 border transition-all hover:border-opacity-100"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#050c26'}
                >
                  {/* Category Image */}
                  {category.imageUrl ? (
                    <div className="w-full h-40 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-40 rounded-lg mb-3 flex items-center justify-center"
                      style={{ backgroundColor: '#181f38' }}
                    >
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#242b47' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Category Info */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white mb-1">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm line-clamp-2" style={{ color: '#78819d' }}>
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Category Stats */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: category.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: category.status === 'active' ? '#22c55e' : '#ef4444'
                      }}
                    >
                      {category.status === 'active' ? 'Активна' : 'Неактивна'}
                    </span>
                    {category.branchId === null ? (
                      <span
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: 'rgba(64, 71, 238, 0.1)', color: '#4047ee' }}
                      >
                        Глобальная
                      </span>
                    ) : category.branch && (
                      <span
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: 'rgba(120, 129, 157, 0.1)', color: '#78819d' }}
                      >
                        {category.branch.name}
                      </span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: '#78819d' }}>
                      {category._count.menuItems} блюд
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setEditFormData({
                          name: category.name,
                          description: category.description || "",
                          imageUrl: category.imageUrl || "",
                          status: category.status,
                        });
                        setShowEditModal(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white transition-all"
                      style={{ backgroundColor: '#4047ee' }}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModal({
                          show: true,
                          id: category.id,
                          name: category.name,
                          type: "category"
                        });
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-bold transition-all"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Dishes Grid
          !menuItems || menuItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold" style={{ color: '#78819d' }}>
                Блюда не найдены
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-4 border transition-all hover:border-opacity-100"
                  style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#242b47'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#050c26'}
                >
                  {/* Dish Image */}
                  {item.images && item.images.length > 0 ? (
                    <div className="w-full h-40 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={item.images.find(img => img.isPrimary)?.imageUrl || item.images[0].imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-40 rounded-lg mb-3 flex items-center justify-center"
                      style={{ backgroundColor: '#181f38' }}
                    >
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#242b47' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Dish Info */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm line-clamp-2 mb-2" style={{ color: '#78819d' }}>
                        {item.description}
                      </p>
                    )}
                    {/* Размеры */}
                    {item.sizes && item.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.sizes.map((s) => (
                          <span key={s.id} className="text-xs px-2 py-0.5 rounded font-bold"
                            style={{ backgroundColor: 'rgba(64,71,238,0.15)', color: '#4047ee' }}>
                            {s.name} — {Number(s.price)} сом
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: '#ef4444' }}>Нет размеров</p>
                    )}
                  </div>

                  {/* Dish Meta */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: '#78819d' }}>
                      <span className="font-semibold">Категория:</span>
                      <span>{item.category.name}</span>
                      {item.category.branchId === null && (
                        <span
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{ backgroundColor: 'rgba(64, 71, 238, 0.1)', color: '#4047ee' }}
                        >
                          Глобальная
                        </span>
                      )}
                    </div>
                    {item.category.branch && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#78819d' }}>
                        <span className="font-semibold">Филиал:</span>
                        <span>{item.category.branch.name}</span>
                      </div>
                    )}
                    {item.stopList && item.stopList.length > 0 && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#ef4444' }}>
                        <span className="font-semibold">Стоп-лист:</span>
                        <span>{item.stopList.map(sl => sl.branch.name).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Dish Status */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: item.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: item.isActive ? '#22c55e' : '#ef4444'
                      }}
                    >
                      {item.isActive ? 'Активно' : 'Неактивно'}
                    </span>
                    {item.isFeatured && (
                      <span
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: 'rgba(64, 71, 238, 0.1)', color: '#4047ee' }}
                      >
                        Популярное
                      </span>
                    )}
                    {item.isNew && (
                      <span
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                      >
                        Новинка
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingDish(item);
                        setDishFormData({
                          categoryId: item.categoryId,
                          name: item.name,
                          description: item.description || "",
                          cookingTimeMinutes: item.cookingTimeMinutes?.toString() || "",
                          imageUrl: (item.images && item.images.length > 0)
                            ? (item.images.find(img => img.isPrimary)?.imageUrl || item.images[0]?.imageUrl || "")
                            : "",
                          isActive: item.isActive,
                        });
                        setDishSizes(
                          item.sizes && item.sizes.length > 0
                            ? item.sizes.map(s => ({
                                name: s.name,
                                price: String(s.price),
                                weightGrams: s.weightGrams ? String(s.weightGrams) : "",
                              }))
                            : [{ name: "Стандарт", price: "", weightGrams: "" }]
                        );
                        setDishSpices(
                          item.spices && item.spices.length > 0
                            ? item.spices.map(sp => ({ name: sp.name, price: String(sp.price) }))
                            : []
                        );
                        setShowEditDishModal(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white transition-all"
                      style={{ backgroundColor: '#4047ee' }}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModal({
                          show: true,
                          id: item.id,
                          name: item.name,
                          type: "dish"
                        });
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-bold transition-all"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(5,12,38,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full my-8" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Добавить категорию
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch('/api/admin/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(addFormData),
                });

                if (response.ok) {
                  setToast({
                    message: "Категория успешно добавлена",
                    type: "success"
                  });
                  setShowAddModal(false);
                  fetchCategories();
                } else {
                  const data = await response.json();
                  setToast({
                    message: data.error || "Ошибка при добавлении категории",
                    type: "error"
                  });
                }
              } catch (error) {
                setToast({
                  message: "Ошибка при добавлении категории",
                  type: "error"
                });
              }
            }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите название категории"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Описание
                  </label>
                  <textarea
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border resize-none"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите описание категории"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Изображение
                  </label>
                  <ImageUpload
                    value={addFormData.imageUrl}
                    onChange={(url) => setAddFormData({ ...addFormData, imageUrl: url })}
                    folder="categories"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Статус
                  </label>
                  <select
                    value={addFormData.status}
                    onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="active" style={{ backgroundColor: '#050c26' }}>Активна</option>
                    <option value="inactive" style={{ backgroundColor: '#050c26' }}>Неактивна</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#4047ee' }}
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(5,12,38,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full my-8" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Редактировать категорию
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch('/api/admin/categories', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingCategory.id,
                    ...editFormData
                  }),
                });

                if (response.ok) {
                  setToast({
                    message: "Категория успешно обновлена",
                    type: "success"
                  });
                  setShowEditModal(false);
                  setEditingCategory(null);
                  fetchCategories();
                } else {
                  const data = await response.json();
                  setToast({
                    message: data.error || "Ошибка при обновлении категории",
                    type: "error"
                  });
                }
              } catch (error) {
                setToast({
                  message: "Ошибка при обновлении категории",
                  type: "error"
                });
              }
            }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите название категории"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Описание
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border resize-none"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите описание категории"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Изображение
                  </label>
                  <ImageUpload
                    value={editFormData.imageUrl}
                    onChange={(url) => setEditFormData({ ...editFormData, imageUrl: url })}
                    folder="categories"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Статус
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="active" style={{ backgroundColor: '#050c26' }}>Активна</option>
                    <option value="inactive" style={{ backgroundColor: '#050c26' }}>Неактивна</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#4047ee' }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {showAddDishModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(5,12,38,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full my-8" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Добавить блюдо
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const validSizes = dishSizes.filter(s => s.name.trim() && s.price);
              if (validSizes.length === 0) {
                setToast({ message: "Добавьте хотя бы один размер с ценой", type: "error" });
                return;
              }
              try {
                const response = await fetch('/api/admin/menu-items', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...dishFormData,
                    cookingTimeMinutes: dishFormData.cookingTimeMinutes ? parseInt(dishFormData.cookingTimeMinutes) : null,
                    sizes: validSizes.map(s => ({
                      name: s.name.trim(),
                      price: parseFloat(s.price),
                      weightGrams: s.weightGrams ? parseInt(s.weightGrams) : null,
                    })),
                    spices: dishSpices
                      .filter(sp => sp.name.trim())
                      .map(sp => ({ name: sp.name.trim(), price: sp.price ? parseFloat(sp.price) : 0 })),
                  }),
                });

                if (response.ok) {
                  setToast({ message: "Блюдо успешно добавлено", type: "success" });
                  setShowAddDishModal(false);
                  setDishFormData(defaultDishForm);
                  setDishSizes([{ name: "Стандарт", price: "", weightGrams: "" }]);
                  setDishSpices([]);
                  fetchMenuItems();
                } else {
                  const data = await response.json();
                  setToast({ message: data.error || "Ошибка при добавлении блюда", type: "error" });
                }
              } catch (error) {
                setToast({ message: "Ошибка при добавлении блюда", type: "error" });
              }
            }}>
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Категория *
                  </label>
                  <select
                    required
                    value={dishFormData.categoryId}
                    onChange={(e) => setDishFormData({ ...dishFormData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="" style={{ backgroundColor: '#050c26' }}>Выберите категорию</option>
                    {categories && categories.length > 0 && categories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ backgroundColor: '#050c26' }}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={dishFormData.name}
                    onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите название блюда"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Описание
                  </label>
                  <textarea
                    value={dishFormData.description}
                    onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border resize-none"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите описание блюда"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Время приготовления (мин)
                  </label>
                  <input
                    type="number"
                    value={dishFormData.cookingTimeMinutes}
                    onChange={(e) => setDishFormData({ ...dishFormData, cookingTimeMinutes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Изображение
                  </label>
                  <ImageUpload
                    value={dishFormData.imageUrl}
                    onChange={(url) => setDishFormData({ ...dishFormData, imageUrl: url })}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishFormData.isActive}
                      onChange={(e) => setDishFormData({ ...dishFormData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#4047ee' }}
                    />
                    <span className="text-sm font-bold text-white">Активно</span>
                  </label>
                </div>

                {/* Размеры и цены */}
                <div className="border-t pt-4" style={{ borderColor: '#242b47' }}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-white">Размеры и цены *</label>
                    <button type="button" onClick={() => setDishSizes([...dishSizes, { name: "", price: "", weightGrams: "" }])}
                      className="text-xs px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#4047ee', color: 'white' }}>
                      + Добавить
                    </button>
                  </div>
                  {dishSizes.map((s, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" placeholder="Название (напр. 250г)" value={s.name}
                        onChange={(e) => { const n = [...dishSizes]; n[i].name = e.target.value; setDishSizes(n); }}
                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <input type="number" placeholder="Цена" value={s.price}
                        onChange={(e) => { const n = [...dishSizes]; n[i].price = e.target.value; setDishSizes(n); }}
                        className="w-24 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <input type="number" placeholder="Вес г" value={s.weightGrams}
                        onChange={(e) => { const n = [...dishSizes]; n[i].weightGrams = e.target.value; setDishSizes(n); }}
                        className="w-20 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      {dishSizes.length > 1 && (
                        <button type="button" onClick={() => setDishSizes(dishSizes.filter((_, j) => j !== i))}
                          className="px-2 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Специи / соусы */}
                <div className="border-t pt-4" style={{ borderColor: '#242b47' }}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-white">Специи / соусы</label>
                    <button type="button" onClick={() => setDishSpices([...dishSpices, { name: "", price: "" }])}
                      className="text-xs px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#242b47', color: 'white' }}>
                      + Добавить
                    </button>
                  </div>
                  {dishSpices.map((sp, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" placeholder="Название (напр. Острый)" value={sp.name}
                        onChange={(e) => { const n = [...dishSpices]; n[i].name = e.target.value; setDishSpices(n); }}
                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <input type="number" placeholder="+цена" value={sp.price}
                        onChange={(e) => { const n = [...dishSpices]; n[i].price = e.target.value; setDishSpices(n); }}
                        className="w-24 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <button type="button" onClick={() => setDishSpices(dishSpices.filter((_, j) => j !== i))}
                        className="px-2 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDishModal(false);
                    setDishFormData(defaultDishForm);
                    setDishSizes([{ name: "Стандарт", price: "", weightGrams: "" }]);
                    setDishSpices([]);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#4047ee' }}
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {showEditDishModal && editingDish && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(5,12,38,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full my-8" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Редактировать блюдо
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const validSizes = dishSizes.filter(s => s.name.trim() && s.price);
              if (validSizes.length === 0) {
                setToast({ message: "Добавьте хотя бы один размер с ценой", type: "error" });
                return;
              }
              try {
                const response = await fetch('/api/admin/menu-items', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingDish.id,
                    ...dishFormData,
                    cookingTimeMinutes: dishFormData.cookingTimeMinutes ? parseInt(dishFormData.cookingTimeMinutes) : null,
                    sizes: validSizes.map(s => ({
                      name: s.name.trim(),
                      price: parseFloat(s.price),
                      weightGrams: s.weightGrams ? parseInt(s.weightGrams) : null,
                    })),
                    spices: dishSpices
                      .filter(sp => sp.name.trim())
                      .map(sp => ({ name: sp.name.trim(), price: sp.price ? parseFloat(sp.price) : 0 })),
                  }),
                });

                if (response.ok) {
                  setToast({ message: "Блюдо успешно обновлено", type: "success" });
                  setShowEditDishModal(false);
                  setEditingDish(null);
                  fetchMenuItems();
                } else {
                  const data = await response.json();
                  setToast({ message: data.error || "Ошибка при обновлении блюда", type: "error" });
                }
              } catch (error) {
                setToast({ message: "Ошибка при обновлении блюда", type: "error" });
              }
            }}>
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Категория *
                  </label>
                  <select
                    required
                    value={dishFormData.categoryId}
                    onChange={(e) => setDishFormData({ ...dishFormData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                  >
                    <option value="" style={{ backgroundColor: '#050c26' }}>Выберите категорию</option>
                    {categories && categories.length > 0 && categories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ backgroundColor: '#050c26' }}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Название *
                  </label>
                  <input
                    type="text"
                    required
                    value={dishFormData.name}
                    onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите название блюда"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Описание
                  </label>
                  <textarea
                    value={dishFormData.description}
                    onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border resize-none"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="Введите описание блюда"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Время приготовления (мин)
                  </label>
                  <input
                    type="number"
                    value={dishFormData.cookingTimeMinutes}
                    onChange={(e) => setDishFormData({ ...dishFormData, cookingTimeMinutes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none border"
                    style={{ backgroundColor: '#050c26', borderColor: '#242b47' }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    Изображение
                  </label>
                  <ImageUpload
                    value={dishFormData.imageUrl}
                    onChange={(url) => setDishFormData({ ...dishFormData, imageUrl: url })}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishFormData.isActive}
                      onChange={(e) => setDishFormData({ ...dishFormData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#4047ee' }}
                    />
                    <span className="text-sm font-bold text-white">Активно</span>
                  </label>
                </div>

                {/* Размеры и цены */}
                <div className="border-t pt-4" style={{ borderColor: '#242b47' }}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-white">Размеры и цены *</label>
                    <button type="button" onClick={() => setDishSizes([...dishSizes, { name: "", price: "", weightGrams: "" }])}
                      className="text-xs px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#4047ee', color: 'white' }}>
                      + Добавить
                    </button>
                  </div>
                  {dishSizes.map((s, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" placeholder="Название (напр. 250г)" value={s.name}
                        onChange={(e) => { const n = [...dishSizes]; n[i].name = e.target.value; setDishSizes(n); }}
                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <input type="number" placeholder="Цена" value={s.price}
                        onChange={(e) => { const n = [...dishSizes]; n[i].price = e.target.value; setDishSizes(n); }}
                        className="w-24 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <input type="number" placeholder="Вес г" value={s.weightGrams}
                        onChange={(e) => { const n = [...dishSizes]; n[i].weightGrams = e.target.value; setDishSizes(n); }}
                        className="w-20 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      {dishSizes.length > 1 && (
                        <button type="button" onClick={() => setDishSizes(dishSizes.filter((_, j) => j !== i))}
                          className="px-2 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Специи / соусы */}
                <div className="border-t pt-4" style={{ borderColor: '#242b47' }}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-white">Специи / соусы</label>
                    <button type="button" onClick={() => setDishSpices([...dishSpices, { name: "", price: "" }])}
                      className="text-xs px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#242b47', color: 'white' }}>
                      + Добавить
                    </button>
                  </div>
                  {dishSpices.map((sp, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" placeholder="Название (напр. Острый)" value={sp.name}
                        onChange={(e) => { const n = [...dishSpices]; n[i].name = e.target.value; setDishSpices(n); }}
                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <input type="number" placeholder="+цена" value={sp.price}
                        onChange={(e) => { const n = [...dishSpices]; n[i].price = e.target.value; setDishSpices(n); }}
                        className="w-24 px-3 py-2 rounded-lg text-white text-sm focus:outline-none border"
                        style={{ backgroundColor: '#050c26', borderColor: '#242b47' }} />
                      <button type="button" onClick={() => setDishSpices(dishSpices.filter((_, j) => j !== i))}
                        className="px-2 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDishModal(false);
                    setEditingDish(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                  style={{ backgroundColor: '#242b47', color: 'white' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#4047ee' }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal?.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(5,12,38,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: '#181f38' }}>
            <h2 className="text-2xl font-bold text-white mb-4">
              Подтвердите удаление
            </h2>
            <p className="mb-6" style={{ color: '#78819d' }}>
              Вы уверены, что хотите удалить {deleteModal.type === "category" ? "категорию" : "блюдо"} <span className="font-bold text-white">"{deleteModal.name}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-3 rounded-xl font-bold transition-all"
                style={{ backgroundColor: '#242b47', color: 'white' }}
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  try {
                    const endpoint = deleteModal.type === "category" 
                      ? '/api/admin/categories'
                      : '/api/admin/menu-items';
                    
                    const response = await fetch(endpoint, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: deleteModal.id }),
                    });

                    if (response.ok) {
                      setToast({
                        message: `${deleteModal.type === "category" ? "Категория" : "Блюдо"} успешно удалено`,
                        type: "success"
                      });
                      setDeleteModal(null);
                      if (deleteModal.type === "category") {
                        fetchCategories();
                      } else {
                        fetchMenuItems();
                      }
                    } else {
                      const data = await response.json();
                      setToast({
                        message: data.error || "Ошибка при удалении",
                        type: "error"
                      });
                    }
                  } catch (error) {
                    setToast({
                      message: "Ошибка при удалении",
                      type: "error"
                    });
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all"
                style={{ backgroundColor: '#ef4444' }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
