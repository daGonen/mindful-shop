document.addEventListener('DOMContentLoaded', function() {
  // Set header height CSS variable
  function setHeaderHeight() {
    const header = document.querySelector('header, .header, [role="banner"]');
    if (header) {
      const headerHeight = header.offsetHeight;
      document.documentElement.style.setProperty('--header-height-total', `${headerHeight}px`);
    } else {
      document.documentElement.style.setProperty('--header-height-total', '0px');
    }
  }

  // Set on load and resize
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);

  const videos = document.querySelectorAll('.video-hero');
  
  videos.forEach(video => {
    if (!video) return;

    // Create Intersection Observer for each video
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Play video when visible
          video.play().catch(e => console.log('Autoplay prevented:', e));
        } else {
          // Pause video when not visible
          video.pause();
        }
      });
    }, {
      threshold: 0.5 // Video needs to be at least 50% visible
    });

    // Start observing the video
    observer.observe(video);

    // Attempt autoplay on initial load
    video.play().catch(e => console.log('Initial autoplay prevented:', e));
  });
});