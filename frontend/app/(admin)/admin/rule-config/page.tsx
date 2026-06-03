"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
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

  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rules.slice(start, start + itemsPerPage);
  }, [rules, currentPage, itemsPerPage]);

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
        const res = await fetch(`/api/v1/admin/rule-config/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to deactivate");
        toast.success(`Rule "${key}" deactivated.`);
        setRules((prev) => prev.map((r) => r.id === id ? { ...r, is_active: false } : r));
      } else {
        const res = await fetch(`/api/v1/admin/rule-config/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        });
        if (!res.ok) throw new Error("Failed to reactivate");
        toast.success(`Rule "${key}" reactivated.`);
        setRules((prev) => prev.map((r) => r.id === id ? { ...r, is_active: true } : r));
      }
    } catch {
      toast.error(action === "deactivate" ? "Failed to deactivate rule." : "Failed to reactivate rule.");
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
      <AdminHeader title="Rule Configuration" subtitle="Manage detection rules for keywords, TLDs, shorteners, and more." stat={{ label: "Total Rules", value: rules.length }} />

      <div className="container mx-auto px-4 pb-6 md:pb-8">
        {/* Tabs + Add Rule */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all",
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
              className="flex items-center gap-2 px-5 py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md"
            >
              <Plus className="size-4" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card bg-white border border-neutral-border shadow-sm rounded-3xl">
          <RulesTable
            rules={paginatedRules}
            loading={loading}
            emptyMessage={activeTab === "all" ? "No detection rules have been configured yet." : `No ${formatType(activeTab as ConfigType)} rules configured yet.`}
            deactivatingId={deactivating}
            onEdit={openEditModal}
            onToggle={handleToggleClick}
          />
          {rules.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={rules.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />
          )}
        </div>
      </div>

       {/* Modal */}
       {modalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div
             className="absolute inset-0 bg-black/40 backdrop-blur-sm"
             onClick={closeModal}
           />
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-neutral-page [&::-webkit-scrollbar-thumb]:bg-secondary/30 [&::-webkit-scrollbar-thumb:hover]:bg-secondary/40 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-neutral-page">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary">
                {editingRule ? "Edit Rule" : "Add Rule"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-neutral-border rounded-full transition-all"
              >
                <X className="size-5 text-secondary/60" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* config_type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary block">
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
                      "w-full bg-white border-2 rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
                      "focus:border-primary focus:ring-4 focus:ring-primary/5",
                      "appearance-none pr-10 pl-4 py-2 text-sm",
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
                  <p className="text-xs font-bold text-risk-high mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.config_type}
                  </p>
                )}
              </div>

              {/* key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary block">
                  Key
                </label>
                <input
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="e.g. urgent_action, .xyz"
                  className={cn(
                    "w-full bg-white border-2 rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
                    "focus:border-primary focus:ring-4 focus:ring-primary/5",
                    "px-4 py-3.5 text-sm",
                    formErrors.key
                      ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5"
                      : "border-neutral-border",
                  )}
                />
                {formErrors.key && (
                  <p className="text-xs font-bold text-risk-high mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.key}
                  </p>
                )}
              </div>

              {/* value */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary block">
                  Value
                </label>
                <input
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="e.g. 0.95, suspicious_pattern"
                  className={cn(
                    "w-full bg-white border-2 rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
                    "focus:border-primary focus:ring-4 focus:ring-primary/5",
                    "px-4 py-3.5 text-sm",
                    formErrors.value
                      ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5"
                      : "border-neutral-border",
                  )}
                />
                {formErrors.value && (
                  <p className="text-xs font-bold text-risk-high mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.value}
                  </p>
                )}
              </div>

               {/* group (optional) */}
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-secondary block">
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
                   className="w-full max-w-xl mx-auto bg-white border-2 border-neutral-border rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary/5 px-4 py-3.5 text-sm"
                 />
               </div>

              {/* score */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary block">
                  Score{" "}
                  <span className="font-normal text-secondary/60">(0–100)</span>
                </label>
                <div className="flex items-center gap-3">
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
                    className="flex-1 h-2 rounded-full appearance-none bg-neutral-border accent-secondary cursor-pointer"
                  />
                  <span
                    className={cn(
                      "w-12 text-center text-sm font-semibold px-2.5 py-1 rounded-lg",
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
                  <p className="text-xs font-bold text-risk-high mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {formErrors.score}
                  </p>
                )}
              </div>

              {/* description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary block">
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
                  className="w-full bg-white border-2 border-neutral-border rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary/5 p-3 md:p-4 min-h-[90px] resize-none text-sm"
                />
              </div>
            </div>

             {/* Actions */}
             <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-neutral-border">
               <button
                 onClick={closeModal}
                 disabled={saving}
                 className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-neutral-border text-secondary font-bold text-sm rounded-xl hover:bg-neutral-page transition-all disabled:opacity-50"
               >
                 Cancel
               </button>
               <button
                 onClick={handleSave}
                 disabled={saving}
                 className="flex items-center gap-2 px-5 py-3 bg-secondary text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
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
        title={confirmConfig.action === "deactivate" ? "Deactivate Rule?" : "Reactivate Rule?"}
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
