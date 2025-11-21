/**
 * Fullscreen Image Zoom
 * Displays only the clicked product image in fullscreen overlay with transparent background
 */

class FullscreenZoom {
    constructor() {
      this.productInfo = document.querySelector('[data-zoom-fullscreen]');
      if (!this.productInfo) return;
  
      this.overlay = null;
      this.init();
    }
  
    init() {
      this.createOverlay();
      this.disableDefaultBehaviors();
      this.attachEventListeners();
    }
  
    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'fullscreen-image-overlay';
      document.body.appendChild(this.overlay);
    }
  
    disableDefaultBehaviors() {
      // Disable any link wrappers around images
      const mediaLinks = this.productInfo.querySelectorAll('.product__media-item a');
      mediaLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }, true);
        link.style.pointerEvents = 'none';
      });
  
      // Disable modal triggers
      const modalTriggers = this.productInfo.querySelectorAll('[data-modal], [data-media-modal]');
      modalTriggers.forEach((trigger) => {
        trigger.style.pointerEvents = 'none';
      });
    }
  
    attachEventListeners() {
      const mediaItems = this.productInfo.querySelectorAll('.product__media-item');
      
      mediaItems.forEach((mediaItem) => {
        const img = mediaItem.querySelector('img');
        if (!img) return;
  
        // Make image clickable
        img.style.pointerEvents = 'auto';
        img.style.cursor = 'zoom-in';
  
        // Add click handler using capture phase
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.openFullscreen(img);
          return false;
        }, true);
        
        // Backup handler on media item container
        mediaItem.style.pointerEvents = 'auto';
        mediaItem.addEventListener('click', (e) => {
          const clickedImg = e.target.closest('img');
          if (clickedImg) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.openFullscreen(clickedImg);
            return false;
          }
        }, true);
      });
  
      // Close on overlay click
      this.overlay.addEventListener('click', () => {
        this.closeFullscreen();
      });
  
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
          this.closeFullscreen();
        }
      });
    }
  
    openFullscreen(img) {
      // Get the base URL without any size parameters
      let originalSrc = img.src;
      
      // Remove Shopify's width parameter and replace with full width request
      // Shopify format: image.jpg?v=123456&width=1946
      if (originalSrc.includes('?')) {
        const urlParts = originalSrc.split('?');
        const baseUrl = urlParts[0];
        const params = new URLSearchParams(urlParts[1]);
        
        // Keep the version parameter if it exists
        const version = params.get('v');
        
        // Request maximum width (Shopify supports up to 5760px)
        originalSrc = version ? `${baseUrl}?v=${version}&width=5760` : `${baseUrl}?width=5760`;
      }
      
      // Also check srcset for the largest available image
      if (img.hasAttribute('srcset')) {
        const srcset = img.getAttribute('srcset');
        const sources = srcset.split(',').map(s => s.trim());
        
        // Find the largest width
        let largestSrc = '';
        let largestWidth = 0;
        
        sources.forEach(source => {
          const parts = source.split(' ');
          if (parts.length >= 2) {
            const width = parseInt(parts[1]);
            if (width > largestWidth) {
              largestWidth = width;
              largestSrc = parts[0];
            }
          }
        });
        
        // Use the largest srcset image if found
        if (largestSrc) {
          originalSrc = largestSrc;
        }
      }
      
      // Clear previous content and add new image
      this.overlay.innerHTML = '';
      
      const fullscreenImg = document.createElement('img');
      fullscreenImg.src = originalSrc;
      fullscreenImg.alt = img.alt || '';
  
      this.overlay.appendChild(fullscreenImg);
      this.overlay.classList.add('active');
  
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
  
    closeFullscreen() {
      this.overlay.classList.remove('active');
      
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new FullscreenZoom();
    });
  } else {
    new FullscreenZoom();
  }