import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  Moon,
  Sun,
  Camera, 
  Upload, 
  CheckCircle2, 
  Download, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  MapPin, 
  Plus, 
  Search, 
  LogOut, 
  LogIn, 
  Trash2, 
  Edit3, 
  Save, 
  Users, 
  Zap, 
  Calendar,
  X,
  Menu,
  Share2,
  Filter,
  ArrowRight,
  MoreHorizontal,
  Star,
  Flame,
  Tag,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Briefcase,
  History,
  AlertCircle,
  Linkedin,
  Twitter,
  Instagram,
  Bell,
  Merge,
  Sparkles,
  Clock,
  Shield,
  ChevronRight,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  sendEmailVerification,
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  User,
  handleFirestoreError,
  OperationType
} from './firebase';
import { extractContactsFromImage, ExtractedContact, generateFollowUpMessage, refineFollowUpMessage } from './services/gemini';
import { Dashboard } from './components/Dashboard';
import { AllContacts } from './components/AllContacts';
import { ExportHub } from './components/ExportHub';
import { ProfileEditor } from './components/ProfileEditor';
import { ProfileTab } from './components/ProfileTab';
import { QRCodeSVG } from 'qrcode.react';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Event {
  id: string;
  name: string;
  location?: string;
  date: string;
  type?: string;
  description?: string;
  userId: string;
  createdAt: string;
}

interface Session {
  id: string;
  name?: string;
  eventId?: string;
  userId: string;
  contactCount: number;
  createdAt: string;
}

