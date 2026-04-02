import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight, 
  Plus, 
  FolderOpen,
  Trash2,
  MoreVertical,
  Filter,
  LayoutGrid,
  List,
  Search,
  ArrowUpDown,
  Tag,
  Flame,
  Instagram,
  Globe,
  Zap,
  Check,
  X,
  User,
  Mail,
  Building2,
  Clock,
  Star,
  MoreHorizontal,
  Linkedin,
  ExternalLink,
  Phone,
  ArrowRight,
  Edit3,
  Save,
  Sparkles,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AllContactsProps {
  events: any[];
  sessions: any[];
  contacts: any[];
  onSelectEvent: (id: string) => void;
  onSelectSession: (id: string) => void;
  onCreateEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onUpdateContact: (id: string, data: any) => void;
  onDeleteContact: (id: string) => void;
  onCreateContact: () => void;
  isDark?: boolean;
}

export const AllContacts: React.FC<AllContactsProps> = ({ 
  events, 
  sessions, 
  contacts,
  onSelectEvent,
  onSelectSession,
  onCreateEvent,
  onDeleteEvent,
  onUpdateContact,
  onDeleteContact,
  onCreateContact,
  isDark = false
}) => {
  const [viewMode, setViewMode] = useState<'events' | 'all'>('events');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'event' | 'tags' | 'lastContacted' | 'location' | 'sessions' | 'contacts' | 'date'>('lastContacted');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showBulkEventDeleteConfirm, setShowBulkEventDeleteConfirm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'hot' | 'favorite'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [bulkTag, setBulkTag] = useState('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [followUpTemplates, setFollowUpTemplates] = useState([
    { id: '1', name: 'Standard Follow-up', content: "Hi {name}, it was great meeting you at {event}. Let's connect soon!" },
    { id: '2', name: 'Coffee Meeting', content: "Hi {name}, I enjoyed our chat at {event}. Would you be open to a coffee next week?" },
    { id: '3', name: 'Resource Share', content: "Hi {name}, following up on our conversation at {event}. Here is the resource I mentioned..." }
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [generatedFollowUp, setGeneratedFollowUp] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContactData, setEditedContactData] = useState<any>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [bulkFollowUpDate, setBulkFollowUpDate] = useState('');
  const [isBulkFollowUp, setIsBulkFollowUp] = useState(false);

  const handleRefineWithAI = async (content: string, setContent: (val: string) => void) => {
    if (!content.trim()) return;
    
    setIsRefining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const eventName = events.find(e => e.id === selectedContact.eventId)?.name || 'the event';
      
      const prompt = `You are a networking expert. Rewrite the following networking follow-up message to be more professional, engaging, and concise. 
      Keep the placeholders {name} and {event} if they are present. 
      The message is for a contact named ${selectedContact.name} met at ${eventName}. 
      
      Draft: "${content}"
      
      Provide ONLY the rewritten message text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const refined = response.text?.trim();
      if (refined) {
        setContent(refined);
        toast.success('AI Refined!');
      }
    } catch (error) {
      console.error('AI Refine error:', error);
      toast.error('Failed to refine with AI');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveContact = () => {
    if (!editedContactData) return;
    onUpdateContact(selectedContact.id, editedContactData);
    setSelectedContact({ ...selectedContact, ...editedContactData });
    setIsEditingContact(false);
    toast.success('Contact updated');
  };

  const generateFollowUp = (templateId: string) => {
    const template = followUpTemplates.find(t => t.id === templateId);
    if (!template || !selectedContact) return;

    const eventName = events.find(e => e.id === selectedContact.eventId)?.name || 'the event';
    const content = template.content
      .replace('{name}', selectedContact.name.split(' ')[0])
      .replace('{event}', eventName);
    
    setGeneratedFollowUp(content);
    setSelectedTemplateId(templateId);
    toast.success('Follow-up generated!');
  };

  const handleAddTemplate = () => {
    if (!newTemplateName || !newTemplateContent) {
      toast.error('Please fill in all fields');
      return;
    }
    const newTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTemplateName,
      content: newTemplateContent
    };
    setFollowUpTemplates([...followUpTemplates, newTemplate]);
    setNewTemplateName('');
    setNewTemplateContent('');
    setIsAddingTemplate(false);
    toast.success('Template added!');
  };

  const allTags: string[] = Array.from(new Set(contacts.flatMap(c => c.tags || []))).sort() as string[];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      e.location?.toLowerCase().includes(localSearch.toLowerCase());
    
    const eventContacts = contacts.filter(c => c.eventId === e.id);
    
    const matchesType = filterType === 'all' || 
      (filterType === 'hot' && eventContacts.some(c => c.isHotLead)) || 
      (filterType === 'favorite' && eventContacts.some(c => c.isFavorite));
      
    const matchesTag = selectedTags.size === 0 || eventContacts.some(c => c.tags && Array.from(selectedTags).every(tag => c.tags.includes(tag)));
    
    return matchesSearch && matchesType && matchesTag;
  });

  const filteredAndSortedContacts = [...contacts]
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        c.company?.toLowerCase().includes(localSearch.toLowerCase()) ||
        c.event?.toLowerCase().includes(localSearch.toLowerCase());
      const matchesType = filterType === 'all' || 
        (filterType === 'hot' && c.isHotLead) || 
        (filterType === 'favorite' && c.isFavorite);
      const matchesTag = selectedTags.size === 0 || (c.tags && Array.from(selectedTags).every(tag => c.tags.includes(tag)));
      return matchesSearch && matchesType && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'company') return (a.company || '').localeCompare(b.company || '');
      if (sortBy === 'event') {
        const aEvent = events.find(e => e.id === a.eventId)?.name || '';
        const bEvent = events.find(e => e.id === b.eventId)?.name || '';
        return aEvent.localeCompare(bEvent);
      }
      if (sortBy === 'tags') {
        const aTags = (a.tags || []).length;
        const bTags = (b.tags || []).length;
        return bTags - aTags;
      }
      if (sortBy === 'lastContacted' || sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedContacts.map(c => c.id)));
    }
  };

  const toggleSelectAllEvents = () => {
    if (selectedEventIds.size === events.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(events.map(e => e.id)));
    }
  };

  const toggleSelectEvent = (id: string) => {
    const newSelected = new Set(selectedEventIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEventIds(newSelected);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => onDeleteContact(id));
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    toast.success('Contacts deleted');
  };

  const handleBulkEventDelete = () => {
    selectedEventIds.forEach(id => onDeleteEvent(id));
    setSelectedEventIds(new Set());
    setShowBulkEventDeleteConfirm(false);
    toast.success('Events deleted');
  };

  const handleBulkTag = (tagToApply?: string) => {
    const finalTag = tagToApply || bulkTag.trim();
    if (!finalTag) return;
    
    selectedIds.forEach(id => {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        const newTags = Array.from(new Set([...(contact.tags || []), finalTag]));
        onUpdateContact(id, { tags: newTags });
      }
    });
    setBulkTag('');
    setIsBulkTagging(false);
    setSelectedIds(new Set());
    toast.success(`Contacts tagged with "${finalTag}"`);
  };

  const handleBulkToggleHotLead = () => {
    selectedIds.forEach(id => {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        onUpdateContact(id, { isHotLead: !contact.isHotLead });
      }
    });
    setSelectedIds(new Set());
    toast.success('Hot lead status updated');
  };

  const handleBulkToggleFavorite = () => {
    selectedIds.forEach(id => {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        onUpdateContact(id, { isFavorite: !contact.isFavorite });
      }
    });
    setSelectedIds(new Set());
    toast.success('Favorite status updated');
  };

  const handleBulkFollowUp = () => {
    if (!bulkFollowUpDate) return;
    selectedIds.forEach(id => {
      onUpdateContact(id, { followUpDate: bulkFollowUpDate });
    });
    setBulkFollowUpDate('');
    setIsBulkFollowUp(false);
    setSelectedIds(new Set());
    toast.success(`Follow-up set for ${selectedIds.size} contacts`);
  };

  const handleLinkedInSearch = (name: string, company?: string) => {
    const query = encodeURIComponent(`${name} ${company || ''} linkedin`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  return (
    <>
      <div className="space-y-12 pb-20">
      {/* Header - Export Hub Style */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">
          📇 Tidy Directory
        </h2>
        <p className="text-slate-500 dark:text-slate-300 text-xl leading-relaxed">
          Manage your connections, track event participation, and organize your professional ecosystem in one unified high-fidelity archive.
        </p>
      </div>

      {/* Sub-tabs - Export Hub Style */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-inner">
          <button 
            onClick={() => setViewMode('events')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-[18px] font-bold text-sm transition-all duration-300",
              viewMode === 'events' 
                ? "bg-white dark:bg-slate-700 text-brand-primary dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
            )}
          >
            <LayoutGrid size={18} className={viewMode === 'events' ? "text-brand-accent" : ""} />
            Events
          </button>
          <button 
            onClick={() => setViewMode('all')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-[18px] font-bold text-sm transition-all duration-300",
              viewMode === 'all' 
                ? "bg-white dark:bg-slate-700 text-brand-primary dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
            )}
          >
            <List size={18} className={viewMode === 'all' ? "text-brand-accent" : ""} />
            All Contacts
          </button>
        </div>
      </div>

      {/* Content Card - Export Hub Style */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow min-h-[600px]">
        <div className="flex flex-col gap-6 md:gap-10">
          {/* Card Header with Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 md:pb-10 border-b border-slate-50 dark:border-slate-700">
            <div>
              <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3 tracking-tight dark:text-white">
                {viewMode === 'events' ? (
                  <>
                    <LayoutGrid size={24} className="text-brand-primary dark:text-brand-accent" />
                    Events
                  </>
                ) : (
                  <>
                    <List size={24} className="text-brand-primary dark:text-brand-accent" />
                    All Contacts
                  </>
                )}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-full md:min-w-0 md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                <input 
                  type="text"
                  placeholder={viewMode === 'events' ? "Search events..." : "Search connections..."}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 transition-all outline-none dark:text-white dark:placeholder:text-slate-600"
                />
              </div>
              
              {viewMode === 'all' && (
                <button 
                  onClick={onCreateContact}
                  className="w-full md:w-auto bg-brand-primary text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-brand-primary/90 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 text-sm"
                >
                  New Contact
                </button>
              )}
              
              {viewMode === 'events' && (
                <button 
                  onClick={onCreateEvent}
                  className="w-full md:w-auto bg-brand-primary text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-brand-primary/90 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 text-sm"
                >
                  New Event
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'events' ? (
              <motion.div 
                key="events-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Events Table Container */}
                <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  {/* Events Filter Bar */}
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-6">
                      {/* Status Filters */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                        <button 
                          onClick={() => setFilterType('all')}
                          className={cn(
                            "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                            filterType === 'all' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-300"
                          )}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setFilterType('hot')}
                          className={cn(
                            "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            filterType === 'hot' ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-300"
                          )}
                        >
                          <Flame size={14} />
                          Hot
                        </button>
                        <button 
                          onClick={() => setFilterType('favorite')}
                          className={cn(
                            "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            filterType === 'favorite' ? "bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-300"
                          )}
                        >
                          <Star size={14} />
                          Favs
                        </button>
                      </div>

                      <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden lg:block" />

                      {/* Tag Quick Filters */}
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => setSelectedTags(new Set())}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                              selectedTags.size === 0 ? "bg-brand-primary text-white dark:text-slate-900 border-brand-primary shadow-md shadow-brand-primary/10" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-200 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                            )}
                          >
                            All Tags
                          </button>
                          {allTags.slice(0, 6).map(tag => (
                            <button 
                              key={tag}
                              onClick={() => {
                                const next = new Set(selectedTags);
                                if (next.has(tag)) next.delete(tag);
                                else next.add(tag);
                                setSelectedTags(next);
                              }}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                selectedTags.has(tag) ? "bg-brand-primary text-white dark:text-slate-900 border-brand-primary" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-200 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>

                        <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden lg:block" />

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest">Sort by</span>
                          <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold px-4 py-2.5 outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-primary/10 dark:focus:ring-brand-accent/10 transition-all"
                          >
                            <option value="name">Event</option>
                            <option value="location">Venue</option>
                            <option value="date">Event Date</option>
                            <option value="sessions">Sessions Held</option>
                            <option value="contacts">New Contacts</option>
                            <option value="tags">Tags</option>
                            <option value="lastContacted">Date Added</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedEventIds.size > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-slate-900 dark:bg-black"
                      >
                        <div className="px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-xs font-black text-white">
                                {selectedEventIds.size}
                              </span>
                              <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Selected</span>
                            </div>
                            <button 
                              onClick={() => setSelectedEventIds(new Set())}
                              className="text-[10px] text-white/40 hover:text-white font-black uppercase tracking-widest transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            {showBulkEventDeleteConfirm ? (
                              <div className="flex items-center gap-3 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest px-3">Delete {selectedEventIds.size} events?</span>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={handleBulkEventDelete}
                                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={() => setShowBulkEventDeleteConfirm(false)}
                                    className="px-4 py-1.5 bg-white/5 text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setShowBulkEventDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                        <th className="pl-10 pr-4 py-6 w-12 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={selectedEventIds.size === events.length && events.length > 0}
                              onChange={toggleSelectAllEvents}
                              className="w-5 h-5 rounded-lg border-slate-400 dark:border-slate-700 text-brand-primary focus:ring-brand-primary dark:bg-slate-800 transition-all cursor-pointer"
                            />
                          </div>
                        </th>
                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">Event</th>
                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">Venue</th>
                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">Event Date</th>
                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">Sessions Held</th>
                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">New Contacts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                      {filteredEvents
                        .sort((a, b) => {
                          if (sortBy === 'name') return a.name.localeCompare(b.name);
                          if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '');
                          if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
                          if (sortBy === 'sessions') {
                            const aSessions = sessions.filter(s => s.eventId === a.id).length;
                            const bSessions = sessions.filter(s => s.eventId === b.id).length;
                            return bSessions - aSessions;
                          }
                          if (sortBy === 'contacts') {
                            const aContacts = contacts.filter(c => c.eventId === a.id).length;
                            const bContacts = contacts.filter(c => c.eventId === b.id).length;
                            return bContacts - aContacts;
                          }
                          if (sortBy === 'tags') {
                            const aTags = new Set(contacts.filter(c => c.eventId === a.id).flatMap(c => c.tags || [])).size;
                            const bTags = new Set(contacts.filter(c => c.eventId === b.id).flatMap(c => c.tags || [])).size;
                            return bTags - aTags;
                          }
                          if (sortBy === 'lastContacted') {
                            return new Date(b.date).getTime() - new Date(a.date).getTime();
                          }
                          return new Date(b.date).getTime() - new Date(a.date).getTime();
                        }).map((event, idx) => {
                          const eventSessions = sessions.filter(s => s.eventId === event.id);
                          const eventContacts = contacts.filter(c => c.eventId === event.id);

                          return (
                            <motion.tr 
                              key={event.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all duration-300"
                            >
                                <td className="pl-10 pr-4 py-6">
                                  <div className="flex items-center justify-center">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedEventIds.has(event.id)}
                                      onChange={() => toggleSelectEvent(event.id)}
                                      className="w-5 h-5 rounded-lg border-slate-400 dark:border-slate-700 text-brand-primary focus:ring-brand-primary dark:bg-slate-800 transition-all cursor-pointer"
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-6">
                                  <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-400 dark:text-slate-300 group-hover:bg-brand-primary dark:group-hover:bg-brand-accent group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-500">
                                      <Calendar size={24} />
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{event.name}</div>
                                      <div className="text-[11px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-[0.1em] mt-0.5">{event.type || 'Networking Event'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6 text-[11px] text-slate-600 dark:text-slate-300 font-mono font-bold uppercase tracking-widest">{event.location || '-'}</td>
                                <td className="px-6 py-6 text-[12px] text-slate-600 dark:text-slate-300 font-mono tracking-tight">{format(new Date(event.date), 'MMM dd, yyyy')}</td>
                                <td className="px-6 py-6">
                                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl">
                                    <span className="text-[12px] font-mono font-bold text-slate-700 dark:text-slate-200">
                                      {eventSessions.length}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">Sessions</span>
                                  </div>
                                </td>
                                <td className="px-6 py-6">
                                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-brand-primary/5 dark:bg-brand-accent/5 border border-brand-primary/10 dark:border-brand-accent/10 rounded-2xl">
                                    <span className="text-[12px] font-mono font-bold text-brand-primary dark:text-brand-accent">
                                      {eventContacts.length}
                                    </span>
                                    <span className="text-[10px] font-black text-brand-primary/60 dark:text-brand-accent/60 uppercase tracking-widest">Contacts</span>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>

                    {filteredEvents.length === 0 && (
                      <div className="py-40 text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] flex items-center justify-center text-slate-200 dark:text-slate-700 mx-auto mb-8">
                          <Search size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No events found</h3>
                        <p className="text-slate-400 dark:text-slate-300 text-base font-medium max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                          <button 
                            onClick={() => { setLocalSearch(''); setFilterType('all'); setSelectedTags(new Set()); setSortBy('name'); }}
                            className="mt-10 px-8 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                          >
                            Clear all filters
                          </button>
                      </div>
                    )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="all-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
            {/* Filters & Bulk Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-6">
                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <button 
                      onClick={() => setFilterType('all')}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                        filterType === 'all' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterType('hot')}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        filterType === 'hot' ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <Flame size={14} />
                      Hot
                    </button>
                    <button 
                      onClick={() => setFilterType('favorite')}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        filterType === 'favorite' ? "bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <Star size={14} />
                      Favs
                    </button>
                  </div>

                  <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden lg:block" />

                  {/* Tag Quick Filters */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setSelectedTags(new Set())}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          selectedTags.size === 0 ? "bg-brand-primary text-white dark:text-slate-900 border-brand-primary shadow-md shadow-brand-primary/10" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-200 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                        )}
                      >
                        All Tags
                      </button>
                      {allTags.slice(0, 6).map(tag => (
                        <button 
                          key={tag}
                          onClick={() => {
                            const next = new Set(selectedTags);
                            if (next.has(tag)) next.delete(tag);
                            else next.add(tag);
                            setSelectedTags(next);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            selectedTags.has(tag) ? "bg-brand-primary text-white dark:text-slate-900 border-brand-primary" : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-200 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden lg:block" />

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">Sort by</span>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold px-4 py-2.5 outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-primary/10 dark:focus:ring-brand-accent/10 transition-all"
                      >
                        <option value="name">Contact Info</option>
                        <option value="company">Company & Role</option>
                        <option value="event">Met At</option>
                        <option value="tags">Tags</option>
                        <option value="lastContacted">Date Added</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-slate-900"
                  >
                    <div className="px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-xs font-black text-white">
                            {selectedIds.size}
                          </span>
                          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Selected</span>
                        </div>
                        <button 
                          onClick={() => setSelectedIds(new Set())}
                          className="text-[10px] text-white/40 hover:text-white font-black uppercase tracking-widest transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {isBulkTagging ? (
                          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                            <input 
                              type="text" 
                              placeholder="Add tag to all..."
                              value={bulkTag}
                              onChange={(e) => setBulkTag(e.target.value)}
                              className="bg-transparent border-none text-[11px] font-bold px-4 py-1.5 outline-none w-40 text-white placeholder:text-white/20"
                              onKeyDown={(e) => e.key === 'Enter' && handleBulkTag()}
                              autoFocus
                            />
                            <button 
                              onClick={() => handleBulkTag()}
                              className="p-2 bg-brand-primary text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-all"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setIsBulkTagging(false)}
                              className="p-2 text-white/40 hover:text-white transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : isBulkFollowUp ? (
                          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                            <input 
                              type="date" 
                              value={bulkFollowUpDate}
                              onChange={(e) => setBulkFollowUpDate(e.target.value)}
                              className="bg-transparent border-none text-[11px] font-bold px-4 py-1.5 outline-none w-40 text-white"
                              autoFocus
                            />
                            <button 
                              onClick={handleBulkFollowUp}
                              className="p-2 bg-brand-primary text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-all"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setIsBulkFollowUp(false)}
                              className="p-2 text-white/40 hover:text-white transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : showBulkDeleteConfirm ? (
                          <div className="flex items-center gap-3 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest px-3">Delete {selectedIds.size} contacts?</span>
                            <div className="flex gap-1">
                              <button 
                                onClick={handleBulkDelete}
                                className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="px-4 py-1.5 bg-white/5 text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setIsBulkTagging(true)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-white/80"
                            >
                              <Tag size={12} className="text-brand-accent" />
                              Tag
                            </button>
                            <button 
                              onClick={handleBulkToggleHotLead}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-white/80"
                            >
                              <Flame size={12} className="text-orange-500" />
                              Hot
                            </button>
                            <button 
                              onClick={handleBulkToggleFavorite}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-white/80"
                            >
                              <Star size={12} className="text-yellow-500" />
                              Fav
                            </button>
                            <button 
                              onClick={() => setIsBulkFollowUp(true)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-white/80"
                            >
                              <Calendar size={12} className="text-blue-400" />
                              Follow-up
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button 
                              onClick={() => setShowBulkDeleteConfirm(true)}
                              className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="pl-10 pr-4 py-5 w-12 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.size === filteredAndSortedContacts.length && filteredAndSortedContacts.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-400 dark:border-slate-700 text-brand-primary focus:ring-brand-primary dark:bg-slate-800 transition-all cursor-pointer"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700">Contact Info</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700">Company & Role</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700">Source Event</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700">Date Added</th>
                      <th className="px-4 py-4 text-right pr-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredAndSortedContacts.map((contact, idx) => {
                      const event = events.find(e => e.id === contact.eventId);
                      const isSelected = selectedIds.has(contact.id);
                      return (
                        <motion.tr 
                          key={contact.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            "group transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-900/50",
                            isSelected ? "bg-brand-primary/[0.04] dark:bg-brand-accent/[0.04]" : contact.isHotLead ? "bg-orange-50/[0.04] dark:bg-orange-500/[0.04]" : ""
                          )}
                        >
                              <td className="pl-10 pr-4 py-4">
                                <div className="flex items-center justify-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => toggleSelect(contact.id)}
                                    className="w-5 h-5 rounded-lg border-slate-400 dark:border-slate-700 text-brand-primary focus:ring-brand-primary dark:bg-slate-800 transition-all cursor-pointer"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-5">
                                  <div className="relative">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-400 dark:text-slate-300 group-hover:bg-brand-primary dark:group-hover:bg-brand-accent group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-500 text-base text-brand-primary dark:text-brand-accent">
                                      {contact.name.charAt(0)}
                                    </div>
                                    {(contact.isHotLead || contact.isFavorite) && (
                                      <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                        {contact.isHotLead && (
                                          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-white dark:ring-slate-800">
                                            <Flame size={8} />
                                          </div>
                                        )}
                                        {contact.isFavorite && (
                                          <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-white dark:ring-slate-800">
                                            <Star size={8} className="fill-white" />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{contact.name}</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-300 font-medium">{contact.email || 'No Email'}</div>
                                    {contact.tags && contact.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {contact.tags.slice(0, 2).map(tag => (
                                          <span key={tag} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded text-[8px] font-bold uppercase tracking-wider">
                                            {tag}
                                          </span>
                                        ))}
                                        {contact.tags.length > 2 && (
                                          <span className="text-[8px] font-bold text-slate-300 dark:text-slate-400">+{contact.tags.length - 2}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-0.5">{contact.company || '-'}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-300 uppercase tracking-widest font-bold">{contact.jobTitle || 'Professional'}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest truncate max-w-[100px]">
                                    {event?.name || 'Manual'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">{format(new Date(contact.createdAt), 'MMM dd, yyyy')}</span>
                                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">Added</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right pr-10">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteContact(contact.id);
                                    }}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Contact"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setSelectedContact(contact)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-brand-primary dark:hover:bg-brand-accent text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-slate-900 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800"
                                  >
                                    View
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              
                  {filteredAndSortedContacts.length === 0 && (
                    <div className="py-40 text-center">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] flex items-center justify-center text-slate-200 dark:text-slate-700 mx-auto mb-8">
                        <Search size={48} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No contacts found</h3>
                      <p className="text-slate-400 dark:text-slate-300 text-base font-medium max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                      <button 
                        onClick={() => { setLocalSearch(''); setFilterType('all'); setSelectedTags(new Set()); setSortBy('name'); }}
                        className="mt-10 px-8 py-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>

  {/* Quick View Sidebar (Recipe 3/7 Influence) */}
  {selectedContact && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedContact(null)}
          className="fixed inset-0 bg-slate-900/10 dark:bg-black/40 backdrop-blur-[2px] z-[100]"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-slate-100 dark:border-slate-800"
        >
          {/* Sidebar Header */}
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300">
                <User size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Contact Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (isEditingContact) {
                    handleSaveContact();
                  } else {
                    setEditedContactData({
                      name: selectedContact.name,
                      email: selectedContact.email,
                      company: selectedContact.company,
                      jobTitle: selectedContact.jobTitle,
                      notes: selectedContact.notes,
                      followUpDate: selectedContact.followUpDate || ''
                    });
                    setIsEditingContact(true);
                  }
                }}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isEditingContact 
                    ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
                title={isEditingContact ? "Save Changes" : "Edit Contact"}
              >
                {isEditingContact ? <Save size={20} /> : <Edit3 size={20} />}
              </button>
              <button 
                onClick={() => {
                  setSelectedContact(null);
                  setIsEditingContact(false);
                }}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-12">
                {/* Profile Section */}
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[48px] flex items-center justify-center text-4xl font-black text-slate-400 dark:text-slate-300 shadow-inner">
                      {selectedContact.name.charAt(0)}
                    </div>
                    {(selectedContact.isHotLead || selectedContact.isFavorite) && (
                      <div className="absolute -top-2 -right-2 flex flex-col gap-2">
                        {selectedContact.isHotLead && (
                          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-slate-900">
                            <Flame size={20} />
                          </div>
                        )}
                        {selectedContact.isFavorite && (
                          <div className="w-10 h-10 bg-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-slate-900">
                            <Star size={20} className="fill-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditingContact ? (
                    <div className="space-y-4 max-w-xs mx-auto">
                      <input 
                        type="text"
                        value={editedContactData.name}
                        onChange={(e) => setEditedContactData({ ...editedContactData, name: e.target.value })}
                        className="w-full text-center text-2xl font-black tracking-tighter bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white"
                        placeholder="Name"
                      />
                      <input 
                        type="text"
                        value={editedContactData.jobTitle}
                        onChange={(e) => setEditedContactData({ ...editedContactData, jobTitle: e.target.value })}
                        className="w-full text-center text-xs font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white"
                        placeholder="Job Title"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-3xl font-black tracking-tighter mb-2 dark:text-white">{selectedContact.name}</h3>
                      <p className="text-slate-400 dark:text-slate-300 font-bold text-sm uppercase tracking-widest">{selectedContact.jobTitle || 'Professional'}</p>
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-4">
                  <button className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-brand-primary dark:hover:bg-brand-accent hover:text-white dark:hover:text-slate-900 transition-all group">
                    <Mail size={20} className="text-slate-400 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-900" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                  </button>
                  <button 
                    onClick={() => handleLinkedInSearch(selectedContact.name, selectedContact.company)}
                    className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-brand-primary dark:hover:bg-brand-accent hover:text-white dark:hover:text-slate-900 transition-all group"
                  >
                    <Linkedin size={20} className="text-slate-400 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-900" />
                    <span className="text-[9px] font-black uppercase tracking-widest">LinkedIn</span>
                  </button>
                  <button className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-brand-primary dark:hover:bg-brand-accent hover:text-white dark:hover:text-slate-900 transition-all group">
                    <Phone size={20} className="text-slate-400 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-900" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Call</span>
                  </button>
                </div>

                {/* Details Grid */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Professional Context</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                        <Building2 size={18} className="text-brand-primary dark:text-brand-accent" />
                        <div className="flex-1">
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Company</div>
                          {isEditingContact ? (
                            <input 
                              type="text"
                              value={editedContactData.company}
                              onChange={(e) => setEditedContactData({ ...editedContactData, company: e.target.value })}
                              className="w-full text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand-primary/10 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedContact.company || 'Not specified'}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                        <Mail size={18} className="text-brand-primary dark:text-brand-accent" />
                        <div className="flex-1">
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Email Address</div>
                          {isEditingContact ? (
                            <input 
                              type="email"
                              value={editedContactData.email}
                              onChange={(e) => setEditedContactData({ ...editedContactData, email: e.target.value })}
                              className="w-full text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand-primary/10 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedContact.email || 'Not specified'}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                        <Calendar size={18} className="text-brand-primary dark:text-brand-accent" />
                        <div className="flex-1">
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Follow-up Reminder</div>
                          {isEditingContact ? (
                            <input 
                              type="date"
                              value={editedContactData.followUpDate}
                              onChange={(e) => setEditedContactData({ ...editedContactData, followUpDate: e.target.value })}
                              className="w-full text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand-primary/10 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedContact.followUpDate ? format(new Date(selectedContact.followUpDate), 'MMMM dd, yyyy') : 'No reminder set'}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                        <Globe size={18} className="text-brand-primary dark:text-brand-accent" />
                        <div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Source Event</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{events.find(e => e.id === selectedContact.eventId)?.name || 'Manual Entry'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Tags & Taxonomy</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.tags?.map((tag: string) => (
                        <span key={tag} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                          {tag}
                        </span>
                      ))}
                      {(!selectedContact.tags || selectedContact.tags.length === 0) && (
                        <span className="text-xs text-slate-400 dark:text-slate-300 italic">No tags applied</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Notes & Context</div>
                    {isEditingContact ? (
                      <textarea 
                        value={editedContactData.notes}
                        onChange={(e) => setEditedContactData({ ...editedContactData, notes: e.target.value })}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 min-h-[120px] resize-none"
                        placeholder="Add context to improve your networking intelligence..."
                      />
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100/50 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        {selectedContact.notes || "No additional notes captured for this contact. Add context to improve your networking intelligence."}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Follow-up Templates</div>
                      <button 
                        onClick={() => setIsAddingTemplate(!isAddingTemplate)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-brand-primary dark:text-brand-accent transition-all"
                      >
                        {isAddingTemplate ? <X size={16} /> : <Plus size={16} />}
                      </button>
                    </div>

                    {isAddingTemplate && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">Template Name</label>
                          <input 
                            type="text"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="e.g. Quick Intro"
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">Content (Use {'{name}'} and {'{event}'})</label>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-brand-primary dark:text-brand-accent uppercase tracking-widest animate-pulse">
                              <Sparkles size={10} />
                              Tab to AI Refine
                            </div>
                          </div>
                          <textarea 
                            value={newTemplateContent}
                            onChange={(e) => setNewTemplateContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' && newTemplateContent.trim()) {
                                e.preventDefault();
                                handleRefineWithAI(newTemplateContent, setNewTemplateContent);
                              }
                            }}
                            placeholder="Hi {name}, nice meeting you at {event}..."
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 outline-none min-h-[100px] resize-none"
                          />
                          {isRefining && (
                            <div className="flex items-center gap-2 text-[10px] text-brand-primary dark:text-brand-accent font-bold">
                              <Loader2 size={12} className="animate-spin" />
                              AI is thinking...
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={handleAddTemplate}
                          className="w-full py-3 bg-brand-primary dark:bg-brand-accent text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-brand-primary/90 dark:hover:bg-brand-accent/90 transition-all"
                        >
                          Save Template
                        </button>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      {followUpTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => generateFollowUp(template.id)}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all group",
                            selectedTemplateId === template.id 
                              ? "bg-brand-primary/5 dark:bg-brand-accent/5 border-brand-primary/20 dark:border-brand-accent/20" 
                              : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-brand-primary/20 dark:hover:border-brand-accent/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{template.name}</span>
                            <Zap size={14} className={cn(
                              "transition-colors",
                              selectedTemplateId === template.id ? "text-brand-primary dark:text-brand-accent" : "text-slate-300 dark:text-slate-600 group-hover:text-brand-primary dark:group-hover:text-brand-accent"
                            )} />
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{template.content}</p>
                        </button>
                      ))}
                    </div>
                    
                    {generatedFollowUp && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-brand-primary/5 dark:bg-brand-accent/5 rounded-3xl border border-brand-primary/10 dark:border-brand-accent/10 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-brand-primary dark:text-brand-accent uppercase tracking-widest">Generated Message</div>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-brand-primary dark:text-brand-accent uppercase tracking-widest animate-pulse">
                            <Sparkles size={10} />
                            Tab to AI Refine
                          </div>
                        </div>
                        <textarea 
                          value={generatedFollowUp}
                          onChange={(e) => setGeneratedFollowUp(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab' && generatedFollowUp.trim()) {
                              e.preventDefault();
                              handleRefineWithAI(generatedFollowUp, setGeneratedFollowUp);
                            }
                          }}
                          className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium outline-none min-h-[120px] resize-none"
                        />
                        {isRefining && (
                          <div className="flex items-center gap-2 text-[10px] text-brand-primary dark:text-brand-accent font-bold">
                            <Loader2 size={12} className="animate-spin" />
                            AI is thinking...
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedFollowUp);
                              toast.success('Copied to clipboard!');
                            }}
                            className="flex-1 py-3 bg-white dark:bg-slate-800 border border-brand-primary/20 dark:border-brand-accent/20 text-brand-primary dark:text-brand-accent rounded-xl text-xs font-bold hover:bg-brand-primary dark:hover:bg-brand-accent hover:text-white dark:hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                          >
                            <Check size={14} />
                            Copy
                          </button>
                          <button 
                            onClick={() => setGeneratedFollowUp('')}
                            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Timeline</div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                      <Clock size={18} className="text-brand-primary" />
                      <div>
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Added On</div>
                        <div className="text-sm font-bold dark:text-slate-200">{format(new Date(selectedContact.createdAt), 'MMMM dd, yyyy')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-8 border-t border-slate-50 dark:border-slate-800">
                <button 
                  onClick={() => handleLinkedInSearch(selectedContact.name, selectedContact.company)}
                  className="w-full py-4 bg-brand-primary text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-3 group shadow-lg shadow-brand-primary/20 dark:shadow-none"
                >
                  Full Profile Details
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
};
