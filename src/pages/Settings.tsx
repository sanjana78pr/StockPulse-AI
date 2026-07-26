import { User, Bell, Key, Shield, Layout, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
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
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-300">JD</span>
                </div>
              </div>
              <div>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">First Name</label>
                <input type="text" defaultValue="John" className="w-full bg-black/40 border border-border/50 rounded-lg px-4 py-2.5 text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Last Name</label>
                <input type="text" defaultValue="Doe" className="w-full bg-black/40 border border-border/50 rounded-lg px-4 py-2.5 text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                <input type="email" defaultValue="john.doe@example.com" className="w-full bg-black/40 border border-border/50 rounded-lg px-4 py-2.5 text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                Save Changes
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium rounded-lg transition-colors border border-red-500/20">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}