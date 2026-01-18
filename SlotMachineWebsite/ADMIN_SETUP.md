# Admin Module Setup Guide

## Overview
The Admin module provides a complete management interface for the Slot Machine website. All data is stored locally using `localStorage` - no database migrations required.

## Features
- ✅ **Admin Authentication** - Login and password reset for admin users
- ✅ **Dashboard** - Overview of users, spins, revenue, and statistics
- ✅ **User Management** - View, block/unblock, and manage players
- ✅ **Game Settings** - Configure spin costs, payouts, and probabilities
- ✅ **Analytics** - Charts and insights for game performance
- ✅ **Access Control** - Admin role restricted by email whitelist

## Setup Instructions

### 1. Configure Admin Emails
Edit `/src/lib/adminConfig.ts` and add admin email addresses:

```typescript
export const ADMIN_EMAILS = [
  'admin@example.com',
  'your-admin@email.com',  // Add your email here
  // Add more admin emails as needed
];
```

### 2. Create Admin Account
1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Enter the email from `ADMIN_EMAILS` list
5. Set a password
6. Verify the email (or disable email verification in Supabase settings)

### 3. Access Admin Panel
1. Navigate to `/admin/auth` to login
2. Use your admin credentials
3. You'll be redirected to `/admin` dashboard

## Admin Routes

### Public Routes
- `/admin/auth` - Admin login and password reset

### Protected Routes (Require Admin Role)
- `/admin` - Main dashboard
- `/admin/users` - User management
- `/admin/settings` - Game configuration
- `/admin/analytics` - Analytics and reports

## Local Storage Data

The system uses the following localStorage keys:

- `slot_machine_game_settings` - Game configuration (spin cost, payouts, probabilities)
- `slot_machine_game_spins` - All game spins for analytics
- `slot_machine_blocked_users` - List of blocked user IDs
- `slot_machine_user_balances` - User balance data

To reset all admin data, open browser console and run:
```javascript
localStorage.removeItem('slot_machine_game_settings');
localStorage.removeItem('slot_machine_game_spins');
localStorage.removeItem('slot_machine_blocked_users');
```

## Game Settings

### Default Configuration
```javascript
{
  spinCost: 10,
  payouts: {
    jackpot: 100,      // 100x for three 7s
    threeMatch: 10,    // 10x for three matching
    twoMatch: 2,       // 2x for two matching
  },
  probabilities: {
    jackpot: 1,        // 1% chance
    threeMatch: 10,    // 10% chance
    twoMatch: 25,      // 25% chance
  },
  initialBalance: 100,
}
```

These settings can be modified through the Admin Settings page.

## User Management Features

### Block/Unblock Users
- Blocked users are redirected to `/blocked` page
- They cannot access the game until unblocked
- Block status is checked on every route

### Reset Balance
- Resets user's balance to initial amount
- Useful for testing or support

### User Statistics
- Total spins per user
- Total winnings per user
- Registration date and last activity

## Analytics Features

### Dashboard Stats (30 days)
- Total spins
- Total revenue
- Total winnings paid out
- Net revenue

### Charts
- **Daily Revenue & Winnings** - Line chart showing daily performance
- **Outcome Distribution** - Pie chart of win types (jackpot, three match, two match, loss)
- **Daily Spin Activity** - Bar chart of spins per day
- **Top Players** - Leaderboard of most active players

## Security Notes

### Admin Access Control
- Admin role is determined by email whitelist in `adminConfig.ts`
- `ProtectedRoute` component enforces access control
- Non-admin users are redirected to `/admin/auth`

### Blocked User Flow
1. Admin blocks user in User Management
2. User ID is added to localStorage blocked list
3. `useAuth` hook checks blocked status
4. Blocked users redirected to `/blocked` page
5. Cannot access dashboard or game

### No Database Migrations
- All admin features work with existing Supabase auth
- No custom database tables required
- Data persists in browser localStorage
- Each browser session is independent

## Development

### Run Development Server
```bash
cd SlotMachineWebsite
npm run dev
```

### Build for Production
```bash
npm run build
```

### Test Admin Features
1. Create admin account with whitelisted email
2. Login at `/admin/auth`
3. Verify dashboard loads
4. Create test user account
5. Play some games to generate spin data
6. View analytics and user management features

## Troubleshooting

### "Not authorized" Error
- Check that your email is in `ADMIN_EMAILS` array
- Verify you're logged in with the correct account
- Clear browser cache and try again

### No Analytics Data
- Play some games to generate spin data
- Spins are logged to localStorage automatically
- Check browser console for errors

### Can't Access Admin Routes
- Ensure `ProtectedRoute` wrapper is properly configured
- Check browser console for routing errors
- Verify admin routes are defined in `App.tsx`

### Lost Admin Access
- Admin emails are hardcoded in `adminConfig.ts`
- Re-deploy or modify the config file
- Login with a whitelisted email address

## Architecture

### Components
- `ProtectedRoute.tsx` - Route guard for authentication and admin checks
- `SlotMachine.tsx` - Game component with settings integration

### Pages
- `AdminAuth.tsx` - Login and password reset
- `AdminDashboard.tsx` - Main admin overview
- `AdminUserManagement.tsx` - User administration
- `AdminGameSettings.tsx` - Game configuration
- `AdminAnalytics.tsx` - Reports and charts
- `Blocked.tsx` - Page for blocked users

### Utilities
- `adminConfig.ts` - Central configuration and localStorage utilities
- `useAuth.tsx` - Authentication context with admin role detection

## Future Enhancements

Potential improvements:
- Export analytics to CSV
- Email notifications for admin actions
- Audit log for admin activities
- Multi-level admin roles (super admin, moderator)
- Database backend migration option
- Real-time analytics updates
