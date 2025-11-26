import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'from-green-400 to-emerald-500' : 
                  type === 'error' ? 'from-red-400 to-rose-500' : 
                  'from-amber-400 to-yellow-500';

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`bg-gradient-to-r ${bgColor} px-6 py-4 rounded-2xl border-4 border-amber-900 shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] max-w-md`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <p className="text-lg font-bold text-amber-950">
            {message}
          </p>
          <button
            onClick={onClose}
            className="ml-auto text-amber-950 hover:text-amber-700 font-bold text-xl"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
