
// HMR stability improvements
if (import.meta.hot) {
  // Accept HMR updates for this module
  import.meta.hot.accept();

  // Dispose function to clean up on reload
  import.meta.hot.dispose(() => {
    // Clear any intervals or timeouts
    const highestId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  });

  // Error handling for HMR
  import.meta.hot.on('vite:error', (error) => {
    console.error('HMR Error:', error);
  });
}

// Prevent memory leaks during development
if (import.meta.env.DEV) {
  // Override console.error to catch React errors
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out known development warnings
    if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export {};
