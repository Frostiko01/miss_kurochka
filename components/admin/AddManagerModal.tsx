"use client";

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface AddManagerModalProps {
  showModal: boolean;
  formData: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    role: "admin" | "branch";
    branchIds: string[];
  };
  formErrors: Record<string, string>;
  branches: Branch[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: any) => void;
  onToggleBranch: (branchId: string) => void;
}

export default function AddManagerModal({
  showModal,
  formData,
  formErrors,
  branches,
  isSubmitting,
  onClose,
  onSubmit,
  onFormDataChange,
  onToggleBranch,
}: AddManagerModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#181f38' }}>
        <div className="sticky top-0 p-6 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Добавить менеджера</h2>
                <p className="text-white/80 text-sm">Создайте нового менеджера или администратора</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {formErrors.submit && (
            <div className="border rounded-xl p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)' }}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 font-semibold">{formErrors.submit}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Полное имя <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => onFormDataChange({ ...formData, fullName: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl text-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${formErrors.fullName ? "border-red-500" : "border-opacity-30"}`}
              style={{
                backgroundColor: 'rgba(24, 31, 56, 0.5)',
                borderColor: formErrors.fullName ? undefined : 'rgba(64, 71, 238, 0.3)',
              }}
              placeholder="Иван Иванов"
            />
            {formErrors.fullName && <p className="mt-2 text-sm text-red-400">{formErrors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl text-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${formErrors.email ? "border-red-500" : "border-opacity-30"}`}
              style={{
                backgroundColor: 'rgba(24, 31, 56, 0.5)',
                borderColor: formErrors.email ? undefined : 'rgba(64, 71, 238, 0.3)',
              }}
              placeholder="manager@example.com"
            />
            {formErrors.email && <p className="mt-2 text-sm text-red-400">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">Username (опционально)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => onFormDataChange({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl text-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{
                backgroundColor: 'rgba(24, 31, 56, 0.5)',
                borderColor: 'rgba(64, 71, 238, 0.3)',
              }}
              placeholder="manager123"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Пароль <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl text-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${formErrors.password ? "border-red-500" : "border-opacity-30"}`}
              style={{
                backgroundColor: 'rgba(24, 31, 56, 0.5)',
                borderColor: formErrors.password ? undefined : 'rgba(64, 71, 238, 0.3)',
              }}
              placeholder="••••••••"
            />
            {formErrors.password && <p className="mt-2 text-sm text-red-400">{formErrors.password}</p>}
            <p className="mt-2 text-sm" style={{ color: '#78819d' }}>Минимум 8 символов</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Подтвердите пароль <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => onFormDataChange({ ...formData, confirmPassword: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl text-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${formErrors.confirmPassword ? "border-red-500" : "border-opacity-30"}`}
              style={{
                backgroundColor: 'rgba(24, 31, 56, 0.5)',
                borderColor: formErrors.confirmPassword ? undefined : 'rgba(64, 71, 238, 0.3)',
              }}
              placeholder="••••••••"
            />
            {formErrors.confirmPassword && <p className="mt-2 text-sm text-red-400">{formErrors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Роль <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => onFormDataChange({ ...formData, role: e.target.value as "admin" | "branch", branchIds: e.target.value === "admin" ? [] : formData.branchIds })}
              className="w-full px-4 py-3 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{
                backgroundColor: 'rgba(24, 31, 56, 0.5)',
                borderColor: 'rgba(64, 71, 238, 0.3)',
              }}
            >
              <option value="branch">Менеджер филиала</option>
              <option value="admin">Администратор</option>
            </select>
            <p className="mt-2 text-sm" style={{ color: '#78819d' }}>
              {formData.role === "admin" ? "Полный доступ ко всем функциям системы" : "Доступ к управлению назначенными филиалами"}
            </p>
          </div>

          {formData.role === "branch" && (
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Филиалы <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl p-4" style={{ backgroundColor: 'rgba(24, 31, 56, 0.3)' }}>
                {branches.length === 0 ? (
                  <p className="text-sm" style={{ color: '#78819d' }}>Нет доступных филиалов</p>
                ) : (
                  branches.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: 'rgba(64, 71, 238, 0.05)' }}>
                      <input
                        type="checkbox"
                        checked={formData.branchIds.includes(branch.id)}
                        onChange={() => onToggleBranch(branch.id)}
                        className="w-5 h-5 rounded border text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        style={{ borderColor: 'rgba(64, 71, 238, 0.3)' }}
                      />
                      <div className="flex-1">
                        <p className="text-white font-bold">{branch.name}</p>
                        <p className="text-sm" style={{ color: '#78819d' }}>{branch.address}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {formErrors.branchIds && <p className="mt-2 text-sm text-red-400">{formErrors.branchIds}</p>}
              <p className="mt-2 text-sm" style={{ color: '#78819d' }}>Выбрано филиалов: {formData.branchIds.length}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all" style={{ backgroundColor: 'rgba(24, 31, 56, 0.5)' }}>
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ boxShadow: 'rgba(64, 71, 238, 0.2) 0 0 20px' }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Добавление...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Добавить менеджера
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
