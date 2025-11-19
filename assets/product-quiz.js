/**
 * Product Quiz JavaScript
 * Handles quiz logic, scoring, and recommendations
 */

(function() {
  'use strict';

  // Quiz state
  const quizData = {
    answers: {},
    productScores: {
      vitality: 0,
      unwind: 0,
      clarity: 0,
      immune: 0
    },
    products: window.quizConfig?.products || {},
    selectedProductKeys: []
  };

  let currentStep = 1;
  const totalSteps = 6;
  let q2Selections = [];

  // Initialize quiz
  function init() {
    updateProgress();
    bindEvents();
  }

  // Bind all event listeners
  function bindEvents() {
    // Single select options (Q1, Q3, Q4)
    document.querySelectorAll('.quiz-option:not(.multi-select)').forEach(option => {
      option.addEventListener('click', handleSingleSelect);
    });

    // Multi-select options (Q2)
    document.querySelectorAll('.quiz-option.multi-select').forEach(option => {
      option.addEventListener('click', handleMultiSelect);
    });

    // All Next buttons
    document.querySelectorAll('.quiz-next').forEach(btn => {
      btn.addEventListener('click', function() {
        const questionNum = this.dataset.next;
        
        // Validate that an answer has been selected
        if (questionNum === '2') {
          if (q2Selections.length > 0) {
            quizData.answers.q2 = [...q2Selections];
            nextStep();
          }
        } else {
          if (quizData.answers[`q${questionNum}`]) {
            nextStep();
          }
        }
      });
    });

    // Email form
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
      emailForm.addEventListener('submit', handleEmailSubmit);
    }

    // No thanks button
    const noThanksBtn = document.getElementById('noThanks');
    if (noThanksBtn) {
      noThanksBtn.addEventListener('click', handleNoThanks);
    }

    // Add All to Cart button
    const addAllBtn = document.getElementById('addAllToCart');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', handleAddAllToCart);
    }
  }

  // Handle single select option click
  function handleSingleSelect(e) {
    const button = e.currentTarget;
    const question = button.dataset.question;
    const product = button.dataset.product;
    
    // Deselect siblings
    button.parentElement.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Select this option
    button.classList.add('selected');
    
    // Save answer
    quizData.answers[`q${question}`] = product;
    
    // Show next button
    const nextBtn = document.querySelector(`[data-next="${question}"]`);
    if (nextBtn) {
      nextBtn.style.display = 'block';
    }
  }

  // Handle multi-select option click (Q2)
  function handleMultiSelect(e) {
    const button = e.currentTarget;
    const product = button.dataset.product;
    
    if (button.classList.contains('selected')) {
      // Deselect
      button.classList.remove('selected');
      q2Selections = q2Selections.filter(p => p !== product);
    } else {
      // Check if already have 3 selections
      if (q2Selections.length >= 3) {
        return;
      }
      // Select
      button.classList.add('selected');
      q2Selections.push(product);
    }
    
    // Show/hide continue button
    const nextBtn = document.querySelector('[data-next="2"]');
    if (nextBtn) {
      nextBtn.style.display = q2Selections.length > 0 ? 'block' : 'none';
    }
  }

