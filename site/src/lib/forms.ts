// Create-bounty form model and validation (shared by the page and tests).

export type BountyForm = {
  title: string;
  description: string;
  requirements: string;
  acceptanceCriteria: string;
  githubRepository: string;
  tech: string;
  rewardAmount: string;
  deadlineDays: string;
};

export const EMPTY_FORM: BountyForm = {
  title: "",
  description: "",
  requirements: "",
  acceptanceCriteria: "",
  githubRepository: "",
  tech: "",
  rewardAmount: "",
  deadlineDays: "7",
};

export function validateBountyForm(f: BountyForm): Partial<Record<keyof BountyForm, string>> {
  const e: Partial<Record<keyof BountyForm, string>> = {};
  if (f.title.trim().length < 6) e.title = "Give it a specific title (6+ characters).";
  if (!f.description.trim()) e.description = "Describe the task.";
  if (!f.requirements.trim()) e.requirements = "List what must be delivered.";
  if (!f.acceptanceCriteria.trim()) e.acceptanceCriteria = "Say how you will judge the work.";
  if (!/^[\w.-]+\/[\w.-]+$/.test(f.githubRepository.trim())) e.githubRepository = "Use owner/repo, e.g. alice/project.";
  if (!f.tech.split(",").some((t) => t.trim())) e.tech = "Add at least one technology.";
  if (!/^\d+(\.\d{1,7})?$/.test(f.rewardAmount.trim()) || Number(f.rewardAmount) <= 0)
    e.rewardAmount = "Positive amount, up to 7 decimals.";
  const d = Number(f.deadlineDays);
  if (!Number.isInteger(d) || d < 1 || d > 365) e.deadlineDays = "1–365 days.";
  return e;
}

