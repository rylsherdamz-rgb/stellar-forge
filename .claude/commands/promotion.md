# /promotion

Generate a promotional video for the Stellar Agentic Framework using Remotion + ElevenLabs voiceover.

## Usage
```
/promotion [scene-focus]
```
Optional scene-focus: `all` (default), `skill`, `cli`, `framework`

## Prerequisites
- `promo/` Remotion project exists (remotion, @remotion/cli, mediabunny installed)
- `ELEVENLABS_API_KEY` set (via `.env` in `promo/` or environment) — never commit the key
- ElevenLabs voice ID configured in `promo/generate-voiceover.mjs` or `.env`

## Steps
1. Read `promo/src/scenes.ts` — confirm the script covers: what the framework does, the Skill (`npx skills add`), the CLI (`npx create-stellar-agentic`)
2. Generate voiceover audio:
   ```bash
   cd promo && node generate-voiceover.mjs
   ```
   - Reads scene script from `src/scenes.ts`
   - Calls ElevenLabs TTS per scene → writes MP3s to `public/voiceover/*.mp3`
   - Prints per-scene duration (seconds)
3. Verify scene timings in `src/scenes.ts` — each scene's `durationInFrames` must fit its voiceover length at 30fps
4. Sanity-check a frame:
   ```bash
   cd promo && npx remotion still Promotion --frame=30 --scale=0.25
   ```
5. Render the video:
   ```bash
   cd promo && npx remotion render Promotion out/promotion.mp4
   ```
6. Verify output exists and is non-empty; report path
7. Write decision record to `data/decisions/<date>-promotion.md`
8. Append cost/token note to `data/logs/costs/<date>.json`

## Customization
- **Script/voiceover text** — edit `promo/src/scenes.ts` (scene.voiceover)
- **Visual style** — edit `promo/src/Promotion.tsx` (colors, layout per scene)
- **Voice** — set `ELEVENLABS_VOICE_ID` in `promo/.env`
- **Scene duration** — edit `promo/src/scenes.ts` (scene.durationInFrames)
- **Aspect ratio** — edit composition dims in `promo/src/Root.tsx` (1080×1920 vertical, 1920×1080 landscape)

## Output
- `promo/out/promotion.mp4` — final video
- `promo/public/voiceover/` — per-scene MP3s (reused on re-render, no re-generation cost)
