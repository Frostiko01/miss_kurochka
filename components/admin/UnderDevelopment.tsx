interface UnderDevelopmentProps {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

export default function UnderDevelopment({
  title,
  description,
  icon,
  iconColor,
}: UnderDevelopmentProps) {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#050c26' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          {title}
        </h1>
        <p className="font-semibold mt-2" style={{ color: '#78819d' }}>{description}</p>
      </div>

      <div className="rounded-2xl p-8" style={{ backgroundColor: '#181f38' }}>
        <div className="text-center py-12">
          <div
            className={`w-20 h-20 bg-gradient-to-br ${iconColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={icon}
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">
            Страница в разработке
          </h3>
          <p style={{ color: '#78819d' }}>
            Функционал будет добавлен в ближайшее время
          </p>
        </div>
      </div>
    </div>
  );
}
