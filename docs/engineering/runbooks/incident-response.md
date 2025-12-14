
# Runbook: Incident Response

## Severity Levels

### SEV-1: Critical
**Definition:** Generation failing for >50% of requests.
**Action:**
1. Check Google Gemini Status Page.
2. Verify API Key Quota usage in Google AI Studio.
3. If Quota exceeded, rotate keys or upgrade billing.

### SEV-2: Major
**Definition:** High latency (>30s) or "Back of Device" hallucinations increasing.
**Action:**
1. Adjust prompt engineering in `geminiService.ts` to reinforce "Front Facing" constraints.
2. Check `retryOperation` logic in service file.

### SEV-3: Minor
**Definition:** SEO metadata generation failing.
**Action:**
1. Non-blocking. User can still download image. Investigate prompt syntax.
