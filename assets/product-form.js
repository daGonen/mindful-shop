if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        
        // Check for selected addon products
        const addonCheckboxes = document.querySelectorAll('.addon-checkbox:checked');
        const hasAddons = addonCheckboxes.length > 0;
        
        if (hasAddons) {
          // Use multi-item add with addons
          this.addWithAddons(formData, addonCheckboxes);
        } else {
          // Use original single-item add
          this.addToCartOriginal(formData, config);
        }
      }

      addWithAddons(formData, addonCheckboxes) {
        const mainProductId = formData.get('id');
        const mainProductQuantity = parseInt(formData.get('quantity') || 1);
        
        // Build items array
        const items = [{
          id: mainProductId,
          quantity: mainProductQuantity
        }];
        
        // Add selected addons with same quantity as main product
        addonCheckboxes.forEach((checkbox) => {
          items.push({
            id: checkbox.dataset.variantId,
            quantity: mainProductQuantity
          });
        });
        
        // Get sections for cart update
        const sections = this.cart ? this.cart.getSectionsToRender().map((section) => section.id) : ['cart-drawer', 'cart-icon-bubble'];
        
        // Add all items to cart
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ 
            items: items,
            sections: sections
          })
        })
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            // Handle error
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: mainProductId,
              errors: response.errors || response.description,
              message: response.message,
            });
            this.handleErrorMessage(response.description);

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButtonText.classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          if (!this.error) {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'product-form',
              productVariantId: mainProductId,
              cartData: response,
            });
          }
          this.error = false;
          
          const quickAddModal = this.closest('quick-add-modal');
          if (quickAddModal) {
            document.body.addEventListener(
              'modalClosed',
              () => {
                setTimeout(() => {
                  console.log("Cart update response:", response);
                  this.cart.renderContents(response);
                });
              },
              { once: true }
            );
            quickAddModal.hide(true);
          } else {
            console.log("Cart update response:", response);
            
            // For addons, we need to fully refresh the cart drawer to avoid stale state
            // Fetch fresh cart data and update
            fetch(`${window.Shopify.routes.root}cart.js`)
              .then((res) => res.json())
              .then((cartData) => {
                // Create a properly formatted response for renderContents
                const formattedResponse = {
                  sections: response.sections,
                  items: response.items
                };
                
                // Update cart contents
                this.cart.renderContents(formattedResponse);
                
                // Open cart drawer (only once)
                if (this.cart && typeof this.cart.open === 'function') {
                  this.cart.open();
                }
              })
              .catch((error) => {
                console.error('Error fetching cart data:', error);
                // Fallback to standard render
                this.cart.renderContents(response);
              });
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading__spinner').classList.add('hidden');
        });
      }

      addToCartOriginal(formData, config) {
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    console.log("Cart update response:", response);
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              console.log("Cart update response:", response);
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}