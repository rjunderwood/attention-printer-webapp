const BASE = "/api/pipeline";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers as Record<string, string> };
  if (options?.method && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  getCampaigns: () => request<{ campaigns: string[] }>("/campaigns"),

  getConfig: (campaign: string) =>
    request<import("./types").CampaignConfig>(`/${campaign}/config`),

  getCreators: (campaign: string) =>
    request<import("./types").CreatorsResponse>(`/${campaign}/creators`),

  pauseCreator: (campaign: string, name: string, reason?: string) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/pause`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  resumeCreator: (campaign: string, name: string) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/resume`, {
      method: "POST",
    }),

  setCreatorType: (campaign: string, name: string, type: string) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/type`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),

  getHistory: (campaign: string, days?: number) =>
    request<import("./types").HistoryResponse>(
      `/${campaign}/history${days ? `?days=${days}` : ""}`
    ),

  getHistoryDetail: (campaign: string, date: string) =>
    request<import("./types").HistoryDetail>(`/${campaign}/history?date=${date}`),

  getFailures: (campaign: string) =>
    request<import("./types").FailuresResponse>(`/${campaign}/failures`),

  acknowledgeFailure: (campaign: string, failureKey: string) =>
    request<{ message: string }>(
      `/${campaign}/failures/${encodeURIComponent(failureKey)}/acknowledge`,
      { method: "POST" }
    ),

  acknowledgeAllFailures: (campaign: string) =>
    request<{ message: string; count: number }>(
      `/${campaign}/failures/acknowledge-all`,
      { method: "POST" }
    ),

  getOrchestratorStatus: () =>
    request<import("./types").OrchestratorStatus>("/orchestrator/status"),

  startWarmup: (campaign: string, name: string, device: number) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/warmup/start`, {
      method: "POST",
      body: JSON.stringify({ device }),
    }),

  promoteWarmup: (campaign: string, name: string, device?: number) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/warmup/promote`, {
      method: "POST",
      body: JSON.stringify(device ? { device } : {}),
    }),

  recordWarmupPost: (campaign: string, name: string, date?: string) =>
    request<import("./types").WarmupPostResponse>(
      `/${campaign}/creators/${name}/warmup/post`,
      { method: "POST", body: JSON.stringify(date ? { date } : {}) }
    ),

  getWarmupProgress: (campaign: string, name: string) =>
    request<import("./types").WarmupProgress>(
      `/${campaign}/creators/${name}/warmup`
    ),

  getWarmupPosting: (campaign: string, date?: string) =>
    request<import("./types").WarmupPostingResponse>(
      `/${campaign}/warmup-posting${date ? `?date=${date}` : ""}`
    ),

  markWarmupPosted: (campaign: string, body: import("./types").MarkPostedRequest) =>
    request<import("./types").MarkPostedResponse>(
      `/${campaign}/warmup-posting/mark-posted`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  // Templates

  getTemplates: (campaign: string, status?: string, category?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    const qs = params.toString();
    return request<import("./types").TemplatesResponse>(
      `/${campaign}/templates${qs ? `?${qs}` : ""}`
    );
  },

  getTemplateDetail: (campaign: string, category: string, name: string) =>
    request<import("./types").TemplateDetail>(
      `/${campaign}/templates/${category}/${name}`
    ),

  updateTemplateConfig: (campaign: string, category: string, name: string, config: Record<string, unknown>) =>
    request<{ message: string; config: import("./types").VideoConfig }>(
      `/${campaign}/templates/${category}/${name}/config`,
      { method: "POST", body: JSON.stringify(config) }
    ),

  activateTemplate: (campaign: string, category: string, name: string) =>
    request<{ message: string; status: string }>(
      `/${campaign}/templates/${category}/${name}/activate`,
      { method: "POST" }
    ),

  uploadFixedImage: async (campaign: string, category: string, name: string, slideNum: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/${campaign}/templates/${category}/${name}/slides/${slideNum}/fixed-image`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
    return data as { message: string; slide: number; template: string };
  },

  // Plans New (template-based plan system)

  getPlansNew: (campaign: string, scope: string) =>
    request<import("./types").PlanNewShowResponse>(
      `/${campaign}/plan/show?scope=${scope}`
    ),

  getPlansNewPreview: (campaign: string, scope: string, date?: string) => {
    const params = new URLSearchParams({ scope });
    if (date) params.set("date", date);
    return request<import("./types").PlanNewPreviewResponse>(
      `/${campaign}/plan/preview?${params}`
    );
  },

  confirmPlansNew: (campaign: string, scope: string, refresh?: boolean) =>
    request<{ message: string }>(`/${campaign}/plan/confirm`, {
      method: "POST",
      body: JSON.stringify({ scope, ...(refresh ? { refresh: true } : {}) }),
    }),

  adjustPlansNew: (campaign: string, body: { scope: string; group: string; content?: import("./types").PlanNewContentItem[]; region?: string }) =>
    request<{ message: string; adjusted_groups: import("./types").PlanNewGroup[] }>(`/${campaign}/plan/adjust`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getPlansNewQueueCheck: (campaign: string, scope: string) =>
    request<import("./types").PlanNewQueueCheckResponse>(
      `/${campaign}/plan/queue-check?scope=${scope}`
    ),

  getPlansNewTemplates: (campaign: string, scope: string) =>
    request<{ templates: import("./types").PlanNewTemplate[] }>(
      `/${campaign}/plan/templates?scope=${scope}`
    ),

  createPlansNewTemplate: (campaign: string, body: { scope: string; name: string; cycle_days: number; auto_rest: boolean }) =>
    request<{ message: string; template: import("./types").PlanNewTemplate }>(`/${campaign}/plan/templates`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getPlansNewTemplate: (campaign: string, id: string, scope: string) =>
    request<{ template: import("./types").PlanNewTemplate }>(
      `/${campaign}/plan/templates/${id}?scope=${scope}`
    ),

  setPlansNewTemplateDay: (campaign: string, id: string, body: { scope: string; day: number; group: import("./types").PlanNewGroup }) =>
    request<{ message: string; template: import("./types").PlanNewTemplate }>(`/${campaign}/plan/templates/${id}/set-day`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  removePlansNewTemplateGroup: (campaign: string, id: string, body: { scope: string; day: number; group_name: string }) =>
    request<{ message: string; template: import("./types").PlanNewTemplate }>(`/${campaign}/plan/templates/${id}/remove-group`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  validatePlansNewTemplate: (campaign: string, id: string, scope: string) =>
    request<import("./types").PlanNewTemplateValidation>(
      `/${campaign}/plan/templates/${id}/validate?scope=${scope}`
    ),

  activatePlansNewTemplate: (campaign: string, scope: string, templateId: string) =>
    request<{ message: string; cycle_days: number }>(`/${campaign}/plan/activate`, {
      method: "POST",
      body: JSON.stringify({ scope, template_id: templateId }),
    }),

  deactivatePlansNewTemplate: (campaign: string, scope: string) =>
    request<{ message: string }>(`/${campaign}/plan/deactivate`, {
      method: "POST",
      body: JSON.stringify({ scope }),
    }),

  deletePlansNewTemplate: (campaign: string, id: string, scope: string) =>
    request<{ message: string }>(`/${campaign}/plan/templates/${id}?scope=${scope}`, {
      method: "DELETE",
    }),

  clonePlansNewTemplate: (campaign: string, id: string, body: { scope: string; name: string }) =>
    request<{ message: string; template: import("./types").PlanNewTemplate; adjustments_applied: number }>(`/${campaign}/plan/templates/${id}/clone`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getPlansNewCohorts: (campaign: string) =>
    request<import("./types").PlanNewCohortsResponse>(
      `/${campaign}/plan/cohorts`
    ),

  addPlansNewCohort: (campaign: string, creators: string[]) =>
    request<{ message: string; cohort: import("./types").PlanNewCohort; warnings: string[] }>(`/${campaign}/plan/cohorts`, {
      method: "POST",
      body: JSON.stringify({ creators }),
    }),

  deletePlansNewCohort: (campaign: string, id: string) =>
    request<{ message: string }>(`/${campaign}/plan/cohorts/${id}`, {
      method: "DELETE",
    }),

  getPlansNewHistory: (campaign: string, scope: string, days?: number, date?: string) => {
    const params = new URLSearchParams({ scope });
    if (days) params.set("days", String(days));
    if (date) params.set("date", date);
    return request<import("./types").PlanNewHistoryResponse>(
      `/${campaign}/plan/history?${params}`
    );
  },

  getPlansNewAdjustments: (campaign: string, scope: string) =>
    request<{ adjustments: import("./types").PlanNewAdjustment[] }>(
      `/${campaign}/plan/adjustments?scope=${scope}`
    ),

  getPlansNewTemplateHistory: (campaign: string, scope: string) =>
    request<{ entries: import("./types").PlanNewTemplateHistoryEntry[] }>(
      `/${campaign}/plan/template-history?scope=${scope}`
    ),

  uploadClip: async (campaign: string, name: string, file: File, filename: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);
    const res = await fetch(`${BASE}/${campaign}/templates/ugc_video/${name}/clip`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
    return data as { message: string; filename: string; template: string };
  },
};
