# Left Arrow Image Replacement - Summary

## ✅ Completed Files:
1. `patient-login.tsx` - DONE
2. `doctor-login.tsx` - DONE

## ⏳ Remaining Files (Apply same pattern):

For each file below, make these 3 changes:

### Change 1: Add Image to imports
```typescript
// Add Image to the import list
import {
  // ... other imports
  Image  // Add this
} from 'react-native';
```

### Change 2: Replace back button text with image
```typescript
// OLD:
<Text style={styles.backButtonText}>←</Text>

// NEW:
<Image 
  source={require('../assets/images/left-arrow.png')} 
  style={styles.backButtonImage}
/>
```

### Change 3: Replace style definition
```typescript
// OLD:
backButtonText: {
  color: 'white',
  fontSize: 18, // or 24
},

// NEW:
backButtonImage: {
  width: 20,
  height: 20,
  tintColor: 'white',
},
```

## Files to Update:

### Registration Screens:
- [ ] `patient-register.tsx`
- [ ] `doctor-register.tsx`

### Reset Password Screens:
- [ ] `patient-reset-password.tsx`
- [ ] `doctor-reset-password.tsx`
- [ ] `reset-password.tsx`

### Profile Screens:
- [ ] `patient-profile.tsx`
- [ ] `doctor-profile.tsx`
- [ ] `edit-patient-profile.tsx`
- [ ] `edit-doctor-profile.tsx`

### Prescription Screens:
- [ ] `create-prescription.tsx`
- [ ] `prescription-details.tsx`
- [ ] `prescription-history.tsx`
- [ ] `patient-prescription-history.tsx`

## Important Note:
**Make sure `left-arrow.png` exists in `frontend/assets/images/` directory!**

If the image doesn't exist, the app will crash. You need to:
1. Create or download a left arrow PNG image
2. Place it in: `frontend/assets/images/left-arrow.png`
3. The image should be white or transparent (tintColor will make it white)
4. Recommended size: 48x48px or 64x64px

## Status:
- ✅ 2 files completed
- ⏳ 13 files remaining
- Total: 15 files

All files follow the exact same pattern shown above.
