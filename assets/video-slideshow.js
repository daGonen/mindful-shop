/**
 * Video Slideshow JavaScript - SIMPLE VERSION
 * Place this file in assets/video-slideshow.js
 */

class VideoSlideshow {
  constructor(container) {
    this.container = container;
    this.wrapper = container.querySelector('.video-slideshow-wrapper');
    this.slides = container.querySelectorAll('.video-slide, .text-slide');
    this.videos = container.querySelectorAll('.slideshow-video');
    this.playButtons = container.querySelectorAll('.play-button');
    this.prevBtn = container.querySelector('.prev-slide');
    this.nextBtn = container.querySelector('.next-slide');
    this.dotsContainer = container.querySelector('.slideshow-dots');
    
    // Modal elements
    this.sidePanel = document.getElementById('videoSidePanel');
    this.sidePanelVideo = document.querySelector('.side-panel-video');
    this.sidePanelTitle = document.querySelector('.side-panel-title');
    this.closePanelBtn = document.querySelector('.close-panel');
    this.sidePanelBackdrop = document.querySelector('.side-panel-backdrop');
    
    this.mobileOverlay = document.getElementById('mobileVideoOverlay');
    this.mobileVideoTrack = document.querySelector('.mobile-video-track');
    this.mobileCloseBtn = document.querySelector('.mobile-close-btn');
    this.mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    this.mobileDotsContainer = document.querySelector('.mobile-video-dots');
    
    this.loadingSpinner = document.getElementById('videoLoading');
    
    // Simple state
    this.currentSlide = 0; // Keep for compatibility
    this.currentPage = 0; // New: current page index
    this.slidesPerPage = 1; // New: slides per page
    this.totalPages = 1; // New: total pages
    this.currentVideoIndex = 0;
    this.videoSlides = [...this.slides].filter(slide => slide.classList.contains('video-slide'));
    this.isAutoplay = this.container.dataset.autoplay === 'true';
    this.autoplaySpeed = parseInt(this.container.dataset.autoplaySpeed) * 1000 || 5000;
    this.pauseOnHover = this.container.dataset.pauseOnHover === 'true';
    this.autoplayInterval = null;
    
    this.init();
  }
  
  init() {
    this.setupVideos();
    this.calculateSlidesPerPage();
    this.createDots();
    this.setupEventListeners();
    this.setupAutoplay();
    this.updateSlidePosition();
    this.createMobileVideoSlideshow();
    
    setTimeout(() => {
      this.container.classList.add('fade-in');
    }, 100);
  }
  
  calculateSlidesPerPage() {
    if (window.innerWidth <= 768) {
      // Mobile: one slide per page
      this.slidesPerPage = 1;
    } else {
      // Desktop: calculate how many slides fit in the container
      const containerWidth = this.wrapper.parentElement.offsetWidth - 40; // Account for padding
      const slideWidth = this.slides.length > 0 ? this.slides[0].offsetWidth : 300;
      const gap = parseInt(getComputedStyle(this.wrapper).gap) || 20;
      
      this.slidesPerPage = Math.floor((containerWidth + gap) / (slideWidth + gap));
      this.slidesPerPage = Math.max(1, this.slidesPerPage);
    }
    
    // Calculate total pages needed
    this.totalPages = Math.ceil(this.slides.length / this.slidesPerPage);
    this.currentPage = 0;
    
    console.log('Slides per page:', this.slidesPerPage);
    console.log('Total slides:', this.slides.length);
    console.log('Total pages:', this.totalPages);
  }
  
  setupVideos() {
    this.videos.forEach((video, index) => {
      if (video.dataset.src) {
        video.src = video.dataset.src;
        
        if (index === 0 && this.isAutoplay) {
          video.play().catch(e => console.log('Autoplay prevented:', e));
        }
      }
    });
  }
  
