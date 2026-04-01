import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Save, User, Mail, Phone, Building2, Briefcase, Globe, Camera, Plus, Trash2, FileText, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfile {
  name: string;
  email: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  website?: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
}

interface ProfileEditorProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onClose, isDark = false }) => {
  const [edited, setEdited] = useState<UserProfile>({
    ...profile,
    skills: profile.skills || []
  });
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(edited);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEdited({ ...edited, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !edited.skills?.includes(newSkill.trim())) {
      setEdited({
        ...edited,
        skills: [...(edited.skills || []), newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEdited({
      ...edited,
      skills: edited.skills?.filter(s => s !== skillToRemove)
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Picture Section - More compact and modern */}
        <div className={cn(
          "p-6 rounded-[32px] border space-y-4",
          isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
        )}>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className={cn(
                "w-24 h-24 rounded-[24px] overflow-hidden border-2 shadow-lg relative",
                isDark ? "bg-slate-700 border-slate-600" : "bg-white border-white"
              )}>
                {edited.photoURL ? (
                  <img src={edited.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    isDark ? "text-slate-500" : "text-slate-200"
                  )}>
                    <User size={40} />
                  </div>
                )}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="text-white" size={20} />
                </div>
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary text-white rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Plus size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div>
              <div className={cn(
                "text-base font-bold",
                isDark ? "text-white" : "text-slate-900"
              )}>Profile Photo</div>
              <p className="text-xs text-slate-400 font-medium mt-1">Upload a custom picture for your digital business card.</p>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline"
              >
                Change Image
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', icon: User, value: edited.name, key: 'name', type: 'text', placeholder: 'e.g. John Doe', required: true },
            { label: 'Email', icon: Mail, value: edited.email, key: 'email', type: 'email', placeholder: 'e.g. john@example.com', required: true },
            { label: 'Job Title', icon: Briefcase, value: edited.jobTitle || '', key: 'jobTitle', type: 'text', placeholder: 'e.g. Product Designer' },
            { label: 'Company', icon: Building2, value: edited.company || '', key: 'company', type: 'text', placeholder: 'e.g. TechFlow' },
            { label: 'Phone', icon: Phone, value: edited.phone || '', key: 'phone', type: 'text', placeholder: 'e.g. +1 (555) 000-0000' },
            { label: 'Website', icon: Globe, value: edited.website || '', key: 'website', type: 'text', placeholder: 'e.g. johndoe.com' },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <field.icon size={12} /> {field.label}
              </label>
              <input 
                required={field.required}
                type={field.type}
                className={cn(
                  "w-full px-5 py-3.5 border border-transparent rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-brand-primary/10 transition-all",
                  isDark 
                    ? "bg-slate-800 text-white focus:bg-slate-700 focus:border-brand-primary/20" 
                    : "bg-slate-50 text-slate-900 focus:bg-white focus:border-brand-primary/20"
                )} 
                value={field.value} 
                onChange={e => setEdited({...edited, [field.key]: e.target.value})} 
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
            <FileText size={12} /> Bio
          </label>
          <textarea 
            rows={2}
            className={cn(
              "w-full px-5 py-3.5 border border-transparent rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-brand-primary/10 transition-all resize-none",
              isDark 
                ? "bg-slate-800 text-white focus:bg-slate-700 focus:border-brand-primary/20" 
                : "bg-slate-50 text-slate-900 focus:bg-white focus:border-brand-primary/20"
            )} 
            value={edited.bio || ''} 
            onChange={e => setEdited({...edited, bio: e.target.value})} 
            placeholder="Short professional bio..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
            <Zap size={12} /> Skills
          </label>
          <div className="flex gap-2">
            <input 
              className={cn(
                "flex-1 px-5 py-3 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 ring-brand-primary/10 transition-all",
                isDark ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
              )} 
              value={newSkill} 
              onChange={e => setNewSkill(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add skill..."
            />
            <button 
              type="button"
              onClick={addSkill}
              className={cn(
                "px-5 rounded-xl font-bold text-xs transition-all",
                isDark ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {edited.skills?.map(skill => (
              <div key={skill} className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-bold",
                isDark 
                  ? "bg-slate-800 border-slate-700 text-slate-300" 
                  : "bg-white border-slate-100 text-slate-600"
              )}>
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="text-slate-300 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit"
            className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 text-sm"
          >
            <Save size={18} />
            Save Changes
          </button>
          <button 
            type="button"
            onClick={onClose}
            className={cn(
              "px-8 py-4 rounded-2xl font-bold text-sm transition-all",
              isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
