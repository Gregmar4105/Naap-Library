# Project Rules

### Explicit Twin & Identity Relationship Verification Invariant

1. **No Auto-Linking by Surname**: Never assume, infer, or automatically link user accounts as twins or family relations based solely on matching surnames, dates of birth, or addresses.
2. **Explicit Linkage Standard**: Twin relationship detection and twin session protection MUST strictly require an explicit database linkage (`TWIN_LIBRARY_ID`) or confirmed twin flag (`IS_TWIN = true`) paired with high-precision face vector match metrics (Euclidean distance < 0.38 and Cosine distance < 0.10).
3. **Protect Separate Users**: Separate users with shared surnames must always be allowed to authenticate independently without triggering twin verification blocks.
