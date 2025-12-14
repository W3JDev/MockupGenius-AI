
# Success Criteria & Validation Metrics

## 1. Business Metrics (KPIs)
| Metric | Definition | Target (MVP) |
| :--- | :--- | :--- |
| **Generation Success Rate** | % of API calls that return a valid image without error. | > 95% |
| **Download Rate** | % of generated images that are downloaded (indicates quality). | > 60% |
| **A/B Usage** | % of sessions where A/B testing is enabled. | > 30% |

## 2. Technical Service Level Objectives (SLOs)
| Metric | Threshold | Measurement |
| :--- | :--- | :--- |
| **Analysis Latency** | < 4 seconds | Time from upload to "Suggested Settings". |
| **Generation Latency** | < 15 seconds | Time from "Generate" click to render. |
| **UI Responsiveness** | < 100ms | Input lag on controls. |

## 3. Qualitative Quality Criteria (QA)
- **Text Legibility:** Screen text must be readable at 100% zoom.
- **Device Physics:** Reflections on the screen must behave like glass (dielectric).
- **Hallucinations:** Zero instances of the "Back of Phone" rendering bug.
- **Context:** If the app is "Coffee Shop", the background must not look like a "Corporate Office".
