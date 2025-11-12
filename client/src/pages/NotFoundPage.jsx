import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { log404Error } from '../utils/errorLogger';

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Log the 404 error
    log404Error(window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center">
            <span className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              404
            </span>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-slate-400 mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-slate-500">
            It might have been moved or deleted, or you may have typed the wrong URL.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8">
          <div className="inline-flex w-24 h-24 rounded-full bg-slate-800/50 items-center justify-center border border-slate-700">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Return to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
          >
            Go Back
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-sm text-slate-600">
          <p>Looking for something specific?</p>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Login
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => navigate('/admin')}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
