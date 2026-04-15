# Auto-Redirect Feature Testing

## Overview
The Self Respect extension now includes an auto-redirect toggle that allows users to control whether they are automatically redirected to healthier alternatives. When auto-redirect is disabled, users must manually click to redirect.

## Features

### 1. Auto-Redirect Toggle
- **Location**: Settings → General Settings
- **Default**: Enabled (true)
- **Behavior**: When enabled, automatic redirect occurs after delay
- **UI**: Toggle switch with description

### 2. Conditional Redirect Delay Input
- **Visibility**: Only shown when auto-redirect is enabled
- **Location**: Below auto-redirect toggle
- **Options**: 1, 2, 3 (default), 5, 10 seconds
- **Behavior**: Hidden when auto-redirect is disabled

### 3. Blocking Level Integration
All three blocking levels respect the auto-redirect setting:

#### Soft Block:
- **Auto-redirect enabled**: Shows countdown, automatic redirect after delay
- **Auto-redirect disabled**: No countdown, manual redirect button only
- **Button text**: Changes based on setting

#### Puzzle Block:
- **Auto-redirect enabled**: "Choose Healthier Alternative" button
- **Auto-redirect disabled**: "Go to Healthier Alternative" button
- **Puzzle logic**: Unaffected by auto-redirect setting

#### Hard Block:
- **Auto-redirect enabled**: Shows redirect info and countdown
- **Auto-redirect disabled**: No redirect info shown
- **Button text**: Consistent (always shows redirect option)

## Technical Implementation

### Storage Schema Update
```typescript
interface UserSettings {
  // ... existing fields
  autoRedirect: boolean;      // New field
  redirectDelay: number;      // Existing, now conditional
  // ... other fields
}
```

### Settings Page Updates
1. **HTML**: Added auto-redirect toggle with ID `autoRedirect`
2. **CSS**: Wrapped redirect delay in container with ID `redirectDelayContainer`
3. **JavaScript**: Conditional visibility based on toggle state

### Content Script Updates
All blocking overlay functions now accept two additional parameters:
```typescript
function showSoftBlockOverlay(
  blockedDomain: string, 
  redirectUrl: string, 
  autoRedirect: boolean = true, 
  redirectDelay: number = 3
)
```

### Timer Management
- **setTimeout**: Used for auto-redirect countdown
- **clearTimeout**: Called when user manually redirects or cancels
- **Interval updates**: Countdown display updates every second

## Testing Instructions

### 1. Build and Load Extension
```bash
./build.sh
# Load dist/ directory in chrome://extensions/
```

### 2. Test Auto-Redirect Toggle

#### Test Case 1: Enable/Disable Toggle
1. Open Settings → General Settings
2. Toggle "Auto Redirect" on/off
3. Verify:
   - Redirect delay input shows/hides correctly
   - Settings are saved (check Chrome DevTools → Application → Storage)
   - Notification appears confirming change

#### Test Case 2: Redirect Delay Configuration
1. Ensure auto-redirect is enabled
2. Change redirect delay to different values (1, 5, 10 seconds)
3. Verify:
   - Setting is saved
   - Notification confirms change
   - Value persists after page reload

### 3. Test Blocking Levels with Auto-Redirect

#### Soft Block Tests:
1. Set blocking level to "Soft Block"
2. **With auto-redirect enabled**:
   - Visit blocked domain
   - Verify countdown message shows correct delay
   - Verify automatic redirect occurs after delay
   - Test "Redirect Now" button (should cancel timer)
   - Test "Cancel" button (should cancel timer and remove overlay)

3. **With auto-redirect disabled**:
   - Visit blocked domain
   - Verify no countdown message
   - Verify no automatic redirect
   - Verify button says "Go to Healthier Alternative"
   - Test manual redirect button
   - Test cancel button

#### Puzzle Block Tests:
1. Set blocking level to "Puzzle Block"
2. **With auto-redirect enabled**:
   - Visit blocked domain
   - Solve puzzle
   - Verify button says "Choose Healthier Alternative"
   - Test both proceed and alternative buttons

