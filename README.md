# NCA Toolkit Web UI (Decommissioned)

> [!NOTE]
> **Decommissioned 2026-11-09**: The Next.js web application and Cloudflare Pages project for `automate.codev.id` have been decommissioned in favor of an agent-native, headless CLI: **`nca`**.
>
> All backend media capabilities (Whisper transcription, FFmpeg transcoding, video cutting/trimming, subtitle burning, Playwright screenshots, and AI clip factory) remain active on OracleServer via `https://api.codev.id/nca`.
>
> AI coding assistants and automation scripts can drive the toolkit directly via the `nca-toolkit` skill or terminal:
> ```bash
> nca health
> nca transcribe "<media_url>" --language id
> nca clip-factory "<source_url>" --transcript "transcript.txt"
> ```
> Documentation:
> - Skill: `SKILLS/nca-toolkit/SKILL.md`
> - Migration Guide: `KNOWLEDGE/KNOWLEDGE-CODYNC-AND-AUTOMATE-HEADLESS-MIGRATION.md`
> - CLI Script: `C:\Users\THINKPAD\scripts\nca-cli.py` (`nca.cmd` / `nca.ps1`)
