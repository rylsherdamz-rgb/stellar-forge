export type SceneKind = "hook" | "framework" | "skill" | "cli" | "together" | "cta";

export type Scene = {
  id: string;
  kind: SceneKind;
  title: string;
  subtitle?: string;
  code?: string[];
  prompt?: boolean;
  voiceover: string;
  audioFile: string;
  defaultFrames: number;
};

export const FPS = 30;

export const SCENES: Scene[] = [
  {
    id: "01-hook",
    kind: "hook",
    title: "Building a Stellar dApp is hard.",
    subtitle: "Contracts, frontends, payments, deployments — it shouldn't take six different tools.",
    voiceover:
      "Building a Stellar dApp means juggling contracts, frontends, payments, and deployments. One prompt should be enough.",
    audioFile: "voiceover/01-hook.mp3",
    defaultFrames: FPS * 7,
  },
  {
    id: "02-framework",
    kind: "framework",
    title: "The Stellar Agentic Framework",
    subtitle: "A graph engine routes your task to six specialist agents — each verifying its output against evals before moving on.",
    voiceover:
      "The Stellar Agentic Framework gives you a graph engine that routes your task to six specialist agents: contracts, frontend, backend, payments, devops, and zero knowledge. Each verifies its output against evals before the work moves on.",
    audioFile: "voiceover/02-framework.mp3",
    defaultFrames: FPS * 12,
  },
  {
    id: "03-skill",
    kind: "skill",
    title: "Install the Skill",
    subtitle: "AI orchestration for Claude Code and OpenCode.",
    code: [
      "npx skills add rylsherdamz-rgb/stellar-forge",
    ],
    prompt: true,
    voiceover:
      "Install the Skill in Claude Code or OpenCode, and the harness activates in every session. Describe what you want, and the agents build, test, and deploy it.",
    audioFile: "voiceover/03-skill.mp3",
    defaultFrames: FPS * 9,
  },
  {
    id: "04-cli",
    kind: "cli",
    title: "Or scaffold with the CLI",
    subtitle: "A production-ready monorepo in one command.",
    code: [
      "npx create-stellar-agentic my-dapp --yes",
      "✔ contracts/   hello-world + token",
      "✔ frontend/    Next.js + Wallets Kit",
      "✔ backend/     Express + x402 payments",
      "✔ CI/CD + all 10 skills installed",
    ],
    prompt: true,
    voiceover:
      "Or scaffold a complete project with one command. The CLI generates a production-ready monorepo: contracts, frontend, backend, and CI slash CD. It even auto-installs the Skill.",
    audioFile: "voiceover/04-cli.mp3",
    defaultFrames: FPS * 10,
  },
  {
    id: "05-together",
    kind: "together",
    title: "CLI bootstraps. Skill builds.",
    subtitle: "Use either one — together they're a complete workflow.",
    voiceover:
      "The CLI bootstraps the project. The Skill builds it. Use either one — together they are a complete workflow.",
    audioFile: "voiceover/05-together.mp3",
    defaultFrames: FPS * 6,
  },
  {
    id: "06-cta",
    kind: "cta",
    title: "Ship on Stellar in minutes.",
    subtitle: "stellar-agentic-framework.vercel.app",
    code: ["npx skills add rylsherdamz-rgb/stellar-forge"],
    prompt: true,
    voiceover:
      "Get started today at stellar agentic framework dot vercel dot app.",
    audioFile: "voiceover/06-cta.mp3",
    defaultFrames: FPS * 5,
  },
];
