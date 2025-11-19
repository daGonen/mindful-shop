document.addEventListener('DOMContentLoaded', function() {
    var rightContainer = document.querySelector('.dCS_bb_right');
    if (!rightContainer) {
        console.error('dCS_bb_right element not found. Aborting bundle-builder.js execution.');
        return;
    }

    var bundle3Url = rightContainer.dataset.bundle3Url;
    var bundle6Url = rightContainer.dataset.bundle6Url;
    var bundleSize = 3;
    var selectedProducts = [];
    var actionBtn = document.getElementById('dCS_bb_action-btn');
    var baseImage = document.getElementById('dCS_bb_base-image');
    var overlay = document.querySelector('.dCS_bb_overlay');
    
    var productHandles = {
        'immune': 'immune',
        'vitality': 'vitality',
        'clarity': 'clarity',
        'unwind': 'unwind'
    };
    
    function isMobileView() {
        return window.innerWidth <= 768;
    }

    function getProductHandle(productTitle) {
        return productHandles[productTitle.toLowerCase()] || null;
    }

    function syncQuantitySelectors() {
        document.querySelectorAll('.quantity__input').forEach(input => {
            let productTitle = input.dataset.productTitle.toLowerCase();
            input.value = selectedProducts.filter(p => p === productTitle).length;
        });
    }

    function updateActionButton() {
        var remaining = bundleSize - selectedProducts.length;
        if (remaining > 0) {
            actionBtn.textContent = "Add " + remaining + " Product" + (remaining > 1 ? "s" : "");
        } else {
            actionBtn.textContent = "Add to Cart";
        }
    }

    function updateOverlay() {
        overlay.innerHTML = '';
        overlay.classList.toggle('grid-6', bundleSize === 6);
        
        // Force layout recalculation
        overlay.offsetHeight; 
        
        // Calculate how many rows we need based on bundle size
        const columns = 3;
        const rows = Math.ceil(bundleSize / columns);
        
        // For 6-pack, ensure we're properly setting the grid
        if (bundleSize === 6) {
            overlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        } else {
            overlay.style.gridTemplateRows = '';
        }
    
        selectedProducts.forEach((productTitle, index) => {
            let wrapper = document.createElement('div');
            wrapper.classList.add('bundle-product-wrapper');
            
            // Calculate proper grid position (1-based)
            const col = (index % columns) + 1;
            const row = Math.floor(index / columns) + 1;
            
            wrapper.style.gridColumn = col;
            wrapper.style.gridRow = row;
            wrapper.dataset.productTitle = productTitle;
            wrapper.dataset.position = index + 1;
            
            let img = document.createElement('img');
            img.classList.add('bundle-product-image');
            let productHandle = getProductHandle(productTitle);
            img.src = productHandle ? `/cdn/shop/files/${productHandle}_bundle.png` : '';
            
            let removeBtn = document.createElement('button');
            removeBtn.classList.add('bundle-product-remove');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function() {
                let index = selectedProducts.indexOf(productTitle);
                if (index > -1) {
                    selectedProducts.splice(index, 1);
                    updateOverlay();
                    updateActionButton();
                    syncQuantitySelectors();
                }
            });
            
            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            overlay.appendChild(wrapper);
        });
    
        syncQuantitySelectors();
    }

    function updateUIForViewport() {
        let isMobile = isMobileView();

        document.querySelectorAll('.dCS_bb_product-item .dCS_bb_add-to-bundle').forEach(button => {
            button.style.display = isMobile ? 'none' : 'inline-block';
        });
        
        document.querySelectorAll('.dCS_bb_product-item .quantity').forEach(qs => {
            qs.remove();
        });

        if (isMobile) {
            document.querySelectorAll('.dCS_bb_product-item').forEach(item => {
                let productTitle = item.querySelector('.dCS_bb_add-to-bundle')?.getAttribute('data-product-title');
                if (!productTitle) return;

                let quantityWrapper = document.createElement('div');
                quantityWrapper.classList.add('quantity');

                let decreaseBtn = document.createElement('button');
                decreaseBtn.classList.add('quantity__button');
                decreaseBtn.innerHTML = '-';

                let quantityInput = document.createElement('input');
                quantityInput.classList.add('quantity__input');
                quantityInput.type = 'number';
                quantityInput.value = selectedProducts.filter(p => p === productTitle.toLowerCase()).length;
                quantityInput.min = 0;
                quantityInput.dataset.productTitle = productTitle;

                let increaseBtn = document.createElement('button');
                increaseBtn.classList.add('quantity__button');
                increaseBtn.innerHTML = '+';

                quantityWrapper.appendChild(decreaseBtn);
                quantityWrapper.appendChild(quantityInput);
                quantityWrapper.appendChild(increaseBtn);
                let productContent = item.querySelector('.dCS_bb_product-content');
                if (productContent) {
                    productContent.appendChild(quantityWrapper); 
                }

                increaseBtn.addEventListener('click', function () {
                    if (selectedProducts.length < bundleSize) {
                        selectedProducts.push(productTitle.toLowerCase());
                        quantityInput.value = selectedProducts.filter(p => p === productTitle.toLowerCase()).length;
                        updateOverlay();
                        updateActionButton();
                        syncQuantitySelectors();
                    }
                });

                decreaseBtn.addEventListener('click', function () {
                    let index = selectedProducts.lastIndexOf(productTitle.toLowerCase());
                    if (index > -1) {
                        selectedProducts.splice(index, 1);
                        quantityInput.value = selectedProducts.filter(p => p === productTitle.toLowerCase()).length;
                        updateOverlay();
                        updateActionButton();
                        syncQuantitySelectors();
                    }
                });
            });
        }
        syncQuantitySelectors();
    }

    document.querySelectorAll('.dCS_bb_add-to-bundle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var productTitle = this.getAttribute('data-product-title').toLowerCase();
            if (selectedProducts.length < bundleSize) {
                selectedProducts.push(productTitle);
                updateOverlay();
                updateActionButton();
                syncQuantitySelectors();
            }
        });
    });

    document.querySelectorAll('input[name="dCS_bb_bundleSize"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            var previousSize = bundleSize;
            bundleSize = parseInt(this.value, 10);
            baseImage.src = (bundleSize === 3) ? bundle3Url : bundle6Url;
            overlay.classList.toggle('grid-6', bundleSize === 6);
            
            if (previousSize === 6 && bundleSize === 3 && selectedProducts.length > 3) {
                selectedProducts = selectedProducts.slice(0, 3);
            }
            
            updateOverlay();
            updateActionButton();
            syncQuantitySelectors();
        });
    });

    updateUIForViewport();
    window.addEventListener('resize', function() {
        updateUIForViewport();
    });
  
    // Handle "Add to Cart" button click
    actionBtn.addEventListener('click', function () {
      if (selectedProducts.length === bundleSize) {
        let cartItems = [];
    
        // Retrieve variant IDs dynamically for each product in the bundle
        const promises = selectedProducts.map((productTitle) => {
          const productHandle = productHandles[productTitle];
          return fetch(`/products/${productHandle}.json`)
            .then((response) => response.json())
            .then((data) => {
              const variantId = data.product.variants[0].id;
              // Aggregate duplicate items into a single object with increased quantity:
              const existingItem = cartItems.find((item) => item.id === variantId);
              if (existingItem) {
                existingItem.quantity += 1;
              } else {
                cartItems.push({ id: variantId, quantity: 1 });
              }
            })
            .catch((error) => console.error('Error fetching product data:', error));
        });
    
        // Once all variant IDs have been fetched, add items to the cart…
        Promise.all(promises).then(() => {
          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cartItems, sections: ['cart-drawer', 'cart-icon-bubble'] }),
          })
              .then(res => res.json())
              .then(response => {
              console.log('Products added to cart successfully.');
              console.log("Cart update response:", response);

              let cart = document.querySelector('cart-drawer');
              if (cart){
                console.log('Updating cart UI');
                cart.setActiveElement(document.activeElement);
                cart.renderContents(response);
              } else {
                console.warn('Cart UI element not found. Falling back to page refresh.');
                window.location.reload();
              }
              
              // Fetch the updated cart drawer markup
              fetch(`${routes.cart_url}?section_id=cart-drawer`)
                .then((response) => response.text())
                .then((responseText) => {
                  const parser = new DOMParser();
                  const htmlDoc = parser.parseFromString(responseText, 'text/html');
    
                  // Replace the entire <cart-drawer> element
                  const updatedCartDrawer = htmlDoc.querySelector('cart-drawer');
                  if (updatedCartDrawer) {
                    document.querySelector('cart-drawer').replaceWith(updatedCartDrawer);
                    if (typeof updatedCartDrawer.open === 'function') {
                      updatedCartDrawer.open();
                    }
                  }
                })
                .catch((error) =>
                  console.error('Error updating cart drawer:', error)
                );
            })
            .catch((error) =>
              console.error('Error adding to cart:', error)
            );
        });
      }
    });
});