  createDots() {
    if (!this.dotsContainer || this.totalPages <= 1) return;
    
    this.dotsContainer.innerHTML = '';
    
    // Create one dot per page (not per slide)
    for (let i = 0; i < this.totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'slideshow-dot';
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to page ${i + 1}`);
      dot.addEventListener('click', () => this.goToPage(i));
      this.dotsContainer.appendChild(dot);
    }
    
    console.log('Created', this.totalPages, 'dots for', this.slides.length, 'slides');
  }
  
  setupEventListeners() {
    // Navigation buttons
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSlide());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSlide());
    
    // Play buttons
    this.playButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => this.handlePlayClick(e, index));
    });
    
    // Modal close events
    if (this.closePanelBtn) this.closePanelBtn.addEventListener('click', () => this.closeSidePanel());
    if (this.sidePanelBackdrop) this.sidePanelBackdrop.addEventListener('click', () => this.closeSidePanel());
    if (this.mobileCloseBtn) this.mobileCloseBtn.addEventListener('click', () => this.closeMobileOverlay());
    
    // Mobile navigation
    this.mobileNavBtns.forEach(btn => {
      if (btn.classList.contains('prev-video')) {
        btn.addEventListener('click', () => this.prevMobileVideo());
      } else if (btn.classList.contains('next-video')) {
        btn.addEventListener('click', () => this.nextMobileVideo());
      }
    });
    
    // Touch events - simple approach
    if (this.wrapper) {
      let touchStartX = 0;
      
      this.wrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      });
      
      this.wrapper.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchStartX - touchEndX;
        
        if (Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            this.nextSlide(); // Swipe left = next
          } else {
            this.prevSlide(); // Swipe right = prev
          }
        }
      });
    }
    
    // Mobile overlay touch events
    if (this.mobileOverlay) {
      let overlayTouchStartX = 0;
      let overlayTouchStartY = 0;
      
      this.mobileOverlay.addEventListener('touchstart', (e) => {
        overlayTouchStartX = e.touches[0].clientX;
        overlayTouchStartY = e.touches[0].clientY;
      });
      
      this.mobileOverlay.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = overlayTouchStartX - touchEndX;
        const deltaY = overlayTouchStartY - touchEndY;
        
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
          if (deltaY < 0) { // Swipe down
            this.closeMobileOverlay();
          }
        } else if (Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            this.nextMobileVideo(); // Swipe left = next
          } else {
            this.prevMobileVideo(); // Swipe right = prev
          }
        }
      });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Window resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Intersection Observer
    this.setupIntersectionObserver();
  }
  
  setupAutoplay() {
    if (this.isAutoplay && this.slides.length > 1) {
      this.startAutoplay();
      
      if (this.pauseOnHover) {
        this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
        this.container.addEventListener('mouseleave', () => this.startAutoplay());
      }
    }
  }
  
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.startAutoplay();
        } else {
          this.pauseAutoplay();
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(this.container);
  }
  
  startAutoplay() {
    if (this.autoplayInterval) return;
    if (this.isAutoplay && this.slides.length > 1) {
      this.autoplayInterval = setInterval(() => {
        this.nextSlide();
      }, this.autoplaySpeed);
    }
  }
  
  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
  
  updateSlidePosition() {
    if (!this.wrapper || this.slides.length === 0) return;
    
    const slideWidth = this.slides[0].offsetWidth;
    const gap = parseInt(getComputedStyle(this.wrapper).gap) || 0;
    
    let offset;
    
    // Check if we're on the last page and there are remaining slides that don't fill the page
    const isLastPage = this.currentPage === this.totalPages - 1;
    const remainingSlidesOnLastPage = this.slides.length - (this.currentPage * this.slidesPerPage);
    
    if (isLastPage && remainingSlidesOnLastPage < this.slidesPerPage && this.slidesPerPage > 1) {
      // Position the slideshow so the last slide is at the right edge
      const lastSlideIndex = this.slides.length - 1;
      const containerWidth = this.wrapper.parentElement.offsetWidth - 40; // Account for padding
      
      // Calculate position so last slide aligns to the right of the visible area
      offset = -(lastSlideIndex * (slideWidth + gap)) + containerWidth - slideWidth;
      
      // But don't go beyond what a normal last page would show
      const normalLastPageOffset = -(this.currentPage * this.slidesPerPage * (slideWidth + gap));
      offset = Math.max(offset, normalLastPageOffset);
    } else {
      // Normal page positioning
      offset = -(this.currentPage * this.slidesPerPage * (slideWidth + gap));
    }
    
    console.log('Moving to page', this.currentPage, 'with offset', offset, isLastPage ? '(last page)' : '');
    
    this.wrapper.style.transform = `translateX(${offset}px)`;
    this.updateDots();
  }
  
  updateDots() {
    const dots = this.dotsContainer?.querySelectorAll('.slideshow-dot');
    if (!dots) return;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentPage);
    });
  }
  
  nextSlide() {
    this.currentPage = (this.currentPage + 1) % this.totalPages;
    this.updateSlidePosition();
  }
  
  prevSlide() {
    this.currentPage = (this.currentPage - 1 + this.totalPages) % this.totalPages;
    this.updateSlidePosition();
  }
  
  goToPage(pageIndex) {
    if (pageIndex >= 0 && pageIndex < this.totalPages) {
      this.currentPage = pageIndex;
      this.updateSlidePosition();
    }
  }
  
  // Keep this for compatibility with play button clicks
  goToSlide(slideIndex) {
    const pageIndex = Math.floor(slideIndex / this.slidesPerPage);
    this.goToPage(pageIndex);
  }
  
  async handlePlayClick(e, slideIndex) {
    e.preventDefault();
    
    const videoSlide = this.playButtons[slideIndex].closest('.video-slide');
    const video = videoSlide.querySelector('.slideshow-video');
    const videoSrc = video.src || video.dataset.src;
    const videoTitle = this.playButtons[slideIndex].dataset.videoTitle || '';
    
    if (!videoSrc) return;
    
    this.currentVideoIndex = this.videoSlides.indexOf(videoSlide);
    
    this.showLoadingSpinner();
    
    try {
      if (window.innerWidth <= 768) {
        await this.showMobileVideo(videoSrc, videoTitle);
      } else {
        await this.showSidePanel(videoSrc, videoTitle);
      }
    } catch (error) {
      console.error('Error loading video:', error);
    } finally {
      this.hideLoadingSpinner();
    }
  }
  
  async showSidePanel(videoSrc, title) {
    this.sidePanelVideo.src = videoSrc;
    this.sidePanelTitle.textContent = title;
    
    this.sidePanel.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    await new Promise((resolve) => {
      this.sidePanelVideo.addEventListener('loadeddata', resolve, { once: true });
      this.sidePanelVideo.load();
    });
    
    this.sidePanelVideo.play();
  }
  
  async showMobileVideo(videoSrc, title) {
    this.mobileOverlay.classList.add('active', 'fade-in');
    document.body.style.overflow = 'hidden';
    
    this.updateMobileSlidePosition();
    this.updateMobileDots();
    this.updateMobileNavigation();
    
    const currentMobileVideo = this.getCurrentMobileVideo();
    if (currentMobileVideo) {
      await new Promise((resolve) => {
        currentMobileVideo.addEventListener('loadeddata', resolve, { once: true });
        if (currentMobileVideo.readyState >= 2) resolve();
      });
      currentMobileVideo.play();
    }
  }
  
  createMobileVideoSlideshow() {
    if (!this.mobileVideoTrack) return;
    
    this.mobileVideoTrack.innerHTML = '';
    
    this.videoSlides.forEach((videoSlide, index) => {
      const video = videoSlide.querySelector('.slideshow-video');
      const videoSrc = video.src || video.dataset.src;
      const playButton = videoSlide.querySelector('.play-button');
      const videoTitle = playButton?.dataset.videoTitle || '';
      
      if (videoSrc) {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'mobile-video-slide';
        slideDiv.innerHTML = `
          <video controls preload="metadata" playsinline data-title="${videoTitle}">
            <source src="${videoSrc}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        `;
        this.mobileVideoTrack.appendChild(slideDiv);
      }
    });
    
    this.createMobileDots();
  }
  
  createMobileDots() {
    if (!this.mobileDotsContainer) return;
    
    this.mobileDotsContainer.innerHTML = '';
    this.videoSlides.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = 'mobile-video-dot';
      if (index === 0) dot.classList.add('active');
      this.mobileDotsContainer.appendChild(dot);
    });
  }
  
  updateMobileDots() {
    const dots = this.mobileDotsContainer.querySelectorAll('.mobile-video-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentVideoIndex);
    });
  }
  
  getCurrentMobileVideo() {
    const slides = this.mobileVideoTrack?.querySelectorAll('.mobile-video-slide');
    return slides?.[this.currentVideoIndex]?.querySelector('video');
  }
  
  updateMobileSlidePosition() {
    if (!this.mobileVideoTrack) return;
    
    const offset = -(this.currentVideoIndex * 100);
    this.mobileVideoTrack.style.transform = `translateX(${offset}%)`;
  }
  
  closeSidePanel() {
    this.sidePanel.classList.remove('active');
    
    setTimeout(() => {
      this.sidePanelVideo.pause();
      this.sidePanelVideo.src = '';
      document.body.style.overflow = '';
    }, 300);
  }
  
  closeMobileOverlay() {
    this.mobileOverlay.classList.add('fade-out');
    
    const mobileVideos = this.mobileVideoTrack?.querySelectorAll('video');
    mobileVideos?.forEach(video => video.pause());
    
    setTimeout(() => {
      this.mobileOverlay.classList.remove('active', 'fade-in', 'fade-out');
      document.body.style.overflow = '';
    }, 300);
  }
  
  nextMobileVideo() {
    if (this.currentVideoIndex < this.videoSlides.length - 1) {
      this.currentVideoIndex++;
      this.switchMobileVideo();
    }
  }
  
  prevMobileVideo() {
    if (this.currentVideoIndex > 0) {
      this.currentVideoIndex--;
      this.switchMobileVideo();
    }
  }
  
  async switchMobileVideo() {
    this.updateMobileSlidePosition();
    this.updateMobileDots();
    this.updateMobileNavigation();
    
    const currentVideo = this.getCurrentMobileVideo();
    if (currentVideo) {
      const allVideos = this.mobileVideoTrack?.querySelectorAll('video');
      allVideos?.forEach(video => {
        if (video !== currentVideo) video.pause();
      });
      
      currentVideo.play();
    }
  }
  
  updateMobileNavigation() {
    const prevBtn = this.mobileOverlay.querySelector('.prev-video');
    const nextBtn = this.mobileOverlay.querySelector('.next-video');
    
    if (prevBtn) prevBtn.disabled = this.currentVideoIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentVideoIndex === this.videoSlides.length - 1;
  }
  
  handleKeyDown(e) {
    if (this.sidePanel.classList.contains('active') || this.mobileOverlay.classList.contains('active')) {
      switch (e.key) {
        case 'Escape':
          this.closeSidePanel();
          this.closeMobileOverlay();
          break;
        case 'ArrowLeft':
          if (this.mobileOverlay.classList.contains('active')) {
            this.prevMobileVideo();
          }
          break;
        case 'ArrowRight':
          if (this.mobileOverlay.classList.contains('active')) {
            this.nextMobileVideo();
          }
          break;
      }
    } else {
      switch (e.key) {
        case 'ArrowLeft':
          this.prevSlide();
          break;
        case 'ArrowRight':
          this.nextSlide();
          break;
      }
    }
  }
  
  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.calculateSlidesPerPage();
      this.createDots();
      
      // Ensure currentPage doesn't exceed totalPages
      this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
      
      this.updateSlidePosition();
      
      if (window.innerWidth > 768 && this.mobileOverlay.classList.contains('active')) {
        this.closeMobileOverlay();
      }
    }, 250);
  }
  
  showLoadingSpinner() {
    if (this.loadingSpinner) {
      this.loadingSpinner.classList.add('active');
    }
  }
  
  hideLoadingSpinner() {
    if (this.loadingSpinner) {
      this.loadingSpinner.classList.remove('active');
    }
  }
  
  destroy() {
    this.pauseAutoplay();
    
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    this.videos.forEach(video => {
      video.pause();
      video.src = '';
    });
    
    this.closeSidePanel();
    this.closeMobileOverlay();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  const slideshows = document.querySelectorAll('.video-slideshow-section');
  const instances = [];
  
  slideshows.forEach(slideshow => {
    const instance = new VideoSlideshow(slideshow);
    instances.push(instance);
  });
  
  window.addEventListener('beforeunload', () => {
    instances.forEach(instance => instance.destroy());
  });
  
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function(event) {
      const slideshow = event.target.querySelector('.video-slideshow-section');
      if (slideshow) {
        new VideoSlideshow(slideshow);
      }
    });
    
    document.addEventListener('shopify:section:unload', function(event) {
      const slideshow = event.target.querySelector('.video-slideshow-section');
      if (slideshow && slideshow.slideshowInstance) {
        slideshow.slideshowInstance.destroy();
      }
    });
  }
});