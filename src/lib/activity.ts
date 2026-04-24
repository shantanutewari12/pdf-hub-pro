// Recent activity tracking — stored in localStorage

export type Activity = {
  id: string;
  tool: string;
  toolSlug: string;
  filename: string;
  timestamp: number;
};

const KEY = "pdfmaster_activity";

export function getActivities(): Activity[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Activity[];
  } catch {
    return [];
  }
}

export function addActivity(tool: string, toolSlug: string, filename: string) {
  const activities = getActivities();
  activities.unshift({
    id: crypto.randomUUID(),
    tool,
    toolSlug,
    filename,
    timestamp: Date.now(),
  });
  // Keep only last 20
  localStorage.setItem(KEY, JSON.stringify(activities.slice(0, 20)));
}

export function clearActivities() {
  localStorage.removeItem(KEY);
}
