import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  Building2, 
  Zap, 
  Download, 
  Plus,
  Shield,
  Clock,
  Award,
  TrendingUp,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProfileTabProps {
  userProfile: {
    name: string;
    email: string;
    photoURL?: string;
    jobTitle?: string;
    company?: string;
    phone?: string;
    website?: string;
    bio?: string;
    skills?: string[];
  } | null;
  contactsCount: number;
  scansCount: number;
  onEditProfile: () => void;
  onPrint: () => void;
  onUpdatePassword: () => void;
  onToast: (msg: string) => void;
  isDark?: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ 
  userProfile, 
  contactsCount,
  scansCount,
  onEditProfile,
  onPrint,
  onUpdatePassword,
  onToast,
  isDark = false
}) => {
  const vCardValue = userProfile 
    ? `BEGIN:VCARD\nVERSION:3.0\nFN:${userProfile.name}\nEMAIL:${userProfile.email}\nTITLE:${userProfile.jobTitle || ''}\nORG:${userProfile.company || ''}\nTEL:${userProfile.phone || ''}\nURL:${userProfile.website || ''}\nEND:VCARD` 
    : window.location.href;

  const stats = [
    { label: 'Total Contacts', value: contactsCount, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Cards Scanned', value: scansCount, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Profile Views', value: '0', icon: TrendingUp, color: 'text-[#8DC63F]', bg: 'bg-[#F4F9ED]' },
    { label: 'Network Score', value: '0', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">👤 Your Professional Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xl leading-relaxed">
          Manage your digital identity and track your networking performance in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Digital Business Card - More compact and premium */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow flex flex-col items-center justify-center gap-5 print-card overflow-hidden relative group h-fit">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:text-white">
            <Zap size={60} />
          </div>
          
          <div className="relative qrcode-container">
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-primary/30 via-brand-accent/30 to-purple-500/30 rounded-[24px] md:rounded-[40px] blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-700 print:hidden"></div>
            <div className="relative bg-white dark:bg-slate-800 p-4 rounded-[32px] shadow-2xl border border-slate-50 dark:border-slate-700">
              <QRCodeSVG 
                value={vCardValue}
                size={140}
                level="H"
                includeMargin={true}
                imageSettings={userProfile?.photoURL ? {
                  src: userProfile.photoURL,
                  x: undefined,
                  y: undefined,
                  height: 28,
                  width: 28,
                  excavate: true,
                } : undefined}
                bgColor="transparent"
                fgColor={isDark ? "#ffffff" : "#000000"}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="font-black text-slate-900 dark:text-white text-2xl tracking-tight leading-none mb-1">{userProfile?.name || <span className="text-slate-200 dark:text-slate-700">Name</span>}</div>
            <div className="text-[10px] text-brand-primary dark:text-brand-accent font-black uppercase tracking-[0.2em]">{userProfile?.jobTitle || <span className="text-slate-200 dark:text-slate-700">Title</span>}</div>
          </div>

          <div className="flex gap-2 justify-center print:hidden">
            <button onClick={() => onToast('VCard downloaded!')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all" title="Download VCard">
              <Download size={16} />
            </button>
            <button onClick={onPrint} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all" title="Print Card">
              <Printer size={16} />
            </button>
            <button onClick={onEditProfile} className="h-10 px-4 bg-brand-primary/10 dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-brand-primary/20 dark:hover:bg-brand-accent/20 transition-all flex items-center gap-2">
              <Plus size={14} /> Edit
            </button>
          </div>
        </div>

        {/* Detailed Info - Takes more space */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-accent/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-3 tracking-tight dark:text-white">
              <User size={20} className="text-brand-primary dark:text-brand-accent" /> Profile Information
            </h3>
            <button onClick={onEditProfile} className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline">Edit Profile</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InfoItem icon={Mail} label="Email Address" value={userProfile?.email} />
            <InfoItem icon={Phone} label="Phone Number" value={userProfile?.phone || 'Not provided'} />
            <InfoItem icon={Briefcase} label="Job Title" value={userProfile?.jobTitle || 'Not provided'} />
            <InfoItem icon={Building2} label="Company" value={userProfile?.company || 'Not provided'} />
            <InfoItem icon={Globe} label="Website" value={userProfile?.website || 'Not provided'} />
          </div>
          
          {userProfile?.bio && (
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-300 mb-2">Professional Bio</div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{userProfile.bio}"</p>
            </div>
          )}
          
          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-300 mb-3">Core Skills</div>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold border border-slate-100 dark:border-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Networking Stats */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8DC63F]/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-primary dark:text-brand-accent" /> Performance
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className={cn("p-4 rounded-3xl border border-transparent transition-all hover:border-slate-100 dark:hover:border-slate-700", stat.bg, "dark:bg-slate-900/50")}>
                <stat.icon size={18} className={cn("mb-2", stat.color)} />
                <div className="text-2xl font-black tracking-tight leading-none mb-1 dark:text-white">{stat.value}</div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

const SecurityToggle = ({ icon: Icon, label, desc, enabled, color, onToggle }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
        <Icon size={20} className={color} />
      </div>
      <div>
        <div className="font-bold text-sm dark:text-white">{label}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">{desc}</div>
      </div>
    </div>
    <div 
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full relative transition-colors cursor-pointer", 
        enabled ? "bg-[#8DC63F]" : "bg-slate-200 dark:bg-slate-700"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow-sm transition-all",
        enabled ? "right-1" : "left-1"
      )} />
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => (
  <div className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors group">
    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-brand-primary/10 dark:group-hover:bg-brand-accent/10 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-all">
      <Icon size={20} />
    </div>
    <div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-0.5">{label}</div>
      <div className="font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  </div>
);
