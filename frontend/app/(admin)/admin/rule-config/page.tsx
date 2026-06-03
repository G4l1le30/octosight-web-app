"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit2, X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { RulesTable } from "@/components/admin/RulesTable";

type ConfigType =
  | "keyword"
  | "scam_scenario"
  | "tld"
  | "shortener"
  | "brand_term";

interface RuleConfig {
  id: number;
  config_type: string;
  key: string;
  value: string;
  group: string | null;
  score: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface RuleFormData {
  config_type: string;
  key: string;
  value: string;
  group: string;
  score: number;
  description: string;
}

const TABS: { id: ConfigType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "keyword", label: "Keyword" },
  { id: "scam_scenario", label: "Scam Scenario" },
  { id: "tld", label: "TLD" },
  { id: "shortener", label: "Shortener" },
  { id: "brand_term", label: "Brand Term" },
];

const CONFIG_TYPE_OPTIONS: { value: ConfigType; label: string }[] = [
  { value: "keyword", label: "Keyword" },
  { value: "scam_scenario", label: "Scam Scenario" },
  { value: "tld", label: "TLD" },
  { value: "shortener", label: "Shortener" },
  { value: "brand_term", label: "Brand Term" },
];

const INITIAL_FORM: RuleFormData = {
  config_type: "",
  key: "",
  value: "",
  group: "",
  score: 50,
  description: "",
};

