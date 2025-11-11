# Progress Persistence Implementation Plan

**Objective:** Enable installation progress tracking to survive page refreshes by persisting state to localStorage and resuming operations automatically.

**Problem:** Currently, when users refresh the page during installation, they lose all progress visibility even though the backend installation continues.

**Solution Approach:** Incremental implementation with self-contained, easily validatable steps.

---

## Implementation Strategy

**Core Principles:**
- Each step is atomic and reversible
- Each step can be individually validated
- No step breaks existing functionality
- Progressive enhancement approach

---

## Step 1: Add localStorage Utilities (Foundation)

### **Files to Modify:**
- `src/utils/localStorage.ts` (NEW)

### **Changes:**
```typescript
// Create localStorage utility functions
export const persistenceUtils = {
  saveProgressState(state: ProgressState): void
  loadProgressState(): ProgressState | null
  clearProgressState(): void
  isProgressStateValid(state: ProgressState): boolean
}
```

### **Validation:**
- Import utilities in browser console
- Test save/load/clear operations
- Verify localStorage keys are created correctly
- Check error handling for invalid data

### **Rollback Strategy:**
- Simply delete the new file
- No existing functionality affected

---

## Step 2: Enhance Batch Progress Store (Core State)

### **Files to Modify:**
- `src/stores/batchProgressStore.ts`

### **Changes:**
```typescript
// Add persistence methods to existing store
interface BatchProgressState {
  // ... existing fields
  persistToStorage(): void
  loadFromStorage(): boolean
  clearStorage(): void
}
```

### **Implementation Details:**
- Add localStorage persistence to existing state mutations
- Auto-save on state changes (debounced)
- Load from storage in store initialization
- Preserve all existing store functionality

### **Validation:**
- Store state persists across browser refresh
- All existing store operations still work
- No performance impact on normal operations
- localStorage is updated when progress changes

### **Rollback Strategy:**
- Remove localStorage methods from store
- Keep all existing store functionality intact

---

## Step 3: Add Progress Recovery Hook (Business Logic)

### **Files to Modify:**
- `src/hooks/useProgressRecovery.ts` (NEW)

### **Changes:**
```typescript
// New hook for handling progress recovery logic
export const useProgressRecovery = () => {
  const checkForOngoingOperation(): RecoveryInfo | null
  const resumeProgressTracking(recoveryInfo: RecoveryInfo): Promise<boolean>
  const cancelRecovery(): void
}
```

### **Implementation Details:**
- Check localStorage on hook initialization
- Validate stored progress data is still relevant
- Provide methods to resume or cancel tracking
- Handle edge cases (expired operations, invalid data)

### **Validation:**
- Hook detects previously saved progress correctly
- Hook handles invalid/expired data gracefully
- Hook provides correct recovery options
- No impact when no stored progress exists

### **Rollback Strategy:**
- Delete the new hook file
- No integration with existing code yet

---

## Step 4: Integrate Recovery UI (User Interface)

### **Files to Modify:**
- `src/client/components/mantine/StoreUpdatesActions.tsx`

### **Changes:**
```typescript
// Add recovery UI section above existing progress bar
const RecoveryAlert = () => {
  // Show "Resuming previous installation..." alert
  // Provide "Stop Tracking" button for manual cancel
}
```

### **Implementation Details:**
- Add recovery alert component above existing progress bar
- Show only when recovery is detected
- Provide clear user actions (Resume/Cancel)
- Style consistently with existing progress UI

### **Validation:**
- Recovery UI appears when resuming operations
- Recovery UI disappears when not needed
- Resume/Cancel buttons work correctly
- UI integrates seamlessly with existing layout

### **Rollback Strategy:**
- Remove recovery UI components
- Existing progress bar remains unchanged

---

## Step 5: Enable Progress Polling Resume (Core Functionality)

### **Files to Modify:**
- `src/hooks/useInstallUpdates.ts`

### **Changes:**
```typescript
// Modify existing polling logic to support resume
const resumeProgressPolling = (progressId: string, recoveryInfo: RecoveryInfo) => {
  // Resume polling with stored progress_id
  // Update UI with recovery status
  // Handle resume success/failure
}
```

