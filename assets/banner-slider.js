document.addEventListener("DOMContentLoaded", () => {
  const sliders = document.querySelectorAll(".dCS_slider");

  sliders.forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".dCS_slider__slide"));
    const dots = slider.closest(".dCS_banner").querySelectorAll(".dCS_slider-dot");
    const nextButton = slider.closest(".dCS_banner").querySelector(".dCS_slider-button--next");
    const prevButton = slider.closest(".dCS_banner").querySelector(".dCS_slider-button--prev");
    const bannerContainer = slider.closest(".dCS_banner-container");

    let currentIndex = 0;
    let autoRotate = bannerContainer.dataset.autoRotate === "true";
    let slideSpeed = parseInt(bannerContainer.dataset.slideSpeed, 10) * 1000;
    let interval;
    let hasUserInteracted = false;
    let isVisible = true; // Track if the banner is in view

    // Element classes for different slides
    const elementClasses = [
      "slide-earth-active",  // 1st slide - earth/ground (brown)
      "slide-fire-active",   // 2nd slide - fire (orange/red)
      "slide-water-active",  // 3rd slide - water (blue)
      "slide-forest-active"  // 4th slide - forest (green)
    ];
    
    // Theme classes for desktop buttons
    // No longer needed since we're using position-based themes

    // Touch swipe variables
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50; // Minimum distance required for a swipe

    const updateActiveState = (index) => {
      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
      
      // Update element class based on current slide
      // Remove all element classes first
      elementClasses.forEach(className => {
        bannerContainer.classList.remove(className);
      });
      
      // Add current element class
      const elementClassIndex = index % elementClasses.length;
      bannerContainer.classList.add(elementClasses[elementClassIndex]);
      
      // We no longer need to update desktop button themes here
      // since they have fixed themes based on position
    };
    
    // Function to update desktop button themes based on active slide
    const updateDesktopButtonThemes = (index) => {
      // We no longer need to update the desktop button themes
      // Each button now has a fixed theme based on its position
      // This is handled in the CSS with position-specific selectors
    };

    const goToSlide = (index) => {
      if (index >= 0 && index < slides.length) {
        // Instead of scrollIntoView which can affect page position,
        // manually control the slider's scroll position
        const slider = slides[0].parentElement;
        const targetSlide = slides[index];
        const slideWidth = targetSlide.offsetWidth;
        
        // Scroll the slider container horizontally without affecting page scroll
        slider.scrollTo({
          left: slideWidth * index,
          behavior: 'smooth'
        });
        
        currentIndex = index;
        updateActiveState(index);
      }
    };

    // Function to start auto-rotation
    const startAutoRotate = () => {
      if (autoRotate && !hasUserInteracted && isVisible) {
        stopAutoRotate(); // Prevent multiple intervals
        interval = setInterval(() => {
          const nextIndex = (currentIndex + 1) % slides.length;
          goToSlide(nextIndex);
        }, slideSpeed);
      }
    };

    // Function to stop auto-rotation permanently
    const stopAutoRotate = () => {
      clearInterval(interval);
      autoRotate = false; // Disable auto-rotation permanently
    };

    // Stop auto-rotate as soon as the user interacts
    const stopAutoRotateOnInteraction = () => {
      if (!hasUserInteracted) {
        hasUserInteracted = true;
        stopAutoRotate();
      }
    };

    // Event listeners for navigation buttons (stop auto-rotation permanently)
    if (nextButton) {
      nextButton.addEventListener("click", () => {
        stopAutoRotateOnInteraction();
        goToSlide((currentIndex + 1) % slides.length);
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        stopAutoRotateOnInteraction();
        goToSlide((currentIndex - 1 + slides.length) % slides.length);
      });
    }

    // Stop auto-rotate when user clicks dots
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        stopAutoRotateOnInteraction();
        goToSlide(index);
      });
    });

    // Touch event handlers for swipe functionality
    slider.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      
      // Check if swipe distance is significant enough
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        stopAutoRotateOnInteraction();
        
        if (swipeDistance > 0) {
          // Swipe right - go to previous slide
          goToSlide((currentIndex - 1 + slides.length) % slides.length);
        } else {
          // Swipe left - go to next slide
          goToSlide((currentIndex + 1) % slides.length);
        }
      }
    };

    // Detect if the banner is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (!isVisible) {
            clearInterval(interval); // Pause auto-rotation when out of view
          } else {
            startAutoRotate(); // Resume auto-rotation if allowed
          }
        });
      },
      { threshold: 0.5 } // 50% of the banner must be visible to be considered "in view"
    );

    observer.observe(bannerContainer);

    // Desktop button interaction handlers
    const desktopButtons = document.querySelectorAll('.dCS_purchase-button.desktop-button');
    
    desktopButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        // The click should proceed normally since we're using anchor tags
        // But we can add additional effects if needed
      });
      
      // Optional hover effects can be added here if needed
      button.addEventListener("mouseenter", () => {
        // Custom hover effect if needed
      });
      
      button.addEventListener("mouseleave", () => {
        // Reset hover effect if needed
      });
    });

    // Initialize active state and auto-rotation
    updateActiveState(currentIndex);
    startAutoRotate();
  });
});