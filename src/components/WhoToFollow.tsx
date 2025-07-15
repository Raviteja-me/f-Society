import { UserPlus } from 'lucide-react';

const suggestions = [
  {
    name: 'Shenoy',
    handle: '@instagram',
    avatar: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80',
    isPremium: true,
    redirectUrl: 'https://www.instagram.com/shenoy_army_/',
    buttonLabel: 'Follow',
    buttonColor: 'bg-pink-500',
  },
  {
    name: 'Ravi teja Beere',
    handle: '@linkedin',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80',
    isPremium: true,
    redirectUrl: 'https://www.linkedin.com/in/raviteja-beere-89a420167/',
    buttonLabel: 'Connect',
    buttonColor: 'bg-blue-700',
  },
  {
    name: 'Instagram',
    handle: '@lazyjobseeker.com_official',
    avatar: '', // Will use fallback icon
    isPremium: false,
    redirectUrl: 'https://www.instagram.com/lazyjobseeker.com_official/',
    buttonLabel: 'Follow',
    buttonColor: 'bg-pink-500',
    icon: 'IG',
    iconBg: 'bg-pink-400',
  },
  {
    name: 'YouTube',
    handle: '@LazyJobSeeker',
    avatar: '', // Will use fallback icon
    isPremium: false,
    redirectUrl: 'https://www.youtube.com/@LazyJobSeeker',
    buttonLabel: 'Subscribe',
    buttonColor: 'bg-red-600',
    icon: 'YT',
    iconBg: 'bg-red-500',
  },
  {
    name: 'LinkedIn',
    handle: '@LazyJobSeeker',
    avatar: '', // Will use fallback icon
    isPremium: false,
    redirectUrl: 'https://www.linkedin.com/company/106751084/admin/dashboard/',
    buttonLabel: 'Connect',
    buttonColor: 'bg-blue-700',
    icon: 'IN',
    iconBg: 'bg-blue-700',
  },
];

export function WhoToFollow() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Who to follow</h2>
      <div className="space-y-4">
        {suggestions.map((s, idx) => (
          <div key={s.handle + idx} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {s.avatar ? (
                <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${s.iconBg || 'bg-gray-400'}`}>{s.icon || <UserPlus />}</div>
              )}
              <div>
                <div className="flex items-center space-x-1">
                  <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                  {s.isPremium && (
                    <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full ml-1">PRO</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{s.handle}</p>
              </div>
            </div>
            <a href={s.redirectUrl} target="_blank" rel="noopener noreferrer">
              <button className={`px-4 py-1 ${s.buttonColor} text-white rounded-full font-bold hover:opacity-90 transition`}>
                {s.buttonLabel}
              </button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 