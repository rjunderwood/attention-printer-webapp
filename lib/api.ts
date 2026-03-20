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

  getPlan: (campaign: string) =>
    request<import("./types").PlanResponse>(`/${campaign}/plan`),

  setPlanGroup: (campaign: string, body: import("./types").PlanSetRequest) =>
    request<{ message: string; plan: import("./types").Plan }>(
      `/${campaign}/plan/set`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  removeGroup: (campaign: string, group: string) =>
    request<{ message: string; plan: import("./types").Plan }>(
      `/${campaign}/plan/remove-group`,
      { method: "POST", body: JSON.stringify({ group }) }
    ),

  resetPlan: (campaign: string) =>
    request<{ message: string; plan: import("./types").Plan }>(
      `/${campaign}/plan/reset`,
      { method: "POST" }
    ),

  getPreview: (campaign: string, date?: string) => {
    const params = date ? `?date=${date}` : "";
    return request<import("./types").PlanPreview>(
      `/${campaign}/plan/preview${params}`
    );
  },

  getStatus: (campaign: string) =>
    request<import("./types").PlanStatus>(`/${campaign}/plan/status`),

  confirmPlan: (campaign: string, refresh?: boolean) =>
    request<{ message: string }>(`/${campaign}/plan/confirm`, {
      method: "POST",
      body: JSON.stringify(refresh ? { refresh: true } : {}),
    }),

  getCreators: (campaign: string) =>
    request<import("./types").CreatorsResponse>(`/${campaign}/creators`),

  pauseCreator: (campaign: string, name: string) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/pause`, {
      method: "POST",
    }),

  resumeCreator: (campaign: string, name: string) =>
    request<{ message: string }>(`/${campaign}/creators/${name}/resume`, {
      method: "POST",
    }),

  getHistory: (campaign: string, days?: number) =>
    request<import("./types").HistoryResponse>(
      `/${campaign}/history${days ? `?days=${days}` : ""}`
    ),

  getHistoryDetail: (campaign: string, date: string) =>
    request<import("./types").HistoryDetail>(`/${campaign}/history?date=${date}`),

  getContentLevels: (campaign: string) =>
    request<import("./types").ContentLevels>(`/${campaign}/content-levels`),

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
};