### **Implementation Details:**
- Add resume capability to existing polling function
- Integrate with progress recovery hook
- Maintain all existing polling behavior
- Add recovery-specific logging and error handling

### **Validation:**
- Polling resumes correctly after page refresh
- Progress continues from last known state
- All existing polling functionality preserved
- Recovery works with both sync and install operations

### **Rollback Strategy:**
- Remove resume functionality from polling
- Keep existing polling logic intact

---

## Step 6: Add App-Level Recovery Initialization (Integration)

### **Files to Modify:**
- `src/client/components/mantine/StoreUpdatesDashboard.tsx`

### **Changes:**
```typescript
// Add recovery initialization to dashboard mount
useEffect(() => {
  // Check for ongoing operations on app startup
  // Initialize recovery if needed
}, []);
```

### **Implementation Details:**
- Initialize recovery check on dashboard mount
- Integrate with existing dashboard lifecycle
- Show recovery status in appropriate UI location
- Preserve all existing dashboard functionality

### **Validation:**
- Recovery initializes automatically on app load
- Recovery integrates smoothly with existing dashboard
- No impact on dashboard when no recovery needed
- Recovery state is properly managed throughout app lifecycle

### **Rollback Strategy:**
- Remove recovery initialization from useEffect
- Dashboard functionality remains unchanged

---

## Validation Strategy Per Step

### **Development Validation:**
1. **TypeScript Compilation:** `npm run type-check`
2. **Build Validation:** ServiceNow SDK `build` command
3. **Functionality Testing:** Manual testing in browser
4. **State Persistence:** Browser refresh tests
5. **Edge Case Testing:** Invalid data, expired operations

### **User Acceptance Testing:**
1. **Start Installation:** Begin installing updates
2. **Refresh Page:** Force browser refresh during installation
3. **Verify Recovery:** Confirm progress tracking resumes
4. **Complete Installation:** Verify installation completes normally
5. **Clean State:** Verify localStorage is cleaned up

---

## Rollback Strategy

Each step can be individually rolled back:

### **Individual Step Rollback:**
- Revert file changes for that step only
- Run build and deploy to restore previous functionality
- No impact on previous steps or overall application

### **Complete Feature Rollback:**
- Remove all new files (`localStorage.ts`, `useProgressRecovery.ts`)
- Revert changes to existing files
- Clean up localStorage keys
- Application returns to original state

---

## Risk Mitigation

### **Data Safety:**
- localStorage operations are wrapped in try/catch
- Invalid stored data is handled gracefully
- Fallback to normal operation if recovery fails

### **Performance:**
- localStorage operations are debounced
- Recovery checks only happen on app initialization
- No impact on normal operation performance

### **User Experience:**
- Clear recovery UI with user control
- Graceful degradation if recovery fails
- Manual override options for stuck operations

---

## Success Criteria

### **Functional Requirements:**
- ✅ Progress tracking survives page refresh
- ✅ Users can resume tracking previous installations
- ✅ Users can cancel stuck tracking operations
- ✅ localStorage is properly cleaned up after completion

### **Non-Functional Requirements:**
- ✅ No performance impact on normal operations
- ✅ Graceful handling of edge cases
- ✅ Maintains all existing functionality
- ✅ Clear and intuitive user interface

### **Implementation Quality:**
- ✅ Each step is independently validatable
- ✅ Clean rollback strategy for each step
- ✅ Comprehensive error handling
- ✅ Consistent with existing architecture patterns

---

## Next Steps

1. **Review and Approve Plan:** Confirm approach and step breakdown
2. **Begin Step 1:** Implement localStorage utilities foundation
3. **Validate Step 1:** Test utilities in isolation
4. **Proceed Incrementally:** Continue through steps 2-6 with validation at each stage
5. **Complete Integration:** Final end-to-end testing and deployment

---

*This plan follows the implementation directives' mandatory workflow: small, atomic, reversible increments with explicit approval and validation at each step.*