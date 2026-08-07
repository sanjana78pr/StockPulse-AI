import { User, Bell, Key, Shield, Layout, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user, logout } = useAuth();

  const initials = (() => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return user?.username?.slice(0, 2).toUpperCase() ?? '??';
  })();

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-gray-400" />
          Settings
        </h1>
        <p className="text-gray-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/10 text-white rounded-lg font-medium text-sm transition-colors">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
            <Layout className="w-4 h-4" /> Appearance
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
            <Shield className="w-4 h-4" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
            <Key className="w-4 h-4" /> API Keys
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-6">Profile Information</h2>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-300">{initials}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-200 font-medium text-lg">
                  {user?.full_name ?? user?.username ?? '—'}
                </p>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                  {user?.role ?? 'user'}
                </span>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.full_name ?? ''}
                  className="w-full bg-black/20 border border-border/30 rounded-lg px-4 py-2.5 text-gray-300 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.username ?? ''}
                  className="w-full bg-black/20 border border-border/30 rounded-lg px-4 py-2.5 text-gray-300 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  readOnly
                  value={user?.email ?? ''}
                  className="w-full bg-black/20 border border-border/30 rounded-lg px-4 py-2.5 text-gray-300 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-xs text-blue-400/70">
                Profile editing coming in a future update. Account changes must be
                made via the API for now.
              </p>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-gray-400">Account Status</span>
                <span className={user?.is_active ? 'text-green-400' : 'text-red-400'}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-gray-400">Member Since</span>
                <span className="text-gray-300">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-gray-300">
                  {user?.updated_at
                    ? new Date(user.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-border/30"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
            <p className="text-sm text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium rounded-lg transition-colors border border-red-500/20">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