3. **With auto-redirect disabled**:
   - Visit blocked domain
   - Solve puzzle
   - Verify button says "Go to Healthier Alternative"
   - Test both proceed and alternative buttons

#### Hard Block Tests:
1. Set blocking level to "Hard Block"
2. **With auto-redirect enabled**:
   - Visit blocked domain
   - Verify countdown message
   - Verify redirect info is shown
   - Verify automatic redirect occurs
   - Test manual redirect button (should cancel timer)

3. **With auto-redirect disabled**:
   - Visit blocked domain
   - Verify no countdown message
   - Verify no redirect info shown
   - Verify manual redirect button works

### 4. Edge Cases

#### Test Case: Quick Toggle Changes
1. Enable auto-redirect, set delay to 10 seconds
2. Visit blocked domain
3. Quickly disable auto-redirect in settings (different tab)
4. Verify current overlay updates (may require refresh)

#### Test Case: Zero-Second Delay
1. Enable auto-redirect
2. Set delay to 1 second (minimum)
3. Visit blocked domain
4. Verify immediate redirect perception

#### Test Case: Storage Persistence
1. Configure settings
2. Close and reopen browser
3. Verify settings are restored

## Expected Behavior Matrix

| Blocking Level | Auto-Redirect | Expected Behavior |
|----------------|---------------|-------------------|
| Soft           | Enabled       | Countdown + auto redirect after delay |
| Soft           | Disabled      | No countdown, manual redirect only |
| Puzzle         | Enabled       | "Choose Healthier Alternative" button |
| Puzzle         | Disabled      | "Go to Healthier Alternative" button |
| Hard           | Enabled       | Countdown + auto redirect, shows redirect info |
| Hard           | Disabled      | No countdown, manual redirect, no redirect info |

## Debugging

### Common Issues:

1. **Timer not clearing**:
   ```javascript
   // Check DevTools console for:
   console.log("Running soft block overlay", { autoRedirect, redirectDelay });
   ```

2. **UI not updating**:
   - Verify `redirectDelayContainer` ID exists
   - Check CSS `display` property changes
   - Verify event listeners are attached

3. **Settings not saving**:
   ```javascript
   // Check Chrome DevTools:
   // Application → Storage → chrome.storage.sync
   ```

4. **TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

### Console Logs:
- Overlay functions log their parameters
- Timer functions log start/stop events
- Storage functions log save/load operations

## Performance Considerations

### Timer Management:
- Timers are cleared when no longer needed
- No memory leaks from uncleared intervals
- Efficient DOM updates for countdown

### Storage Efficiency:
- Only essential data stored
- Efficient serialization/deserialization
- Minimal storage footprint

### UI Responsiveness:
- Conditional rendering prevents unnecessary DOM elements
- Smooth transitions for show/hide
- Responsive design maintained

## User Experience Benefits

1. **Flexibility**: Users can choose their preferred interaction style
2. **Control**: Manual redirect for those who want more control
3. **Simplicity**: Auto-redirect for those who prefer hands-off approach
4. **Consistency**: All blocking levels respect the same setting
5. **Clarity**: UI clearly indicates current auto-redirect state

## Future Enhancements

### Potential Improvements:
1. **Per-domain settings**: Different auto-redirect settings for different categories
2. **Time-based rules**: Auto-redirect only during certain hours
3. **Progressive delays**: Increasing delays for repeated attempts
4. **Custom messages**: User-defined redirect messages
5. **Redirect history**: Track which alternatives users choose

### Technical Debt:
- Consider using React/Vue for more reactive UI
- Add unit tests for timer logic
- Improve TypeScript type definitions
- Add accessibility features

## Conclusion

The auto-redirect feature adds significant flexibility to the Self Respect extension, allowing users to tailor their experience based on personal preference. The implementation is robust, with proper timer management, conditional UI rendering, and integration across all blocking levels.