// Handle email form submission  
function handleEmailSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('quizEmail');
  const email = emailInput.value.trim();
  
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    alert('Please enter a valid email address');
    return;
  }
  
  const recommendedProducts = quizData.selectedProductKeys.map(key => {
    return quizData.products[key]?.title || '';
  }).filter(title => title !== '');
  
  if (typeof _learnq !== 'undefined') {
    
    // This is ALL you need - it creates the profile AND triggers the flow
    _learnq.push(['track', 'Completed Quiz', {
      '$email': email,
      '$consent': ['email'], // This is the consent flag
      'Recommended Product 1': recommendedProducts[0] || '',
      'Recommended Product 2': recommendedProducts[1] || '',
      'Source': 'Product Quiz',
      '$event_id': 'quiz_' + Date.now(),
      '$value': 0
    }]);
    
    // This updates the profile properties
    _learnq.push(['identify', {
      '$email': email,
      '$consent': ['email'],
      'Quiz Completed': true,
      'Quiz Product 1': recommendedProducts[0] || '',
      'Quiz Product 2': recommendedProducts[1] || ''
    }]);
    
    console.log('✅ Quiz completed for:', email);
    
  } else {
    console.error('❌ Klaviyo not loaded');
  }
  
  nextStep();
}

  // Handle no thanks button click
  function handleNoThanks() {
    nextStep();
  }

  // Move to next step
  function nextStep() {
    if (currentStep === 4) {
      calculateScores();
    }
    
    if (currentStep < totalSteps) {
      const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
      if (currentStepEl) {
        currentStepEl.classList.remove('active');
      }
      
      currentStep++;
      
      const nextStepEl = document.querySelector(`[data-step="${currentStep}"]`);
      if (nextStepEl) {
        nextStepEl.classList.add('active');
      }
      
      updateProgress();
      
      if (currentStep === 6) {
        displayResults();
      }
    }
  }

  // Update progress bar
  function updateProgress() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
  }

  // Calculate product scores
  function calculateScores() {
    // Q1, Q3, Q4 contribute to dominant element
    ['q1', 'q3', 'q4'].forEach(q => {
      if (quizData.answers[q]) {
        quizData.productScores[quizData.answers[q]]++;
      }
    });
  }

  // Display quiz results
  function displayResults() {
    // Find dominant product from Q1, Q3, Q4
    let dominantProduct = null;
    let maxScore = 0;
    let tiedProducts = [];

    for (let product in quizData.productScores) {
      if (quizData.productScores[product] > maxScore) {
        maxScore = quizData.productScores[product];
        dominantProduct = product;
        tiedProducts = [product];
      } else if (quizData.productScores[product] === maxScore) {
        tiedProducts.push(product);
      }
    }

    // If tie, pick first one
    if (tiedProducts.length > 1) {
      dominantProduct = tiedProducts[0];
    }

    // Get flavor product from Q2 (pick most selected)
    let flavorProduct = null;
    if (quizData.answers.q2 && quizData.answers.q2.length > 0) {
      const flavorCounts = {};
      quizData.answers.q2.forEach(p => {
        flavorCounts[p] = (flavorCounts[p] || 0) + 1;
      });
      flavorProduct = Object.keys(flavorCounts).reduce((a, b) => 
        flavorCounts[a] > flavorCounts[b] ? a : b
      );
    }

    let selectedProducts = [dominantProduct];

    // Logic for second product
    if (flavorProduct && flavorProduct !== dominantProduct) {
      selectedProducts.push(flavorProduct);
    } else {
      // Find second highest score product
      let secondProduct = null;
      let secondMaxScore = 0;
      
      for (let product in quizData.productScores) {
        if (product !== dominantProduct && quizData.productScores[product] > secondMaxScore) {
          secondMaxScore = quizData.productScores[product];
          secondProduct = product;
        }
      }
      
      // If all answers are the same product, pick random
      if (!secondProduct || secondMaxScore === 0) {
        const allProducts = ['vitality', 'unwind', 'clarity', 'immune'];
        const availableProducts = allProducts.filter(p => p !== dominantProduct);
        secondProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      }
      
      selectedProducts.push(secondProduct);
    }

    // Store selected products for "Add All" functionality
    quizData.selectedProductKeys = selectedProducts;

    // Render products
    renderProducts(selectedProducts);
  }

  // Format price for display
  function formatPrice(price) {
    return (price / 100).toFixed(2);
  }

  // Render product cards
  function renderProducts(products) {
    const resultsContainer = document.getElementById('resultsProducts');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';

    products.forEach(productKey => {
      const product = quizData.products[productKey];
      
      if (!product || !product.id) {
        console.warn(`Product ${productKey} not configured`);
        return;
      }

      const productDiv = document.createElement('div');
      productDiv.className = 'result-product';
      
      // Build price display
      let priceHTML = `<p class="product-price">$${formatPrice(product.price)}</p>`;
      if (product.compareAtPrice && product.compareAtPrice > product.price) {
        priceHTML = `
          <p class="product-price">
            <span class="price-regular">$${formatPrice(product.price)}</span>
            <span class="price-compare">$${formatPrice(product.compareAtPrice)}</span>
          </p>
        `;
      }
      
      productDiv.innerHTML = `
        ${product.featuredImage ? `<img src="${product.featuredImage}" alt="${product.title}" class="product-image">` : ''}
        <h3>${product.title}</h3>
        <p class="product-description">Perfect for you based on your answers</p>
        ${priceHTML}
        <button class="add-to-cart" 
                data-variant="${product.variantId}" 
                data-handle="${product.handle}"
                data-url="${product.url}">
          Add to Cart
        </button>
      `;
      resultsContainer.appendChild(productDiv);
    });

    // Show "Add All to Cart" button if we have products
    const addAllBtn = document.getElementById('addAllToCart');
    if (addAllBtn && products.length > 0) {
      addAllBtn.style.display = 'block';
    }

    // Bind add to cart events
    bindAddToCartEvents();
  }

  // Bind add to cart button events
  function bindAddToCartEvents() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });
  }

  // Handle add to cart button click
  function handleAddToCart(e) {
    const button = e.currentTarget;
    const variantId = button.dataset.variant;
    const handle = button.dataset.handle;
    const url = button.dataset.url;
    
    if (variantId && variantId !== 'null') {
      addToCart([{ id: variantId, quantity: 1 }], button);
    } else if (handle) {
      // Fetch product data and add to cart
      fetchProductAndAddToCart(handle, button);
    } else if (url) {
      // Fallback: redirect to product page
      window.location.href = url;
    } else {
      console.error('No variant ID, handle, or URL provided');
    }
  }

  // Handle "Add All to Cart" button click
  function handleAddAllToCart(e) {
    const button = e.currentTarget;
    const cartItems = [];

    // Collect all variant IDs from selected products
    const promises = quizData.selectedProductKeys.map(productKey => {
      const product = quizData.products[productKey];
      
      if (product && product.variantId && product.variantId !== 'null') {
        // Variant ID is available
        return Promise.resolve({ id: product.variantId, quantity: 1 });
      } else if (product && product.handle) {
        // Fetch variant ID from handle
        return fetch(`/products/${product.handle}.json`)
          .then(response => response.json())
          .then(data => {
            const variantId = data.product.variants[0].id;
            return { id: variantId, quantity: 1 };
          })
          .catch(error => {
            console.error('Error fetching product data:', error);
            return null;
          });
      }
      return Promise.resolve(null);
    });

    Promise.all(promises).then(items => {
      const validItems = items.filter(item => item !== null);
      
      if (validItems.length > 0) {
        addToCart(validItems, button, true);
      } else {
        console.error('No valid items to add to cart');
      }
    });
  }

  // Fetch product data and add to cart
  function fetchProductAndAddToCart(handle, button) {
    fetch(`/products/${handle}.json`)
      .then(response => response.json())
      .then(data => {
        const variantId = data.product.variants[0].id;
        addToCart([{ id: variantId, quantity: 1 }], button);
      })
      .catch(error => {
        console.error('Error fetching product data:', error);
        button.textContent = 'Error';
        setTimeout(() => {
          button.textContent = 'Add to Cart';
        }, 2000);
      });
  }

  // Add product(s) to cart via AJAX
  function addToCart(items, button, isAddAll = false) {
    const originalText = button.textContent;
    button.textContent = isAddAll ? 'Adding Both...' : 'Adding...';
    button.disabled = true;

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: items,
        sections: ['cart-drawer', 'cart-icon-bubble']
      })
    })
    .then(response => response.json())
    .then(response => {
      console.log('Products added to cart successfully:', response);
      
      button.textContent = isAddAll ? 'Both Added!' : 'Added!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
      
      // Update cart drawer
      const cart = document.querySelector('cart-drawer');
      if (cart && typeof cart.renderContents === 'function') {
        console.log('Updating cart UI');
        cart.setActiveElement(document.activeElement);
        cart.renderContents(response);
      } else {
        console.log('Cart drawer element not found, fetching cart drawer');
        
        // Fetch the updated cart drawer markup
        const cartUrl = window.quizConfig?.cartRoutes?.cartUrl || '/cart';
        fetch(`${cartUrl}?section_id=cart-drawer`)
          .then(response => response.text())
          .then(responseText => {
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(responseText, 'text/html');
            
            // Replace the entire <cart-drawer> element
            const updatedCartDrawer = htmlDoc.querySelector('cart-drawer');
            const currentCartDrawer = document.querySelector('cart-drawer');
            
            if (updatedCartDrawer && currentCartDrawer) {
              currentCartDrawer.replaceWith(updatedCartDrawer);
              
              // Open the cart drawer if it has an open method
              if (typeof updatedCartDrawer.open === 'function') {
                updatedCartDrawer.open();
              }
            }
          })
          .catch(error => {
            console.error('Error updating cart drawer:', error);
          });
      }
      
      // Trigger cart update event for theme compatibility
      document.dispatchEvent(new CustomEvent('cart:updated'));
      
      // Update cart icon bubble if it exists
      if (response.sections && response.sections['cart-icon-bubble']) {
        const cartIconBubble = document.getElementById('cart-icon-bubble');
        if (cartIconBubble) {
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(response.sections['cart-icon-bubble'], 'text/html');
          const newBubble = htmlDoc.getElementById('cart-icon-bubble');
          if (newBubble) {
            cartIconBubble.innerHTML = newBubble.innerHTML;
          }
        }
      }
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      button.textContent = 'Try Again';
      button.disabled = false;
    });
  }

  // Initialize quiz when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();