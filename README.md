# MSDeaf-Timeline

Static timeline site for Malaysian Deaf Sports history.

## Admin Console

The site now includes a browser-side admin console for managing timeline events.

- Add new events
- Edit existing events
- Delete events
- Reorder events
- Export the current timeline as JSON
- Reset back to the default `data.json`

Important:

- Changes are saved in the browser with `localStorage`
- Admin access is protected only by a client-side session login in the browser
- Changes are not written back to `data.json` automatically
- Use `Export JSON` if you want to keep or publish the edited timeline data

## Admin Login

- The admin console now stays hidden until you sign in
- The default password is `msdeaf-admin-2026`
- The unlocked state lasts only for the current browser session
- This is not a secure server-side authentication system; it is a front-end isolation layer for a static site