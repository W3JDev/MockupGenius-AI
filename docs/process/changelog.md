
# Changelog

## [1.2.0] - 2024-05-20
### Added
- **Image Replacement:** Added logic in `App.tsx` and `Gallery.tsx` to handle swapping source images.
- **Content Fit:** Added `Contain`, `Cover`, `TopAlign` to `types.ts` and prompt logic.
- **Custom Backgrounds:** Added free-text prompt input in `Controls.tsx`.

### Changed
- **Rendering Engine:** Upgraded prompt to "Dual-Layer Composite Architecture v3.0" in `geminiService.ts`.
- **UI:** Refactored Controls to support conditional rendering for Custom Prompts.

## [1.1.0] - 2024-05-10
### Added
- **A/B Testing:** Toggle to generate 2 variants.
- **SEO Generation:** Parallel API call to generate metadata.

## [1.0.0] - 2024-05-01
- Initial MVP Release.
