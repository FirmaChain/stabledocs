import { createBrowserHistory } from 'history'
let history = createBrowserHistory({
  /* pass a configuration object here if needed */
  basename: '',             // The base URL of the app (see below)
  forceRefresh: false,      // Set true to force full page refreshes
  keyLength: 6,             // The length of location.key

  // getUserConfirmation: (message, callback) => callback(window.confirm(message))
})
export default history