export default function RuleConfigPage() {
  const [activeTab, setActiveTab] = useState<ConfigType | "all">("all");
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<number | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    id: number | null;
    key: string;
    action: "deactivate" | "reactivate";
  }>({ isOpen: false, id: null, key: "", action: "deactivate" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof RuleFormData, string>>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("config_type");
  const [sortDir, setSortDir] = useState("asc");

  const toggleSort = useCallback((col: string) => {
    if (col === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }, [sortBy]);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab === "all" ? "" : `?type=${activeTab}`;
      const res = await fetch(`/api/v1/admin/rule-config${params}`);
      if (!res.ok) throw new Error("Failed to fetch rules");
      const data = await res.json();
      setRules(data);
    } catch {
      toast.error("Failed to load rule configurations.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRules();
    setCurrentPage(1);
  }, [fetchRules]);

  const filteredRules = useMemo(() => {
    let result = [...rules];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.key.toLowerCase().includes(q) ||
          (r.value || "").toLowerCase().includes(q) ||
          (r.group || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const aVal = String(a[sortBy as keyof RuleConfig] ?? "");
      const bVal = String(b[sortBy as keyof RuleConfig] ?? "");
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [rules, search, sortBy, sortDir]);

  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRules.slice(start, start + itemsPerPage);
  }, [filteredRules, currentPage, itemsPerPage]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof RuleFormData, string>> = {};
    if (!formData.config_type) errors.config_type = "Type is required";
    if (!formData.key.trim()) errors.key = "Key is required";
    if (!formData.value.trim()) errors.value = "Value is required";
    if (formData.score < 0 || formData.score > 100)
      errors.score = "Score must be between 0 and 100";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setEditingRule(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (rule: RuleConfig) => {
    setEditingRule(rule);
    setFormData({
      config_type: rule.config_type,
      key: rule.key,
      value: rule.value,
      group: rule.group || "",
      score: rule.score,
      description: rule.description || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRule(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        config_type: formData.config_type,
        key: formData.key.trim(),
        value: formData.value.trim(),
        score: formData.score,
      };
      if (formData.group.trim()) body.group = formData.group.trim();
      if (formData.description.trim())
        body.description = formData.description.trim();

      if (editingRule) {
        const res = await fetch(`/api/v1/admin/rule-config/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Rule updated successfully.");
      } else {
        const res = await fetch("/api/v1/admin/rule-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Rule created successfully.");
      }

      closeModal();
      fetchRules();
    } catch {
      toast.error(
        editingRule ? "Failed to update rule." : "Failed to create rule.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = (rule: RuleConfig) => {
    const action = rule.is_active ? "deactivate" : "reactivate";
    setConfirmConfig({ isOpen: true, id: rule.id, key: rule.key, action });
  };

  const confirmToggle = async () => {
    if (!confirmConfig.id) return;
    const id = confirmConfig.id;
    const { action, key } = confirmConfig;
    setDeactivating(id);
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    try {
      if (action === "deactivate") {
        const res = await fetch(`/api/v1/admin/rule-config/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to deactivate");
        toast.success(`Rule "${key}" deactivated.`);
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_active: false } : r)),
        );
      } else {
        const res = await fetch(`/api/v1/admin/rule-config/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        });
        if (!res.ok) throw new Error("Failed to reactivate");
        toast.success(`Rule "${key}" reactivated.`);
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_active: true } : r)),
        );
      }
    } catch {
      toast.error(
        action === "deactivate"
          ? "Failed to deactivate rule."
          : "Failed to reactivate rule.",
      );
    } finally {
      setDeactivating(null);
    }
  };

  const formatType = (type: ConfigType) => {
    const map: Record<ConfigType, string> = {
      keyword: "Keyword",
      scam_scenario: "Scam Scenario",
      tld: "TLD",
      shortener: "Shortener",
      brand_term: "Brand Term",
    };
    return map[type] || type;
  };

  return (
    <>
      <AdminHeader
        title="Rule Configuration"
        subtitle="Manage detection rules for keywords, TLDs, shorteners, and more."
        stat={{ label: "Total Rules", value: rules.length }}
      />

      <div className="container mx-auto px-3 md:px-4 pb-6 md:pb-8">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs mb-3 md:mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/60"
          />
          <input
            type="text"
            placeholder="Search by key, value, group, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm border-2 border-neutral-border rounded-lg md:rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium"
          />
        </div>

        {/* Tabs + Add Rule */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-4 md:mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all",
                activeTab === tab.id
                  ? "bg-secondary text-white shadow-md scale-105"
                  : "bg-white text-secondary/80 border border-neutral-border hover:border-secondary/40 hover:bg-neutral-page",
              )}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 bg-secondary text-white rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:opacity-90 transition-all shadow-md"
            >
              <Plus className="size-4" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card bg-white border border-neutral-border shadow-sm rounded-2xl md:rounded-3xl">
          <RulesTable
            rules={paginatedRules}
            loading={loading}
            emptyMessage={
              activeTab === "all"
                ? "No detection rules have been configured yet."
                : `No ${formatType(activeTab as ConfigType)} rules configured yet.`
            }
            deactivatingId={deactivating}
            onEdit={openEditModal}
            onToggle={handleToggleClick}
            onSort={toggleSort}
            sortBy={sortBy}
            sortDir={sortDir}
          />
          {filteredRules.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredRules.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Modal header — fixed */}
            <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-3 md:pb-4 shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-secondary">
                {editingRule ? "Edit Rule" : "Add Rule"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 md:p-2 hover:bg-neutral-border rounded-full transition-all"
              >
                <X className="size-5 text-secondary/60" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto px-6 md:px-8 pb-3 md:pb-4 space-y-4 md:space-y-5 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-neutral-page [&::-webkit-scrollbar-thumb]:bg-secondary/30 [&::-webkit-scrollbar-thumb:hover]:bg-secondary/40 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-neutral-page">
              {/* config_type */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-secondary block">
                  Type
                </label>
                <div className="relative group">
                  <select
                    value={formData.config_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config_type: e.target.value as ConfigType,
                      })
                    }
                    className={cn(
                      "w-full bg-white border-2 rounded-md md:rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
                      "focus:border-primary focus:ring-4 focus:ring-primary/5",
                      "appearance-none pr-8 md:pr-10 pl-3 md:pl-4 py-1.5 md:py-2 text-xs md:text-sm",
                      formErrors.config_type
                        ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5"
                        : "border-neutral-border",
                    )}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1rem",
                    }}
                  >
                    <option value="">Select type</option>
                    {CONFIG_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.config_type && (
                  <p className="text-xs font-bold text-risk-high mt-0.5 md:mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.config_type}
                  </p>
                )}
              </div>

              {/* key */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-secondary block">
                  Key
                </label>
                <input
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="e.g. urgent_action, .xyz"
                  className={cn(
                    "w-full bg-white border-2 rounded-md md:rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
                    "focus:border-primary focus:ring-4 focus:ring-primary/5",
                    "px-3 md:px-4 py-3 md:py-3.5 text-xs md:text-sm",
                    formErrors.key
                      ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5"
                      : "border-neutral-border",
                  )}
                />
                {formErrors.key && (
                  <p className="text-xs font-bold text-risk-high mt-0.5 md:mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.key}
                  </p>
                )}
              </div>

              {/* value */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-secondary block">
                  Value
                </label>
                <input
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="e.g. 0.95, suspicious_pattern"
                  className={cn(
                    "w-full bg-white border-2 rounded-md md:rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
                    "focus:border-primary focus:ring-4 focus:ring-primary/5",
                    "px-3 md:px-4 py-3 md:py-3.5 text-xs md:text-sm",
                    formErrors.value
                      ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5"
                      : "border-neutral-border",
                  )}
                />
                {formErrors.value && (
                  <p className="text-xs font-bold text-risk-high mt-0.5 md:mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.value}
                  </p>
                )}
              </div>

              {/* group (optional) */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-secondary block">
                  Group{" "}
                  <span className="font-normal text-secondary/60">
                    (optional)
                  </span>
                </label>
                <input
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value })
                  }
                  placeholder="e.g. social_engineering, phishing_urls"
                  className="w-full max-w-xl mx-auto bg-white border-2 border-neutral-border rounded-md md:rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary/5 px-3 md:px-4 py-3 md:py-3.5 text-xs md:text-sm"
                />
              </div>

              {/* score */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-secondary block">
                  Score{" "}
                  <span className="font-normal text-secondary/60">(0–100)</span>
                </label>
                <div className="flex items-center gap-2 md:gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        score: Number(e.target.value),
                      })
                    }
                    className="flex-1 h-1.5 md:h-2 rounded-full appearance-none bg-neutral-border accent-secondary cursor-pointer"
                  />
                  <span
                    className={cn(
                      "w-10 md:w-12 text-center text-xs md:text-sm font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg",
                      formData.score >= 70
                        ? "bg-risk-high/10 text-risk-high"
                        : formData.score >= 40
                          ? "bg-risk-medium/10 text-risk-medium"
                          : "bg-risk-low/10 text-risk-low",
                    )}
                  >
                    {formData.score}
                  </span>
                </div>
                {formErrors.score && (
                  <p className="text-xs font-bold text-risk-high mt-0.5 md:mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.score}
                  </p>
                )}
              </div>

              {/* description */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-secondary block">
                  Description{" "}
                  <span className="font-normal text-secondary/60">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief explanation of this rule..."
                  rows={3}
                  className="w-full bg-white border-2 border-neutral-border rounded-md md:rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary/5 p-3 md:p-4 min-h-[90px] resize-none text-xs md:text-sm"
                />
              </div>
            </div>

            {/* Actions — fixed */}
            <div className="flex items-center justify-end gap-2 md:gap-3 px-6 md:px-8 pb-6 md:pb-8 pt-3 md:pt-4 border-t border-neutral-border shrink-0">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 bg-white border-2 border-neutral-border text-secondary font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:bg-neutral-page transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-3 bg-secondary text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : editingRule ? (
                  <Edit2 className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                {saving
                  ? "Saving..."
                  : editingRule
                    ? "Update Rule"
                    : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={
          confirmConfig.action === "deactivate"
            ? "Deactivate Rule?"
            : "Reactivate Rule?"
        }
        message={
          confirmConfig.action === "deactivate"
            ? `Are you sure you want to deactivate rule "${confirmConfig.key}"? This rule will no longer be used for threat detection.`
            : `Are you sure you want to reactivate rule "${confirmConfig.key}"? This rule will be used for threat detection again.`
        }
        confirmText="Confirm"
        type={confirmConfig.action === "deactivate" ? "danger" : "primary"}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmToggle}
        isLoading={deactivating !== null}
      />
    </>
  );
}
