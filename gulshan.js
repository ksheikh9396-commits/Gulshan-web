(function () {
    var nav = document.querySelector('.nav');
    var navToggle = document.querySelector('.nav-toggle');

    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
        var links = nav.querySelectorAll('.nav-links a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function () {
                nav.classList.remove('open');
            });
        }
    }

      function initLocationMap() {
        var query = document.body.getAttribute('data-map-query');
        if (!query) {
            return;
        }
        var encoded = encodeURIComponent(query);
        var mapFrame = document.getElementById('location-map');
        var addressEl = document.getElementById('location-address');
        var directionsLink = document.getElementById('directions-link');
        var openMapsLink = document.getElementById('open-maps-link');

        if (addressEl) {
            addressEl.textContent = query;
        }
        if (mapFrame) {
            mapFrame.src =
                'https://www.google.com/maps?q=' + encoded + '&hl=en&z=16&output=embed';
        }
        if (directionsLink) {
            directionsLink.href =
                'https://www.google.com/maps/dir/?api=1&destination=' + encoded;
        }
        if (openMapsLink) {
            openMapsLink.href =
                'https://www.google.com/maps/search/?api=1&query=' + encoded;
        }
    }

    initLocationMap();


    if (nav) {
        window.addEventListener(
            'scroll',
            function () {
                nav.classList.toggle('scrolled', window.scrollY > 40);
            },
            { passive: true }
        );
    }

    var cartDrawer = document.getElementById('cart-drawer');
    if (!cartDrawer) {
        return;
    }

    var cartOverlay = document.getElementById('cart-overlay');
    var cartTrigger = document.querySelector('.cart-trigger');
    var cartClose = document.getElementById('cart-close');
    var cartItemsEl = document.getElementById('cart-items');
    var cartEmpty = document.getElementById('cart-empty');
    var cartTotalEl = document.getElementById('cart-total');
    var cartCountEl = document.getElementById('cart-count');
    var checkoutForm = document.getElementById('checkout-form');
    var sizePicker = document.getElementById('cart-size-picker');
    var sizePickerDish = document.getElementById('cart-size-picker-dish');
    var smallPriceEl = document.getElementById('cart-small-price');
    var largePriceEl = document.getElementById('cart-large-price');
    var btnAddSmall = document.getElementById('cart-add-small');
    var btnAddLarge = document.getElementById('cart-add-large');
    var btnSizeCancel = document.getElementById('cart-size-cancel');

    var cart = [];
    var pendingSized = null;
    var DELIVERY_PACKAGING_FEE = 150;
    var cartSummary = document.getElementById('cart-summary');
    var cartSubtotalEl = document.getElementById('cart-subtotal');

    function formatKsh(amount) {
        return amount + '/=';
    }

    function getCartTotals() {
        var sub = 0;
        for (var t = 0; t < cart.length; t++) {
            sub += cart[t].price * cart[t].qty;
        }
        var delivery = cart.length ? DELIVERY_PACKAGING_FEE : 0;
        return { subtotal: sub, delivery: delivery, grand: sub + delivery };
    }

    function openCart() {
        cartDrawer.classList.add('open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        if (cartOverlay) {
            cartOverlay.classList.add('show');
        }
    }

    function closeCart() {
        cartDrawer.classList.remove('open');
        cartDrawer.setAttribute('aria-hidden', 'true');
        if (cartOverlay) {
            cartOverlay.classList.remove('show');
        }
        hideSizePicker();
    }

    function hideSizePicker() {
        pendingSized = null;
        if (sizePicker) {
            sizePicker.hidden = true;
        }
    }

    function showSizePicker(name, smallNum, largeNum) {
        pendingSized = { name: name, small: smallNum, large: largeNum };
        if (!sizePicker || !sizePickerDish || !smallPriceEl || !largePriceEl) {
            return;
        }
        sizePickerDish.textContent = name;
        smallPriceEl.textContent = formatKsh(smallNum);
        largePriceEl.textContent = formatKsh(largeNum);
        sizePicker.hidden = false;
    }

    function lineKey(item) {
        return item.name + '|' + (item.size || '');
    }

    function addOrIncrement(name, price, size) {
        var key = name + '|' + (size || '');
        for (var i = 0; i < cart.length; i++) {
            if (lineKey(cart[i]) === key) {
                cart[i].qty += 1;
                renderCart();
                return;
            }
        }
        cart.push({ name: name, price: price, size: size || null, qty: 1 });
        renderCart();
    }

    function renderCart() {
        cartItemsEl.innerHTML = '';
        var totalQty = 0;
        var sum = 0;

        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            totalQty += item.qty;
            sum += item.price * item.qty;

            var li = document.createElement('li');
            li.className = 'cart-item';
            var label = item.name + (item.size ? ' (' + item.size + ')' : '');
            var main = document.createElement('div');
            main.className = 'cart-item-main';
            var nameWrap = document.createElement('div');
            var nameEl = document.createElement('div');
            nameEl.className = 'cart-item-name';
            nameEl.textContent = label;
            nameWrap.appendChild(nameEl);
            var priceEl = document.createElement('span');
            priceEl.textContent = formatKsh(item.price);
            main.appendChild(nameWrap);
            main.appendChild(priceEl);

            var actions = document.createElement('div');
            actions.className = 'cart-item-actions';
            var minus = document.createElement('button');
            minus.type = 'button';
            minus.className = 'qty-btn';
            minus.setAttribute('aria-label', 'Decrease quantity');
            minus.textContent = '−';
            var qtySpan = document.createElement('span');
            qtySpan.textContent = String(item.qty);
            var plus = document.createElement('button');
            plus.type = 'button';
            plus.className = 'qty-btn';
            plus.setAttribute('aria-label', 'Increase quantity');
            plus.textContent = '+';
            var remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remove-btn';
            remove.textContent = 'Remove';

            minus.addEventListener(
                'click',
                (function (line) {
                    return function () {
                        line.qty -= 1;
                        if (line.qty < 1) {
                            var k = lineKey(line);
                            for (var r = 0; r < cart.length; r++) {
                                if (lineKey(cart[r]) === k) {
                                    cart.splice(r, 1);
                                    break;
                                }
                            }
                        }
                        renderCart();
                    };
                })(item)
            );
            plus.addEventListener(
                'click',
                (function (line) {
                    return function () {
                        line.qty += 1;
                        renderCart();
                    };
                })(item)
            );
            remove.addEventListener(
                'click',
                (function (line) {
                    return function () {
                        var k = lineKey(line);
                        for (var r = 0; r < cart.length; r++) {
                            if (lineKey(cart[r]) === k) {
                                cart.splice(r, 1);
                                break;
                            }
                        }
                        renderCart();
                    };
                })(item)
            );

            actions.appendChild(minus);
            actions.appendChild(qtySpan);
            actions.appendChild(plus);
            actions.appendChild(remove);

            li.appendChild(main);
            li.appendChild(actions);
            cartItemsEl.appendChild(li);
        }

        var totals = getCartTotals();
        if (cartSummary) {
            cartSummary.hidden = !cart.length;
        }
        if (cartSubtotalEl) {
            cartSubtotalEl.textContent = formatKsh(totals.subtotal);
        }
        cartTotalEl.textContent = formatKsh(totals.grand);
        cartCountEl.textContent = String(totalQty);
        cartEmpty.style.display = cart.length ? 'none' : 'block';
    }

    function onMenuItemActivate(row) {
        var name = row.getAttribute('data-name');
        if (!name) {
            return;
        }

        var priceStr = row.getAttribute('data-price');
        var smallStr = row.getAttribute('data-small');
        var largeStr = row.getAttribute('data-large');

        openCart();

        if (smallStr != null && largeStr != null && smallStr !== '' && largeStr !== '') {
            var s = parseFloat(smallStr, 10);
            var l = parseFloat(largeStr, 10);
            if (!isNaN(s) && !isNaN(l)) {
                showSizePicker(name, s, l);
                return;
            }
        }

        hideSizePicker();
        if (priceStr != null && priceStr !== '') {
            var p = parseFloat(priceStr, 10);
            if (!isNaN(p)) {
                addOrIncrement(name, p, null);
            }
        }
    }

    var selectable = document.querySelectorAll('.menu-list-item--selectable');
    for (var j = 0; j < selectable.length; j++) {
        (function (row) {
            row.addEventListener('click', function () {
                onMenuItemActivate(row);
            });
            row.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onMenuItemActivate(row);
                }
            });
        })(selectable[j]);
    }

    if (btnAddSmall) {
        btnAddSmall.addEventListener('click', function () {
            if (!pendingSized) {
                return;
            }
            addOrIncrement(pendingSized.name, pendingSized.small, 'Small');
            hideSizePicker();
        });
    }
    if (btnAddLarge) {
        btnAddLarge.addEventListener('click', function () {
            if (!pendingSized) {
                return;
            }
            addOrIncrement(pendingSized.name, pendingSized.large, 'Large');
            hideSizePicker();
        });
    }
    if (btnSizeCancel) {
        btnSizeCancel.addEventListener('click', function () {
            hideSizePicker();
        });
    }

    if (cartTrigger) {
        cartTrigger.addEventListener('click', function () {
            if (cartDrawer.classList.contains('open')) {
                closeCart();
            } else {
                openCart();
            }
        });
    }
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && cartDrawer.classList.contains('open')) {
            closeCart();
        }
    });

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!cart.length) {
                return;
            }
            var wa = document.body.getAttribute('data-whatsapp-number') || '';
            var customer = document.getElementById('customer-name');
            var address = document.getElementById('customer-address');
            var lines = ['Hello Gulshan, I would like to order:', ''];
            for (var c = 0; c < cart.length; c++) {
                var it = cart[c];
                var lbl = it.name + (it.size ? ' (' + it.size + ')' : '');
                lines.push('• ' + it.qty + '× ' + lbl + ' @ ' + formatKsh(it.price) + ' each');
            }
            var money = getCartTotals();
            lines.push('');
            lines.push('Food subtotal: ' + formatKsh(money.subtotal));
            lines.push('Packaging fee: ' + formatKsh(money.delivery));
            lines.push('Total due: ' + formatKsh(money.grand));
            lines.push('');
            lines.push('Name: ' + (customer && customer.value ? customer.value : ''));
            lines.push('Address: ' + (address && address.value ? address.value : ''));
            var text = lines.join('\n');
            var url = 'https://wa.me/' + wa.replace(/\D/g, '') + '?text=' + encodeURIComponent(text);
            window.open(url, '_blank');
        });
    }

    renderCart();
})();
