import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function Admin403() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
        <ShieldOff className="h-8 w-8 text-red-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-sm text-gray-500 max-w-sm mb-8">
        You do not have permission to access this page. Contact your administrator if you believe this is a mistake.
      </p>

      <Link
        to="/admin"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back to Dashboard
      </Link>
    </div>
  );
}
