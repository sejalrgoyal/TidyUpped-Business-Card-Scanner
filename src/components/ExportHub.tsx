import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Download, 
  Mail, 
  Printer,
  FileText, 
  Share2, 
  ExternalLink,
  Check,
  Plus,
  Database,
  Zap,
  Settings as SettingsIcon,
  X as CloseIcon,
  LogIn,
  Link as LinkIcon
} from 'lucide-react';

import { 
  SiX, 
  SiWhatsapp, 
  SiTelegram, 
  SiFacebook, 
  SiReddit, 
  SiInstagram, 
  SiTiktok, 
  SiSlack, 
  SiDiscord, 
  SiThreads, 
  SiPinterest,
  SiGmail,
  SiSnapchat,
  SiMessenger,
  SiNotion
} from 'react-icons/si';
import { FaSms, FaLinkedin } from 'react-icons/fa';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

interface ExportHubProps {
  contacts: any[];
  onExportCSV: () => void;
  onExportVCF: () => void;
  onPrint: () => void;
  onShareLinkedIn: () => void;
  onShareTwitter: () => void;
  onShareWhatsApp: () => void;
  onShareTelegram: () => void;
  onShareFacebook: () => void;
  onShareReddit: () => void;
  onShareEmail: () => void;
  onShareThreads: () => void;
  onSharePinterest: () => void;
  onShareTikTok: () => void;
  onToast: (msg: string) => void;
  isDark?: boolean;
}

