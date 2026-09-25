'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Layers,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Terminal,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { cmsApi } from '@/lib/api';
import type { CmsContent } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const TYPE_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'announcement', label: 'Announcements' },
  { id: 'topic', label: 'Learning Topics' },
  { id: 'feature', label: 'Features' },
  { id: 'faq', label: 'FAQs' },
  { id: 'banner', label: 'Banners' },
  { id: 'news', label: 'News Feed' },
];

export default function CmsManagerPage() {
  const [items, setItems] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CmsContent>>({
    key: '',
    type: 'announcement',
    title: '',
    subtitle: '',
    badge: '',
    linkUrl: '',
    icon: '',
    isPublished: true,
    order: 0,
  });

  const loadCmsItems = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.listAdmin();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      setFeedback({ type: 'error', message: 'Failed to load CMS content items.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await loadCmsItems();
    }
    run();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setFeedback(null);
    try {
      const res = await cmsApi.seed();
      setFeedback({ type: 'success', message: `Seeded ${res.count} default CMS content items!` });
      await loadCmsItems();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to seed default CMS items.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleTogglePublish = async (item: CmsContent) => {
    try {
      const updated = await cmsApi.update(item.id, { isPublished: !item.isPublished });
      setItems((prev) => (Array.isArray(prev) ? prev.map((i) => (i.id === item.id ? updated : i)) : []));
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update publication status.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CMS content item?')) return;
    try {
      await cmsApi.delete(id);
      setItems((prev) => (Array.isArray(prev) ? prev.filter((i) => i.id !== id) : []));
      setFeedback({ type: 'success', message: 'CMS item deleted successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete CMS item.' });
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      key: `custom-${Date.now()}`,
      type: activeTab === 'all' ? 'announcement' : activeTab,
      title: '',
      subtitle: '',
      badge: '',
      linkUrl: '',
      icon: '',
      isPublished: true,
      order: (Array.isArray(items) ? items.length : 0) + 1,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (item: CmsContent) => {
    setEditingId(item.id);
    setFormData({
      key: item.key,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || '',
      badge: item.badge || '',
      linkUrl: item.linkUrl || '',
      icon: item.icon || '',
      isPublished: item.isPublished,
      order: item.order,
    });
    setIsEditing(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.key) return;

    try {
      if (editingId) {
        const updated = await cmsApi.update(editingId, formData);
        setItems((prev) => (Array.isArray(prev) ? prev.map((i) => (i.id === editingId ? updated : i)) : [updated]));
        setFeedback({ type: 'success', message: 'CMS item updated!' });
      } else {
        const created = await cmsApi.create(formData);
        setItems((prev) => (Array.isArray(prev) ? [created, ...prev] : [created]));
        setFeedback({ type: 'success', message: 'CMS item created!' });
      }
      setIsEditing(false);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save CMS item.' });
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter((item) => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });


  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Code':
        return Code;
      case 'Cpu':
        return Cpu;
      case 'Layers':
        return Layers;
      case 'Globe':
        return Globe;
      case 'Terminal':
        return Terminal;
      case 'Sparkles':
        return Sparkles;
      case 'Award':
        return Award;
      case 'UserCheck':
        return UserCheck;
      default:
        return SlidersHorizontal;
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
            <SlidersHorizontal className="size-4" />
            TaskFlow Content Management
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-fg">CMS Manager &amp; Content Hub</h1>
          <p className="text-xs md:text-sm text-fg-muted mt-1">
            Manage public announcement banners, topics, FAQs, platform news, and feature cards dynamically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSeed}
            disabled={seeding}
            variant="ghost"
            className="h-10 border border-border/80 text-fg hover:bg-surface-2 gap-2 text-xs"
          >
            <RefreshCw className={`size-3.5 ${seeding ? 'animate-spin' : ''}`} />
            Seed Defaults
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="h-10 bg-accent text-slate-950 font-bold hover:bg-accent-hover gap-2 text-xs"
          >
            <Plus className="size-4" />
            New Content Item
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-fg-subtle hover:text-fg">
            ✕
          </button>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-xs">
          <div className="flex items-center justify-between text-fg-muted">
            <span className="text-xs font-semibold">Total CMS Items</span>
            <SlidersHorizontal className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-fg">{items.length}</p>
          <p className="text-[11px] text-fg-subtle mt-1">{items.filter((i) => i.isPublished).length} Published Live</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-xs">
          <div className="flex items-center justify-between text-fg-muted">
            <span className="text-xs font-semibold">Active Announcements</span>
            <Megaphone className="size-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-fg">
            {items.filter((i) => i.type === 'announcement' && i.isPublished).length}
          </p>
          <p className="text-[11px] text-fg-subtle mt-1">Displayed on Landing Header</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-xs">
          <div className="flex items-center justify-between text-fg-muted">
            <span className="text-xs font-semibold">Learning Topics</span>
            <Layers className="size-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-fg">
            {items.filter((i) => i.type === 'topic' && i.isPublished).length}
          </p>
          <p className="text-[11px] text-fg-subtle mt-1">Category Navigation Cards</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-xs">
          <div className="flex items-center justify-between text-fg-muted">
            <span className="text-xs font-semibold">Published FAQs</span>
            <HelpCircle className="size-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-fg">
            {items.filter((i) => i.type === 'faq' && i.isPublished).length}
          </p>
          <p className="text-[11px] text-fg-subtle mt-1">Help &amp; Documentation Q&amp;A</p>
        </div>
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-slate-950 font-bold shadow-xs'
                  : 'bg-surface-1 text-fg-muted hover:bg-surface-2 hover:text-fg border border-border/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search items by key, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-1 pl-9 pr-4 py-2 text-xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Content Form Modal */}
      {isEditing && (
        <div className="rounded-2xl border border-accent/40 bg-surface-1 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-heading text-lg font-bold text-fg">
              {editingId ? 'Edit Content Item' : 'Create New CMS Content Item'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-fg-subtle hover:text-fg">
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1">Unique Key / Identifier</label>
              <input
                type="text"
                required
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g. top-announcement-bar"
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1">Content Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              >
                <option value="announcement">Announcement</option>
                <option value="topic">Learning Topic</option>
                <option value="feature">Feature Card</option>
                <option value="faq">FAQ Item</option>
                <option value="banner">Hero Banner</option>
                <option value="news">News Post</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-fg-muted mb-1">Title / Headline</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title..."
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-fg-muted mb-1">Subtitle / Body Description</label>
              <textarea
                rows={3}
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Enter subtitle or body text..."
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1">Badge Text (Optional)</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. Live Now, New, Trending"
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1">Link URL (Optional)</label>
              <input
                type="text"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="e.g. /courses or https://..."
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1">Icon Name (Optional)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Code, Cpu, Terminal, Sparkles, Globe"
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1">Priority Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-border bg-surface-0 px-3 py-2 text-xs text-fg focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-fg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-border bg-surface-0 text-accent focus:ring-accent"
                />
                Is Published (Visible Live)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 sm:col-span-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="h-9 px-4 text-xs text-fg-muted"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 bg-accent text-slate-950 font-bold hover:bg-accent-hover text-xs">
                Save CMS Item
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Items Grid / Table */}
      {loading ? (
        <div className="flex py-12 justify-center items-center text-fg-subtle text-xs">
          <RefreshCw className="size-4 animate-spin mr-2" /> Loading CMS Content...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3 bg-surface-1">
          <SlidersHorizontal className="mx-auto size-8 text-fg-subtle" />
          <h3 className="text-sm font-bold text-fg">No CMS Content Items Found</h3>
          <p className="text-xs text-fg-muted">Click &quot;Seed Defaults&quot; above to pre-populate content, or add a new item.</p>
          <Button onClick={handleSeed} disabled={seeding} className="h-9 bg-accent text-slate-950 font-bold text-xs">
            Seed Default Content Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const IconComp = getIconComponent(item.icon);
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface-1 p-5 shadow-xs transition-all hover:border-accent/50 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                      {item.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        title={item.isPublished ? 'Published (Click to Unpublish)' : 'Unpublished (Click to Publish)'}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-colors ${
                          item.isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                        }`}
                      >
                        {item.isPublished ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                        {item.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-border text-accent">
                      <IconComp className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-fg">{item.title}</h4>
                      <p className="text-[11px] font-mono text-fg-subtle">key: {item.key}</p>
                    </div>
                  </div>

                  {item.subtitle && <p className="text-xs text-fg-muted line-clamp-2">{item.subtitle}</p>}

                  {item.badge && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                      <Tag className="size-3" /> {item.badge}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-fg-subtle">
                  <span>Order: #{item.order}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 text-fg hover:text-accent font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded hover:bg-rose-500/10 text-fg-subtle hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
