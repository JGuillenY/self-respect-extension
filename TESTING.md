# Testing the Three Blocking Levels

## Overview
The Self Respect extension now features three distinct blocking levels that users can configure in the settings. Each level provides different levels of protection and user interaction.

## Blocking Levels

### 1. Soft Block (Default)
**Description**: The original implementation with a gentle approach.

**Features**:
- Shows a respectful overlay explaining why the site is blocked
- Provides a redirect to a healthier alternative
- Allows temporary bypass with "Cancel" button
- 3-second countdown before automatic redirect

**User Experience**:
```
[Self Respect Overlay]
"You were about to visit [blocked-domain.com]"
"This site may not align with your goals..."
[Redirect Now] [Cancel]
```

### 2. Puzzle Block
**Description**: Requires solving a difficult puzzle to proceed.

**Features**:
- Generates random hard puzzles (math, logic, pattern, memory)
- 5 attempts maximum
- 10-minute time limit
- Hint system (available after 3 attempts)
- If puzzle is solved, user can choose to proceed or take alternative

**Puzzle Types**:
- **Math**: Complex arithmetic problems (e.g., "Solve for x: 3^(2x+1) = 81")
- **Logic**: Reasoning problems (e.g., "12 balls, one heavier, find with 3 weighings")
- **Pattern**: Sequence completion (e.g., Fibonacci, prime numbers)
- **Memory**: Short-term memory challenges

**User Experience**:
```
[Self Respect - Puzzle Block]
"To access this site, you must solve a difficult puzzle"
[Puzzle Question]
[Answer Input] [Submit]
Attempts: 0/5 | Timeout: 10 minutes | [Show Hint]
```

### 3. Hard Block
**Description**: Absolute protection with no bypass options.

**Features**:
- No access allowed under any circumstances
- No puzzle, no temporary bypass
- Immediate redirect to alternative
- Clear message about permanent blocking

**User Experience**:
```
[Self Respect - Hard Block]
"Access to [blocked-domain.com] is permanently blocked"
"This site is incompatible with your self-respect goals"
⚠️ HARD BLOCK ACTIVATED ⚠️
[Go to Healthier Alternative]
```

## Configuration

### Settings Location
1. Click the extension icon
2. Click "⚙️ Open Settings"
3. Navigate to "General Settings" section
4. Select "Blocking Level" dropdown

### Available Options:
- **Soft Block (Current - Shows overlay)**
- **Puzzle Block (Hard puzzle to solve)**
- **Hard Block (No access at all)**

## Testing Instructions

### 1. Load the Extension
```bash
# Build the extension
./build.sh

# In Chrome:
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the "dist" directory
```

### 2. Test Each Blocking Level

#### Soft Block Test:
1. Set blocking level to "Soft Block" in settings
2. Visit a blocked domain (e.g., `pornhub.com`)
3. Verify overlay appears with redirect option
4. Test both "Redirect Now" and "Cancel" buttons

#### Puzzle Block Test:
1. Set blocking level to "Puzzle Block" in settings
2. Visit a blocked domain
3. Try solving the puzzle:
   - Correct answer: Should show success message and proceed option
   - Wrong answer 5 times: Should reload with new puzzle
   - Wait 10 minutes: Should timeout and reload
4. Test hint system (available after 3 attempts)

#### Hard Block Test:
1. Set blocking level to "Hard Block" in settings
2. Visit a blocked domain
3. Verify no bypass options are available
4. Test redirect button

### 3. Integration Tests

#### Storage Integration:
- Verify settings are saved to Chrome storage
- Check that blocking level persists after browser restart
- Confirm statistics update for all blocking types

#### Real-time Updates:
- Change blocking level while extension is active
- Verify changes take effect immediately
- Test with multiple tabs open

## Expected Behavior

### Soft Block:
- Overlay appears immediately
- 3-second countdown (configurable in settings)
- User can cancel to temporarily access site
- Statistics increment when blocked

### Puzzle Block:
- Puzzle overlay appears immediately
- User has 5 attempts to solve
- 10-minute time limit
- Success allows choice to proceed or redirect
- Failure reloads page with new puzzle
- Statistics increment when blocked

### Hard Block:
- Hard block overlay appears immediately
- No bypass options available
- Only option is to redirect to alternative
- Statistics increment when blocked

## Troubleshooting

### Common Issues:

1. **Puzzle not generating**:
   - Check TypeScript compilation
   - Verify puzzle.ts file is included in build
   - Check browser console for errors

2. **Settings not saving**:
   - Verify Chrome storage permissions in manifest
   - Check settings.js for storage errors
   - Test with Chrome DevTools → Application → Storage

3. **Overlay not appearing**:
   - Check content script is loading
   - Verify domain is in blocked list
   - Check for CSS conflicts with page

4. **Statistics not updating**:
   - Verify incrementBlockCounter is called
   - Check storage permissions
   - Test with Chrome DevTools

### Debugging:
```javascript
// Open Chrome DevTools on blocked page
// Check Console for:
console.log("[Self Respect] Blocking domain: ...")
console.log("Running [soft/puzzle/hard] block overlay")

// Check Network tab for content.js loading
// Check Application → Storage for settings
```

## Performance Considerations

### Puzzle Generation:
- Puzzles are generated client-side
- No network requests needed
- Minimal performance impact

### Storage Usage:
- Settings: ~1KB
- Statistics: ~100 bytes
- Blocked sites: Variable based on custom domains

### Memory Usage:
- Overlay: Single DOM element
- Event listeners: Cleaned up properly
- No memory leaks expected

## Security Considerations

### Client-side Only:
- All logic runs in browser
- No external API calls
- No user data transmitted

### Puzzle Security:
- Answers validated client-side
- No server-side verification needed
- Timeout prevents brute force

### Storage Security:
- Uses Chrome's secure storage
- No sensitive data stored
- Settings sync across devices (if signed in)

## Future Enhancements

### Potential Improvements:
1. **Puzzle Difficulty Levels**: User-selectable difficulty
2. **Custom Puzzles**: Users can add their own puzzles
3. **Time-based Rules**: Different blocking levels at different times
4. **Category-specific Levels**: Different levels for different categories
5. **Progress Tracking**: Track puzzle success rates
6. **Achievements**: Rewards for consistent self-control

### Technical Debt:
- Consider bundling for smaller file size
- Add more puzzle types
- Improve puzzle validation
- Add unit tests for puzzle generator

## Conclusion

The three-tier blocking system provides flexible protection levels:
- **Soft**: For gentle reminders and easy bypass
- **Puzzle**: For significant barriers requiring effort
- **Hard**: For absolute protection with no exceptions

This allows users to customize their self-respect journey based on their current needs and willpower levels.