export const ExportHub: React.FC<ExportHubProps> = ({ 
  contacts, 
  onExportCSV, 
  onExportVCF, 
  onPrint,
  onShareLinkedIn,
  onShareTwitter,
  onShareWhatsApp,
  onShareTelegram,
  onShareFacebook,
  onShareReddit,
  onShareEmail,
  onShareThreads,
  onSharePinterest,
  onShareTikTok,
  onToast,
  isDark = false
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'core' | 'integrations' | 'sharing'>('core');
  const [connectedApps, setConnectedApps] = React.useState<Record<string, string>>({});
  const [activeSettingsApp, setActiveSettingsApp] = React.useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);

  const toggleConnection = (name: string) => {
    if (connectedApps[name]) {
      const newApps = { ...connectedApps };
      delete newApps[name];
      setConnectedApps(newApps);
      onToast(`Disconnected from ${name}`);
    } else {
      setConnectedApps({ ...connectedApps, [name]: `${name}-Workspace-${Math.floor(Math.random() * 99 + 1)}` });
      onToast(`Successfully linked to ${name}!`);
    }
  };

  const tabs = [
    { id: 'core', label: 'Core', icon: Download },
    { id: 'integrations', label: 'Integrations', icon: ExternalLink },
    { id: 'sharing', label: 'Sharing Options', icon: Share2 },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">📤 Export & Sharing Hub</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xl leading-relaxed">
          Connect your networking data with your favorite tools or share your professional profile instantly with the world.
        </p>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-[18px] font-bold text-sm transition-all duration-300",
                activeSubTab === tab.id 
                  ? "bg-white dark:bg-slate-700 text-brand-primary dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
              )}
            >
              <tab.icon size={18} className={activeSubTab === tab.id ? "text-brand-accent" : ""} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeSubTab === 'core' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Core Exports */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-tight dark:text-white">
                <Download size={24} className="text-brand-primary dark:text-brand-accent" /> Core Exports
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <button onClick={onExportCSV} className="flex flex-col items-center justify-center p-8 bg-orange-50/50 dark:bg-orange-500/5 rounded-[32px] hover:bg-orange-100/50 dark:hover:bg-orange-500/10 transition-all group hover:scale-105">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-vibrant-orange group-hover:text-white transition-all duration-500 text-orange-500">
                    <FileText size={28} />
                  </div>
                  <span className="font-bold text-sm dark:text-white">CSV Export</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-2 font-bold">All History</span>
                </button>
                <button onClick={onExportVCF} className="flex flex-col items-center justify-center p-8 bg-blue-50/50 dark:bg-blue-500/5 rounded-[32px] hover:bg-blue-100/50 dark:hover:bg-blue-500/10 transition-all group hover:scale-105">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-vibrant-blue group-hover:text-white transition-all duration-500 text-blue-500">
                    <Users size={28} />
                  </div>
                  <span className="font-bold text-sm dark:text-white">.vcf Bundle</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-2 font-bold">Phone Sync</span>
                </button>
                <button onClick={onPrint} className="flex flex-col items-center justify-center p-8 bg-[#F4F9ED]/50 dark:bg-[#8DC63F]/5 rounded-[32px] hover:bg-[#E8F3D8]/50 dark:hover:bg-[#8DC63F]/10 transition-all group hover:scale-105">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-[#8DC63F] group-hover:text-white transition-all duration-500 text-[#8DC63F]">
                    <Printer size={28} />
                  </div>
                  <span className="font-bold text-sm dark:text-white">Print Card</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-2 font-bold">Physical Copy</span>
                </button>
                <button onClick={() => onToast('Email summary sent!')} className="flex flex-col items-center justify-center p-8 bg-purple-50/50 dark:bg-purple-500/5 rounded-[32px] hover:bg-purple-100/50 dark:hover:bg-purple-500/10 transition-all group hover:scale-105">
                  <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-vibrant-purple group-hover:text-white transition-all duration-500 text-purple-500">
                    <Mail size={28} />
                  </div>
                  <span className="font-bold text-sm dark:text-white">Email Digest</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-2 font-bold">Daily Summary</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'integrations' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-tight dark:text-white">
                <ExternalLink size={24} className="text-brand-primary dark:text-brand-accent" /> Integrations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Salesforce', desc: 'Sync leads to your pipeline', icon: Database, color: 'text-blue-500' },
                  { name: 'HubSpot', desc: 'Automate follow-up emails', icon: Zap, color: 'text-orange-500' },
                  { name: 'Mailchimp', desc: 'Add to marketing lists', icon: Mail, color: 'text-yellow-600' },
                  { name: 'Notion', desc: 'Save to networking database', icon: SiNotion, color: 'text-slate-900 dark:text-white' },
                ].map((int) => {
                  const isConnected = !!connectedApps[int.name];
                  return (
                    <div 
                      key={int.name}
                      className={cn(
                        "flex flex-col p-6 rounded-[32px] border transition-all duration-300",
                        isConnected 
                          ? "bg-white dark:bg-slate-800 border-brand-primary/20 dark:border-brand-accent/20 shadow-lg shadow-brand-primary/5" 
                          : "bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-600", int.color)}>
                            <int.icon size={26} />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg flex items-center gap-2 dark:text-white">
                              {int.name}
                              {isConnected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F4F9ED] dark:bg-[#8DC63F]/10 text-[#8DC63F] rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  <Check size={10} /> Connected
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">{int.desc}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleConnection(int.name)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            isConnected 
                              ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500" 
                              : "bg-brand-primary dark:bg-brand-accent text-white hover:bg-brand-primary/90 dark:hover:bg-brand-accent/90 shadow-md shadow-brand-primary/20"
                          )}
                        >
                          {isConnected ? <Plus size={20} className="rotate-45" /> : <Plus size={20} />}
                        </button>
                      </div>

                      {isConnected ? (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#8DC63F] animate-pulse" />
                            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              Linked: <span className="text-brand-primary dark:text-brand-accent">{connectedApps[int.name]}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveSettingsApp(int.name)}
                            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-accent uppercase tracking-widest flex items-center gap-1.5 group/btn cursor-pointer"
                          >
                            <SettingsIcon size={12} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                            Settings
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium italic px-2">
                          Not currently linked to any account.
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <button 
                  onClick={() => setIsLinkModalOpen(true)}
                  className="flex items-center justify-center gap-3 p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[24px] hover:border-brand-primary dark:hover:border-brand-accent hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-accent font-bold text-sm md:col-span-2"
                >
                  <LinkIcon size={20} />
                  Link New Platform
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'sharing' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow max-w-5xl mx-auto">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-tight dark:text-white">
                <Share2 size={24} className="text-brand-primary dark:text-brand-accent" /> Sharing Options
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[
                  { name: 'LinkedIn', icon: FaLinkedin, color: 'text-[#0A66C2]', action: onShareLinkedIn },
                  { name: 'Twitter / X', icon: SiX, color: 'text-black dark:text-white', action: onShareTwitter },
                  { name: 'WhatsApp', icon: SiWhatsapp, color: 'text-[#25D366]', action: onShareWhatsApp },
                  { name: 'Telegram', icon: SiTelegram, color: 'text-[#26A5E4]', action: onShareTelegram },
                  { name: 'Facebook', icon: SiFacebook, color: 'text-[#1877F2]', action: onShareFacebook },
                  { name: 'Reddit', icon: SiReddit, color: 'text-[#FF4500]', action: onShareReddit },
                  { name: 'Instagram', icon: SiInstagram, color: 'text-[#E4405F]', action: () => onToast('Instagram draft ready!') },
                  { name: 'TikTok', icon: SiTiktok, color: 'text-black dark:text-white', action: onShareTikTok },
                  { name: 'Slack', icon: SiSlack, color: 'text-[#4A154B] dark:text-[#E01E5A]', action: () => onToast('Slack draft ready!') },
                  { name: 'Discord', icon: SiDiscord, color: 'text-[#5865F2]', action: () => onToast('Discord draft ready!') },
                  { name: 'SMS', icon: FaSms, color: 'text-slate-600 dark:text-slate-300', action: () => onToast('SMS draft ready!') },
                  { name: 'Email', icon: SiGmail, color: 'text-[#EA4335]', action: onShareEmail },
                  { name: 'Threads', icon: SiThreads, color: 'text-black dark:text-white', action: onShareThreads },
                  { name: 'Pinterest', icon: SiPinterest, color: 'text-[#BD081C]', action: onSharePinterest },
                  { name: 'Snapchat', icon: SiSnapchat, color: 'text-[#FFFC00]', action: () => onToast('Snapchat draft ready!') },
                  { name: 'Messenger', icon: SiMessenger, color: 'text-[#0084FF]', action: () => onToast('Messenger draft ready!') },
                ].map((opt: any) => (
                  <button 
                    key={opt.name}
                    onClick={opt.action} 
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                      <opt.icon size={24} className={opt.color} />
                    </div>
                    <span className="font-bold text-xs dark:text-white">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {activeSettingsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSettingsApp(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-primary/10 dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent rounded-xl flex items-center justify-center">
                      <SettingsIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight dark:text-white">{activeSettingsApp} Settings</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Sync preferences</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveSettingsApp(null)}
                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Linked Workspace</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                          <Database size={16} className="text-brand-primary dark:text-brand-accent" />
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{connectedApps[activeSettingsApp]}</div>
                      </div>
                      <button className="text-[10px] font-bold text-brand-primary dark:text-brand-accent hover:underline">Change</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sync Options</div>
                    {[
                      { label: 'Auto-sync new contacts', enabled: true },
                      { label: 'Include profile photos', enabled: true },
                      { label: 'Sync networking notes', enabled: false },
                      { label: 'Notify on successful sync', enabled: true },
                    ].map((opt, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{opt.label}</span>
                        <div 
                          onClick={() => {/* Toggle logic here if needed */}}
                          className={cn(
                            "w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer",
                            opt.enabled ? "bg-brand-primary dark:bg-brand-accent" : "bg-slate-200 dark:bg-slate-700"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow-sm transition-transform",
                            opt.enabled ? "translate-x-5" : "translate-x-0"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setActiveSettingsApp(null)}
                    className="flex-1 py-3 bg-slate-900 dark:bg-brand-accent text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-brand-accent/90 transition-all"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      toggleConnection(activeSettingsApp);
                      setActiveSettingsApp(null);
                    }}
                    className="px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Link New Platform Modal */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLinkModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-primary/10 dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent rounded-xl flex items-center justify-center">
                      <LinkIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight dark:text-white">Link New Platform</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Connect your tools</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsLinkModalOpen(false)}
                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { name: 'Google Workspace', icon: SiGmail, color: 'text-[#EA4335]' },
                    { name: 'Slack', icon: SiSlack, color: 'text-[#4A154B]' },
                    { name: 'Discord', icon: SiDiscord, color: 'text-[#5865F2]' },
                    { name: 'Trello', icon: Database, color: 'text-[#0079BF]' },
                    { name: 'Asana', icon: Zap, color: 'text-[#F06595]' },
                    { name: 'Monday.com', icon: FileText, color: 'text-[#FF3D57]' },
                  ].map((platform) => (
                    <button 
                      key={platform.name}
                      onClick={() => {
                        toggleConnection(platform.name);
                        setIsLinkModalOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm", platform.color)}>
                          <platform.icon size={20} />
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{platform.name}</div>
                      </div>
                      <LogIn size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors" />
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => setIsLinkModalOpen(false)}
                    className="w-full py-4 bg-slate-900 dark:bg-brand-accent text-white rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-brand-accent/90 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for users icon
const Users = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