interface Contact extends ExtractedContact {
  id: string;
  userId: string;
  createdAt: string;
  sessionId?: string;
  eventId?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  isHotLead?: boolean;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  followUpDate?: string;
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

// --- Components ---

const CameraModal = ({ 
  isOpen, 
  onClose, 
  onCapture 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCapture: (base64: string) => void;
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera error:", err);
          onClose();
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isOpen]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg');
        onCapture(base64);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-white/10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-black dark:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="flex-1 overflow-y-auto">
          <div className="aspect-[4/3] bg-zinc-100 dark:bg-slate-800 relative overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Guide Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/20 dark:border-black/40 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-white/50 rounded-2xl" />
            </div>
          </div>
          
          <div className="p-8 flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Align your card</h3>
            <p className="text-zinc-500 dark:text-slate-400 mb-8">Position the business card within the frame.</p>
            <button 
              onClick={capture}
              className="w-20 h-20 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <div className="w-16 h-16 border-4 border-white/20 dark:border-black/10 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-white dark:bg-black rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled, 
  icon: Icon 
}: { 
  children: React.ReactNode; 
  onClick?: (e?: any) => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'; 
  className?: string; 
  disabled?: boolean;
  icon?: any;
}) => {
  const variants = {
    primary: 'tidy-gradient text-white hover:opacity-90 shadow-lg shadow-orange-500/20 dark:shadow-none',
    secondary: 'vibrant-gradient-blue text-white hover:opacity-90 shadow-lg shadow-blue-500/20 dark:shadow-none',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20',
    accent: 'vibrant-gradient-emerald text-white hover:opacity-90 shadow-lg shadow-[#8DC63F]/20 dark:shadow-none',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800"
      >
        <div className="p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold tracking-tight dark:text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mb-8">
            {children}
          </div>
          {footer && (
            <div className="flex gap-3">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ContactCard: React.FC<{ 
  contact: Contact; 
  onUpdate: (id: string, data: Partial<Contact>) => void; 
  onDelete: (id: string) => void;
  onDownloadVCard: (contact: Contact) => void;
  onGenerateFollowUp: (contact: Contact) => void;
  onScheduleFollowUp: (contact: Contact) => void;
}> = ({ 
  contact, 
  onUpdate, 
  onDelete,
  onDownloadVCard,
  onGenerateFollowUp,
  onScheduleFollowUp
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(contact);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onUpdate(contact.id, edited);
    setIsEditing(false);
  };

  const toggleFavorite = () => onUpdate(contact.id, { isFavorite: !contact.isFavorite });
  const toggleHotLead = () => onUpdate(contact.id, { isHotLead: !contact.isHotLead });

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white dark:bg-slate-800 border p-8 rounded-[40px] card-shadow transition-all group relative overflow-hidden",
          contact.isHotLead ? "border-orange-100 dark:border-orange-500/20 ring-1 ring-orange-500/10" : "border-slate-100 dark:border-slate-700"
        )}
      >
        {contact.isHotLead && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
        )}
        
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[24px] flex items-center justify-center text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 font-bold text-xl">
              {contact.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {contact.isHotLead && (
                  <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit">
                    <Flame size={10} /> Hot Lead
                  </div>
                )}
                {contact.isFavorite && (
                  <div className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit">
                    <Star size={10} className="fill-yellow-600 dark:fill-yellow-400" /> Favorite
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold tracking-tight dark:text-white">{contact.name}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                {contact.jobTitle} {contact.company ? `@ ${contact.company}` : ''}
              </p>
            </div>
          </div>
            <div className="flex gap-1">
              <button 
                onClick={() => window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(contact.name + ' ' + (contact.company || ''))}`, '_blank')}
                className="p-2.5 rounded-xl text-slate-400 dark:text-slate-300 hover:text-[#0A66C2] dark:hover:text-[#0A66C2] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all hover:scale-110 active:scale-90"
                title="Search on LinkedIn"
              >
                <Linkedin size={20} />
              </button>
              <button 
                onClick={toggleFavorite} 
              className={cn("p-2.5 rounded-xl transition-all hover:scale-110 active:scale-90", contact.isFavorite ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10" : "text-slate-400 dark:text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10")}
            >
              <Zap size={20} fill={contact.isFavorite ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2.5 rounded-xl text-slate-400 dark:text-slate-300 hover:text-brand-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:scale-110 active:scale-90"
            >
              <Edit3 size={20} />
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 rounded-xl text-slate-400 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all hover:scale-110 active:scale-90"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Full Name</label>
                <input 
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-brand-primary/10 dark:text-white" 
                  value={edited.name} 
                  onChange={e => setEdited({...edited, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Company</label>
                <input 
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-brand-primary/10 dark:text-white" 
                  value={edited.company || ''} 
                  onChange={e => setEdited({...edited, company: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Email Address</label>
                <input 
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white" 
                  value={edited.email || ''} 
                  onChange={e => setEdited({...edited, email: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Phone Number</label>
                <input 
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white" 
                  value={edited.phone || ''} 
                  onChange={e => setEdited({...edited, phone: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Follow-up Date</label>
              <input 
                type="date"
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white" 
                value={edited.followUpDate || ''} 
                onChange={e => setEdited({...edited, followUpDate: e.target.value})} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Notes</label>
              <textarea 
                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-brand-primary/10 min-h-[100px] resize-none dark:text-white" 
                value={edited.notes || ''} 
                onChange={e => setEdited({...edited, notes: e.target.value})} 
                placeholder="Add some context about this contact..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSave} 
                className="flex-1 bg-brand-primary text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 dark:shadow-none flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-8 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                {contact.email && (
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover/item:scale-110 transition-transform">
                      <Mail size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover/item:scale-110 transition-transform">
                      <Phone size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{contact.phone}</span>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-[#F4F9ED] dark:bg-[#F4F9ED]/10 rounded-xl flex items-center justify-center text-[#8DC63F] group-hover/item:scale-110 transition-transform">
                      <Globe size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{contact.website}</span>
                  </div>
                )}
                {contact.linkedin && (
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-[#0A66C2] group-hover/item:scale-110 transition-transform">
                      <Linkedin size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">linkedin.com/in/{contact.linkedin}</span>
                  </div>
                )}
                {contact.instagram && (
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 bg-pink-50 dark:bg-pink-500/10 rounded-xl flex items-center justify-center text-[#E4405F] group-hover/item:scale-110 transition-transform">
                      <Instagram size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">@{contact.instagram}</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <MessageSquare size={12} /> Notes
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
                  {contact.notes || "No notes added yet. Tap edit to add some context."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {contact.tags?.map((tag, i) => (
                <span key={i} className="group/tag flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-brand-primary hover:text-white">
                  {tag}
                  <button 
                    onClick={() => onUpdate(contact.id, { tags: contact.tags?.filter((_, index) => index !== i) })}
                    className="opacity-0 group-hover/tag:opacity-100 hover:text-white transition-all"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="+ Add Tag"
                  className="w-24 px-3 py-1.5 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:border-brand-primary focus:text-brand-primary transition-all bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        onUpdate(contact.id, { tags: [...(contact.tags || []), val] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={toggleHotLead}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    contact.isHotLead ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 dark:shadow-none" : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {contact.isHotLead ? 'Hot Lead 🔥' : 'Mark Hot'}
                </button>
                <button 
                  onClick={() => onGenerateFollowUp(contact)}
                  className="px-4 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  AI Follow-up
                </button>
                <button 
                  onClick={() => onScheduleFollowUp(contact)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Clock size={14} />
                  Schedule
                </button>
              </div>
              <button 
                onClick={() => onDownloadVCard(contact)}
                className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-accent transition-all text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
              >
                <Download size={18} />
                <span>Save to Contacts</span>
              </button>
            </div>
          </>
        )}
      </motion.div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Contact"
        footer={
          <>
            <button 
              onClick={() => {
                onDelete(contact.id);
                setShowDeleteConfirm(false);
              }}
              className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-all"
            >
              Delete
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </>
        }
      >
        <p className="text-slate-500 dark:text-slate-400">Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{contact.name}</span>? This action cannot be undone.</p>
      </Modal>
    </>
  );
};

// --- Main App ---

export default function App() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'scanner' | 'contacts' | 'export' | 'dashboard' | 'profile'>('scanner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingMessage, setProcessingMessage] = useState('Reading your cards...');
  const [toast, setToast] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [duplicateQueue, setDuplicateQueue] = useState<{ newContact: ExtractedContact, existingContact: Contact, sessionId: string }[]>([]);
  const [currentDuplicate, setCurrentDuplicate] = useState<{ newContact: ExtractedContact, existingContact: Contact, sessionId: string } | null>(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File | null, preview: string }[]>([]);
  const [processingResult, setProcessingResult] = useState<{ count: number, duplicates: number } | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpContact, setFollowUpContact] = useState<Contact | null>(null);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState('Conference');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactJobTitle, setNewContactJobTitle] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');
  const [newContactWebsite, setNewContactWebsite] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [newContactTwitter, setNewContactTwitter] = useState('');
  const [newContactInstagram, setNewContactInstagram] = useState('');
  const [newContactLinkedin, setNewContactLinkedin] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    jobTitle: '',
    company: '',
    phone: '',
    website: '',
    bio: '',
    skills: [],
    photoURL: ''
  });

  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
        photoURL: user.photoURL || undefined
      }));
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Auth ---
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!isDemoMode) {
        setUser(u);
      }
      setLoading(false);
    });
  }, [isDemoMode]);

  const handleLogout = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setUser(null);
      setContacts([]);
      setEvents([]);
      setSessions([]);
    } else {
      signOut(auth);
    }
  };

  const handleDemoMode = () => {
    setIsDemoMode(true);
    setUser({
      uid: 'demo-user',
      email: 'demo@tidyupped.com',
      displayName: 'Demo User',
      photoURL: 'https://picsum.photos/seed/demo/100/100',
    } as any);
    
    // Mock contacts
    const mockContacts: Contact[] = [
      {
        id: '1',
        userId: 'demo-user',
        name: 'Jane Smith',
        company: 'TechNova',
        jobTitle: 'CEO',
        email: 'jane@technova.com',
        phone: '+1 555 0123',
        website: 'www.technova.com',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        isFavorite: true,
        isHotLead: true,
        eventId: 'e1',
        tags: ['CEO', 'Founder', 'Tech'],
        notes: 'Met at the keynote. Interested in our enterprise plan.'
      },
      {
        id: '1-2',
        userId: 'demo-user',
        name: 'Alice Chen',
        company: 'TechNova',
        jobTitle: 'CTO',
        email: 'alice@technova.com',
        createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
        eventId: 'e1',
        tags: ['CTO', 'Engineering'],
        notes: 'Colleague of Jane. Technical decision maker.'
      },
      {
        id: '1-3',
        userId: 'demo-user',
        name: 'Mark Wilson',
        company: 'TechNova',
        jobTitle: 'VP Product',
        email: 'mark@technova.com',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        eventId: 'e1',
        tags: ['Product', 'Strategy'],
      },
      {
        id: '2',
        userId: 'demo-user',
        name: 'Mike Johnson',
        company: 'CloudScale',
        jobTitle: 'Solution Architect',
        email: 'mike.j@cloudscale.io',
        phone: '+1 555 4567',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        eventId: 'e1',
        tags: ['Engineering', 'AI', 'Cloud'],
        notes: 'Discussed API integrations for their platform.'
      },
      {
        id: '2-2',
        userId: 'demo-user',
        name: 'Sarah Connor',
        company: 'CloudScale',
        jobTitle: 'DevOps Lead',
        email: 's.connor@cloudscale.io',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        eventId: 'e3',
        tags: ['DevOps', 'Infrastructure'],
      },
      {
        id: '4',
        userId: 'demo-user',
        name: 'Sarah Williams',
        company: 'Global Ventures',
        jobTitle: 'Investment Partner',
        email: 'sarah.w@globalv.com',
        phone: '+1 555 1011',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isHotLead: true,
        isFavorite: true,
        eventId: 'e2',
        tags: ['Investor', 'VC', 'Finance'],
        notes: 'Follow up about our Series A deck.'
      },
      {
        id: '4-2',
        userId: 'demo-user',
        name: 'James Bond',
        company: 'Global Ventures',
        jobTitle: 'Analyst',
        email: 'j.bond@globalv.com',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        eventId: 'e2',
        tags: ['Finance', 'Analysis'],
      },
      {
        id: '5',
        userId: 'demo-user',
        name: 'David Miller',
        company: 'Stellar Marketing',
        jobTitle: 'Growth Lead',
        email: 'david@stellarmkt.com',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        eventId: 'e2',
        tags: ['Marketing', 'Growth'],
        notes: 'Met during the networking lunch. Great energy.'
      },
      {
        id: '6',
        userId: 'demo-user',
        name: 'Elena Rodriguez',
        company: 'BioTech Systems',
        jobTitle: 'Product Manager',
        email: 'e.rodriguez@biotech.io',
        createdAt: new Date().toISOString(),
        eventId: 'e2',
        tags: ['Product', 'BioTech'],
        notes: 'Interested in our scanning speed for lab inventory.'
      },
      {
        id: '7',
        userId: 'demo-user',
        name: 'Robert Taylor',
        company: 'Fintech Flow',
        jobTitle: 'CTO',
        email: 'robert@fintechflow.com',
        phone: '+1 555 2233',
        createdAt: new Date().toISOString(),
        isHotLead: true,
        eventId: 'e1',
        tags: ['CTO', 'Fintech', 'Tech'],
        notes: 'Wants a technical deep dive into our AI model.'
      },
      {
        id: '8',
        userId: 'demo-user',
        name: 'Lisa Anderson',
        company: 'Design Co',
        jobTitle: 'Senior Designer',
        email: 'lisa@designco.com',
        createdAt: new Date().toISOString(),
        eventId: 'e1',
        tags: ['Design', 'UI/UX'],
        notes: 'Recommended by Jane Smith.'
      },
      {
        id: '9',
        userId: 'demo-user',
        name: 'Kevin Park',
        company: 'Startup Hub',
        jobTitle: 'Community Manager',
        email: 'kevin@startuphub.org',
        createdAt: new Date().toISOString(),
        eventId: 'e2',
        tags: ['Community', 'Networking'],
        notes: 'Organizes monthly meetups in SF.'
      },
      {
        id: '10',
        userId: 'demo-user',
        name: 'Amanda White',
        company: 'Legal Eagle',
        jobTitle: 'General Counsel',
        email: 'amanda@legaleagle.com',
        createdAt: new Date().toISOString(),
        eventId: 'e2',
        tags: ['Legal', 'Compliance'],
        notes: 'Discussed data privacy and GDPR compliance.'
      },
      {
        id: '11',
        userId: 'demo-user',
        name: 'John Doe',
        company: 'Google',
        jobTitle: 'AI Researcher',
        email: 'johndoe@google.com',
        createdAt: new Date().toISOString(),
        eventId: 'e3',
        tags: ['AI', 'Research'],
        address: 'Mountain View, CA, USA'
      },
      {
        id: '12',
        userId: 'demo-user',
        name: 'Jane Doe',
        company: 'Google',
        jobTitle: 'Software Engineer',
        email: 'janedoe@google.com',
        createdAt: new Date().toISOString(),
        eventId: 'e3',
        tags: ['Engineering', 'Software'],
        address: 'London, UK'
      },
      {
        id: '13',
        userId: 'demo-user',
        name: 'Sam Altman',
        company: 'OpenAI',
        jobTitle: 'CEO',
        email: 'sam@openai.com',
        createdAt: new Date().toISOString(),
        eventId: 'e1',
        isHotLead: true,
        tags: ['CEO', 'AI'],
        address: 'San Francisco, CA, USA'
      }
    ];
    setContacts(mockContacts);

    // Mock Events
    const mockEvents: Event[] = [
      {
        id: 'e1',
        userId: 'demo-user',
        name: 'TechCrunch Disrupt',
        location: 'San Francisco',
        date: '2026-03-15',
        type: 'Conference',
        description: 'The ultimate startup event.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'e2',
        userId: 'demo-user',
        name: 'Web Summit 2026',
        location: 'Lisbon',
        date: '2026-03-28',
        type: 'Summit',
        description: 'Where the future goes to be born.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'e3',
        userId: 'demo-user',
        name: 'AI Expo',
        location: 'London',
        date: '2026-04-05',
        type: 'Expo',
        description: 'Exploring the latest in artificial intelligence.',
        createdAt: new Date().toISOString()
      }
    ];
    setEvents(mockEvents);

    // Mock Sessions
    const mockSessions: Session[] = [
      {
        id: 's1',
        userId: 'demo-user',
        eventId: 'e1',
        name: 'Day 1 Morning',
        contactCount: 5,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 's2',
        userId: 'demo-user',
        eventId: 'e2',
        name: 'Networking Night',
        contactCount: 5,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];
    setSessions(mockSessions);

    setToast('Welcome to Demo Mode! You are viewing sample data.');
  };

  const handleGenerateFollowUp = async (contact: Contact) => {
    setToast('Generating AI follow-up...');
    const message = await generateFollowUpMessage(contact);
    setFollowUpMessage(message);
    setFollowUpContact(contact);
    setIsFollowUpModalOpen(true);
  };

  const handleRefineFollowUp = async (tone: string) => {
    if (!followUpContact) return;
    setIsRefining(true);
    setToast(`Refining message to be ${tone}...`);
    try {
      const refined = await refineFollowUpMessage(followUpContact, followUpMessage, tone);
      setFollowUpMessage(refined);
      setToast('Message refined!');
    } catch (err) {
      console.error('Refinement failed', err);
      setToast('Failed to refine message');
    } finally {
      setIsRefining(false);
    }
  };

  const handleScheduleFollowUp = (contact: Contact) => {
    const title = `Follow up with ${contact.name}`;
    const details = `Met via TidyUpped. \nEmail: ${contact.email || 'N/A'}\nNotes: ${contact.notes || ''}`;
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${startTime}/${endTime}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const handleCreateEvent = () => {
    setIsEventModalOpen(true);
  };

  const submitCreateEvent = async () => {
    if (!user || !newEventName) return;
    if (isDemoMode) {
      const newEvent: Event = {
        id: Math.random().toString(36).substr(2, 9),
        name: newEventName,
        location: newEventLocation,
        date: newEventDate,
        type: newEventType,
        description: newEventDescription,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      setEvents(prev => [newEvent, ...prev]);
      setNewEventName('');
      setNewEventLocation('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventType('Conference');
      setNewEventDescription('');
      setIsEventModalOpen(false);
      setToast('Event created (Demo Mode)');
      return;
    }
    
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        name: newEventName,
        location: newEventLocation,
        date: newEventDate,
        type: newEventType,
        description: newEventDescription,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      setActiveEventId(docRef.id);
      setToast(`Event "${newEventName}" created!`);
      setNewEventName('');
      setNewEventLocation('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventType('Conference');
      setNewEventDescription('');
      setIsEventModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'events');
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (isDemoMode) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setSessions(prev => prev.filter(s => s.eventId !== id));
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event and all its sessions? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'events', id));
          setToast('Event deleted');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
        }
      }
    });
  };

  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login failed', err);
      handleAuthError(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setToast('Please fill in all fields');
      return;
    }
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (authName) {
          await updateProfile(userCredential.user, { displayName: authName });
        }
        await sendEmailVerification(userCredential.user);
        setToast('Account created! Verification email sent.');
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setToast('Welcome back!');
      }
    } catch (err: any) {
      console.error('Email auth failed', err);
      handleAuthError(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsAuthLoading(true);
    try {
      // For "Guest Login (no saving across sessions)", we can use anonymous auth
      // but the user also wants "Try Demo Mode". I'll use Demo Mode as it has data.
      handleDemoMode();
    } catch (err: any) {
      console.error('Guest login failed', err);
      handleAuthError(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    if (err.code === 'auth/popup-closed-by-user') {
      setToast('Sign-in popup was closed. Please try again.');
    } else if (err.code === 'auth/cancelled-popup-request') {
      setToast('Sign-in request was cancelled. Please try again.');
    } else if (err.code === 'auth/popup-blocked') {
      setToast('Sign-in popup was blocked. Please allow popups.');
    } else if (err.code === 'auth/email-already-in-use') {
      setToast('This email is already in use. Try logging in.');
    } else if (err.code === 'auth/invalid-credential') {
      setToast('Invalid email or password.');
    } else if (err.code === 'auth/weak-password') {
      setToast('Password should be at least 6 characters.');
    } else {
      setToast('Authentication failed. Please try again.');
    }
  };

  const downloadVCard = (contact: Contact) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company || ''}
TITLE:${contact.jobTitle || ''}
TEL;TYPE=WORK,VOICE:${contact.phone || ''}
EMAIL;TYPE=PREF,INTERNET:${contact.email || ''}
URL:${contact.website || ''}
NOTE:${contact.notes || ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${contact.name.replace(/\s+/g, '_')}.vcf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear History',
      message: 'Are you sure you want to clear all history? This action cannot be undone and will delete all your contacts, sessions, and events.',
      onConfirm: async () => {
        if (isDemoMode) {
          setContacts([]);
          setSessions([]);
          setEvents([]);
          setToast('Demo history cleared');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          return;
        }

        try {
          setToast('Clearing history...');
          
          // Use Promise.allSettled to attempt all deletions even if some fail
          const contactDeletions = contacts.map(c => 
            deleteDoc(doc(db, 'contacts', c.id)).catch(err => {
              console.warn(`Failed to delete contact ${c.id}`, err);
              return null;
            })
          );
          
          const sessionDeletions = sessions.map(s => 
            deleteDoc(doc(db, 'sessions', s.id)).catch(err => {
              console.warn(`Failed to delete session ${s.id}`, err);
              return null;
            })
          );
          
          const eventDeletions = events.map(e => 
            deleteDoc(doc(db, 'events', e.id)).catch(err => {
              console.warn(`Failed to delete event ${e.id}`, err);
              return null;
            })
          );

          await Promise.all([...contactDeletions, ...sessionDeletions, ...eventDeletions]);
          
          setToast('History cleared');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error('Clear history failed', err);
          setToast('Failed to clear history. Check console for details.');
        }
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Job Title', 'Company', 'Website', 'Notes', 'Created At'];
    const rows = contacts.map(c => [
      c.name,
      c.email || '',
      c.phone || '',
      c.jobTitle || '',
      c.company || '',
      c.website || '',
      c.notes || '',
      c.createdAt
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tidyupped_contacts_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('CSV Exported!');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const text = "Just organized my networking with TidyUpped! Check it out:";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = `Check out TidyUpped for business card scanning: ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Check out TidyUpped!")}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleShareReddit = () => {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent("Check out TidyUpped!")}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = "Check out TidyUpped!";
    const body = `I'm using TidyUpped to organize my networking. Check it out here: ${window.location.href}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleExportVCFBundle = () => {
    if (contacts.length === 0) {
      setToast('No contacts to export');
      return;
    }

    let vcfContent = '';
    contacts.forEach(contact => {
      vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company || ''}
TITLE:${contact.jobTitle || ''}
TEL;TYPE=WORK,VOICE:${contact.phone || ''}
EMAIL;TYPE=PREF,INTERNET:${contact.email || ''}
URL:${contact.website || ''}
NOTE:${contact.notes || ''}
END:VCARD\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tidyupped_contacts_bundle_${format(new Date(), 'yyyy-MM-dd')}.vcf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('VCF Bundle Exported!');
  };

  const handlePrint = () => {
    // Check if we are in an iframe
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setToast('For best results, open the app in a new tab to print.');
      // Attempt to print anyway
      try {
        window.print();
      } catch (e) {
        console.error('Print failed in iframe', e);
      }
    } else {
      window.print();
    }
  };

  const handleShareThreads = () => {
    const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(`Check out my professional profile on TidyUp! ${window.location.href}`)}`;
    window.open(url, '_blank');
    setToast('Threads draft opened!');
  };

  const handleSharePinterest = () => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent('My Professional Profile on TidyUp')}`;
    window.open(url, '_blank');
    setToast('Pinterest draft opened!');
  };

  const handleShareTikTok = () => {
    // TikTok doesn't have a direct share URL like others, usually it's app-based or copy link
    navigator.clipboard.writeText(window.location.href);
    setToast('Link copied! Share it on your TikTok profile.');
  };

  const handleUpdatePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setIsProfileEditorOpen(false);
    setToast('Profile updated successfully!');
  };

  // --- Data ---
  useEffect(() => {
    if (!user || isDemoMode) {
      if (!user) {
        setContacts([]);
        setEvents([]);
        setSessions([]);
      }
      return;
    }

    // Contacts
    const qContacts = query(
      collection(db, 'contacts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubContacts = onSnapshot(qContacts, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contact));
      setContacts(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'contacts');
    });

    // Events
    const qEvents = query(
      collection(db, 'events'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event));
      setEvents(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    // Sessions
    const qSessions = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session));
      setSessions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sessions');
    });

    return () => {
      unsubContacts();
      unsubEvents();
      unsubSessions();
    };
  }, [user]);

  const handleCreateContact = () => {
    if (!user) return;
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactJobTitle('');
    setNewContactCompany('');
    setNewContactWebsite('');
    setNewContactAddress('');
    setNewContactNotes('');
    setNewContactTwitter('');
    setNewContactInstagram('');
    setNewContactLinkedin('');
    setIsContactModalOpen(true);
  };

  const submitCreateContact = async () => {
    if (!user || !newContactName) return;
    
    const newContactData = {
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      jobTitle: newContactJobTitle,
      company: newContactCompany,
      website: newContactWebsite,
      address: newContactAddress,
      notes: newContactNotes,
      twitter: newContactTwitter,
      instagram: newContactInstagram,
      linkedin: newContactLinkedin,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      tags: [],
      isFavorite: false,
      isHotLead: false
    };

    try {
      if (isDemoMode) {
        setContacts(prev => [{ id: Math.random().toString(36).substr(2, 9), ...newContactData }, ...prev]);
      } else {
        await addDoc(collection(db, 'contacts'), newContactData);
      }
      setToast(`Contact "${newContactName}" created!`);
      setIsContactModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contacts');
    }
  };

  const handleUpdateContact = async (id: string, data: Partial<Contact>) => {
    if (isDemoMode) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return;
    }
    try {
      await updateDoc(doc(db, 'contacts', id), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contacts/${id}`);
    }
  };

  const handleDeleteContact = (id: string) => {
    if (isDemoMode) {
      setContacts(prev => prev.filter(c => c.id !== id));
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Delete Contact',
      message: 'Are you sure you want to delete this contact? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'contacts', id));
          setToast('Contact deleted');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `contacts/${id}`);
        }
      }
    });
  };

  // --- Scanning ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPendingFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleStartProcessing = async () => {
    if (!user || pendingFiles.length === 0) return;
    
    setIsProcessing(true);
    let processedCount = 0;
    let initialDuplicates = duplicateQueue.length;
    
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const { file, preview } = pendingFiles[i];
        setProcessingMessage(`Reading card ${i + 1} of ${pendingFiles.length}...`);
        await processImage(preview);
        processedCount++;
      }
      
      // Clear pending files
      pendingFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setPendingFiles([]);
      
      const duplicatesFound = duplicateQueue.length - initialDuplicates;
      setProcessingResult({ count: processedCount, duplicates: duplicatesFound });
      
      if (duplicateQueue.length > 0 && !currentDuplicate) {
        setCurrentDuplicate(duplicateQueue[0]);
        setDuplicateQueue(prev => prev.slice(1));
      }
    } catch (err) {
      console.error('Processing failed', err);
      setToast(err instanceof Error ? err.message : 'Processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (base64: string) => {
    if (!user) return;
    setProcessingMessage('Organizing your contacts...');
    const extracted = await extractContactsFromImage(base64);
    
    if (extracted.length === 0) return;

    // Create a session if none exists for this scan
    let sessionId = activeSessionId;
    if (!sessionId) {
      if (isDemoMode) {
        sessionId = Math.random().toString(36).substr(2, 9);
        const newSession: Session = {
          id: sessionId,
          name: `Session ${format(new Date(), 'MMM dd, HH:mm')}`,
          eventId: activeEventId || null,
          userId: user.uid,
          contactCount: extracted.length,
          createdAt: new Date().toISOString()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(sessionId);
      } else {
        try {
          const sessionRef = await addDoc(collection(db, 'sessions'), {
            name: `Session ${format(new Date(), 'MMM dd, HH:mm')}`,
            eventId: activeEventId || null,
            userId: user.uid,
            contactCount: extracted.length,
            createdAt: new Date().toISOString()
          });
          sessionId = sessionRef.id;
          setActiveSessionId(sessionId);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'sessions');
        }
      }
    }
    
    for (const contactData of extracted) {
      // Robust duplicate detection
      const potentialDuplicate = contacts.find(c => 
        (c.email && contactData.email && c.email.toLowerCase().trim() === contactData.email.toLowerCase().trim()) ||
        (c.name && contactData.name && c.name.toLowerCase().trim() === contactData.name.toLowerCase().trim() && 
         c.company && contactData.company && c.company.toLowerCase().trim() === contactData.company.toLowerCase().trim())
      );

      if (potentialDuplicate) {
        setDuplicateQueue(prev => [...prev, { newContact: contactData, existingContact: potentialDuplicate, sessionId }]);
        continue;
      }

      const contactPayload = {
        ...contactData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        sessionId,
        eventId: activeEventId || null,
        tags: [],
        notes: '',
        isFavorite: false,
        isHotLead: false,
        linkedin: '',
        twitter: '',
        instagram: ''
      };

      if (isDemoMode) {
        setContacts(prev => [{ id: Math.random().toString(36).substr(2, 9), ...contactPayload }, ...prev]);
      } else {
        try {
          await addDoc(collection(db, 'contacts'), contactPayload);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'contacts');
        }
      }
    }
  };

  const handleCameraCapture = (base64: string) => {
    setPendingFiles(prev => [...prev, { file: null, preview: base64 }]);
    setIsCameraOpen(false);
  };

  const handleMergeContacts = async (masterId: string, duplicateIds: string[]) => {
    if (!user) return;
    try {
      const masterContact = contacts.find(c => c.id === masterId);
      if (!masterContact) return;

      // Combine tags and notes from duplicates
      const allTags = new Set(masterContact.tags || []);
      let combinedNotes = masterContact.notes || '';

      for (const id of duplicateIds) {
        const dup = contacts.find(c => c.id === id);
        if (dup) {
          dup.tags?.forEach(t => allTags.add(t));
          if (dup.notes) combinedNotes += `\n\n[Merged Note]: ${dup.notes}`;
          
          // Delete the duplicate
          try {
            await deleteDoc(doc(db, 'contacts', id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `contacts/${id}`);
          }
        }
      }

      // Update the master contact
      try {
        await updateDoc(doc(db, 'contacts', masterId), {
          tags: Array.from(allTags),
          notes: combinedNotes.trim()
        });
        setToast('Contacts merged successfully');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `contacts/${masterId}`);
      }
    } catch (err) {
      console.error('Merge failed', err);
      setToast('Failed to merge contacts');
    }
  };

  const handleDuplicateAction = async (action: 'merge' | 'new' | 'skip') => {
    if (!user || !currentDuplicate) return;

    try {
      if (action === 'new') {
        try {
          await addDoc(collection(db, 'contacts'), {
            ...currentDuplicate.newContact,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            sessionId: currentDuplicate.sessionId,
            eventId: activeEventId || null,
            tags: [],
            notes: '',
            isFavorite: false,
            isHotLead: false,
            linkedin: '',
            twitter: '',
            instagram: ''
          });
          setToast('Contact added as new');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'contacts');
        }
      } else if (action === 'merge') {
        // Simple merge: update existing with any new info if missing
        const updates: any = {};
        const { newContact, existingContact } = currentDuplicate;
        
        if (!existingContact.jobTitle && newContact.jobTitle) updates.jobTitle = newContact.jobTitle;
        if (!existingContact.company && newContact.company) updates.company = newContact.company;
        if (!existingContact.phone && newContact.phone) updates.phone = newContact.phone;
        if (!existingContact.website && newContact.website) updates.website = newContact.website;
        
        if (Object.keys(updates).length > 0) {
          try {
            await updateDoc(doc(db, 'contacts', existingContact.id), updates);
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `contacts/${existingContact.id}`);
          }
        }
        setToast('Contact merged');
      }
    } catch (err) {
      console.error('Duplicate action failed', err);
    } finally {
      // Move to next in queue
      if (duplicateQueue.length > 0) {
        const next = duplicateQueue[0];
        setDuplicateQueue(prev => prev.slice(1));
        setCurrentDuplicate(next);
      } else {
        setCurrentDuplicate(null);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop: onDrop as any, 
    accept: { 'image/*': [] },
    multiple: true,
    noClick: false,
    noKeyboard: false
  } as any);

  // --- Filtering ---
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

    if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brand-bg text-brand-primary transition-colors duration-300">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-brand-primary rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-primary flex flex-col items-center justify-center p-6 transition-colors duration-300 relative">
        {/* Theme Toggle for Login Screen */}
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 bg-brand-card dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] bg-brand-card dark:bg-slate-800 rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-10">
            <div className="flex flex-col items-center mb-12">
              <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3">TidyUpped</h1>
              <p className="text-[10px] font-bold text-brand-primary dark:text-brand-accent uppercase tracking-[0.4em]">Business Card Scanner</p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-center mb-2 dark:text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              {authMode === 'login' 
                ? 'Sign in to manage your contacts' 
                : 'Start organizing your networking today'}
            </p>

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      type="text"
                      placeholder="John Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-brand-primary/10 transition-all dark:text-white"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="email"
                    placeholder="name@company.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-brand-primary/10 transition-all dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-4">Password</label>
                <div className="relative">
                  <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-brand-primary/10 transition-all dark:text-white"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4 bg-brand-primary text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthLoading ? <Loader2 className="animate-spin" size={18} /> : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-brand-card dark:bg-slate-800 px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={handleLogin}
                disabled={isAuthLoading}
                className="flex items-center justify-center gap-2 py-4 bg-brand-card dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all dark:text-white"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Google
              </button>
              <button 
                onClick={handleGuestLogin}
                disabled={isAuthLoading}
                className="flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-brand-accent text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-brand-accent/90 transition-all"
              >
                <Zap size={18} className="text-brand-primary dark:text-slate-900" />
                Guest
              </button>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-brand-primary font-bold hover:underline"
              >
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 p-6 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Guest login provides a temporary demo session
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg text-brand-primary font-sans selection:bg-brand-primary selection:text-white relative transition-colors duration-300">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibrant-orange/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibrant-blue/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-vibrant-pink/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Duplicate Modal */}
      <AnimatePresence>
        {currentDuplicate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-card dark:bg-slate-900 w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="p-10 overflow-y-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Duplicate Detected</h3>
                    <p className="text-slate-500 dark:text-slate-400">We found an existing contact that matches this scan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-4">Existing Contact</div>
                    <div className="font-bold text-lg mb-1 text-slate-900 dark:text-white">{currentDuplicate.existingContact.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">{currentDuplicate.existingContact.company || 'No Company'}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{currentDuplicate.existingContact.email}</div>
                  </div>
                  <div className="p-6 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-[32px] border border-brand-primary/10 dark:border-brand-primary/20">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-brand-primary mb-4">New Scan</div>
                    <div className="font-bold text-lg mb-1 text-slate-900 dark:text-white">{currentDuplicate.newContact.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">{currentDuplicate.newContact.company || 'No Company'}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{currentDuplicate.newContact.email}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => handleDuplicateAction('merge')}
                    className="flex-1 py-4 bg-black dark:bg-white dark:text-black text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Merge size={20} />
                    Merge Info
                  </button>
                  <button 
                    onClick={() => handleDuplicateAction('new')}
                    className="flex-1 py-4 bg-brand-card dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Add as New
                  </button>
                  <button 
                    onClick={() => handleDuplicateAction('skip')}
                    className="px-8 py-4 text-slate-400 dark:text-slate-500 font-bold hover:text-red-500 transition-all"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Result Modal */}
      <AnimatePresence>
        {processingResult && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-brand-card dark:bg-slate-900 w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Processing Complete</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                  Successfully processed {processingResult.count} card{processingResult.count !== 1 ? 's' : ''}.
                  {processingResult.duplicates > 0 && ` ${processingResult.duplicates} duplicate${processingResult.duplicates !== 1 ? 's' : ''} found.`}
                </p>
                <button
                  onClick={() => setProcessingResult(null)}
                  className="w-full py-4 bg-brand-primary text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-brand-primary text-white dark:text-slate-900 py-2 px-6 text-center text-xs font-bold uppercase tracking-[0.2em] relative z-50 flex items-center justify-center gap-4">
          <span>Demo Mode: Previewing Sample Data</span>
          <button 
            onClick={handleLogout}
            className="bg-white/20 dark:bg-slate-900/10 hover:bg-white/30 dark:hover:bg-slate-900/20 px-3 py-1 rounded-full transition-colors"
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 md:px-8 py-4">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-all"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-100 dark:border-slate-800">
            {[
              { id: 'scanner', label: 'Scanner', icon: Camera, color: 'text-vibrant-orange', bg: 'bg-orange-50 dark:bg-orange-500/10' },
              { id: 'contacts', label: 'All Contacts', icon: Users, color: 'text-vibrant-pink', bg: 'bg-pink-50 dark:bg-pink-500/10' },
              { id: 'export', label: 'Export', icon: Share2, color: 'text-[#0072BC]', bg: 'bg-[#EBF5FB] dark:bg-blue-500/10' },
              { id: 'dashboard', label: 'Dashboard', icon: Zap, color: 'text-vibrant-blue', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { id: 'profile', label: 'Profile', icon: UserIcon, color: 'text-brand-primary', bg: 'bg-brand-primary/10 dark:bg-white/10' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all",
                  activeTab === tab.id ? `${tab.bg} ${tab.color} shadow-sm` : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-500 transition-all hover:scale-110 active:scale-95"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 bg-[#8DC63F]/10 text-[#8DC63F] rounded-full text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-[#8DC63F] rounded-full animate-pulse" />
              Live
            </div>
            <button onClick={handleLogout} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-500 transition-all hover:scale-110 active:scale-95">
              <LogOut size={22} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800"
            >
              <div className="grid grid-cols-1 gap-1 p-4">
                {[
                  { id: 'scanner', label: 'Scanner', icon: Camera, color: 'text-vibrant-orange', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                  { id: 'contacts', label: 'All Contacts', icon: Users, color: 'text-vibrant-pink', bg: 'bg-pink-50 dark:bg-pink-500/10' },
                  { id: 'export', label: 'Export', icon: Share2, color: 'text-[#0072BC]', bg: 'bg-[#EBF5FB] dark:bg-blue-500/10' },
                  { id: 'dashboard', label: 'Dashboard', icon: Zap, color: 'text-vibrant-blue', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                  { id: 'profile', label: 'Profile', icon: UserIcon, color: 'text-brand-primary', bg: 'bg-brand-primary/10 dark:bg-white/10' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all w-full text-left",
                      activeTab === tab.id ? `${tab.bg} ${tab.color}` : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <tab.icon size={20} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {isProcessing ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                  <div className="relative w-40 h-40 mb-10">
                    <motion.div 
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.05, 1],
                        borderRadius: ["40%", "50%", "40%"]
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                        scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        borderRadius: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                      }}
                      className="absolute inset-0 bg-gradient-to-tr from-[#E8F3D8] to-[#F4F9ED] border border-[#D4E8B8]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <Sparkles className="text-[#8DC63F]" size={48} />
                      </motion.div>
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold mb-3 tracking-tight dark:text-white">{processingMessage}</h2>
                  <p className="text-slate-400 text-lg">Our AI is doing the heavy lifting...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Hero Section */}
                  <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 md:mb-6">
                      Scan Cards. <span className="text-[#0072BC] dark:text-blue-400">Distribute Instantly.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
                      Upload photos of business cards. AI reads every card and routes contacts to all your configured destinations automatically.
                    </p>
                  </div>

                  {/* Stepper */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                    <div className="flex items-center gap-3 px-6 py-3 bg-[#8DC63F] text-white rounded-full shadow-lg shadow-[#8DC63F]/20 font-bold">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">1</div>
                      Upload Photos
                    </div>
                    <div className="hidden sm:block w-8 h-[2px] bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-full font-bold">
                      <div className="w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-sm">2</div>
                      AI Extraction
                    </div>
                    <div className="hidden sm:block w-8 h-[2px] bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-full font-bold">
                      <div className="w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-sm">3</div>
                      Review in History
                    </div>
                  </div>

                  {/* Upload Card */}
                  <div className="bg-white dark:bg-slate-800 rounded-[24px] md:rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-w-5xl mx-auto">
                    <div className="bg-[#F4F9ED]/50 dark:bg-slate-900/50 px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00548B] dark:text-brand-accent">📸 UPLOAD BUSINESS CARD PHOTOS</span>
                    </div>
                    <div className="p-4 md:p-8">
                      <div 
                        {...getRootProps()}
                        className={cn(
                          "relative border-2 border-dashed rounded-[20px] md:rounded-[32px] p-8 md:p-20 transition-all duration-300 flex flex-col items-center justify-center text-center",
                          isDragActive ? "border-[#8DC63F] bg-[#F4F9ED]/30 scale-[0.99]" : "border-[#D4E8B8] dark:border-slate-700 bg-[#F4F9ED]/10 dark:bg-slate-900/20 hover:border-[#8DC63F] hover:bg-[#F4F9ED]/20"
                        )}
                      >
                        <input {...getInputProps()} />
                        <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Drop photos here, or click to browse</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 md:mb-10 text-sm md:text-lg">Batch upload supported, each photo can contain multiple cards</p>
                        
                        <div className="flex flex-wrap gap-3 md:gap-4 mb-10 md:mb-16 justify-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); open(); }}
                            className="bg-[#8DC63F] text-white px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#7FB339] transition-all shadow-lg shadow-[#8DC63F]/20 active:scale-95 text-sm md:text-base"
                          >
                            <Upload size={18} />
                            Choose Photos
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsCameraOpen(true); }}
                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm active:scale-95 text-sm md:text-base"
                          >
                            <Camera size={18} />
                            Take photo
                          </button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 md:gap-12 pt-8 md:pt-10 border-t border-[#D4E8B8] dark:border-slate-700 w-full">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-semibold">
                            <span className="text-lg">🖼️</span> JPG, PNG, HEIC, WebP
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-semibold">
                            <span className="text-lg">📦</span> Batch upload
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-semibold">
                            <span className="text-lg">🤖</span> Multi-card per photo
                          </div>
                        </div>
                      </div>

                      {/* Pending Files Ribbon */}
                      {pendingFiles.length > 0 && (
                        <div className="mt-8 w-full">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              Pending Photos ({pendingFiles.length})
                            </h4>
                            <button 
                              onClick={() => setPendingFiles([])}
                              className="text-xs font-bold text-red-500 hover:underline"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 pr-2 scrollbar-hide">
                            {pendingFiles.map((file, idx) => (
                              <div key={idx} className="relative flex-shrink-0 group">
                                <img 
                                  src={file.preview} 
                                  alt={`Pending ${idx}`} 
                                  className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl border-2 border-slate-100 dark:border-slate-700 group-hover:border-brand-primary transition-all"
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removePendingFile(idx); }}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button 
                              onClick={(e) => { e.stopPropagation(); open(); }}
                              className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
                            >
                              <Plus size={32} className="text-slate-400 dark:text-slate-600" />
                            </button>
                          </div>
                          
                          <div className="mt-8 flex justify-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStartProcessing(); }}
                              className="bg-brand-primary text-white dark:text-slate-900 px-12 py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-brand-primary/30 active:scale-95"
                            >
                              <Sparkles size={24} />
                              Process {pendingFiles.length} Card{pendingFiles.length !== 1 ? 's' : ''}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard 
                contacts={contacts} 
                sessions={sessions} 
                events={events}
                onRefresh={() => setToast('Data refreshed')}
                onClearHistory={handleClearHistory}
                isDark={darkMode}
                onNavigate={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AllContacts 
                events={events}
                sessions={sessions}
                contacts={contacts}
                onSelectEvent={setActiveEventId}
                onSelectSession={setActiveSessionId}
                onCreateEvent={handleCreateEvent}
                onDeleteEvent={handleDeleteEvent}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                onCreateContact={handleCreateContact}
                isDark={darkMode}
              />
            </motion.div>
          )}

          {activeTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ExportHub 
                contacts={contacts}
                onExportCSV={handleExportCSV}
                onExportVCF={handleExportVCFBundle}
                onPrint={handlePrint}
                onShareLinkedIn={handleShareLinkedIn}
                onShareTwitter={handleShareTwitter}
                onShareWhatsApp={handleShareWhatsApp}
                onShareTelegram={handleShareTelegram}
                onShareFacebook={handleShareFacebook}
                onShareReddit={handleShareReddit}
                onShareEmail={handleShareEmail}
                onShareThreads={handleShareThreads}
                onSharePinterest={handleSharePinterest}
                onShareTikTok={handleShareTikTok}
                onToast={setToast}
                isDark={darkMode}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProfileTab 
                userProfile={userProfile}
                contactsCount={contacts.length}
                scansCount={sessions.length}
                onEditProfile={() => setIsProfileEditorOpen(true)}
                onPrint={handlePrint}
                onUpdatePassword={handleUpdatePassword}
                onToast={setToast}
                isDark={darkMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10 text-center border-t border-slate-100 dark:border-slate-800 mt-10">
        <p className="text-slate-400 dark:text-slate-500 text-sm">© 2026 TidyUpped. All rights reserved.</p>
      </footer>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <CameraModal 
            isOpen={isCameraOpen} 
            onClose={() => setIsCameraOpen(false)} 
            onCapture={handleCameraCapture} 
          />
        )}
      </AnimatePresence>

      {/* Password Update Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Update Password"
        footer={
          <>
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setIsPasswordModalOpen(false);
                setToast('Password reset link sent to your email!');
              }}
              className="flex-1 bg-brand-primary text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Send Reset Link
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">For security, we will send a password reset link to your registered email address: <span className="font-bold text-slate-900 dark:text-white">{userProfile.email}</span></p>
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-3">
            <Shield className="text-blue-500" size={20} />
            <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
              Once you click "Send Reset Link", check your inbox (and spam folder) for instructions on how to set a new password.
            </p>
          </div>
        </div>
      </Modal>

      {/* Profile Editor Modal */}
      <Modal
        isOpen={isProfileEditorOpen}
        onClose={() => setIsProfileEditorOpen(false)}
        title="Customize Your Profile"
      >
        <ProfileEditor 
          profile={userProfile}
          onSave={handleSaveProfile}
          onClose={() => setIsProfileEditorOpen(false)}
          isDark={darkMode}
        />
      </Modal>

      {/* New Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Create New Event"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setIsEventModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={submitCreateEvent}
              disabled={!newEventName}
              className="flex-1 py-4 bg-brand-primary text-white dark:text-slate-900 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              Create Event
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Event Name</label>
            <input 
              type="text" 
              placeholder="e.g. CES 2026, Web Summit..." 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-bold outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Location</label>
            <input 
              type="text" 
              placeholder="e.g. Las Vegas, Lisbon..." 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newEventLocation}
              onChange={(e) => setNewEventLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Event Date</label>
            <input 
              type="date" 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Event Type</label>
            <select 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
            >
              <option value="Conference">Conference</option>
              <option value="Trade Show">Trade Show</option>
              <option value="Networking">Networking</option>
              <option value="Workshop">Workshop</option>
              <option value="Meetup">Meetup</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Description</label>
            <textarea 
              placeholder="Add some details about the event..." 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white min-h-[100px] resize-none"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
            />
          </div>
          <div className="p-4 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-2xl border border-brand-primary/10">
            <p className="text-[11px] text-brand-primary dark:text-brand-accent font-medium leading-relaxed">
              <strong>Tip:</strong> Once created, you can add sessions and scan business cards. The "Sessions Held" and "New Contacts" counts will update automatically in your directory.
            </p>
          </div>
        </div>
      </Modal>

      {/* New Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Create New Contact"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setIsContactModalOpen(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={submitCreateContact}
              disabled={!newContactName}
              className="flex-1 py-4 bg-brand-primary text-white dark:text-slate-900 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              Create Contact
            </button>
          </div>
        }
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Full Name *</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-bold outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Email</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Phone</label>
              <input 
                type="tel" 
                placeholder="+1 (555) 000-0000" 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Job Title</label>
              <input 
                type="text" 
                placeholder="e.g. Software Engineer" 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
                value={newContactJobTitle}
                onChange={(e) => setNewContactJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Company</label>
              <input 
                type="text" 
                placeholder="e.g. Acme Inc." 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
                value={newContactCompany}
                onChange={(e) => setNewContactCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Website</label>
            <input 
              type="url" 
              placeholder="https://example.com" 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newContactWebsite}
              onChange={(e) => setNewContactWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Address</label>
            <input 
              type="text" 
              placeholder="e.g. 123 Main St, San Francisco, CA" 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white"
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Social Links</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl">
                <Linkedin size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="LinkedIn Profile URL" 
                  className="flex-1 bg-transparent border-none text-sm font-medium outline-none dark:text-white"
                  value={newContactLinkedin}
                  onChange={(e) => setNewContactLinkedin(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl">
                <Twitter size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Twitter Handle" 
                  className="flex-1 bg-transparent border-none text-sm font-medium outline-none dark:text-white"
                  value={newContactTwitter}
                  onChange={(e) => setNewContactTwitter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl">
                <Instagram size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Instagram Handle" 
                  className="flex-1 bg-transparent border-none text-sm font-medium outline-none dark:text-white"
                  value={newContactInstagram}
                  onChange={(e) => setNewContactInstagram(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Notes</label>
            <textarea 
              placeholder="Add any additional notes about this contact..." 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none focus:ring-2 ring-brand-primary/10 dark:text-white min-h-[100px] resize-none"
              value={newContactNotes}
              onChange={(e) => setNewContactNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="AI Follow-up Message"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(followUpMessage);
                setToast('Copied to clipboard!');
              }}
              className="flex-1 bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Copy Message
            </button>
            <button 
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 min-h-[200px] relative">
            {isRefining && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center rounded-[32px] z-10">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
              </div>
            )}
            <textarea 
              className="w-full h-full bg-transparent border-none text-slate-600 dark:text-slate-300 text-sm leading-relaxed outline-none resize-none min-h-[200px]"
              value={followUpMessage}
              onChange={(e) => setFollowUpMessage(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-2">Refine Tone with AI</label>
            <div className="flex flex-wrap gap-2">
              {['Professional', 'Casual', 'Enthusiastic', 'Short & Sweet'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleRefineFollowUp(tone)}
                  disabled={isRefining}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50"
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={confirmModal.onConfirm}
              className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-slate-500 text-lg leading-relaxed">{confirmModal.message}</p>
      </Modal>

      {/* Toast Notification */}
      <Toaster position="bottom-center" />
    </div>
  );
}
