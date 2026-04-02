import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Legend
} from 'recharts';
import * as topojson from 'topojson-client';
import { 
  Users, 
  FolderOpen, 
  Building2, 
  AlertCircle, 
  Tag, 
  Flame,
  RefreshCw,
  Trash2,
  Map as MapIcon,
  Globe,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  ArrowUpRight,
  UserPlus,
  Briefcase,
  Target,
  Activity,
  ChevronRight,
  Search,
  Maximize2,
  MousePointer2,
  LayoutGrid,
  MapPin,
  X
} from 'lucide-react';
import { format, subDays, isSameDay, isAfter, isBefore, startOfDay, endOfDay, differenceInDays } from 'date-fns';

interface DashboardProps {
  contacts: any[];
  sessions: any[];
  events: any[];
  onRefresh: () => void;
  onClearHistory: () => void;
  isDark?: boolean;
  onNavigate?: (tab: 'scanner' | 'contacts' | 'export' | 'dashboard' | 'profile') => void;
}

const COLORS = ['#FF6321', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  contacts, 
  sessions, 
  events,
  onRefresh,
  onClearHistory,
  isDark = false,
  onNavigate
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [filterEventId, setFilterEventId] = useState<string>('all');
  const [ecosystemView, setEcosystemView] = useState<'cluster' | 'map' | 'list'>('cluster');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // --- Data Filtering ---
  const filteredContacts = useMemo(() => {
    let result = [...contacts];
    
    // Time Range Filter
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = subDays(new Date(), days);
      result = result.filter(c => isAfter(new Date(c.createdAt), cutoff));
    }

    // Event Filter
    if (filterEventId !== 'all') {
      result = result.filter(c => c.eventId === filterEventId);
    }

    return result;
  }, [contacts, timeRange, filterEventId]);

  const previousPeriodContacts = useMemo(() => {
    if (timeRange === 'all') return [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const start = subDays(new Date(), days * 2);
    const end = subDays(new Date(), days);
    return contacts.filter(c => isAfter(new Date(c.createdAt), start) && isBefore(new Date(c.createdAt), end));
  }, [contacts, timeRange]);

  // --- KPI Calculations ---
  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const kpis = [
    { 
      label: 'Total Contacts', 
      value: filteredContacts.length, 
      prevValue: previousPeriodContacts.length,
      icon: Users, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50/50 dark:bg-orange-500/10' 
    },
    { 
      label: 'Unique Companies', 
      value: new Set(filteredContacts.map(c => c.company).filter(Boolean)).size, 
      prevValue: new Set(previousPeriodContacts.map(c => c.company).filter(Boolean)).size,
      icon: Building2, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50/50 dark:bg-blue-500/10' 
    },
    { 
      label: 'Hot Leads', 
      value: filteredContacts.filter(c => c.isHotLead).length, 
      prevValue: previousPeriodContacts.filter(c => c.isHotLead).length,
      icon: Flame, 
      color: 'text-pink-500', 
      bg: 'bg-pink-50/50 dark:bg-pink-500/10' 
    },
    { 
      label: 'Engagement Rate', 
      value: filteredContacts.length > 0 ? Math.round((filteredContacts.filter(c => c.isFavorite || c.isHotLead).length / filteredContacts.length) * 100) : 0, 
      prevValue: previousPeriodContacts.length > 0 ? Math.round((previousPeriodContacts.filter(c => c.isFavorite || c.isHotLead).length / previousPeriodContacts.length) * 100) : 0,
      suffix: '%',
      icon: Activity, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50/50 dark:bg-emerald-500/10' 
    },
  ];

  // --- Chart Data Preparation ---

  // 1. Growth Area Chart
  const growthData = useMemo(() => {
    const days = timeRange === 'all' ? 30 : (timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 90));
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const count = filteredContacts.filter(c => isBefore(new Date(c.createdAt), endOfDay(date))).length;
      data.push({
        date: format(date, 'MMM dd'),
        total: count
      });
    }
    return data;
  }, [filteredContacts, timeRange]);

  // 2. Role Diversity Radar
  const roleData = useMemo(() => {
    const roles: Record<string, number> = {};
    filteredContacts.forEach(c => {
      const title = (c.jobTitle || 'Other').toLowerCase();
      if (title.includes('ceo') || title.includes('founder') || title.includes('president')) roles['Executive'] = (roles['Executive'] || 0) + 1;
      else if (title.includes('manager') || title.includes('director') || title.includes('lead')) roles['Management'] = (roles['Management'] || 0) + 1;
      else if (title.includes('engineer') || title.includes('developer') || title.includes('tech')) roles['Technical'] = (roles['Technical'] || 0) + 1;
      else if (title.includes('sales') || title.includes('marketing') || title.includes('growth')) roles['Commercial'] = (roles['Commercial'] || 0) + 1;
      else if (title.includes('design') || title.includes('creative') || title.includes('product')) roles['Product'] = (roles['Product'] || 0) + 1;
      else roles['Other'] = (roles['Other'] || 0) + 1;
    });
    return Object.entries(roles).map(([subject, A]) => ({ subject, A, fullMark: filteredContacts.length }));
  }, [filteredContacts]);

  // 3. Industry Breakdown
  const industryData = useMemo(() => {
    const industries: Record<string, number> = {};
    filteredContacts.forEach(c => {
      const company = (c.company || '').toLowerCase();
      if (company.includes('tech') || company.includes('cloud') || company.includes('software')) industries['Technology'] = (industries['Technology'] || 0) + 1;
      else if (company.includes('finance') || company.includes('bank') || company.includes('invest')) industries['Finance'] = (industries['Finance'] || 0) + 1;
      else if (company.includes('health') || company.includes('bio') || company.includes('med')) industries['Healthcare'] = (industries['Healthcare'] || 0) + 1;
      else if (company.includes('design') || company.includes('creative') || company.includes('agency')) industries['Creative'] = (industries['Creative'] || 0) + 1;
      else if (company.includes('legal') || company.includes('law')) industries['Legal'] = (industries['Legal'] || 0) + 1;
      else industries['Other'] = (industries['Other'] || 0) + 1;
    });
    return Object.entries(industries)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredContacts]);

  // 4. Company Distribution
  const companyData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredContacts.forEach(c => {
      if (c.company) counts[c.company] = (counts[c.company] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredContacts]);

  // 4. Follow-up Pipeline
  const pipelineData = useMemo(() => {
    const hot = filteredContacts.filter(c => c.isHotLead).length;
    const favorite = filteredContacts.filter(c => c.isFavorite && !c.isHotLead).length;
    const regular = filteredContacts.filter(c => !c.isFavorite && !c.isHotLead).length;
    
    return [
      { name: 'Hot Leads', value: hot, color: '#FF6321' },
      { name: 'Favorites', value: favorite, color: '#3B82F6' },
      { name: 'Regular', value: regular, color: '#94a3b8' }
    ];
  }, [filteredContacts]);

  // 5. Follow-up Reminders
  const followUpReminders = useMemo(() => {
    return contacts
      .filter(c => c.followUpDate)
      .map(c => ({
        ...c,
        followUpDate: new Date(c.followUpDate)
      }))
      .filter(c => isAfter(c.followUpDate, startOfDay(new Date())))
      .sort((a, b) => a.followUpDate.getTime() - b.followUpDate.getTime())
      .slice(0, 5);
  }, [contacts]);

  const mapRef = useRef<SVGSVGElement>(null);
  const geoMapRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mapData, setMapData] = useState<any>(null);
  const zoomRef = useRef<any>(null);
  const geoZoomRef = useRef<any>(null);

  // Fetch map data once
  useEffect(() => {
    if (!mapData) {
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(res => res.json())
        .then(topology => {
          const geojson = topojson.feature(topology, topology.objects.countries as any);
          setMapData(geojson);
        })
        .catch(err => {
          console.error("Failed to load map data:", err);
          // Fallback to a very simple map data if needed
          setMapData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]
                },
                properties: { name: "World" }
              }
            ]
          });
        });
    }
  }, [mapData]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const resetView = () => {
    if (ecosystemView === 'cluster' && mapRef.current && zoomRef.current) {
      d3.select(mapRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    } else if (ecosystemView === 'map' && geoMapRef.current && geoZoomRef.current) {
      d3.select(geoMapRef.current).transition().duration(750).call(geoZoomRef.current.transform, d3.zoomIdentity);
    }
  };

  useEffect(() => {
    if (!mapRef.current || filteredContacts.length === 0 || ecosystemView !== 'cluster' || dimensions.width === 0) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom as any);

    // Create links between contacts in the same company or event
    const links: any[] = [];
    for (let i = 0; i < filteredContacts.length; i++) {
      for (let j = i + 1; j < filteredContacts.length; j++) {
        const a = filteredContacts[i];
        const b = filteredContacts[j];
        if ((a.company && a.company === b.company) || (a.eventId && a.eventId === b.eventId)) {
          links.push({ source: a.id, target: b.id });
        }
      }
    }

    const simulation = d3.forceSimulation(filteredContacts)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.1))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collide", d3.forceCollide().radius(50))
      .on("tick", () => {
        link.attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

    const link = g.append("g")
      .attr("stroke", "#e2e8f0")
      .attr("class", "dark:stroke-slate-700")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 1);

    const node = g.selectAll("g.node")
      .data(filteredContacts)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any
      );

    node.append("circle")
      .attr("r", (d: any) => d.isHotLead ? 28 : 22)
      .attr("fill", (d, i) => COLORS[i % COLORS.length])
      .attr("opacity", 0.1)
      .attr("class", "pulse");

    node.append("circle")
      .attr("r", (d: any) => d.isHotLead ? 16 : 14)
      .attr("fill", (d, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");

    node.append("text")
      .text((d: any) => d.name.charAt(0))
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "#fff")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .style("pointer-events", "none");

    node.append("text")
      .text((d: any) => d.name)
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#1e293b")
      .attr("class", "dark:fill-slate-300")
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .attr("opacity", showLabels ? 0.8 : 0)
      .attr("class", "label");

    node.on("mouseover", function() {
      d3.select(this).select("circle:last-of-type").transition().duration(200).attr("r", 20);
      d3.select(this).select(".label").transition().duration(200).attr("font-size", "12px").attr("fill", "#FF6321");
    }).on("mouseout", function() {
      d3.select(this).select("circle:last-of-type").transition().duration(200).attr("r", (d: any) => d.isHotLead ? 16 : 14);
      const isDark = document.documentElement.classList.contains('dark');
      d3.select(this).select(".label").transition().duration(200).attr("font-size", "10px").attr("fill", isDark ? "#cbd5e1" : "#1e293b");
    }).on("click", (event, d: any) => {
      setSelectedContact(d);
    });

    return () => simulation.stop();
  }, [filteredContacts, ecosystemView, dimensions, showLabels]);

  // Geographic Map Effect
  useEffect(() => {
    if (!geoMapRef.current || filteredContacts.length === 0 || ecosystemView !== 'map' || dimensions.width === 0 || !mapData) return;

    const svg = d3.select(geoMapRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const g = svg.append("g");

    const projection = d3.geoMercator()
      .scale(width / 6.2)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom()
      .scaleExtent([1, 12])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    geoZoomRef.current = zoom;
    svg.call(zoom as any);

    const isDark = document.documentElement.classList.contains('dark');
    
    // Draw map
    g.selectAll("path")
      .data(mapData.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", isDark ? "#1e293b" : "#f1f5f9")
      .attr("stroke", isDark ? "#334155" : "#e2e8f0")
      .attr("stroke-width", 0.5)
      .on("mouseover", function() {
        d3.select(this).attr("fill", isDark ? "#334155" : "#e2e8f0");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", isDark ? "#1e293b" : "#f1f5f9");
      });

    // Plot contacts
    const contactsWithCoords = filteredContacts.map((c, i) => {
      let lat = (Math.random() - 0.5) * 120;
      let lng = (Math.random() - 0.5) * 240;
      
      const addr = (c.address || '').toLowerCase();
      if (addr.includes('usa') || addr.includes('ca') || addr.includes('ny') || addr.includes('united states') || addr.includes('san francisco')) {
        lat = 37 + (Math.random() - 0.5) * 10;
        lng = -100 + (Math.random() - 0.5) * 20;
      } else if (addr.includes('europe') || addr.includes('uk') || addr.includes('london') || addr.includes('germany') || addr.includes('lisbon') || addr.includes('portugal')) {
        lat = 48 + (Math.random() - 0.5) * 10;
        lng = 10 + (Math.random() - 0.5) * 15;
      } else if (addr.includes('asia') || addr.includes('india') || addr.includes('china') || addr.includes('singapore')) {
        lat = 20 + (Math.random() - 0.5) * 20;
        lng = 100 + (Math.random() - 0.5) * 30;
      }

      return { ...c, lat, lng };
    });

    const markers = g.selectAll("g.marker")
      .data(contactsWithCoords)
      .enter()
      .append("g")
      .attr("class", "marker")
      .attr("transform", (d: any) => {
        const coords = projection([d.lng, d.lat]);
        return coords ? `translate(${coords[0]},${coords[1]})` : "translate(0,0)";
      });

    markers.append("circle")
      .attr("r", 0)
      .attr("fill", (d, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
      .transition()
      .duration(1000)
      .attr("r", (d: any) => d.isHotLead ? 7 : 5);

    markers.append("text")
      .text((d: any) => d.name)
      .attr("dy", -12)
      .attr("text-anchor", "middle")
      .attr("fill", isDark ? "#94a3b8" : "#64748b")
      .attr("font-size", "8px")
      .attr("font-weight", "700")
      .attr("opacity", showLabels ? 0.6 : 0);

    markers.on("mouseover", function() {
      d3.select(this).select("circle").transition().duration(200).attr("r", 10);
      d3.select(this).select("text").transition().duration(200).attr("opacity", 1);
    }).on("mouseout", function() {
      d3.select(this).select("circle").transition().duration(200).attr("r", (d: any) => d.isHotLead ? 7 : 5);
      d3.select(this).select("text").transition().duration(200).attr("opacity", showLabels ? 0.6 : 0);
    }).on("click", (event, d: any) => {
      setSelectedContact(d);
    });

  }, [filteredContacts, ecosystemView, dimensions, showLabels, mapData]);

  if (contacts.length === 0) {
    return (
      <div className="space-y-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-5xl font-bold tracking-tight mb-6 dark:text-white">📊 Intelligence Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-300 text-xl leading-relaxed">Your professional network analytics will appear here once you start scanning cards.</p>
        </div>
        
        <div className="py-32 text-center bg-brand-card dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-600">
            <Activity size={48} />
          </div>
          <h3 className="text-3xl font-bold mb-3 tracking-tight dark:text-white">Awaiting Data Streams</h3>
          <p className="text-slate-500 dark:text-slate-300 mb-10 max-w-xs mx-auto text-lg">
            Scan your first business card to unlock real-time networking insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-brand-card dark:bg-slate-800 p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 dark:bg-white/10 text-brand-primary dark:text-white rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight dark:text-white">Tidy Intelligence</h2>
            <p className="text-slate-400 dark:text-slate-300 text-[10px] font-medium uppercase tracking-widest">Real-time ecosystem analytics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 md:px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  timeRange === range ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Event Filter */}
          <select 
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex-1 md:flex-none"
          >
            <option value="all">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-all hover:text-brand-primary">
              <RefreshCw size={20} />
            </button>
            <button onClick={onClearHistory} className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-red-400 transition-all">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => {
          const growth = getGrowth(kpi.value, kpi.prevValue);
          return (
            <div 
              key={i} 
              onClick={() => onNavigate('contacts')}
              className="bg-brand-card dark:bg-slate-800 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-700 card-shadow group hover:border-brand-primary/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={cn("p-3 rounded-2xl", kpi.bg)}>
                  <kpi.icon size={20} className={kpi.color} />
                </div>
                {timeRange !== 'all' && (
                  <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase",
                    growth >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-red-50 dark:bg-red-500/10 text-red-600"
                  )}>
                    {growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(growth)}%
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-4xl font-bold tracking-tight mb-1 dark:text-white">{kpi.value}{kpi.suffix}</div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">{kpi.label}</div>
              
              <div className="mt-6 h-1 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  className={cn("h-full rounded-full", kpi.color.replace('text', 'bg'))}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Network Growth Area Chart */}
        <div className="lg:col-span-8 bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-bold tracking-tight dark:text-white">Tidy Expansion</h3>
              <p className="text-slate-400 dark:text-slate-300 text-sm mt-1">Cumulative contact acquisition over time.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-primary" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Contacts</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6321" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: isDark ? '#0f172a' : '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-1">{label}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {payload[0].value} Contacts
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#FF6321" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Follow-up Pipeline Pie Chart */}
        <div className="lg:col-span-4 bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <h3 className="text-2xl font-bold mb-2 tracking-tight dark:text-white">Follow-up Pipeline</h3>
          <p className="text-slate-400 dark:text-slate-300 text-sm mb-8">Priority distribution of your leads.</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-1">{payload[0].name}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {payload[0].value} ({((Number(payload[0].value) / filteredContacts.length) * 100).toFixed(1)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Diversity Radar */}
        <div className="lg:col-span-4 bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <h3 className="text-2xl font-bold mb-2 tracking-tight dark:text-white">Role Diversity</h3>
          <p className="text-slate-400 dark:text-slate-300 text-sm mb-8">Professional balance of your ecosystem.</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={roleData}>
                <PolarGrid stroke={isDark ? '#334155' : '#f1f5f9'} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <Radar
                  name="Contacts"
                  dataKey="A"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.5}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-1">{payload[0].payload.subject}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {payload[0].value} Contacts
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Breakdown Bar Chart */}
        <div className="lg:col-span-4 bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <h3 className="text-2xl font-bold mb-2 tracking-tight dark:text-white">Industry Reach</h3>
          <p className="text-slate-400 dark:text-slate-300 text-sm mb-8">Sector distribution of your network.</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: isDark ? '#0f172a' : '#fff' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-1">{label}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {payload[0].value} Contacts
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[10, 10, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies Bar Chart */}
        <div className="lg:col-span-4 bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <h3 className="text-2xl font-bold mb-2 tracking-tight dark:text-white">Top Organizations</h3>
          <p className="text-slate-400 dark:text-slate-300 text-sm mb-8">Highest density company connections.</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {payload[0].value} Contacts
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 10, 10, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Networking Reach Cluster / Map */}
        <div className="lg:col-span-12 bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight dark:text-white">Ecosystem Explorer</h3>
              <p className="text-slate-400 dark:text-slate-300 text-xs md:text-sm mt-1">Interactive visualization of your professional nodes.</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setEcosystemView('cluster')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  ecosystemView === 'cluster' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <LayoutGrid size={14} /> Cluster
              </button>
              <button
                onClick={() => setEcosystemView('map')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  ecosystemView === 'map' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <Globe size={14} /> Map
              </button>
              <button
                onClick={() => setEcosystemView('list')}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  ecosystemView === 'list' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <Filter size={14} /> List
              </button>
            </div>
          </div>
          <div ref={containerRef} className="h-[600px] w-full bg-slate-50/30 dark:bg-slate-900/30 rounded-[32px] overflow-hidden relative border border-slate-50 dark:border-slate-800 group">
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
              <button 
                onClick={resetView}
                className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-sm rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-brand-primary transition-colors"
                title="Reset View"
              >
                <RefreshCw size={16} />
              </button>
              <button 
                onClick={() => setShowLabels(!showLabels)}
                className={cn(
                  "p-3 backdrop-blur shadow-sm rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors",
                  showLabels ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" : "bg-white/80 dark:bg-slate-800/80 text-slate-400"
                )}
                title="Toggle Labels"
              >
                <Tag size={16} />
              </button>
              <button 
                onClick={() => setShowLegend(!showLegend)}
                className={cn(
                  "p-3 backdrop-blur shadow-sm rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors",
                  showLegend ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" : "bg-white/80 dark:bg-slate-800/80 text-slate-400"
                )}
                title="Toggle Legend"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {ecosystemView === 'cluster' ? (
                <motion.svg 
                  key="cluster"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={mapRef} 
                  className="w-full h-full cursor-grab active:cursor-grabbing" 
                />
              ) : ecosystemView === 'map' ? (
                <motion.svg 
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={geoMapRef} 
                  className="w-full h-full cursor-grab active:cursor-grabbing" 
                />
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full h-full p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredContacts.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedContact(c)}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-brand-primary/30 transition-all group cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm",
                            c.isHotLead ? "bg-orange-500" : "bg-slate-400 dark:bg-slate-600"
                          )}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {c.name}
                              {c.isHotLead && <Flame size={14} className="text-orange-500" />}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-300 font-medium">{c.jobTitle || 'Professional'} @ {c.company || 'Private'}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                            <MapPin size={10} /> {c.address ? c.address.split(',').pop()?.trim() : 'Remote'}
                          </div>
                          <div className="text-[10px] font-bold text-brand-primary dark:text-brand-accent uppercase tracking-widest">
                            {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showLegend && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute bottom-6 right-6 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Hot Lead</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Regular</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Follow-up Reminders */}
      <div className="grid grid-cols-1 gap-8">
        {/* Follow-up Reminders */}
        <div className="bg-brand-card dark:bg-slate-800 p-6 md:p-10 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-700 card-shadow">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-tight dark:text-white">Follow-up Reminders</h3>
            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl">
              <Calendar size={18} />
            </div>
          </div>
          
          {followUpReminders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 dark:text-slate-300 text-sm">No upcoming follow-ups scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followUpReminders.map((c, i) => {
                const daysLeft = differenceInDays(c.followUpDate, new Date());
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedContact(c)}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-orange-200 dark:hover:border-orange-500/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs font-bold border border-slate-100 dark:border-slate-700 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider">
                          {format(c.followUpDate, 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest",
                      daysLeft <= 1 ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
                    )}>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Quick View Sidebar */}
      <AnimatePresence>
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
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300">
                    <Users size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Contact Intelligence</span>
                </div>
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[48px] flex items-center justify-center text-4xl font-black text-slate-400 dark:text-slate-300 shadow-inner">
                      {selectedContact.name.charAt(0)}
                    </div>
                    {selectedContact.isHotLead && (
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-slate-900">
                        <Flame size={20} />
                      </div>
                    )}
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter mb-2 dark:text-white">{selectedContact.name}</h3>
                  <p className="text-slate-400 dark:text-slate-300 font-bold text-sm uppercase tracking-widest">{selectedContact.jobTitle || 'Professional'}</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Professional Context</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                        <Building2 size={18} className="text-brand-primary" />
                        <div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Company</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedContact.company || 'Not specified'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                        <Calendar size={18} className="text-brand-primary" />
                        <div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-0.5">Source Event</div>
                          <button 
                            onClick={() => onNavigate('contacts')}
                            className="text-sm font-bold text-brand-primary dark:text-brand-accent hover:underline text-left"
                          >
                            {events.find(e => e.id === selectedContact.eventId)?.name || 'Manual Entry'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedContact.notes && (
                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Notes</div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100/50 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        {selectedContact.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for Tailwind classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
