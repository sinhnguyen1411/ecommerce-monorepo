// Biến khởi tạo
var timeOut_modalCart;
var viewout = true;
var check_show_modal = true;
var htmlQvApp = '',
    htmlCombo = "";
var dataItemsCombo = [];
var variantItem = [];
var checkIsCombo = true;
var freeShipMin = 300000;
var totalCartMin = 100000;
var percentFreeShip = "";
var imgCartNo = "//theme.hstatic.net/200000984102/1001341697/14/cart_banner_image.jpg?v=113";
const img_gift = 'https://shopfront-cdn.tekoapis.com/cart/gift-filled.png';
var $body = $('body');
var $site_cart = $('.js-sitenav-cart');

//Delay action
function delayTime(func, wait) {
    return function() {
        var that = this,
            args = [].slice(arguments);
        clearTimeout(func._throttleTimeout);
        func._throttleTimeout = setTimeout(function() {
            func.apply(that, args);
        }, wait);
    };
}

var HRT = {
    init: function() {
        var that = this;
        that.initViews();
        that.Main.init();
    },
    initViews: function() {
        var view = window.template,
            that = this;
        switch (view) {
            case 'index':
            case 'index.header-style-01':
            case 'index.header-style-02':
            case 'index.header-style-03':
                that.Index.init();
                that.Quickview.init();
                break;
            case 'collection':
                that.Collection.init();
                that.Quickview.init();
                break;
            case 'product':
            case 'product.style-01':
            case 'product.style-02':
            case 'product.style-03':
            case 'product.style-04':
            case 'product.ldp-product':
                that.Product.init();
                that.Quickview.init();
                break;
            case 'product.quickview':
                that.Quickview.init();
                break;
            case 'search':
                that.Quickview.init();
                break;
            case 'blog':
                break;
            case 'article':
                that.Article.init();
                break;
            case 'page.contact':
                break;
            case 'page':
            case 'page.about-01':
            case 'page.about-02':
            case 'page.about-03':
            case 'page.faqs':
                that.Page.init();
                break;
            case 'customers[order]':
                break;
            case 'cart':
                HRT.Cart.init();
                that.Quickview.init();
                break;
            case 'page.landing-page':
                that.Ldpage.init();
                that.Quickview.init();
                break;
            default:
        }
    }
}

HRT.All = {
    checkCart: function() {
        $.ajax({
            url: '/cart.js',
            type: 'GET',
            async: false,
            success: function(cart) {
                $('.count-holder .count').html(cart.item_count);
                cartGet = cart;
                if (cart.items.length > 0) {
                    cart.items.map((x, i) => {
                        $('.proloop-actions[data-vrid="' + x.variant_id + '"] .proloop-value').val(x.quantity);
                        $('.proloop-actions[data-vrid="' + x.variant_id + '"]').addClass('action-count');
                    });
                }
            }
        });
    },
    delayTime: function(func, wait) {
        return function() {
            var that = this,
                args = [].slice(arguments);
            clearTimeout(func._throttleTimeout);
            func._throttleTimeout = setTimeout(function() {
                func.apply(that, args);
            }, wait);
        };
    },
    notifyProduct: function($info) {
        var wait = setTimeout(function() {
            $.jGrowl($info, {
                life: 2000,
            });
        });
    },
    checkemail: function(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    boxAccount: function(type) {
        $('.site_account .site_account_panel_list .site_account_panel ').removeClass('is-selected');
        var newheight = $('.site_account .site_account_panel_list .site_account_panel#' + type).addClass('is-selected').height();
        if ($('.site_account_panel').hasClass('is-selected')) {
            $('.site_account_panel_list').css("height", newheight);
        }
    },
    getCartModal: function(check, data) {
        function processCart(cart, xHasyPrice) {
            if (cart) {
                jQuery('.count-holder .count').html(cart.item_count);
                jQuery('.toolbarCartClick .count').html(cart.item_count);
                //jQuery('.siteCart-mobile__header .p-count').html(cart.item_count + ' sản phẩm');
                if (cart.item_count == 0) {
                    jQuery('#exampleModalLabel').html('Giỏ hàng của bạn đang trống. Mời bạn tiếp tục mua hàng.');
                    jQuery('.header-action_cart #cart-view').html('<tbody><tr class="mini-cart__empty"><td><div class="svgico-mini-cart"> <svg width="81" height="70" viewBox="0 0 81 70"><g transform="translate(0 2)" stroke-width="4" fill="none" fill-rule="evenodd"><circle stroke-linecap="square" cx="34" cy="60" r="6"></circle><circle stroke-linecap="square" cx="67" cy="60" r="6"></circle><path d="M22.9360352 15h54.8070373l-4.3391876 30H30.3387146L19.6676025 0H.99560547"></path></g></svg></div> Hiện chưa có sản phẩm</td></tr></tbody>');
                    jQuery('#cart-view').html('<div class="mini-cart__empty"><div class="svgico-mini-cart"><img data-src="' + imgCartNo + '" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" class="lazyload" alt="Giỏ hàng của bạn đang trống"/><p>Chưa có sản phẩm trong giỏ hàng...</p><div class="action-link-empty"><a href="/collections/all" class="linkreturn">Trở về trang sản phẩm</a><a name="link-copuon" class="linkcoupon">Khuyến mãi dành cho bạn</a></div></div></div>');

                    jQuery('#cartform').hide();
                    jQuery('.sidebar-main').removeClass('is-show-right');
                    jQuery('.header-action_cart').removeClass('js-action-show');
                    jQuery('body').removeClass('locked-scroll');
                    jQuery('body').removeClass('mainBody-mbcart').removeClass('body-showcart');
                    jQuery('.sidebar-main').removeClass('is-show-right');
                    jQuery('.sidebar-main .sitenav-wrapper').removeClass('show');

                    jQuery('.sitenav-cart').addClass('cart-empty');
                    jQuery('.cart-shipping .cart-shipping__bar').addClass('d-none');
                } else {
                    //jQuery('#exampleModalLabel').html('Bạn có ' + cart.item_count + ' sản phẩm trong giỏ hàng.');
                    jQuery('body').addClass('mainBody-mbcart');
                    jQuery('#cartform').removeClass('d-none');
                    jQuery('.header-action_cart #cart-view').html('');
                    jQuery('#cart-view').html('');
                    jQuery('.sitenav-cart').removeClass('cart-empty');
                    jQuery('.cart-shipping .cart-shipping__bar').removeClass('d-none');
                }
                if (jQuery('#cart-pos-product').length > 0) {
                    jQuery('#cart-pos-product span').html(cart.item_count + ' sản phẩm');
                }
                //check link notify price total checkout
                if (totalCartMin >= cart.total_price / 100) {
                    jQuery('.cart-view-total .summary-alert').show();
                    jQuery('.cart-view-total .linktocheckout').addClass('disabled');
                } else {
                    jQuery('.cart-view-total .summary-alert').hide();
                    jQuery('.cart-view-total .linktocheckout').removeClass('disabled');
                }
                // check free ship
                if (cart.total_price / 100 >= freeShipMin) {
                    percentFreeShip = '100%';
                    jQuery('.cart-shipping .cart-shipping__title').html('Bạn đã được <span class="free-ship">miễn phí vận chuyển</span>')
                    jQuery('.cart-shipping .cart-shipping__bar .shipping-bar').css('width', percentFreeShip);
                    jQuery('.cart-shipping').addClass('cart-shipping-free');
                } else {
                    percentFreeShip = cart.total_price / freeShipMin;
                    jQuery('.cart-shipping .cart-shipping__title').html('Bạn cần mua thêm <span class="price">' + Haravan.formatMoney(freeShipMin * 100 - cart.total_price, formatMoney) + '</span> để được <span class="free-ship">miễn phí vận chuyển</span>');
                    jQuery('.cart-shipping .cart-shipping__bar .shipping-bar').css('width', percentFreeShip + '%');
                    jQuery('.cart-shipping').removeClass('cart-shipping-free');
                }

                // Get product for cart view
                jQuery.each(cart.items, function(i, item) {
                    HRT.All.clone_item(item, i, xHasyPrice);
                });

                jQuery('.header-action_cart #total-view-cart').html(Haravan.formatMoney(cart.total_price, formatMoney));
                jQuery('#total-view-cart').html(Haravan.formatMoney(cart.total_price, formatMoney));
                $('.linktocheckout').attr('href', '/checkout');
            } else {
                jQuery('#exampleModalLabel').html('Giỏ hàng của bạn đang trống. Mời bạn tiếp tục mua hàng.');
                if (jQuery('#cart-pos-product').length > 0) {
                    jQuery('#cart-pos-product span').html(cart.item_count + ' sản phẩm');
                }
                //jQuery('.siteCart-mobile__header .p-count').html(cart.item_count + ' sản phẩm');
                $('.header-action_cart #cart-view').html('<div class="mini-cart__empty"><div><div class="svgico-mini-cart"> <svg width="81" height="70" viewBox="0 0 81 70"><g transform="translate(0 2)" stroke-width="4" fill="none" fill-rule="evenodd"><circle stroke-linecap="square" cx="34" cy="60" r="6"></circle><circle stroke-linecap="square" cx="67" cy="60" r="6"></circle><path d="M22.9360352 15h54.8070373l-4.3391876 30H30.3387146L19.6676025 0H.99560547"></path></g></svg></div> Hiện chưa có sản phẩm</div></div>');
                $('#cart-view').html('<div class="mini-cart__empty"><div><div class="svgico-mini-cart"> <svg width="81" height="70" viewBox="0 0 81 70"><g transform="translate(0 2)" stroke-width="4" fill="none" fill-rule="evenodd"><circle stroke-linecap="square" cx="34" cy="60" r="6"></circle><circle stroke-linecap="square" cx="67" cy="60" r="6"></circle><path d="M22.9360352 15h54.8070373l-4.3391876 30H30.3387146L19.6676025 0H.99560547"></path></g></svg></div> Hiện chưa có sản phẩm</div></div>');
                jQuery('.sidebar-main').removeClass('is-show-right');
                jQuery('body').removeClass('mainBody-mbcart').removeClass('body-showcart');
            }
        }
        var cart = null;
        jQuery('#cartform').hide();
        jQuery('#myCart #exampleModalLabel').text("Giỏ hàng");
        if (data == undefined) {
            jQuery.getJSON('/cart.js', function(cart, textStatus) {
                cartGet = cart;
                var xHasyPrice = cart.items.filter(x => x.price == 0 && x.price_original > 0 && x.promotionref != null && x.promotionby.length > 0);
                if (xHasyPrice.length > 0) {
                    xHasyPrice = xHasyPrice.map((x, i) => {
                        return x.promotionby;
                    });
                }
                processCart(cart, xHasyPrice);
            });
        } else {
            var xHasyPrice = data.items.filter(x => x.price == 0 && x.price_original > 0 && x.promotionref != null && x.promotionby.length > 0);
            if (xHasyPrice.length > 0) {
                xHasyPrice = xHasyPrice.map((x, i) => {
                    return x.promotionby;
                });
            }
            processCart(data, xHasyPrice);
        }

        /*if(check != undefined && check == true && jQuery(window).width() > 992){
        	if(!$('.header-action_cart').hasClass('js-action-show')){
        		$('body').removeClass("locked-scroll");
        		$('.header-action').removeClass('js-action-show');
        	}
        	if($('#main-header').hasClass('hSticky')){
        		$('#main-header').addClass("hSticky-nav");
        		setTimeout(function(){
        			$('#main-header').addClass("hSticky-up");
        		}, 300);
        		setTimeout(function(){
        			$('.header-action_cart').addClass("js-action-show");
        			$('body').addClass("locked-scroll");
        		}, 500);
        	}
        	else{
        		$('.header-action_cart').addClass("js-action-show");
        		$('body').addClass("locked-scroll");
        		jQuery('html, body').animate({
        			scrollTop: 0			
        		}, 600);
        	}
        }*/
        if (check != undefined && check == true && jQuery(window).width() < 991) {
            HRT.All.sidenav_open($body, '#js-sitenav-cart', 'js-current')
        }
    },
    clone_item: function(product, i, xHasyPrice) {
        var item_product = jQuery('.sitenav-cart .table-clone-cart').find('.mini-cart__item').clone();
        if (xHasyPrice.length > 0) {
            xHasyPrice.map((x, i) => {
                if (x[0].variant_ids.length > 0 && x[0].variant_ids.includes(product.variant_id)) {
                    item_product.addClass('xSpecial');
                } else if (x[0].product_id == product.product_id) {
                    item_product.addClass('xSpecial');
                }
            });
        }

        item_product.attr('data-vid', product.variant_id).attr('data-pid', product.product_id);
        //var item_product = jQuery('#clone-item-cart').find('.mini-cart__item');
        if (product.image == null) {
            item_product.find('img').attr('src', '//theme.hstatic.net/200000984102/1001341697/14/no_image.jpg?v=113').attr('alt', product.url);
        } else {
            item_product.find('img').attr('src', Haravan.resizeImage(product.image, 'small')).attr('alt', product.url);
        }

        if (product.promotionby.length > 0) {
            item_product.find('.mini-cart__left .mnc-link').append('<span class="mnc-gift"><img src="' + img_gift + '" alt="icon quà tặng"></span>');
        }

        item_product.find('.mnc-link').attr('href', product.url).attr('title', product.url);
        item_product.find('.mini-cart__title .mnc-title').html(product.title);
        item_product.find('.mini-cart__quantity .qty-value').val(product.quantity).attr('data-vid', product.variant_id);
        item_product.find('.mini-cart__price .mnc-price').html(Haravan.formatMoney(product.price, formatMoney));
        if (product.price < product.price_original) {
            item_product.find('.mini-cart__price .mnc-ori-price').html(Haravan.formatMoney(product.price_original, formatMoney));
        }
        item_product.find('.mini-cart__remove').html('<a href="javascript:void(0);" onclick="HRT.All.deleteCart(' + (i + 1) + ',' + product.variant_id + ')" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"> <g><path d="M500,442.7L79.3,22.6C63.4,6.7,37.7,6.7,21.9,22.5C6.1,38.3,6.1,64,22,79.9L442.6,500L22,920.1C6,936,6.1,961.6,21.9,977.5c15.8,15.8,41.6,15.8,57.4-0.1L500,557.3l420.7,420.1c16,15.9,41.6,15.9,57.4,0.1c15.8-15.8,15.8-41.5-0.1-57.4L557.4,500L978,79.9c16-15.9,15.9-41.5,0.1-57.4c-15.8-15.8-41.6-15.8-57.4,0.1L500,442.7L500,442.7z"/></g> </svg></a>');
        var title = '';
        if (product.variant_options != null && product.variant_options.indexOf('Default Title') == -1) {
            $.each(product.variant_options, function(i, v) {
                title = title + v + ' / ';
            });
            title = title + '@@';
            title = title.replace(' / @@', '')
            item_product.find('.mnc-variant').html(title);
        } else {
            item_product.find('.mnc-variant').html('');
        }
        //item_product.clone().removeClass('d-none').prependTo('#cart-view');
        //if($(window).width()  992){
        $('#cart-view').append(item_product.removeClass('d-none'));
        //}
        //else{
        //$('.header-action_cart #cart-view').append(item_product.removeClass('d-none'));
        //}
        if ((product.price == 0 || product.promotionby.length > 0) && promotionApp) {
            item_product.find('button.qty-btn').hide();
            item_product.find('.qty-value').addClass('qty-value-app');
            item_product.find('.mini-cart__remove').hide();
        }
        if (product.promotionref != null && promotionApp && promotionApp_name == 'app_combo') {
            item_product.find('button.qty-btn').hide();
            item_product.find('.qty-value').addClass('qty-value-app');
        }
    },
    plusQuantity: function() {
        if (jQuery('input[name="quantity"]').val() != undefined) {
            var currentVal = parseInt(jQuery('input[name="quantity"]').val());
            if (!isNaN(currentVal)) {
                jQuery('input[name="quantity"]').val(currentVal + 1);
            } else {
                jQuery('input[name="quantity"]').val(1);
            }

        } else {
            console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
        }
    },
    minusQuantity: function() {
        if (jQuery('input[name="quantity"]').val() != undefined) {
            var currentVal = parseInt(jQuery('input[name="quantity"]').val());
            if (!isNaN(currentVal) && currentVal > 1) {
                jQuery('input[name="quantity"]').val(currentVal - 1);
            }
        } else {
            console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
        }
    },
    deleteCart: function(line, variant_id) {
        var params = {
            type: 'POST',
            url: '/cart/change.js',
            data: 'quantity=0&line=' + line,
            dataType: 'json',
            success: function(cart) {
                HRT.All.getCartModal(false);
                $('.proloop-actions[data-vrid="' + variant_id + '"] .proloop-value').val(0);
                $('.proloop-actions[data-vrid="' + variant_id + '"] .action-boxqty').addClass('d-none');
                $('.proloop-actions[data-vrid="' + variant_id + '"]').removeClass('action-count');
                setTimeout(function() {
                    $('.proloop-actions[data-vrid="' + variant_id + '"] .action-boxqty').removeClass('d-none');
                }, 500);
            },
            error: function(XMLHttpRequest, textStatus) {
                Haravan.onError(XMLHttpRequest, textStatus);
            }
        };
        jQuery.ajax(params);
    },
    addCartProdItem: function(id) {
        var prolink = $('.product-loop[data-id="' + id + '"] .proloop-image .proloop-link').attr('href');
        var proId = $('.product-loop[data-id="' + id + '"] .product-inner').attr('data-proid');
        var proTitle = $('.product-loop[data-id="' + id + '"] .proloop-detail h3 a').html();

        if (promotionApp && promotionApp_name != 'app_buy2get1') {
            if (!$('.product-loop[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none')) {
                //window.location.href = $('.product-loop[data-id="'+id+'"]').find('a').attr('href') || $('.prodloop-block[data-id="'+id+'"]').find('a').attr('href');
                HRT.Quickview.renderQuickview(prolink, proId, proTitle);
                setTimeout(function() {
                    $('.modal-quickview .product-promotion').show();
                }, 150);
            } else {
                var min_qty = 1;
                var variant_id = $(this).attr('data-variantid');
                $('.proloop-actions[data-vrid=' + id + '] .btn-proloop-cart').addClass('btnload');
                var params = {
                    type: 'POST',
                    url: '/cart/add.js',
                    async: true,
                    data: 'quantity=' + min_qty + '&id=' + id,
                    dataType: 'json',
                    success: function(line_item) {
                        //console.log(line_item)
                        if (template.indexOf('cart') > -1) {
                            var x = $('#layout-cart').offset().top;
                            window.scrollTo({
                                top: x,
                                behavior: 'smooth'
                            });
                            setTimeout(function() {
                                window.location.reload();
                            }, 300);
                        } else {
                            var image = '';
                            if (line_item['image'] == null) {
                                image = 'https://hstatic.net/0/0/global/noDefaultImage6.gif';
                            } else {
                                image = Haravan.resizeImage(line_item['image'], 'small');
                            }
                            var $info = '<div class="row"><div class="col-md-12 col-xs-12"><p class="jGowl-text">Đã thêm vào giỏ hàng thành công!</p></div><div class="col-md-4 col-xs-4"><a href="' + line_item['url'] + '"><img width="70px" src="' + image + '" alt="' + line_item['title'] + '"/></a></div><div class="col-md-8 col-xs-8"><div class="jGrowl-note"><a class="jGrowl-title" href="' + line_item['url'] + '">' + line_item['title'] + '</a><ins>' + Haravan.formatMoney(line_item['price'], formatMoney) + '</ins></div></div></div>';
                            HRT.All.notifyProduct($info);
                            $('.proloop-actions[data-vrid="' + id + '"] .proloop-value').val(line_item.quantity);
                            HRT.All.getCartModal(true);
                        }

                        setTimeout(function() {
                            $('.proloop-actions[data-vrid=' + id + ']').addClass('action-count');
                            $('.proloop-actions[data-vrid=' + id + '] .btn-proloop-cart').removeClass('btnload');
                        }, 400);
                    },
                    error: function(XMLHttpRequest, textStatus) {
                        Haravan.onError(XMLHttpRequest, textStatus);
                    }
                };
                if ($('.product-loop[data-id="' + id + '"] .add-to-cart').hasClass('btn-addcart-view')) {
                    HRT.Quickview.renderQuickview(prolink, proId, proTitle)
                } else {
                    jQuery.ajax(params);
                }
            }
        } else {
            var min_qty = 1;
            var variant_id = $(this).attr('data-variantid');
            $('.proloop-actions[data-vrid=' + id + '] .btn-proloop-cart').addClass('btnload');
            var params = {
                type: 'POST',
                url: '/cart/add.js',
                async: true,
                data: 'quantity=' + min_qty + '&id=' + id,
                dataType: 'json',
                success: function(line_item) {
                    //console.log(line_item)
                    if (template.indexOf('cart') > -1) {
                        var x = $('#layout-cart').offset().top;
                        window.scrollTo({
                            top: x,
                            behavior: 'smooth'
                        });
                        setTimeout(function() {
                            window.location.reload();
                        }, 300);
                    } else {
                        var image = '';
                        if (line_item['image'] == null) {
                            image = 'https://hstatic.net/0/0/global/noDefaultImage6.gif';
                        } else {
                            image = Haravan.resizeImage(line_item['image'], 'small');
                        }
                        var $info = '<div class="row"><div class="col-md-12 col-xs-12"><p class="jGowl-text">Đã thêm vào giỏ hàng thành công!</p></div><div class="col-md-4 col-xs-4"><a href="' + line_item['url'] + '"><img width="70px" src="' + image + '" alt="' + line_item['title'] + '"/></a></div><div class="col-md-8 col-xs-8"><div class="jGrowl-note"><a class="jGrowl-title" href="' + line_item['url'] + '">' + line_item['title'] + '</a><ins>' + Haravan.formatMoney(line_item['price'], formatMoney) + '</ins></div></div></div>';
                        HRT.All.notifyProduct($info);
                        $('.proloop-actions[data-vrid="' + id + '"] .proloop-value').val(line_item.quantity);
                        HRT.All.getCartModal(true);
                    }

                    setTimeout(function() {
                        $('.proloop-actions[data-vrid=' + id + ']').addClass('action-count');
                        $('.proloop-actions[data-vrid=' + id + '] .btn-proloop-cart').removeClass('btnload');
                    }, 400);
                },
                error: function(XMLHttpRequest, textStatus) {
                    Haravan.onError(XMLHttpRequest, textStatus);
                }
            };
            if ($('.product-loop[data-id="' + id + '"] .add-to-cart').hasClass('btn-addcart-view')) {
                HRT.Quickview.renderQuickview(prolink, proId, proTitle)
            } else {
                jQuery.ajax(params);
            }
        }
    },
    plusQtyProdItem: function(id) {
        if (promotionApp && promotionApp_name != 'app_buy2get1') {
            if (!$('.product-loop[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none') && !$('.product-inner[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none'))
                window.location.href = $('.product-loop[data-id="' + id + '"]').find('a.proloop-link').attr('href') || $('.product-inner[data-id="' + id + '"]').find('a.proloop-link').attr('href');
            else {
                if (jQuery('input[name="proloop-quantity"]').val() != undefined) {
                    var input = $('.proloop-actions[data-vrid=' + id + ']').find('.actions-boxqty input');
                    var currentVal = parseInt(input.val());
                    var newQty = 1;
                    if (!isNaN(currentVal)) {
                        input.val(currentVal + 1);
                        newQty = currentVal + 1;
                    } else {
                        input.val(1);
                    }
                    var params = {
                        type: 'POST',
                        url: '/cart/update.js',
                        async: true,
                        data: 'quantity=' + newQty + '&id=' + id,
                        dataType: 'json',
                        success: function(line_item) {
                            if (template.indexOf('cart') > -1) {
                                window.location.reload();
                            } else {
                                HRT.All.getCartModal(false);
                            }
                        },
                        error: function(XMLHttpRequest, textStatus) {
                            Haravan.onError(XMLHttpRequest, textStatus);
                        }
                    };
                    jQuery.ajax(params);
                } else {
                    console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
                }
            }
        } else {
            if (jQuery('input[name="proloop-quantity"]').val() != undefined) {
                var input = $('.proloop-actions[data-vrid=' + id + ']').find('.actions-boxqty input');
                var currentVal = parseInt(input.val());
                var newQty = 1;
                if (!isNaN(currentVal)) {
                    input.val(currentVal + 1);
                    newQty = currentVal + 1;
                } else {
                    input.val(1);
                }
                var params = {
                    type: 'POST',
                    url: '/cart/update.js',
                    async: true,
                    data: 'quantity=' + newQty + '&id=' + id,
                    dataType: 'json',
                    success: function(line_item) {
                        if (template.indexOf('cart') > -1) {
                            window.location.reload();
                        } else {
                            HRT.All.getCartModal(false);
                        }
                    },
                    error: function(XMLHttpRequest, textStatus) {
                        Haravan.onError(XMLHttpRequest, textStatus);
                    }
                };
                jQuery.ajax(params);
            } else {
                console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
            }
        }
    },
    minusQtyProdItem: function(id) {
        if (promotionApp && promotionApp_name != 'app_buy2get1') {
            if (!$('.product-loop[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none') && !$('.product-inner[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none'))
                window.location.href = $('.product-loop[data-id="' + id + '"]').find('a.proloop-link').attr('href') || $('.product-inner[data-id="' + id + '"]').find('a.proloop-link').attr('href');
            else {
                if (jQuery('input[name="proloop-quantity"]').val() != undefined) {
                    var input = $('.proloop-actions[data-vrid=' + id + ']').find('.actions-boxqty input');
                    var currentVal = parseInt(input.val());
                    var newQty = 1;
                    if (!isNaN(currentVal) && currentVal >= 1) {
                        input.val(currentVal - 1);
                        newQty = currentVal - 1;
                        var params = {
                            type: 'POST',
                            url: '/cart/update.js',
                            async: true,
                            data: 'quantity=' + newQty + '&id=' + id,
                            dataType: 'json',
                            success: function(line_item) {
                                if (template.indexOf('cart') > -1) {
                                    window.location.reload();
                                } else {
                                    HRT.All.getCartModal(false);
                                    if (newQty <= 0) {
                                        $('.proloop-actions[data-vrid="' + id + '"] .action-boxqty').addClass('d-none');
                                        $('.proloop-actions[data-vrid="' + id + '"]').removeClass('action-count');
                                        setTimeout(function() {
                                            $('.proloop-actions[data-vrid="' + id + '"] .action-boxqty').removeClass('d-none');
                                        }, 500);
                                    }
                                }
                            },
                            error: function(XMLHttpRequest, textStatus) {
                                Haravan.onError(XMLHttpRequest, textStatus);
                            }
                        };
                        jQuery.ajax(params);
                    }
                } else {
                    console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
                }
            }
        } else {
            if (jQuery('input[name="proloop-quantity"]').val() != undefined) {
                var input = $('.proloop-actions[data-vrid=' + id + ']').find('.actions-boxqty input');
                var currentVal = parseInt(input.val());
                var newQty = 1;
                if (!isNaN(currentVal) && currentVal >= 1) {
                    input.val(currentVal - 1);
                    newQty = currentVal - 1;
                    var params = {
                        type: 'POST',
                        url: '/cart/update.js',
                        async: true,
                        data: 'quantity=' + newQty + '&id=' + id,
                        dataType: 'json',
                        success: function(line_item) {
                            if (template.indexOf('cart') > -1) {
                                window.location.reload();
                            } else {
                                HRT.All.getCartModal(false);
                                if (newQty <= 0) {
                                    $('.proloop-actions[data-vrid="' + id + '"] .action-boxqty').addClass('d-none');
                                    $('.proloop-actions[data-vrid="' + id + '"]').removeClass('action-count');
                                    setTimeout(function() {
                                        $('.proloop-actions[data-vrid="' + id + '"] .action-boxqty').removeClass('d-none');
                                    }, 500);
                                }
                            }
                        },
                        error: function(XMLHttpRequest, textStatus) {
                            Haravan.onError(XMLHttpRequest, textStatus);
                        }
                    };
                    jQuery.ajax(params);
                }
            } else {
                console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
            }
        }
    },
    showFormPreoder: function(id) {
        var prolink = $('.product-loop[data-id="' + id + '"] .proloop-image .proloop-link').attr('href');
        var proId = $('.product-loop[data-id="' + id + '"] .product-inner').attr('data-proid');
        var proTitle = $('.product-loop[data-id="' + id + '"] .proloop-detail h3 a').html();
        var preorderQv = true;
        //if(promotionApp && promotionApp_name != 'app_buy2get1'){
        HRT.Quickview.renderQuickview(prolink, proId, proTitle, preorderQv);
        if (!$('.product-loop[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none')) {
            setTimeout(function() {
                $('.modal-quickview .product-promotion').show();
            }, 150);
        }
        //}
    },
    sidenav_close: function(e) {
        $('.js-act-sitenav[data-id]').removeClass(e);
        $('.sidebar-main .sitenav-wrapper').removeClass('is-opened');
        $('.header-action-item').removeClass('js-action-show');
        $body.removeClass('locked-scroll');
    },
    sidenav_open: function(_this, _obj, _e) {
        _this.addClass(_e);
        $body.addClass('locked-scroll');
        $(_obj).addClass('is-opened');

        if ($('.ajax-render-mainmenu').parents(_obj).hasClass('is-opened') && $('.js-ajax-menu .menuList-links').length == 0) {
            $.ajax({
                url: '/index?view=load-menu',
                success: function(data) {
                    $('.ajax-render-mainmenu').append(data);
                }
            });
        } else if ($('.ajax-render-notify').parents(_obj).hasClass('is-opened') && $('.js-ajax-notify .list-notify').length == 0) {
            $.ajax({
                url: '/index?view=load-notify',
                success: function(data) {
                    $('.ajax-render-notify').append(data);
                }
            });

        }

        if ($('.addThis_listSharing').hasClass('active')) {
            $('.addThis_listSharing').removeClass('active');
            $('.addThis_listSharing').fadeOut(150);
        }
    }
}

HRT.Main = {
    init: function() {
        var that = this;
        that.topbarBannerHide();
        that.countNotifyItem();
        that.clickIconsHeader();
        that.clickIconsSearch();
        that.clickIconsContact();
        that.searchAutoHeader();
        that.scrollFixedHeader();
        that.updateMiniCart();
        that.boxAcountHeader();
        that.formAccountHeader();
        that.toggleFooter();
        that.newsletterForm();
        that.addThisIconShare();
        that.copyCodeProdCoupon();
        that.popoverCoupon();
        that.showModalCouponAjax();
        that.slideCouponModal();
        that.menuSidebar();
        that.copylinkProd();
        that.inventoryLocation();
        that.clickActSiteNav();
    },
    topbarBannerHide: function() {
        $('.topbar-banner .close-icon').click(function() {
            $('.topbar-banner').hide();
        });
    },
    countNotifyItem: function() {
        var countNotify = $('.notify-container .article-item').length;
        $('.topbar .noti-numb').text(countNotify);
        $('.toolbar-notify .count').text(countNotify);
    },
    clickIconsHeader: function() {
        $('.header-action_clicked').click(function(e) {
            e.preventDefault();
            if ($(this).parents('.header-action-item').hasClass('js-action-show')) {
                $('body').removeClass('locked-scroll');
                $(this).parents('.header-action-item').removeClass('js-action-show');
            } else {
                $('body').removeClass("locked-scroll-menu");
                $('.header-action-item').removeClass('js-action-show');
                $('body').addClass('locked-scroll');
                $(this).parents('.header-action-item').addClass('js-action-show');
            }
        });
        $('body').on('click', '#sitenav-overlay', function(e) {
            $('body').removeClass('locked-scroll');
            $('.header-action-item').removeClass('js-action-show');
            $('.sidebar-search .overlay').remove();
        });
        $('body').on('click', '#sitenav-overlay,.sitenav-content .btnclose', function(e) {
            $('body').removeClass('locked-scroll').removeClass("locked-scroll-menu");
            $('.header-action-item').removeClass('js-action-show');
            $('body .overlay').remove();
        });
    },
    clickIconsSearch: function() {
        $('.activeSearchChecked').click(function() {
            $('body').addClass('locked-scroll');
            $('.header-action-item').removeClass('js-action-show');
            $('.sidebar-search').addClass('show');
            $("#inputSearchAuto").trigger("focus");
            $('.sidebar-search').append('<div class="overlay"></div>');
        });
        $('body').on('click', '.sidebar-search .overlay, .sidebar-search .btn-close-search', function(e) {
            $('body').removeClass('locked-scroll');
            $('.sidebar-search').removeClass('show');
            $('.sidebar-search .overlay').remove();
        });
    },
    clickIconsContact: function() {
        $('.toolbarContactClick').click(function() {
            if ($('.addThis_listSharing').hasClass('active')) {
                $('.addThis_listSharing').removeClass('active');
                $('.addThis_listSharing').fadeOut(150);
            } else {
                $('body').addClass('locked-scroll');
                $('.addThis_listSharing').fadeIn(100);
                $('.addThis_listSharing').addClass('active');
            }
        });
    },
    clickActSiteNav: function() {
        var classActive = 'js-current';
        $('.js-act-sitenav[data-id]').on('click', function(e) {
            var _this = $(this),
                _obj = _this.data('id');
            if (!$(_obj).length) return;
            e.preventDefault();
            if (_this.hasClass(classActive)) {
                HRT.All.sidenav_close(classActive);
            } else {
                HRT.All.sidenav_close(classActive);
                HRT.All.sidenav_open(_this, _obj, classActive)
            }
        });
        $('.sitenav-mask, .btn-sitenav-close').on('click', function(e) {
            HRT.All.sidenav_close(classActive);
        });
    },
    searchAutoHeader: function() {
        $('.ultimate-search').submit(function(e) {
            e.preventDefault();
            var q = $(this).find('input[name=q]').val();
            if (q.indexOf('script') > -1 || q.indexOf('>') > -1) {
                alert('Từ khóa của bạn có chứa mã độc hại ! Vui lòng nhập lại từ khóa khác');
                $(this).find('input[name=q]').val('');
            } else {
                var q_follow = 'product';
                var query = encodeURIComponent(q);
                if (!q) {
                    window.location = '/search?type=' + q_follow + '&q=';
                    return;
                } else {
                    window.location = '/search?type=' + q_follow + '&q=' + query;
                    return;
                }
            }
        });
        var $input = $('.ultimate-search input[type="text"]');
        $input.bind('keyup change paste propertychange', delayTime(function() {
            var key = $(this).val(),
                $parent = $(this).parents('.wpo-wrapper-search'),
                $results = $(this).parents('.wpo-wrapper-search').find('.smart-search-wrapper');
            if (key.indexOf('script') > -1 || key.indexOf('>') > -1) {
                alert('Từ khóa của bạn có chứa mã độc hại! Vui lòng nhập lại từ khóa khác');
                $(this).val('');
                $('.ultimate-search input[type="text"]').val('');
            } else {
                if (key.length > 0) {
                    $(this).attr('data-history', key);
                    $('.ultimate-search input[type="text"]').val($(this).val());
                    var q_follow = 'product',
                        str = '';
                    str = '/search?type=product&q=' + key + '&view=ultimate-product';
                    $.ajax({
                        url: str,
                        type: 'GET',
                        async: true,
                        success: function(data) {
                            $results.find('.resultsContent').html(data).addClass('resultsdata');
                        }
                    })
                    if (!$('.header-action_search').hasClass('js-action-show')) {
                        $('body').removeClass("locked-scroll");
                        $('.header-action-item').removeClass('js-action-show');
                    }
                    $(".ultimate-search").addClass("expanded");
                    $results.fadeIn();
                } else {
                    $('.ultimate-search input[type="text"]').val($(this).val());
                    $(".ultimate-search").removeClass("expanded");
                    if ($('.search-suggest').length > 0) {
                        $results.fadeIn();
                        $results.find('.resultsContent').html('').removeClass('resultsdata');
                    } else {
                        $results.find('.resultsContent').html('');
                        $results.fadeOut();
                    }
                }
            }
        }, 500));
        $('body').click(function(evt) {
            var target = evt.target;
            if (target.id !== 'ajaxSearchResults' && target.id !== 'inputSearchAuto') {
                //$("#ajaxSearchResults").hide();		
            }
            if (target.id !== 'ajaxSearchResults-mb' && target.id !== 'inputSearchAuto-mb') {
                //$("#ajaxSearchResults-mb").hide();
            }
            if (target.id !== 'ajaxSearchResults-3' && target.id !== 'inputSearchAuto-3') {
                $("#ajaxSearchResults-3").hide();
                $(".ajaxSearchResults").find('.search-suggest').removeClass('show-suggest');
            }
        });
        $('body').on('click', '.ultimate-search #inputSearchAuto-3', function() {
            if ($('.search-suggest').length > 0) {
                $("#ajaxSearchResults-3").show();
                $(".ajaxSearchResults").find('.search-suggest').addClass('show-suggest');
            } else {
                if ($(this).is(":focus")) {
                    if ($(this).val() != '') {
                        $(".ajaxSearchResults").show();
                    }
                }
            }
        })
        $('body').on('click', '.ultimate-search .search-close', function(e) {
            e.preventDefault();
            $(".ajaxSearchResults").hide();
            $(".ultimate-search").removeClass("expanded");
            $(".ultimate-search").find('input[name=q]').val('');
        })
    },
    scrollFixedHeader: function() {
        var $parentHeader = $('.mainHeader--height');
        var parentHeight = $parentHeader.find('#main-header').outerHeight();
        var $header = $('#main-header');
        var offset_sticky_header = $header.outerHeight() + 100;
        var offset_sticky_down = 0;
        $parentHeader.css('min-height', parentHeight);
        var resizeTimer = false,
            resizeWindow = $(window).prop("innerWidth");
        $(window).on("resize", function() {
            if (resizeTimer) {
                clearTimeout(resizeTimer)
            }
            resizeTimer = setTimeout(function() {
                var newWidth = $(window).prop("innerWidth");
                if (resizeWindow != newWidth) {
                    $header.removeClass('hSticky-up').removeClass('hSticky-nav').removeClass('hSticky');
                    $parentHeader.css('min-height', '');
                    resizeTimer = setTimeout(function() {
                        parentHeight = $parentHeader.find('#main-header').outerHeight();
                        $parentHeader.css('min-height', parentHeight);
                    }, 50);
                    resizeWindow = newWidth;
                }
            }, 200)
        });
        setTimeout(function() {
            $parentHeader.css('min-height', '');
            parentHeight = $parentHeader.find('#main-header').outerHeight();
            $parentHeader.css('min-height', parentHeight);
            $(window).scroll(function() {
                if ($(window).scrollTop() > offset_sticky_header && $(window).scrollTop() > offset_sticky_down) {
                    if ($(window).width() > 991) {
                        $('body').removeClass('locked-scroll');
                        $('.header-action-item').removeClass('js-action-show');
                    }
                    $header.addClass('hSticky');
                    if ($(window).scrollTop() > offset_sticky_header + 150) {
                        $header.removeClass('hSticky-up').addClass('hSticky-nav');
                        $('body').removeClass('scroll-body-up');
                    };
                } else {
                    if ($(window).scrollTop() > offset_sticky_header + 100 && ($(window).scrollTop() + 450) + $(window).height() < $(document).height()) {
                        $header.addClass('hSticky-up');
                        $('body').addClass('scroll-body-up');
                    }
                }
                if ($(window).scrollTop() <= offset_sticky_down && $(window).scrollTop() <= offset_sticky_header) {
                    $header.removeClass('hSticky-up').removeClass('hSticky-nav');
                    $('body').removeClass('scroll-body-up');
                    if ($(window).scrollTop() <= offset_sticky_header - 100) {
                        $header.removeClass('hSticky');
                    }
                }
                offset_sticky_down = $(window).scrollTop();
            });
        }, 300)
    },
    inventoryLocation: function() {
        if ($('.header-action_locate').length > 0) {
            if (localStorage.my_location != null && localStorage.my_location != undefined) {
                $('.locationContainer .header-action_dropdown .chooseLocation span').text(localStorage.my_location);
                $('.locationContainer .header-action_dropdown .chooseLocation span').attr('data-id', localStorage.location_id);
                $('.locationContainer .header-action__link .shiptoHere').html('<span class="txt-overflow">' + localStorage.my_location + '</span>');
                if (cartGet != null && cartGet.location_id == null) {
                    $.post('/location.js?locationId=' + localStorage.location_id).done(function(data) {
                        if (data.error == false) {
                            window.location.reload();
                        }
                    });
                }
            } else {
                var txtAddress = $('.locationContainer .header-action_dropdown .chooseLocation span').text();
                var idAddress = $('.locationContainer .header-action_dropdown .chooseLocation span').data('id');
                var provinceAddress = $('.locationContainer .header-action_dropdown .chooseLocation span').data('province');

                $('.locationContainer .header-action__link .shiptoHere').html('<span class="txt-overflow">' + txtAddress + '</span>');

                if (locationHeader) {
                    $('body').addClass('location-noscroll');
                    $('.header-action_locate .header-action_text').addClass('overlays');
                    setTimeout(function() {
                        $('#site-locate-handle').trigger('click');
                    }, 600)
                } else {
                    localStorage.my_location = txtAddress;
                    localStorage.location_id = idAddress;
                    localStorage.location_province = provinceAddress;

                    $.post('/location.js?locationId=' + localStorage.location_id).done(function(data) {
                        if (data.error == false) {
                            window.location.reload();
                        }
                    });

                }
            }
        }
        $(document).on('click', '.listprov li,.location-stores .listshop li', function() {
            var mylocation = $(this).text(),
                mylocation_id = $(this).data('id'),
                mylocation_province = $(this).data('province');
            localStorage.my_location = mylocation;
            localStorage.location_id = mylocation_id;
            localStorage.location_province = mylocation_province;
            $('.header-action_locate .header-action_text').removeClass('overlays');
            $('body').removeClass('location-noscroll');
            $('.locationContainer .header-action_dropdown .chooseLocation span').text(mylocation);
            $('.locationContainer .header-action_dropdown .chooseLocation span').attr('data-id', mylocation_id);
            $('.locationContainer .header-action_dropdown .chooseLocation span').attr('data-province', mylocation_province);
            $('.locationContainer .header-action__link .shiptoHere').removeClass('hidden').html('<span class="txt-overflow">' + mylocation + '</span>');
            $('#site-locate-handle').trigger('click');
            $.post('/location.js?locationId=' + localStorage.location_id).done(function(data) {
                if (data.error == false) {
                    window.location.reload();
                }
            });
        });
        if ($(".sitenav-locate .boxfilter").length > 0) {
            var option_province = '<option value="null">- Chọn Tỉnh/Thành -</option>';
            var option_district = '<option value="null">- Chọn Quận/Huyện -</option>';
            $.each(newStore, function(i, v) {
                option_province += '<option value="' + i + '">' + i + '</option>';
            });
            $('.filter-province').html(option_province);
            $('.filter-district').html(option_district);
            $('.filter-province').change(function() {
                var province = $(this).val();
                var option_province_new = '<option value="null">- Chọn Quận/Huyện -</option>';
                if (province != "null" && province != '') {
                    $('.listprov li[data-province!="' + province + '"]').hide();
                    $('.listprov li[data-province="' + province + '"]').show();
                    //localStorage.setItem('location_province',province);		
                    if (newStore[province]) {
                        $.each(newStore[province], function(i, v) {
                            option_province_new += '<option value="' + i + '">' + i + '</option>';
                        });
                        $('.filter-district').html(option_province_new);
                    }
                } else {
                    $('.listprov li').show();
                }
            });
            $('.filter-district').change(function() {
                var district = $(this).val();
                var province = $('.filter-province').val();
                if (district != "null" && district != '') {
                    //localStorage.setItem('location_district',province);
                    $('.listprov li[data-district!="' + district + '"]').hide();
                    $('.listprov li[data-district="' + district + '"]').show();
                } else {
                    if (province != "null" && province != '') {
                        $('.listprov li[data-province!="' + province + '"]').hide();
                        $('.listprov li[data-province="' + province + '"]').show();
                    } else {
                        $('.listprov li').show();
                    }
                }
            });
            if (localStorage.location_province != null && localStorage.location_province != undefined) {
                $('.filter-province').val(localStorage.location_province).change();
            }
        }
    },
    updateMiniCart: function() {
        $(document).on('click', '.mini-cart__quantity .mnc-plus', function(e) {
            e.preventDefault();
            var line = $(this).parents('.mini-cart__item').index() + 1;
            var currentQty = parseInt($(this).parents('.mini-cart__item').find('input').val());
            var newQty = currentQty + 1;
            $(this).parents('.mini-cart__item').find('input').val(newQty);
        });

        $(document).on('click', '.mini-cart__quantity .mnc-minus', function(e) {
            e.preventDefault();
            var line = $(this).parents('.mini-cart__item').index() + 1;
            var currentQty = parseInt($(this).parents('.mini-cart__item').find('input').val());
            if (currentQty > 1) {
                var newQty = currentQty - 1;
                $(this).parents('.mini-cart__item').find('input').val(newQty);
            }
        });

        $(document).on('click', '.mini-cart__quantity .mnc-plus', HRT.All.delayTime(function() {
            //debugger
            var line = $(this).parents('.mini-cart__item').index() + 1;
            var vId = $(this).parents('.mini-cart__item').find('input').attr('data-vid');
            var pId = $(this).parents('.mini-cart__item').attr('data-pid');
            var currentQty = parseInt($(this).parents('.mini-cart__item').find('input').val());
            var updates = [];
            var qtyGift = 0;
            var updateNormal = true;
            if (promotionApp) {
                if (promotionApp_name == 'app_buyxgety') {
                    updateNormal = false;
                    var old_promotion_variant_id = buyXgetY.getPromotionStorage(vId);
                    if (old_promotion_variant_id !== undefined) {

                        var gOSP = 0, //Gift other but same main product 
                            gOPR = 0, //Gift priority but same main product
                            gCurrent = null;

                        var giftExistInCart = true,
                            qtyGiftNotInCart = 0;
                        if (old_promotion_variant_id != undefined) {
                            $.each(old_promotion_variant_id, function(vIdGift, infoGift) {

                                var filterGiftInCart = cartGet.items.filter(x => x.variant_id == vIdGift && x.promotionby.length > 0 && x.promotionby[0].product_id == pId);
                                if (infoGift.priority == false && filterGiftInCart.length > 0) {
                                    gOSP += filterGiftInCart[0].quantity;
                                }

                                if (infoGift.priority == true) {
                                    if (filterGiftInCart.length > 0) {
                                        gOPR += filterGiftInCart[0].quantity;
                                    } else {
                                        giftExistInCart = false;
                                    }
                                    gCurrent = infoGift;
                                    gCurrent.vId = vIdGift;
                                }
                            });

                            if (giftExistInCart == false) {
                                qtyGift = (currentQty - gOSP) / gCurrent.count_buy * gCurrent.count_gift;
                            }
                        }

                        cartGet.items.map((item, index) => {
                            if (item.variant_id == vId) {
                                updates[index] = currentQty;
                            } else {
                                if (item.promotionby.length > 0 && item.promotionby[0].product_id == pId) {
                                    if (gCurrent != null) {
                                        if (gCurrent.priority == true && gCurrent.vId == item.variant_id) {
                                            var haohut = currentQty - (gOSP + gOPR);
                                            qtyGift = (item.quantity + haohut) / gCurrent.count_buy * gCurrent.count_gift;
                                            updates[index] = qtyGift;
                                        } else {
                                            updates[index] = item.quantity;
                                        }
                                    }
                                } else {
                                    updates[index] = item.quantity;
                                }
                            }
                        });

                        var params = {
                            type: 'POST',
                            url: '/cart/update.js',
                            data: {
                                'updates[]': updates
                            },
                            async: false,
                            dataType: 'json',
                            success: function(data) {
                                cartItem = {};
                                cartGet = data;
                                for (i = 0; i < data.items.length; i++) {
                                    var id = data.items[i].variant_id;
                                    cartItem[data.items[i].variant_id] = data.items[i].quantity;
                                    $('.mini-cart__item input[data-vid="' + id + '"]').val(data.items[i].quantity);
                                    $('.proloop-actions[data-vrid="' + id + '"]').find('.proloop-boxqty input').val(data.items[i].quantity);
                                    $('.proloop-actions[data-vrid="' + id + '"] .proloop-value').val(data.items[i].quantity);
                                }

                                if (giftExistInCart) {
                                    HRT.All.getCartModal(false);
                                } else {
                                    if (gCurrent.vId == 'not_gift') {
                                        HRT.All.getCartModal(false);
                                    } else {
                                        $.post('/cart/add.js', 'id=' + gCurrent.vId + '&quantity=' + qtyGift).done(function() {
                                            HRT.All.getCartModal(false);

                                            /*
									var total_price = Haravan.formatMoney(data.total_price,formatMoney);
									$('#total-view-cart,.boxinfo.p-price,.mnc-total-price').html(total_price);
									$('.count-holder .count').html(data.item_count);
									$('.boxinfo.p-count').html(data.item_count + ' sản phẩm');
									*/
                                        });
                                    }
                                }
                            },
                            error: function(XMLHttpRequest, textStatus) {
                                Haravan.onError(XMLHttpRequest, textStatus);
                            }
                        };
                        jQuery.ajax(params);
                    } else {
                        var params = {
                            type: 'POST',
                            url: '/cart/change.js',
                            data: 'quantity=' + currentQty + '&line=' + line,
                            async: false,
                            dataType: 'json',
                            success: function(data) {
                                cartItem = {};
                                cartGet = data;
                                for (i = 0; i < data.items.length; i++) {
                                    var id = data.items[i].variant_id;
                                    cartItem[data.items[i].variant_id] = data.items[i].quantity;
                                    $('.mini-cart__item input[data-vid="' + id + '"]').val(data.items[i].quantity);
                                    $('.proloop-actions[data-vrid="' + id + '"]').find('.proloop-boxqty input').val(data.items[i].quantity);
                                }

                                HRT.All.getCartModal(false);
                            },
                            error: function(XMLHttpRequest, textStatus) {
                                Haravan.onError(XMLHttpRequest, textStatus);
                            }
                        };
                        jQuery.ajax(params);
                    }
                }
            }
            if (updateNormal) {
                var params = {
                    type: 'POST',
                    url: '/cart/change.js',
                    data: 'quantity=' + currentQty + '&line=' + line,
                    async: false,
                    dataType: 'json',
                    success: function(data) {
                        cartItem = {};
                        cartGet = data;
                        for (i = 0; i < data.items.length; i++) {
                            var id = data.items[i].variant_id;
                            cartItem[data.items[i].variant_id] = data.items[i].quantity;
                            $('.mini-cart__item input[data-vid="' + id + '"]').val(data.items[i].quantity);
                            $('.proloop-actions[data-vrid="' + id + '"]').find('.proloop-boxqty input').val(data.items[i].quantity);
                            $('.proloop-actions[data-vrid="' + id + '"] .proloop-value').val(data.items[i].quantity);
                        }
                        HRT.All.getCartModal(false);
                        var total_price = Haravan.formatMoney(data.total_price, formatMoney);
                        $('#total-view-cart,.boxinfo.p-price,.mnc-total-price').html(total_price);
                        $('.count-holder .count').html(data.item_count);
                        $('.boxinfo.p-count').html(data.item_count + ' sản phẩm');
                    },
                    error: function(XMLHttpRequest, textStatus) {
                        Haravan.onError(XMLHttpRequest, textStatus);
                    }
                };
                jQuery.ajax(params);
            }
        }, 300));

        $(document).on('click', '.mini-cart__quantity .mnc-minus', HRT.All.delayTime(function() {
            //var isXhasSpecialY = $(this).parents('.mini-cart__item').hasClass('xSpecial');
            var updates = [];
            var line = $(this).parents('.mini-cart__item').index() + 1;
            var vId = $(this).parents('.mini-cart__item').find('input').attr('data-vid');
            var pId = $(this).parents('.mini-cart__item').attr('data-pid');
            var currentQty = parseInt($(this).parents('.mini-cart__item').find('input').val());
            if (currentQty > 0) {
                var updateNormal = true;
                if (promotionApp) {
                    if (promotionApp_name == 'app_buyxgety') {
                        updateNormal = false;
                        var old_promotion_variant_id = buyXgetY.getPromotionStorage(vId);
                        if (old_promotion_variant_id !== undefined) {

                            var gOSP = 0, //Gift other but same main product 
                                gOPR = 0, //Gift priority but same main product
                                gCurrent = null;

                            if (old_promotion_variant_id != undefined) {
                                $.each(old_promotion_variant_id, function(vIdGift, infoGift) {
                                    var filterGiftInCart = cartGet.items.filter(x => x.variant_id == vIdGift && x.promotionby.length > 0 && x.promotionby[0].product_id == pId);
                                    if (infoGift.priority == false && filterGiftInCart.length > 0) {
                                        gOSP += filterGiftInCart[0].quantity;
                                    }
                                    if (infoGift.priority == true && filterGiftInCart.length > 0) {
                                        gOPR += filterGiftInCart[0].quantity * infoGift.count_buy / infoGift.count_gift;
                                        gCurrent = infoGift;
                                        gCurrent.vId = vIdGift;
                                    }
                                });
                            }

                            cartGet.items.map((item, index) => {
                                if (item.variant_id == vId) updates[index] = currentQty;
                                else {
                                    if (item.promotionby.length > 0 && item.promotionby[0].product_id == pId) {
                                        if (gCurrent != null && gCurrent.priority == true && gCurrent.vId == item.variant_id) {
                                            var haohut = gOSP + gOPR - currentQty;
                                            var qtyGift = item.quantity - (haohut / gCurrent.count_buy * gCurrent.count_gift);
                                            updates[index] = qtyGift;
                                        } else {
                                            updates[index] = item.quantity;
                                        }
                                    } else {
                                        updates[index] = item.quantity;
                                    }
                                }
                            });

                            var params = {
                                type: 'POST',
                                url: '/cart/update.js',
                                data: {
                                    'updates[]': updates
                                },
                                async: false,
                                dataType: 'json',
                                success: function(data) {
                                    cartItem = {};
                                    cartGet = data;
                                    for (i = 0; i < data.items.length; i++) {
                                        var id = data.items[i].variant_id;
                                        cartItem[data.items[i].variant_id] = data.items[i].quantity;
                                        $('.mini-cart__item input[data-vid="' + id + '"]').val(data.items[i].quantity);
                                        $('.proloop-actions[data-vrid="' + id + '"]').find('.proloop-boxqty input').val(data.items[i].quantity);
                                    }

                                    HRT.All.getCartModal(false);

                                    var total_price = Haravan.formatMoney(data.total_price, formatMoney);
                                    $('#total-view-cart,.boxinfo.p-price,.mnc-total-price').html(total_price);
                                    $('.count-holder .count').html(data.item_count);
                                    $('.boxinfo.p-count').html(data.item_count + ' sản phẩm');
                                },
                                error: function(XMLHttpRequest, textStatus) {
                                    Haravan.onError(XMLHttpRequest, textStatus);
                                }
                            };
                            jQuery.ajax(params);
                        } else {
                            var params = {
                                type: 'POST',
                                url: '/cart/change.js',
                                data: 'quantity=' + currentQty + '&line=' + line,
                                async: false,
                                dataType: 'json',
                                success: function(data) {
                                    cartItem = {};
                                    cartGet = data;
                                    for (i = 0; i < data.items.length; i++) {
                                        var id = data.items[i].variant_id;
                                        cartItem[data.items[i].variant_id] = data.items[i].quantity;
                                        $('.mini-cart__item input[data-vid="' + id + '"]').val(data.items[i].quantity);
                                        $('.proloop-actions[data-vrid="' + id + '"]').find('.proloop-boxqty input').val(data.items[i].quantity);
                                        $('.proloop-actions[data-vrid="' + id + '"] .proloop-value').val(data.items[i].quantity);
                                    }

                                    HRT.All.getCartModal(false);

                                    var total_price = Haravan.formatMoney(data.total_price, formatMoney);
                                    $('#total-view-cart,.boxinfo.p-price,.mnc-total-price').html(total_price);
                                    $('.count-holder .count').html(data.item_count);
                                    $('.boxinfo.p-count').html(data.item_count + ' sản phẩm');
                                },
                                error: function(XMLHttpRequest, textStatus) {
                                    Haravan.onError(XMLHttpRequest, textStatus);
                                }
                            };
                            jQuery.ajax(params);
                        }
                    }
                }
                if (updateNormal) {
                    var params = {
                        type: 'POST',
                        url: '/cart/change.js',
                        data: 'quantity=' + currentQty + '&line=' + line,
                        async: false,
                        dataType: 'json',
                        success: function(data) {
                            cartItem = {};
                            cartGet = data;
                            for (i = 0; i < data.items.length; i++) {
                                var id = data.items[i].variant_id;
                                cartItem[data.items[i].variant_id] = data.items[i].quantity;
                                $('.mini-cart__item input[data-vid="' + id + '"]').val(data.items[i].quantity);
                                $('.proloop-actions[data-vrid="' + id + '"]').find('.proloop-boxqty input').val(data.items[i].quantity);
                                $('.proloop-actions[data-vrid="' + id + '"] .proloop-value').val(data.items[i].quantity);
                            }

                            HRT.All.getCartModal(false);

                            var total_price = Haravan.formatMoney(data.total_price, formatMoney);
                            $('#total-view-cart,.boxinfo.p-price,.mnc-total-price').html(total_price);
                            $('.count-holder .count').html(data.item_count);
                            $('.boxinfo.p-count').html(data.item_count + ' sản phẩm');
                        },
                        error: function(XMLHttpRequest, textStatus) {
                            Haravan.onError(XMLHttpRequest, textStatus);
                        }
                    };
                    jQuery.ajax(params);
                }
            }
        }, 300));
    },
    boxAcountHeader: function() {
        $('body').on('click', '.js-link', function(e) {
            e.preventDefault();
            HRT.All.boxAccount($(this).attr('aria-controls'));
        });
        $('.site_account input').blur(function() {
            var tmpval = $(this).val();
            if (tmpval == '') {
                $(this).removeClass('is-filled');
            } else {
                $(this).addClass('is-filled');
            }
        });
    },
    formAccountHeader: function() {
        /* submit recapcha form */
        if ($('#header-login-panel').length > 0) {
            $('#header-login-panel form#customer_login').submit(function(e) {
                var self = $(this);
                if ($(this)[0].checkValidity() == true) {
                    e.preventDefault();
                    grecaptcha.ready(function() {
                        grecaptcha.execute('6LdD18MUAAAAAHqKl3Avv8W-tREL6LangePxQLM-', {
                            action: 'submit'
                        }).then(function(token) {
                            self.find('input[name="g-recaptcha-response"]').val(token);
                            self.unbind('submit').submit();
                        });
                    });
                }
            });
        }
        if ($('#header-recover-panel').length > 0) {
            $('#header-recover-panel form').submit(function(e) {
                var self = $(this);
                if ($(this)[0].checkValidity() == true) {
                    e.preventDefault();
                    grecaptcha.ready(function() {
                        grecaptcha.execute('6LdD18MUAAAAAHqKl3Avv8W-tREL6LangePxQLM-', {
                            action: 'submit'
                        }).then(function(token) {
                            self.find('input[name="g-recaptcha-response"]').val(token);
                            self.unbind('submit').submit();
                        });
                    });
                }
            });
        }
    },
    toggleFooter: function() {
        $('.footer-expand-title').on('click', function() {
            jQuery(this).toggleClass('active').parent().find('.footer-expand-collapsed').stop().slideToggle('medium');
        });
        $('.widget-footer__title').on('click', function() {
            if ($(window).width() < 991) {
                jQuery(this).toggleClass('opened').parent().find('.block-collapse').stop().slideToggle('medium');
            }
        });
    },
    newsletterForm: function() {
        if ($('.newsletter-form').length > 0) {
            $('.newsletter-form form.contact-form').submit(function(e) {
                var self = $(this);
                if ($(this)[0].checkValidity() == true) {
                    e.preventDefault();
                    grecaptcha.ready(function() {
                        grecaptcha.execute('6LdD18MUAAAAAHqKl3Avv8W-tREL6LangePxQLM-', {
                            action: 'submit'
                        }).then(function(token) {
                            self.find('input[name="g-recaptcha-response"]').val(token);
                            $.ajax({
                                type: 'POST',
                                url: '/account/contact',
                                data: $('.newsletter-form form.contact-form').serialize(),
                                success: function(data) {
                                    if ($(data).find('#newsletter-success').length > 0) {
                                        $('.newsletter-form .newsletter-error').html('');
                                        Swal.fire({
                                            icon: "success",
                                            customClass: "newsletter-form-success",
                                            title: "Đăng kí thông tin thành công",
                                            text: "Thông báo sẽ tự động tắt sau 5 giây...",
                                            showConfirmButton: false,
                                            timer: 5000,
                                            timerProgressBar: true,
                                        });
                                        e.target.reset();
                                    } else {
                                        $('.newsletter-form .newsletter-error').html('Địa chỉ email không hợp lệ');
                                    }
                                },
                            })
                        });
                    });
                }
            });
        }
    },
    addThisIconShare: function() {
        if ($('.addThis_listSharing').length > 0) {
            $('.addThis_contact__icons .box-contact,.addThis_contact__lists .addThis_close').on('click', function(e) {
                if ($('.addThis_listSharing').hasClass('active')) {
                    $body.removeClass('locked-scroll').removeClass('body-sidenav');
                    $('.addThis_listSharing').removeClass('active');
                    $('.addThis_listSharing').fadeOut(150);
                } else {
                    if ($(this).hasClass('toolbarContactClick')) $body.addClass('locked-scroll').addClass('body-sidenav');
                    $('.addThis_listSharing').fadeIn(100);
                    $('.addThis_listSharing').addClass('active');
                }
            });
            $("body").on('click', function(event) {
                if ($(event.target).is('.addThis_contact__dialog') || $(event.target).is('.addThiclose')) {
                    event.preventDefault();
                    $body.removeClass('locked-scroll').removeClass('body-sidenav');
                    $('.addThis_listSharing').removeClass('active');
                    $('.addThis_listSharing').fadeOut(150);
                }
            });
            $('.body-popupform form.contact-form').submit(function(e) {
                var self = $(this);
                if ($(this)[0].checkValidity() == true) {
                    e.preventDefault();
                    grecaptcha.ready(function() {
                        grecaptcha.execute('6LdD18MUAAAAAHqKl3Avv8W-tREL6LangePxQLM-', {
                            action: 'submit'
                        }).then(function(token) {
                            self.find('input[name="g-recaptcha-response"]').val(token);
                            $.ajax({
                                type: 'POST',
                                url: '/contact',
                                data: $('.body-popupform form.contact-form').serialize(),
                                success: function(data) {
                                    $('.modal-contactform.fade.show').modal('hide');
                                    Swal.fire({
                                        icon: "success",
                                        customClass: "newsletter-form-success",
                                        title: "Đăng kí thông tin thành công",
                                        html: '<p class="txt1">Cảm ơn bạn đã để lại thông tin</p><p class="txt2">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất</p><p class="txt3">Thông báo sẽ tự động tắt sau <span></span> giây...</p>',
                                        showConfirmButton: false,
                                        timer: 5000,
                                        timerProgressBar: true,
                                    }).then((result) => {
                                        location.reload();
                                    });
                                },
                            })
                        });
                    });
                }
            });
        }
        if ($('.layoutProduct_scroll').length > 0) {
            if (jQuery(window).width() < 768) {
                var curScrollTop = 0;
                $(window).scroll(function() {
                    var scrollTop = $(window).scrollTop();
                    if (scrollTop > curScrollTop && scrollTop > 200) {
                        $('.layoutProduct_scroll').removeClass('scroll-down').addClass('scroll-up');
                    } else {
                        if (scrollTop > 200 && scrollTop + $(window).height() + 150 < $(document).height()) {
                            $('.layoutProduct_scroll').removeClass('scroll-up').addClass('scroll-down');
                        }
                    }
                    if (scrollTop < curScrollTop && scrollTop < 200) {
                        $('.layoutProduct_scroll').removeClass('scroll-up').removeClass('scroll-down');
                    }
                    curScrollTop = scrollTop;
                });
            }
        }
    },
    copyCodeProdCoupon: function() {
        $(document).on('click', '.coupon-item .cp-btn', function(e) {
            e.preventDefault();
            $('.coupon-item .cp-btn').html('Sao chép mã').removeClass('disabled');
            var copyText = $(this).attr('data-coupon');
            var el = document.createElement('textarea');
            el.value = copyText;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            $(this).html('Đã sao chép').addClass('disabled');
        });
    },
    copyCodeModalCoupon: function() {
        $(document).on('click', '.coupon-item .cp-btn', function(e) {
            e.preventDefault();
            $('.coupon-item .cp-btn').html('Sao chép mã').removeClass('disabled');
            var copyText = $(this).attr('data-coupon');
            var dummy = $('<input class="copy-coupon-text-hide">').val(copyText).appendTo('body').select();
            dummy.focus();
            document.execCommand('copy');
            $('.copy-coupon-text-hide').hide();
            $(this).html('Đã sao chép').addClass('disabled');
        });
    },
    popoverCoupon: function() {
        var popover = '.cp-icon[data-bs-toggle="popover"]';
        $(popover).popover({
            html: true,
            animation: true,
            sanitize: false,
            placement: function(popover, trigger) {
                var placement = jQuery(trigger).attr('data-bs-placement');
                var dataClass = jQuery(trigger).attr('data-class');
                jQuery(trigger).addClass('is-active');
                jQuery(popover).addClass(dataClass);
                if (jQuery(trigger).offset().top - $(window).scrollTop() > 280) {
                    return "top";
                }
                return placement;
            },
            content: function() {
                var elementId = $(this).attr("data-content-id");
                return $('#' + elementId).html();
            },
            delay: {
                show: 60,
                hide: 40
            }
        });

        function eventPopover() {
            if ($(window).width() >= 768) {
                $(popover).on('mouseenter', function() {
                    var self = this;
                    jQuery(this).popover("show");
                    jQuery(".popover.coupon-popover").on('mouseleave', function() {
                        jQuery(self).popover('hide');
                    });
                }).on('mouseleave', function() {
                    var self = this;
                    setTimeout(function() {
                        if (!jQuery('.popover.coupon-popover:hover').length) {
                            jQuery(self).popover('hide');
                        }
                    }, 300);
                });
            } else {
                $(popover).off('mouseenter mouseleave');
            }
        };
        eventPopover();
        $(window).resize(function() {
            eventPopover();
        });
        $(popover).popover().on("hide.bs.popover", function() {
            $(".modal-coupon--backdrop").removeClass("js-modal-show");
        });
        $(popover).popover().on("show.bs.popover", function() {
            $(".modal-coupon--backdrop").addClass("js-modal-show");
        });
        $(popover).popover().on("shown.bs.popover", function() {
            $('.btn-popover-close,.modal-coupon--backdrop').click(function() {
                $(popover).not(this).popover('hide');
                var $this = $(this);
                $this.popover('hide');
            });
        });
        $(document).on('click', '.cpi-trigger', function(e) {
            e.preventDefault();
            var btnPopover = $(this).attr('data-coupon');
            $(".coupon-item .cp-btn[data-coupon=" + btnPopover + "]").click();
        });
        $(document).on('click', '.popover-content__coupon .btn-popover-code', function(e) {
            e.preventDefault();
            var btnPopover = $(this).attr('data-coupon');
            $(".coupon-item .cp-btn[data-coupon=" + btnPopover + "]").click();
            $(this).html('Đã sao chép').addClass('disabled');
        });
    },
    slideCouponModal: function() {
        var swiper = new Swiper("#modalCoupon", {
            slidesPerView: 1,
            spaceBetween: 12,
            grid: {
                rows: 2,
                fill: "row",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });
    },
    showModalCouponAjax: function() {
        $(document).on('click', '.sitenav-cart .linkcoupon', function(e) {
            if ($('.modal-coupon').length == 0) {
                $.ajax({
                    url: '/index?view=load-modal-coupon',
                    success: function(data) {
                        $('body').append(data);
                        setTimeout(function() {
                            $('#modal-coupon').modal('show');
                        }, 100);
                        HRT.Main.copyCodeModalCoupon();
                        HRT.Main.popoverCoupon();
                        HRT.Main.slideCouponModal();
                    }
                });
            } else {
                $('#modal-coupon').modal('show');
            }
        });
    },
    menuSidebar: function() {
        $(document).on('click', '.plus-nClick1', function(e) {
            e.preventDefault();
            $(this).parents('.level0').toggleClass('opened');
            $(this).parents('.level0').children('ul').slideToggle(200);
        });
        $(document).on('click', '.plus-nClick2', function(e) {
            e.preventDefault();
            $(this).parents('.level1').toggleClass('opened');
            $(this).parents('.level1').children('ul').slideToggle(200);
        });
        $(document).on('click', '.sidebox-title .htitle', function(e) {
            $(this).parents('.group-sidebox').toggleClass('is-open').find('.sidebox-content-togged').slideToggle('medium');
        });
    },
    copylinkProd: function() {
        $(document).on('click', '.share-link-js', function(e) {
            e.preventDefault();
            var copyText = $(this).attr('data-url');
            var dummy = $('<input class="copy-url-hide">').val(copyText).appendTo('body').select();
            dummy.focus();
            document.execCommand('copy');
            $('.copy-url-hide').hide();
            swal.fire({
                icon: "success",
                customClass: "copy-success",
                text: "Đã sao chép",
                showConfirmButton: false,
                timer: 1500,
            });
        });
    },
}

HRT.Index = {
    init: function() {
        var that = this;
        that.slideMainBanner();
        that.slideCategory();
        that.slideCollection();
        that.homeCollectionTabs();
        //that.popoverLookbooks();
        //that.popoverAddCartCombo();
        //that.slideLookbooks();
        that.scrollLoadLookbook();
        that.slideBlog();
        that.infoSetHeight();
        that.addContact();
    },
    slideMainBanner: function() {
        var swiper = new Swiper(".home-slider", {
            slidesPerView: 1,
            lazy: true,
            loop: true,
            autoplay: {
                delay: 8000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
                renderBullet: function(index, className) {
                    return '<span class="' + className + '" rel="noopener"></span>';
                },
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
        });
    },
    slideCategory: function() {
        var swiper = new Swiper("#slide-category", {
            slidesPerView: 4,
            spaceBetween: 30,
            lazy: true,
            navigation: {
                nextEl: ".swiper-category-next",
                prevEl: ".swiper-category-prev",
            },
            breakpoints: {
                0: {
                    slidesPerView: 1.3,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                992: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1200: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                }
            }
        });
    },
    slideCollection: function() {
        var swiper = new Swiper("#home-slide-collection", {
            slidesPerView: 4,
            spaceBetween: 30,
            navigation: {
                nextEl: ".swiper-collection-next",
                prevEl: ".swiper-collection-prev",
            },
            breakpoints: {
                0: {
                    slidesPerView: 2,
                    spaceBetween: 4,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 24,
                },
                992: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                },
                1200: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                },
            }
        });
    },
    homeCollectionTabs: function() {
        if (jQuery(window).width() >= 992) {
            var limitProd = $('.section-home-collection .tabs-navigation').attr('data-limit-desktop');
        } else {
            var limitProd = $('.section-home-collection .tabs-navigation').attr('data-limit-mobile');
        }
        $('.section-home-collection').each(function() {
            var sectionCurrent = $(this);
            $(this).find('.tabs-navigation a[data-bs-toggle="tab"]').on('shown.bs.tab', function() {
                var handle = $(this).attr("data-handle");
                var tprod = $(this).parents('.section-home-collection').find('.collection-tabs-ajax .tab-pane.active .list-product-row .product-loop:not(.product-loadding)').length;
                var indexTab = $(this).parent().index();
                var title = $(this).html();
                var countProd = $(this).attr("data-count");
                var sectionIndex = $(this).parents('.tabs-navigation').attr("data-index");

                sectionCurrent.find('.see-more-product a.btn-see-more').attr('href', handle);
                sectionCurrent.find('.see-more-product strong.coll-title').html(title);

                if (Number(countProd) > Number(limitProd)) {
                    sectionCurrent.find('.see-more-product').removeClass("d-none");
                } else {
                    sectionCurrent.find('.see-more-product').addClass("d-none");
                }

                if (jQuery(window).width() < 768) {
                    var $parentScroll = sectionCurrent.find(".tabs-navigation");
                    HRT.Product.scrollLeft($parentScroll, ".active", 500);
                }
                if (tprod == 0) {
                    if (handle == '') {
                        $.ajax({
                            url: '/collections/all?view=home-product-data-no',
                            success: function(data) {
                                setTimeout(function() {
                                    sectionCurrent.find('.collection-tabs-ajax .tab-pane.active .list-product-row').html('');
                                    sectionCurrent.find('.collection-tabs-ajax .tab-pane.active .list-product-row').append(data);
                                    sectionCurrent.find('.home-productTabs .wrapbox--btn').addClass('d-none');
                                }, 350)
                            }
                        });
                    } else {
                        $.ajax({
                            url: handle + '?view=home-product-data',
                            success: function(data) {
                                setTimeout(function() {
                                    data = data.replace(/navTabColl__loop_/g, 'section_' + sectionIndex + '_tab_' + (indexTab + 1) + '_loop_');
                                    sectionCurrent.find('.collection-tabs-ajax .tab-pane.active .list-product-row').html('');
                                    sectionCurrent.find('.collection-tabs-ajax .tab-pane.active .list-product-row').append(data);
                                    if (productReviewsApp && productReviewsProloop) {
                                        ProductReviews.init();
                                    }
                                    if (promotionApp) {
                                        if (promotionApp_name == 'app_combo') {
                                            comboApp.showGiftLabel();
                                        } else {
                                            buyXgetY.showGiftLabel();
                                        }
                                    }
                                    HRT.All.checkCart();
                                }, 350);
                            }
                        });
                    }
                }
            });
        });
    },
    popoverLookbooks: function() {
        $('.popover-dot[data-bs-toggle="popover"]').popover({
            html: true,
            animation: true,
            placement: function(popover, trigger) {
                var placement = jQuery(trigger).attr('data-bs-placement');
                var dataClass = jQuery(trigger).attr('data-class');
                jQuery(trigger).addClass('is-active');
                jQuery(popover).addClass(dataClass);
                return placement;
            },
            content: function() {
                var elementId = $(this).attr("data-content-id");
                return $(elementId).html();
            },
        });
        jQuery("body").on("click", '.popover-dot[data-bs-toggle="popover"]', function(e) {
            $('.popover-dot[data-bs-toggle="popover"]').each(function() {
                if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });

        });
        setTimeout(function() {
            $('.lookbooks-banner-1 .popover-dot:eq(0)').click();
        }, 1000);
        //$('body').on('hidden.bs.popover', function (e) {
        //	$(e.target).data('bs.popover').inState = { click: false, hover: false, focus: false };
        //});
    },
    popoverAddCartCombo: function() {
        function AddSetCombo(index, array, cb) {
            if (index < array.length) {
                $.ajax({
                    url: '/cart/add.js',
                    type: 'POST',
                    async: false,
                    data: {
                        id: array[index],
                        quantity: 1
                    },
                    success: function() {
                        index++;
                        AddSetCombo(index, array, cb);
                    },
                    error: function() {
                        //$('.btn-lb').removeClass('btn-animate');
                    }
                });
            } else {
                if (typeof cb == 'function') return cb();
            }
        }
        $(document).on('click', '.lookbooks-banner .btn-lb', function(e) {
            e.preventDefault();
            var dataSet = $(this).attr('data-combo').split(',');
            //$(this).addClass('btn-animate');
            setTimeout(function() {
                AddSetCombo(0, dataSet, function() {
                    HRT.All.sidenav_open($body, '#js-sitenav-cart', 'js-current')
                    HRT.All.getCartModal(false);
                });
            }, 400);

        });
    },
    slideLookbooks: function() {
        var init = false;

        function swiperCard() {
            if (window.innerWidth <= 992) {
                if (!init) {
                    init = true;
                    swiper = new Swiper(".section-home-lookbooks .swiper", {
                        slidesPerView: 1,
                        spaceBetween: 20,
                        navigation: {
                            nextEl: ".swiper-lookbooks-next",
                            prevEl: ".swiper-lookbooks-prev",
                        },
                        breakpoints: {
                            0: {
                                slidesPerView: 1,
                            },
                            768: {
                                slidesPerView: 2,
                            }
                        }
                    });
                }
            } else if (init) {
                swiper.destroy();
                init = false;
            }
        }
        swiperCard();
        window.addEventListener("resize", swiperCard);
    },
    scrollLoadLookbook: function() {
        var isLoading = true;
        $(window).scroll(function() {
            if (isLoading && $('.section-home-lookbooks .list-lookbooks-loading').length > 0 && jQuery(window).scrollTop() > jQuery('.section-home-lookbooks').offset().top - 800) {
                isLoading = false;
                $.ajax({
                    url: '/index?view=load-lookbook',
                    success: function(data) {
                        $('.section-home-lookbooks .section-content').html();
                        $('.section-home-lookbooks .section-content').html(data);
                        HRT.Index.popoverLookbooks();
                        HRT.Index.slideLookbooks();
                        HRT.Index.popoverAddCartCombo();
                    }
                });
                //console.log(isLoading)
            }
        });
    },
    slideBlog: function() {
        var swiper = new Swiper("#homeBlogs-slide", {
            slidesPerView: 3,
            spaceBetween: 30,
            navigation: {
                nextEl: ".swiper-homeblog-next",
                prevEl: ".swiper-homeblog-prev",
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                992: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1200: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
            }
        });
    },
    infoSetHeight: function() {
        if (jQuery(window).width() > 767) {
            var maxHeight = 0;
            $('.section-home-info .info-block__inner').each(function() {
                var thisHeight = parseInt($(this).outerHeight());
                maxHeight = (maxHeight >= thisHeight ? maxHeight : thisHeight);
            });
            $('.section-home-info .info-block__inner').css('min-height', maxHeight);
        }
    },
    addContact: function() {
        $('.js-btn-contact').click(function(e) {
            e.preventDefault();
            $('.modal-contactform').modal('show');
        })
    }
}

HRT.Collection = {
    init: function() {
        var that = this;
        that.toggleFilterMobile();
        that.menuSidebar();
    },
    toggleFilterMobile: function() {
        $('.collection-sortby-filter .layered_filter_title').on('click', function() {
            var layerfilter = $(this).attr('data-layered-click');
            if (jQuery(window).width() < 992) {
                if ($(this).parent().hasClass('filter_opened')) {
                    $(this).parent().removeClass('filter_opened');
                    $(layerfilter).slideUp(300);
                } else {
                    $('.layered_filter_mobileContent').slideUp(300);
                    $('.layered_filter_title').parent().removeClass('filter_opened');
                    $(this).parent().addClass('filter_opened');
                    $(layerfilter).slideDown(300);
                }
            }
        });
        $('.filter_group-subtitle').on('click', function() {
            jQuery(this).toggleClass('action-group').parent().find('.filter_group-content').stop().slideToggle('medium');
        });
    },
    menuSidebar: function() {
        $(document).on('click', '.tree-menu .tree-menu-lv1', function() {
            $this = $(this).find('.tree-menu-sub');
            $('.tree-menu .has-child .tree-menu-sub').not($this).slideUp('fast');
            $(this).find('.tree-menu-sub').slideToggle('fast');
            $(this).toggleClass('menu-collapsed');
            $(this).toggleClass('menu-uncollapsed');
            var $this1 = $(this);
            $('.tree-menu .has-child').not($this1).removeClass('menu-uncollapsed');
        });
    },
}

HRT.Product = {
    init: function() {
        var that = this;

        that.slideProductRelated('#slideRelated', 'related');
        that.slideProductRelated('#slideViewed', 'viewed');
        that.scrollTabProduct();
        that.scrollSidebarBottom();
        that.valueQuantitySticky();
        that.addCartStickyProduct();
        that.btnPreorderSticky();
        that.shareLinkMobile();
        that.loadMoreDesc();
        that.hoverZoomImg();
        that.renderCombo(currentId);
        that.changeOptionCombo();
        that.changeOptionFirstCombo();
        that.clickAddCombo();
        that.moreFaqs();
        that.slideRelatedMb();
    },
    slideProductRelated: function(target, name) {
        if ($(target).length > 0) {
            var swiper = new Swiper(target, {
                slidesPerView: 4,
                spaceBetween: 24,
                loop: false,
                navigation: {
                    nextEl: ".swiper-" + name + "-next",
                    prevEl: ".swiper-" + name + "-prev",
                },
                breakpoints: {
                    0: {
                        slidesPerView: 2,
                        spaceBetween: 4,
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 24,
                    },
                    992: {
                        slidesPerView: 4,
                        spaceBetween: 24,
                    },
                    1200: {
                        slidesPerView: 4,
                        spaceBetween: 24,
                    },
                }
            });
        }
    },
    scrollLeft: function(parent, elem, speed) {
        var active = jQuery(parent).find(elem);
        var activeWidth = active.width() / 2;
        var pos = jQuery(parent).find(elem).position().left + activeWidth;
        var elpos = jQuery(parent).scrollLeft();
        var elW = jQuery(parent).width();
        pos = pos + elpos - elW / 2;
        jQuery(parent).animate({
            scrollLeft: pos
        }, speed == undefined ? 1000 : speed);
        return this;
    },
    scrollTabProduct: function() {
        $('.tab-title [data-bs-toggle="pill"]').on('shown.bs.tab', function(event) {
            if (jQuery(window).width() < 768) {
                var $parentScroll = $('.product-tabs').find(".tab-title");
                HRT.Product.scrollLeft($parentScroll, ".active", 500);
            }
        })
    },
    scrollSidebarBottom: function() {
        setTimeout(function() {
            var hActionTop = $('.product-tabs').offset().top - 40;
            $(window).scroll(function() {
                if (hActionTop < $(this).scrollTop()) {
                    $('.sidebar-action-bottom').addClass("is-show");
                } else {
                    $('.sidebar-action-bottom').removeClass("is-show");
                }
                if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
                    $('.sidebar-action-bottom').removeClass("is-show");
                }
            });
        }, 1000);
    },
    valueQuantitySticky: function() {
        $('#quantity-sb').blur(function() {
            var value = $(this).val();
            $('#quantity').val(value);
        });
        $('#quantity').blur(function() {
            var value = $(this).val();
            $('#quantity-sb').val(value);
        });
    },
    addCartStickyProduct: function() {
        $('#add-to-cart-sticky').click(function() {
            $('#add-to-cart').trigger('click');
        });
    },
    btnPreorderSticky: function() {
        $('#js-preorder-sticky').click(function() {
            $('.js-btn-preorder-detail').trigger('click');
        });
    },
    shareLinkMobile: function() {
        if (jQuery(window).width() < 991) {
            var text = $('.layout-productDetail .product-name h1').html();
            //console.log(title)
            //var img = $('.product-gallery__slide .product-gallery__photo:eq(0) img').attr('src');
            const shareData = {
                //title: title,
                text: text,
                url: location.href
            }
            const btn = document.getElementById('share-mobile');
            // Share must be triggered by "user activation"
            btn.addEventListener('click', async () => {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    resultPara.textContent = `Error: ${err}`;
                }
            });
        }
    },
    loadMoreDesc: function() {
        setTimeout(function() {
            var content_height = $('.expandable-toggle .desc-content'),
                hHeader = $('#main-header').innerHeight(),
                seeMore = $('.js_expandable_content'),
                proContent = $('.product-tabs'),
                srollTop = proContent.offset().top;
            if ($('.expandable-toggle .desc-content-js').height() > 230) {
                seeMore.show();
                seeMore.click(function() {
                    if (!$('#main-header').hasClass('hSticky-up')) {
                        $('#main-header').removeClass("hSticky-nav");
                    }
                    $(this).toggleClass("show");
                    if ($(this).hasClass('show')) {
                        content_height.css("max-height", "none");
                        $('.expandable-toggle__btn').removeClass('btn-viewmore').addClass('btn-closemore').find('.expandable-toggle__text').html('Thu gọn');
                        $(this).parent('.description-btn').addClass('is-show');
                    } else {
                        content_height.css("max-height", "230px");
                        $('.expandable-toggle__btn').removeClass('btn-closemore').addClass('btn-viewmore').find('.expandable-toggle__text').html('Xem thêm');
                        $(this).parent('.description-btn').removeClass('is-show');
                        window.scrollTo({
                            top: srollTop,
                            behavior: 'smooth'
                        });
                    }
                })
            } else {
                seeMore.hide();
            }
        }, 1000);
    },
    hoverZoomImg: function() {
        var show_zoom = "true";
        if (jQuery(window).width() > 992 && show_zoom == "true") {
            setTimeout(function() {
                const driftImgs = document.querySelectorAll('.product-gallery__photo:not(.illusion_360) img');
                const pane = document.querySelector('.info-wrapper');
                jQuery.each(driftImgs, function(i, val) {
                    new Drift(val, {
                        paneContainer: pane,
                        inlinePane: false,
                    });
                });
            }, 350);
        }
    },
    //render app combo
    render_img: function(result, aIdCombo) {
        var htmlImg = '';
        var numIdCombo = aIdCombo.length - 1;
        htmlImg += '<div class="combo-content--images">';
        $.each(aIdCombo, function(i, v) {
            htmlImg += '<a href="' + result[v].url + '" title="' + result[v].title + '" class="image ">';
            htmlImg += '<img src="' + Haravan.resizeImage(result[v].img, 'medium') + '" alt="' + result[v].title + '">';
            htmlImg += '</a>';
            if (i < numIdCombo) {
                htmlImg += '<p class="plus">+</p>';
            }
        });
        htmlImg += '</div>';
        return htmlImg;
    },
    render_price: function(result, dtCombo) {
        var dt_of_combo = {},
            price_combo = 0;
        if (!dtCombo.is_apply_by_variant) {
            dt_of_combo.quantity = dtCombo.quantity;
            switch (dtCombo.type) {
                case 1:
                    price_combo = result.price - dtCombo.promotion_value;
                    break;
                case 2:
                    price_combo = result.price - (result.price * (dtCombo.promotion_value / 100));
                    break;
                default:
                    price_combo = dtCombo.promotion_value;
            }
            dt_of_combo.price = price_combo;
        } else {
            $.each(dtCombo.apply_productvariants, function(i, v) {
                if (v != null) {
                    var vrt = result.variants.find(item => item.id == v.id)
                    dt_of_combo.quantity = v.qty;
                    switch (v.type) {
                        case 1:
                            price_combo = vrt.price - v.promotion_value;
                            break;
                        case 2:
                            price_combo = vrt.price - (vrt.price * (v.promotion_value / 100));
                            break;
                        default:
                            price_combo = v.promotion_value;
                    }
                    dt_of_combo.price = price_combo;
                }
            });
        }
        return dt_of_combo;
    },
    render_items: function(result, iCombo, nCombo, currentId) {
        var htmlDetail = '<div class="combo-content--list">';
        htmlDetail += '<div class="list-combos">';
        var totalPriceCombo = 0;
        var totalPriceInit = 0;
        var numCombo = nCombo.length - 1;
        variantItem.push(result);
        if (nCombo.length == 2) {
            $('.combo-info').addClass('width-small')
        } else {
            $('.combo-info').removeClass('width-small')
        }

        $.each(nCombo, function(i, v) {
            /* Kiểm tra giảm theo biến thể từ app */
            var is_vrt_combo = false;
            var vrt_combo = '';
            if (dataItemsCombo[iCombo][v].is_apply_by_variant) {
                is_vrt_combo = true;
                vrt_combo = result[v].variants.find(i => i.id == dataItemsCombo[iCombo][v].apply_productvariants[0].id)
            }
            /* Xử lý giá trị từ app */
            var dtCombo = HRT.Product.render_price(result[v], dataItemsCombo[iCombo][v]);
            /* End Xử lý */
            var vrtOption = Object.values(result[v].variants);
            //var vrt = Array.from(new Set([...vrtOption.map(item => item.title)]));
            var optionSize = result[v].option_size;
            if (is_vrt_combo) {
                var dtPrice = $.isEmptyObject(dtCombo) ? vrt_combo.price : dtCombo.price;
                var dtQty = $.isEmptyObject(dtCombo) ? 1 : dtCombo.quantity;
                totalPriceInit += vrt_combo.price;
                totalPriceCombo += (dtPrice * dtQty);
            } else {
                var dtPrice = $.isEmptyObject(dtCombo) ? result[v].price : dtCombo.price;
                var dtQty = $.isEmptyObject(dtCombo) ? 1 : dtCombo.quantity;
                totalPriceInit += result[v].price;
                totalPriceCombo += (dtPrice * dtQty);
            }

            //if(!dataItemsCombo[iCombo][v].is_apply_by_variant){
            htmlDetail += '<div class="combo-item' + (v == currentId ? ' item-force' : ' ') + '">';
            htmlDetail += '<div class="combo-item--images">';
            htmlDetail += '<a href="' + result[v].url + '" title="' + result[v].title + '" class="image ">';
            htmlDetail += '<span class="lazy-img-cb">';
            if (is_vrt_combo) {
                htmlDetail += '<img src="' + Haravan.resizeImage(vrt_combo.img, 'medium') + '" alt="' + result[v].title + '">';
            } else {
                htmlDetail += '<img src="' + Haravan.resizeImage(result[v].img, 'medium') + '" alt="' + result[v].title + '">';
            }
            htmlDetail += '</span>';
            htmlDetail += '</a>';
            htmlDetail += '</div>';
            htmlDetail += '<div class="combo-item--detail">';
            htmlDetail += '<div class="combo-item--head">';
            htmlDetail += '<div class="combo-item--title">'
            if (is_vrt_combo) {
                if (v == currentId) {
                    htmlDetail += '<input type="checkbox" id="item-force" class="force" name="combo-option" value="' + vrt_combo.id + '"  data-combo="' + dtPrice + '" data-quantity="' + dtQty + '" data-origin="' + vrt_combo.price + '" data-km="' + vrt_combo.compare_at_price + '" checked/>';
                } else {
                    htmlDetail += '<input type="checkbox" name="combo-option" value="' + vrt_combo.id + '" data-combo="' + dtPrice + '" data-quantity="' + dtQty + '" data-origin="' + vrt_combo.price + '" data-km="' + vrt_combo.compare_at_price + '" checked/>';
                }
            } else {
                if (v == currentId) {
                    htmlDetail += '<input type="checkbox" id="item-force" class="force" name="combo-option" value="' + result[v].first_available + '"  data-combo="' + dtPrice + '" data-quantity="' + dtQty + '" data-origin="' + result[v].price + '" data-km="' + result[v].compare_at_price + '" checked/>';
                } else {
                    htmlDetail += '<input type="checkbox" name="combo-option" value="' + result[v].first_available + '" data-combo="' + dtPrice + '" data-quantity="' + dtQty + '" data-origin="' + result[v].price + '" data-km="' + result[v].compare_at_price + '" checked/>';
                }
            }
            htmlDetail += '<span class="combo--title">' + (v == currentId ? '<strong>Bạn đang xem: </strong> ' : '') + dtQty + ' x ' + result[v].title;
            htmlDetail += '</span>';
            htmlDetail += '</div>';
            if (is_vrt_combo) {
                if (result[v].option_size == 1 && result[v].options[0].value == 'Default Title') htmlDetail += '<div class="combo-item--option is-hide">';
                else htmlDetail += '<div class="combo-item--option disable">';
            } else {
                if (result[v].option_size == 1 && (result[v].options[0].value == 'Default Title' || result[v].options[0].value.length == 1)) htmlDetail += '<div class="combo-item--option is-hide">';
                else htmlDetail += '<div class="combo-item--option">';
            }
            htmlDetail += '<div class="options-title">';
            htmlDetail += '<div class="title">Vui lòng chọn:</div>';
            htmlDetail += '</div>';
            htmlDetail += '<div class="options-list">';
            if (result[v].option_size == 1) {
                result[v].options.forEach((op, index) => {
                    htmlDetail += '<div class="select-option option' + (index + 1) + '" data-option="option' + (index + 1) + '">';
                    if (op.value.length != 1) {
                        htmlDetail += '<select class="filter-option" name="option' + (index + 1) + '" data-pro-id="' + v + '" id="select-item' + (i + 1) + '-option' + (index + 1) + '">';
                    } else {
                        htmlDetail += '<select class="filter-option disable" name="option' + (index + 1) + '" data-pro-id="' + v + '" id="select-item' + (i + 1) + '-option' + (index + 1) + '">';
                    }
                    if (is_vrt_combo) {
                        htmlDetail += '<option value="' + vrt_combo.title + '">' + vrt_combo.title + '</option>';
                    } else {
                        op.value.forEach((p) => {
                            var isDisabled = false;
                            var variant = result[v].variants.find((item) => item.title.includes(p));
                            if (variant) isDisabled = !variant.available;
                            if (isDisabled) htmlDetail += '<option disabled value="' + p + '">' + p + '</option>';
                            else htmlDetail += '<option value="' + p + '">' + p + '</option>';
                        });
                    }
                    htmlDetail += '</select>';
                    htmlDetail += '</div>'
                });
            } else {
                var indexOption = -1;
                result[v].options.forEach((op, i) => {
                    if (op.name == "Màu sắc") {
                        indexOption = i;
                        return false;
                    }
                });
                var colorFirst = result[v].variants[indexOption].optionColor;
                var available = result[v].variants.filter(item => item.available && item.optionColor[0] == colorFirst);

                var valueOption2 = "";
                //var sortResult = [result[v].options.find((item) => item.name === "Màu sắc"),...result[v].options.filter((item) => item.name !== "Màu sắc")]
                if (is_vrt_combo) {
                    htmlDetail += '<div class="select-option option1" data-option="option1">'
                    htmlDetail += '<select class="filter-option" name="option1" data-pro-id="' + v + '" id="select-item' + (i + 1) + '-option' + (i + 1) + '">';
                    htmlDetail += '<option value="' + vrt_combo.title + '">' + vrt_combo.title + '</option>';
                    htmlDetail += '</select>';
                    htmlDetail += '</div>'
                } else {
                    result[v].options.forEach((op, index) => {
                        if (op.name == "Màu sắc") indexOption = index;
                        htmlDetail += '<div class="select-option option' + (index + 1) + '" data-option="option' + (index + 1) + '">';
                        if (op.value.length != 1) {
                            htmlDetail += '<select class="filter-option" onchange="HRT.Product.onchange_op' + (index + 1) + '(this,' + v + ',' + index + ')" name="option' + (index + 1) + '" data-pro-id="' + v + '" id="select' + (i + 1) + '-option' + (index + 1) + '">';
                        } else {
                            htmlDetail += '<select class="filter-option disable" onchange="HRT.Product.onchange_op' + (index + 1) + '(this,' + v + ',' + index + ')" name="option' + (index + 1) + '" data-pro-id="' + v + '" id="select' + (i + 1) + '-option' + (index + 1) + '">';
                        }
                        if (index == 1) {
                            op.value.forEach((p, i) => {
                                if (i == 0) valueOption2 = p;
                                var variant = available.find((item) => item.title.includes(p));
                                if (variant) htmlDetail += '<option value="' + p + '">' + p + '</option>';
                                else htmlDetail += '<option disabled value="' + p + '">' + p + '</option>';
                            });
                        } else if (index == 2) {
                            available = result[v].variants.filter(item => item.available && item.optionColor[0] == colorFirst && item.title.includes(colorFirst + ' / ' + valueOption2));
                            op.value.forEach((p) => {
                                var variant = available.find((item) => item.title.includes(p));
                                if (variant) htmlDetail += '<option value="' + p + '">' + p + '</option>';
                                else htmlDetail += '<option disabled value="' + p + '">' + p + '</option>';
                            });
                        } else {
                            op.value.forEach((p) => {
                                var variant = result[v].variants.find((item) => item.title.includes(p));
                                htmlDetail += '<option value="' + p + '">' + p + '</option>';
                            });
                        }
                        htmlDetail += '</select>';
                        htmlDetail += '</div>'
                    });
                }
            }
            htmlDetail += '</div>'
            htmlDetail += '</div>'
            htmlDetail += '</div>'
            htmlDetail += '<div class="combo-item--bottom">';
            if (is_vrt_combo) {
                htmlDetail += '<p class="combo-item--priceInit"><span><b>' + Haravan.formatMoney(vrt_combo.price * 100, formatMoney) + '</b>' + (vrt_combo.price < vrt_combo.compare_at_price ? '<del>' + Haravan.formatMoney(vrt_combo.compare_at_price * 100, formatMoney) + '</del>' : '') + '</span></p>';
                htmlDetail += '<p class="combo-item--price"><span class="price-tt">Giảm còn: </span><span class="price-cb">' + Haravan.formatMoney(dtPrice * dtQty * 100, formatMoney) + '</span>' + (vrt_combo.price > dtPrice ? '<del>' + Haravan.formatMoney(vrt_combo.price * dtQty * 100, formatMoney) + '</del>' : '') + '</p>';
            } else {
                htmlDetail += '<p class="combo-item--priceInit"><span><b>' + Haravan.formatMoney(result[v].price * 100, formatMoney) + '</b>' + (result[v].price < result[v].compare_at_price ? '<del>' + Haravan.formatMoney(result[v].compare_at_price * 100, formatMoney) + '</del>' : '') + '</span></p>';
                htmlDetail += '<p class="combo-item--price"><span class="price-tt">Giảm còn: </span><span class="price-cb">' + Haravan.formatMoney(dtPrice * dtQty * 100, formatMoney) + '</span>' + (result[v].price > dtPrice ? '<del>' + Haravan.formatMoney(result[v].price * dtQty * 100, formatMoney) + '</del>' : '') + '</p>';
            }
            htmlDetail += '</div>';
            htmlDetail += '</div>';
            htmlDetail += '</div>';
            //}
        });
        htmlDetail += '</div>';
        htmlDetail += '</div>'; //end list item

        htmlDetail += '<div class="combo-content--total">';
        htmlDetail += '<div class="wrapbox-total">'
        htmlDetail += '<div class="combo-total">'
        htmlDetail += '<p class="txt1">Tổng tiền: <span class="combo-total-price">' + Haravan.formatMoney(totalPriceCombo * 100, formatMoney) + '</span></p>';
        htmlDetail += '<p class="txt2">Tiết kiệm: <span class="combo-total-priceInit">' + Haravan.formatMoney(totalPriceInit * 100 - totalPriceCombo * 100, formatMoney) + '</span></p>';
        htmlDetail += '</div>'
        htmlDetail += '<button type="button" class="add-combo">Thêm ' + nCombo.length + ' vào giỏ hàng</button>'
        htmlDetail += '</div>';
        htmlDetail += '</div>';
        return htmlDetail;
    },
    uniques: function(arr) {
        var a = [];
        for (var i = 0, l = arr.length; i < l; i++)
            if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
                a.push(arr[i]);
        return a;
    },
    updateInfoItemCombo: function(e, id, indexCombo, resulData) {
        if (resulData.img == null) {
            resulData.img = " ";
        }
        $(e).parents('.combo-item--detail').find('.combo-item--title input').attr('value', resulData.id);
        $(e).parents('.combo-item .combo-item--detail').siblings().find('img').attr('src', resulData.img);
        if (checkIsCombo) {
            $(e).parents('.combo-item--detail').find('.combo-item--price').html('<span class="price-tt">Giảm còn:</span><span class="price-cb">' + Haravan.formatMoney(HRT.Product.render_price(resulData, dataItemsCombo[indexCombo][id]).price * 100, formatMoney) + '</span>' + '<del>' + Haravan.formatMoney(resulData.price * 100, formatMoney) + '</del>');
        } else {
            $(e).parents('.combo-item--detail').find('.combo-item--price').html('&nbsp');
        }
        if (resulData.price < resulData.compare_at_price) {
            $(e).parents('.combo-item--detail').find('.combo-item--priceInit span del').removeClass("d-none");
            $(e).parents('.combo-item--detail').find('.combo-item--priceInit span b').html(Haravan.formatMoney(resulData.price * 100, formatMoney));
            $(e).parents('.combo-item--detail').find('.combo-item--priceInit span del').html(Haravan.formatMoney(resulData.compare_at_price * 100, formatMoney));
        } else {
            $(e).parents('.combo-item--detail').find('.combo-item--priceInit span b').html(Haravan.formatMoney(resulData.price * 100, formatMoney));
            $(e).parents('.combo-item--detail').find('.combo-item--priceInit span del').addClass("d-none");
        }
    },
    updatePriceTotalCombo: function(e, id, index, strValue, resulData) {
        var totalPriceCombo = 0;
        var totalPriceInit = 0;
        var indexCombo = $(e).parents('.combo-info--content').attr('data-combo-index');
        var priceItemCb = HRT.Product.render_price(resulData, dataItemsCombo[indexCombo][id]);
        var dtPrice = $.isEmptyObject(priceItemCb) ? resulData.price : priceItemCb.price;
        var dtQty = $.isEmptyObject(priceItemCb) ? 1 : priceItemCb.quantity;

        $(e).parents('.combo-item--detail').find('.combo-item--title input').attr('data-origin', resulData.price);
        $(e).parents('.combo-item--detail').find('.combo-item--title input').attr('data-km', resulData.compare_at_price);
        $(e).parents('.combo-item--detail').find('.combo-item--title input').attr('data-combo', dtPrice);

        if (checkIsCombo) {
            $(e).parents('.combo-info--content').find('.combo-item:not(.disabled)').each((i, v) => {
                var itemPrice = $(e).parents('.combo-info--content').find('.combo-item:eq(' + i + ') .combo-item--price .price-cb').html();
                var itemPriceFirst = $(e).parents('.combo-info--content').find('.combo-item:eq(' + i + ') .combo-item--price del').html();
                var parsrPrice = parseInt(itemPrice.replace(/₫/g, "").replace(/,/g, ""));
                var parsrPriceFirst = parseInt(itemPriceFirst.replace(/₫/g, "").replace(/,/g, ""));
                totalPriceCombo += parsrPrice;
                totalPriceInit += parsrPriceFirst;
            });
        } else {
            $(e).parents('.combo-info--content').find('.combo-item:not(.disabled)').each((i, v) => {
                var itemPrice = $(e).parents('.combo-info--content').find('.combo-item:not(.disabled):eq(' + i + ') .combo-item--priceInit b').html();
                var itemPriceFirst = $(e).parents('.combo-info--content').find('.combo-item:not(.disabled):eq(' + i + ') .combo-item--priceInit del').html();
                var parsrPrice = parseInt(itemPrice.replace(/₫/g, "").replace(/,/g, ""));
                if (itemPriceFirst == undefined) itemPriceFirst = itemPrice;
                var parsrPriceFirst = parseInt(itemPriceFirst.replace(/₫/g, "").replace(/,/g, ""));
                totalPriceCombo += parsrPrice;
                totalPriceInit += parsrPriceFirst;
            });
        }
        $(e).parents('.combo-info--content').find('.combo-content--total .combo-total-price').html(Haravan.formatMoney(totalPriceCombo * 100, formatMoney));
        $(e).parents('.combo-info--content').find('.combo-content--total .combo-total-priceInit').html(Haravan.formatMoney(totalPriceInit * 100 - totalPriceCombo * 100, formatMoney));

    },
    renderCombo: function(currentId, view) {
        var aIdCombo = [],
            aIdSearch = [],
            nameCombo = [];
        htmlQvApp = htmlCombo = "";
        dataItemsCombo = [];
        var comboDOM = (view != undefined ? '#quickview-template .combo-info' : '.layout-productDetail .combo-info');
        //var parentDOM = (view != undefined?'#quickview-template':'.products-detail-js .combo-info');
        $.get('https://combo-omni.haravan.com/js/list_recommendeds?product_id=' + currentId).done(function(data) {
            if (data.length > 0) {
                $.each(data, function(i, v) {
                    var temp = [];
                    var temp2 = {};
                    $.each(v.recommendeds, function(j, k) {
                        temp.push(k.product_id);
                        aIdSearch.push(k.product_id);
                        temp2[k.product_id] = k;
                    });
                    aIdCombo.push(temp);
                    dataItemsCombo.push(temp2);
                    nameCombo.push(v.name_combo)
                });
                aIdSearch = HRT.Product.uniques(aIdSearch);
                var str = "/search?q=filter=((id:product=" + aIdSearch.join(')||(id:product=') + '))';
                $.get(str + '&view=datacombo').done(function(result) {
                    result = JSON.parse(result);
                    $.each(aIdCombo, function(i, v) {
                        var allAvailable = true;
                        /* Kiểm tra có item nào trong combo ko valid thì không hiển thị */
                        /* Hoặc có item nào bị ẩn thì ko hiển thị */
                        $.each(v, function(j, k) {
                            if (result[k]) {
                                if (dataItemsCombo[i][k].is_apply_by_variant) {
                                    var apply_length = dataItemsCombo[i][k].apply_productvariants.length;
                                    /*$.each(dataItemsCombo[i][k].apply_productvariants,function(l,m){
                                    	if(!result[k].variants[m.id].available){
                                    		allAvailable = false;
                                    		if(apply_length == 1) return false;
                                    		else m = null;
                                    	}
                                    });*/
                                } else {
                                    if (!result[k].available) {
                                        allAvailable = false;
                                        return false;
                                    }
                                }
                            } else {
                                allAvailable = false;
                                return false;
                            }
                        });
                        /* End Kiểm tra */

                        /* Nếu kiểm tra các item trong combo đều còn hàng thì render */
                        if (allAvailable) {
                            htmlCombo += '<div class="combo-info--content" data-combo-index="' + i + '">';
                            //var htmlImg = render_img(result,v);
                            //var htmlDetail = render_detail(result,i,v,currentId);
                            htmlCombo += '<div class="combo-content--name">' + nameCombo[i] + '</div>';
                            var htmlDetail = HRT.Product.render_items(result, i, v, currentId);
                            //htmlCombo += htmlImg;
                            htmlCombo += htmlDetail;
                            htmlCombo += '</div>';
                        }
                    });

                    if (htmlCombo != '') {
                        $(comboDOM).append(htmlCombo).removeClass('d-none');
                        if (view != undefined) {
                            htmlQvApp = htmlCombo;
                        }
                    }
                });
            } else {
                if (view == 'quickview') {
                    //return htmlCombo || '';
                    return htmlCombo;
                }
            }
        });
    },
    changeOptionCombo: function() {
        $(document).on('change', '.layout-productDetail .combo-info input[name="combo-option"]:not(.force)', function() {
            var ind = $(this).parents('.combo-item').index();
            var total = 0;
            var totalKm = 0;
            if (ind >= 0) {
                if ($(this).is(':checked')) {
                    //$(this).parents('.combo-info--content').find('.combo-item:nth-child('+(ind*2 + 1)+')'+'.combo-item--images a').removeClass('disabled');
                    $(this).parents('.combo-info--content').find('.combo-item:nth-child(' + (ind * 1 + 1) + ')').removeClass('disabled');
                } else {
                    $(this).parents('.combo-info--content').find('.combo-item:nth-child(' + (ind * 1 + 1) + ')').addClass('disabled');
                }
                var numCombo = $(this).parents('.combo-info--content').find('input').length;
                var numCheck = $(this).parents('.combo-info--content').find('input:checked').length;
                $(this).parents('.combo-info--content').find('input').each(function() {
                    var combo = parseInt($(this).attr('data-combo').trim());
                    var qty = parseInt($(this).attr('data-quantity').trim());
                    var origin = parseInt($(this).attr('data-origin').trim());
                    if (numCombo == numCheck) {
                        checkIsCombo = true;
                        total += combo * qty;
                        totalKm += origin * qty - combo * qty;
                        var htmlDel = '';
                        if (origin > combo) {
                            htmlDel += '<del>' + Haravan.formatMoney(origin * qty * 100, formatMoney) + '</del>';
                        }
                        $(this).parents('.combo-item').find('.combo-item--price').html('<span class="price-tt">Giảm còn: </span><span class="price-cb">' + Haravan.formatMoney(combo * qty * 100, formatMoney) + '</span>' + htmlDel);
                    } else {
                        checkIsCombo = false;
                        $(this).parents('.combo-item--detail').find('.combo-item--price').html('&nbsp');
                        var origin = parseInt($(this).attr('data-origin').trim());
                        var priceKm = parseInt($(this).attr('data-km').trim());
                        if (priceKm == 0) priceKm = origin;

                        $(this).parents('div.combo-item').find('.combo-item--price').html(Haravan.formatMoney(origin * qty * 100, formatMoney));
                        $(this).parents('div.combo-item').find('.combo-item--price').html('&nbsp');
                        if ($(this).is(':checked')) total += origin * qty, totalKm += priceKm * qty - origin * qty;
                    }
                });
                $(this).parents('.combo-info--content').find('.combo-total-price').html(Haravan.formatMoney(total * 100, formatMoney));
                $(this).parents('.combo-info--content').find('.combo-total-priceInit').html(Haravan.formatMoney(totalKm * 100, formatMoney));
                $(this).parents('.combo-info--content').find('.add-combo').html('Thêm ' + (numCheck == 1 ? '' : numCheck + ' ') + 'vào giỏ hàng');
            }
            //var parents = $(this).parents('.products-detail-js').attr('id');
            //var checkcount = $('#'+parents+' input[name="combo-option"]:checked').length;
            //$(this).parents('.combo-info--content').find('.add-combo').html('Thêm '+(checkcount == 1 ? '' : checkcount + ' ')+'vào giỏ hàng');
        });
    },
    changeOptionFirstCombo: function() {
        jQuery(document).on('change', '.combo-item--option [name="option1"]', function(e) {
            var vrtSize = $(this).parents('.combo-item--option ').find('.select-option').length;
            var name = $(this).attr('name');
            var pro_id = $(this).attr('data-pro-id');
            var index = $(this).parents('.combo-item').index();
            var indexCombo = $(this).parents('.combo-info--content').attr('data-combo-index');
            var totalPriceCombo = 0;
            var totalPriceInit = 0;
            //var dtPrice = $.isEmptyObject(dtCombo)?result[v].price:dtCombo.price;
            if (vrtSize == 1) {
                var strValue = $(this).val();
                var resulData = variantItem[0][pro_id].variants.find(item => item.title == strValue);

                if (resulData.img == null) {
                    resulData.img = " ";
                }
                $(this).parents('.combo-item--detail').find('.combo-item--title input').attr('value', resulData.id);
                $(this).parents('.combo-item .combo-item--detail').siblings().find('img').attr('src', resulData.img);

                if (resulData.price < resulData.compare_at_price) {
                    $(this).parents('.combo-item--detail').find('.combo-item--priceInit span del').removeClass("d-none");
                    $(this).parents('.combo-item--detail').find('.combo-item--priceInit span b').html(Haravan.formatMoney(resulData.price * 100, formatMoney));
                    $(this).parents('.combo-item--detail').find('.combo-item--priceInit span del').html(Haravan.formatMoney(resulData.compare_at_price * 100, formatMoney));
                } else {
                    $(this).parents('.combo-item--detail').find('.combo-item--priceInit span b').html(Haravan.formatMoney(resulData.price * 100, formatMoney));
                    $(this).parents('.combo-item--detail').find('.combo-item--priceInit span del').addClass("d-none");
                }

                var priceItemCb = HRT.Product.render_price(resulData, dataItemsCombo[indexCombo][pro_id]);
                var dtPrice = $.isEmptyObject(priceItemCb) ? resulData.price : priceItemCb.price;
                var dtQty = $.isEmptyObject(priceItemCb) ? 1 : priceItemCb.quantity;

                $(this).parents('.combo-item--detail').find('.combo-item--title input').attr('data-origin', resulData.price);
                $(this).parents('.combo-item--detail').find('.combo-item--title input').attr('data-km', resulData.compare_at_price);
                $(this).parents('.combo-item--detail').find('.combo-item--title input').attr('data-combo', dtPrice);

                if (checkIsCombo) {
                    $(this).parents('.combo-item--detail').find('.combo-item--price').html('<span class="price-tt">Giảm còn:</span><span class="price-cb">' + Haravan.formatMoney(HRT.Product.render_price(resulData, dataItemsCombo[indexCombo][pro_id]).price * 100, formatMoney) + '</span>' + '<del>' + Haravan.formatMoney(resulData.price * 100, formatMoney) + '</del>');
                    $(this).parents('.combo-info--content').find('.combo-item:not(.disabled)').each((i, v) => {
                        var itemPrice = $(this).parents('.combo-info--content').find('.combo-item:eq(' + i + ') .combo-item--price .price-cb').html();
                        var itemPriceFirst = $(this).parents('.combo-info--content').find('.combo-item:eq(' + i + ') .combo-item--price del').html();
                        var parsrPrice = parseInt(itemPrice.replace(/₫/g, "").replace(/,/g, ""));
                        var parsrPriceFirst = parseInt(itemPriceFirst.replace(/₫/g, "").replace(/,/g, ""));
                        totalPriceCombo += parsrPrice;
                        totalPriceInit += parsrPriceFirst;
                    });
                } else {
                    $(this).parents('.combo-item--detail').find('.combo-item--price').html('&nbsp');
                    $(this).parents('.combo-info--content').find('.combo-item:not(.disabled)').each((i, v) => {
                        var itemPrice = $(this).parents('.combo-info--content').find('.combo-item:not(.disabled):eq(' + i + ') .combo-item--priceInit b').html();
                        var itemPriceFirst = $(this).parents('.combo-info--content').find('.combo-item:not(.disabled):eq(' + i + ') .combo-item--priceInit del').html();
                        var parsrPrice = parseInt(itemPrice.replace(/₫/g, "").replace(/,/g, ""));
                        if (itemPriceFirst == undefined) itemPriceFirst = itemPrice;
                        var parsrPriceFirst = parseInt(itemPriceFirst.replace(/₫/g, "").replace(/,/g, ""));
                        totalPriceCombo += parsrPrice;
                        totalPriceInit += parsrPriceFirst;
                    });
                }
                //console.log(totalPriceCombo,totalPriceInit)
                $(this).parents('.combo-info--content').find('.combo-content--total .combo-total-price').html(Haravan.formatMoney(totalPriceCombo * 100, formatMoney));
                $(this).parents('.combo-info--content').find('.combo-content--total .combo-total-priceInit').html(Haravan.formatMoney(totalPriceInit * 100 - totalPriceCombo * 100, formatMoney));

            }
        })
    },
    onchange_op1: function(e, id, index) {
        var vrtSize = $(e).parents('.combo-item--option ').find('.select-option').length;
        var value1 = $(e).val();
        var value2 = $(e).parents('.combo-item--option').find('[name="option2"]').val();
        var value3 = $(e).parents('.combo-item--option').find('[name="option3"]').val();
        var indexCombo = $(e).parents('.combo-info--content').attr('data-combo-index');

        if (vrtSize == 2) {
            var available = variantItem[0][id].variants.filter(item => item.available && item.optionColor[0] == value1);
            $(e).parents('.combo-item--option').find('[name="option2"] option').each((i) => {
                var name = ($(e).parents('.combo-item--option').find('[name="option2"] option:eq(' + i + ')').val());
                var variant = available.find((item) => item.title.includes(value1 + ' / ' + name));
                if (variant != undefined) $(e).parents('.combo-item--option').find('[name="option2"] option[value=' + name + ']').prop("disabled", false);
                else $(e).parents('.combo-item--option').find('[name="option2"] option[value=' + name + ']').prop("disabled", true);
            });
            $(e).parents('.combo-item--option').find('[name="option2"]').val($(e).parents('.combo-item--option').find('[name="option2"] option:not([disabled]):first').val());
            var strValue = value1 + ' / ' + $(e).parents('.combo-item--option').find('[name="option2"]').val();
            var resulData = variantItem[0][id].variants.find(item => item.title == strValue);
            HRT.Product.updateInfoItemCombo(e, id, indexCombo, resulData);
            HRT.Product.updatePriceTotalCombo(e, id, index, strValue, resulData);
        } else {
            var available = variantItem[0][id].variants.filter(item => item.available && item.optionColor[0] == value1);
            $(e).parents('.combo-item--option').find('[name="option2"] option').each((i) => {
                var name = ($(e).parents('.combo-item--option').find('[name="option2"] option:eq(' + i + ')').val());
                var variant = available.find((item) => item.title.includes(value1 + ' / ' + name));
                if (variant != undefined) $(e).parents('.combo-item--option').find('[name="option2"] option[value=' + name + ']').prop("disabled", false);
                else $(e).parents('.combo-item--option').find('[name="option2"] option[value=' + name + ']').prop("disabled", true);
            });
            $(e).parents('.combo-item--option').find('[name="option2"]').val($(e).parents('.combo-item--option').find('[name="option2"] option:not([disabled]):first').val());
            $(e).parents('.combo-item--option').find('[name="option3"] option').each((i) => {
                var name = ($(e).parents('.combo-item--option').find('[name="option3"] option:eq(' + i + ')').val());
                var variant = available.find((item) => item.title.includes(value1 + ' / ' + $(e).parents('.combo-item--option').find('[name="option2"]').val() + ' / ' + name));
                if (variant != undefined) $(e).parents('.combo-item--option').find('[name="option3"] option[value=' + name + ']').prop("disabled", false);
                else $(e).parents('.combo-item--option').find('[name="option3"] option[value=' + name + ']').prop("disabled", true);
            });
            $(e).parents('.combo-item--option').find('[name="option3"]').val($(e).parents('.combo-item--option').find('[name="option3"] option:not([disabled]):first').val());

            //console.log($(e).parents('.combo-item--option').find('[name="option2"]').val())
            var strValue = value1 + ' / ' + $(e).parents('.combo-item--option').find('[name="option2"]').val() + ' / ' + $(e).parents('.combo-item--option').find('[name="option3"]').val();
            var resulData = variantItem[0][id].variants.find(item => item.title == strValue);
            HRT.Product.updateInfoItemCombo(e, id, indexCombo, resulData);
            HRT.Product.updatePriceTotalCombo(e, id, index, strValue, resulData);
        }
    },
    onchange_op2: function(e, id, index) {
        var vrtSize = $(e).parents('.combo-item--option ').find('.select-option').length;
        var value1 = $(e).parents('.combo-item--option').find('[name="option1"]').val();
        var value2 = $(e).parents('.combo-item--option').find('[name="option2"]').val();
        var value3 = $(e).parents('.combo-item--option').find('[name="option3"]').val();
        if (vrtSize == 2) {
            var strValue = value1 + ' / ' + value2;
            var indexCombo = $(e).parents('.combo-info--content').attr('data-combo-index');
            var resulData = variantItem[0][id].variants.find(item => item.title == strValue);
            HRT.Product.updateInfoItemCombo(e, id, indexCombo, resulData);
            HRT.Product.updatePriceTotalCombo(e, id, index, strValue, resulData);
        } else {
            var available = variantItem[0][id].variants.filter(item => item.available && item.optionColor[0] == value1);
            $(e).parents('.combo-item--option').find('[name="option3"] option').each((i) => {
                var name = ($(e).parents('.combo-item--option').find('[name="option3"] option:eq(' + i + ')').val());
                var variant = available.find((item) => item.title.includes(value1 + ' / ' + $(e).parents('.combo-item--option').find('[name="option2"]').val() + ' / ' + name));
                if (variant != undefined) $(e).parents('.combo-item--option').find('[name="option3"] option[value=' + name + ']').prop("disabled", false);
                else $(e).parents('.combo-item--option').find('[name="option3"] option[value=' + name + ']').prop("disabled", true);
            });
            $(e).parents('.combo-item--option').find('[name="option3"]').val($(e).parents('.combo-item--option').find('[name="option3"] option:not([disabled]):first').val());
            var strValue = value1 + ' / ' + value2 + ' / ' + $(e).parents('.combo-item--option').find('[name="option3"]').val();
            var indexCombo = $(e).parents('.combo-info--content').attr('data-combo-index');
            var resulData = variantItem[0][id].variants.find(item => item.title == strValue);
            HRT.Product.updateInfoItemCombo(e, id, indexCombo, resulData);
            HRT.Product.updatePriceTotalCombo(e, id, index, strValue, resulData);
        }
    },
    onchange_op3: function(e, id, index) {
        var value1 = $(e).parents('.combo-item--option').find('[name="option1"]').val();
        var value2 = $(e).parents('.combo-item--option').find('[name="option2"]').val();
        var value3 = $(e).parents('.combo-item--option').find('[name="option3"]').val();
        var strValue = value1 + ' / ' + value2 + ' / ' + value3;
        var indexCombo = $(e).parents('.combo-info--content').attr('data-combo-index');

        var resulData = variantItem[0][id].variants.find(item => item.title == strValue);
        //console.log(resulData)
        HRT.Product.updateInfoItemCombo(e, id, indexCombo, resulData);
        HRT.Product.updatePriceTotalCombo(e, id, index, strValue, resulData);
    },
    addCombo: function(indx, aItems, callback) {
        if (indx < aItems.length) {
            $.ajax({
                url: '/cart/add.js',
                type: 'POST',
                data: 'id=' + aItems[indx].vid + '&quantity=' + aItems[indx].qty,
                async: false,
                success: function(data) {
                    indx++;
                    HRT.Product.addCombo(indx, aItems, callback);
                },
                error: function() {

                }
            });
        } else {
            if (typeof callback === 'function') return callback();
        }
    },
    clickAddCombo: function() {
        $(document).on('click', '.layout-productDetail .combo-info .add-combo', function() {
            var aItems = [];
            $(this).parents('.combo-info--content').find('input:checked').each(function() {
                var temp = {};
                temp.vid = $(this).val();
                //temp.qty = $(this).attr('data-quantity');
                temp.qty = parseInt($(this).attr('data-quantity')) * parseInt($('#quantity').val());
                aItems.push(temp);
            });
            HRT.Product.addCombo(0, aItems, function() {
                //window.location = '/cart';
                HRT.All.getCartModal(false);
                HRT.All.sidenav_open($site_cart, '#js-sitenav-cart', 'js-current')
                //if($(window).width() < 992){
                //$('body').addClass('locked-scroll');
                //$('.sidebar-main').addClass('is-show-right');
                //$('.sidebar-main .sitenav-cart').addClass('show');
                //}
            });
        });
    },
    moreFaqs: function() {
        $('.js-btn-faq').click(function() {
            $(this).hide();
            $(".faq-item").removeClass('d-none');
        })
    },
    slideRelatedMb: function() {
        if (jQuery(window).width() < 768) {
            var swiper = new Swiper("#slideRelated-style01", {
                slidesPerView: 2,
                spaceBetween: 4,
                navigation: {
                    nextEl: ".swiper-related-next",
                    prevEl: ".swiper-related-prev",
                },
            });
        }
    }
}

HRT.Page = {
    init: function() {
        var that = this;
        that.slideAbout02Client();
        that.slideAbout03Intro();
        that.navTabsHover();
        that.navTabsCenter();
        that.toggleFaqs();
    },
    slideAbout02Client: function() {
        var swiper = new Swiper("#about02-slide-client", {
            navigation: {
                nextEl: ".swiper-client-next",
                prevEl: ".swiper-client-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });
    },
    slideAbout03Intro: function() {
        var swiper = new Swiper("#about03-slide-intro", {
            lazy: true,
            loop: true,
            navigation: {
                nextEl: ".swiper-intro-next",
                prevEl: ".swiper-intro-prev",
            },
        });
    },
    navTabsHover: function() {
        $('.nav-tabs .hover-tabjs').hover(function() {
            $('.hover-tabjs').removeClass('active');
            $('.tab-pane').removeClass('active').removeClass('show');
            $(this).tab('show');
        });
    },
    navTabsCenter: function() {
        if (jQuery(window).width() > 767) {
            var maxHeight = 0;
            $('.box-wrapper').each(function() {
                var thisHeight = parseInt($(this).outerHeight());
                maxHeight = (maxHeight >= thisHeight ? maxHeight : thisHeight);
            });
            $('.box-wrapper').css('min-height', maxHeight);
        }
    },
    toggleFaqs: function() {
        $('.header-faqs').on('click', function() {
            if (!$(this).hasClass('opened')) {
                jQuery('.header-faqs').removeClass('opened').parent().find('.content-faqs').stop().slideUp('medium');
                jQuery(this).toggleClass('opened').parent().find('.content-faqs').stop().slideToggle('medium');
            } else {
                jQuery(this).toggleClass('opened').parent().find('.content-faqs').stop().slideToggle('medium');
            }
        });
    },
}

HRT.Article = {
    init: function() {
        var that = this;
        that.sliderRelatedBlog();
        that.tbOfContentsArt();
    },
    tbOfContentsArt: function() {
        if ($('.article-table-contents').length > 0) {
            function urlfriendly(slug) {
                //Đổi chữ hoa thành chữ thường
                //Đổi ký tự có dấu thành không dấu
                slug = slug.toLowerCase();
                slug = slug.trim().replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
                slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
                slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
                slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
                slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
                slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
                slug = slug.replace(/đ/gi, 'd');
                //Xóa các ký tự đặt biệt
                slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '_');
                //Đổi khoảng trắng thành ký tự gạch ngang
                slug = slug.replace(/ /gi, "_");
                //Đổi nhiều ký tự gạch ngang liên tiếp thành 1 ký tự gạch ngang
                //Phòng trường hợp người nhập vào quá nhiều ký tự trắng
                slug = slug.replace(/\-\-\-\-\-/gi, '_');
                slug = slug.replace(/\-\-\-\-/gi, '_');
                slug = slug.replace(/\-\-\-/gi, '_');
                slug = slug.replace(/\-\-/gi, '_');
                //Xóa các ký tự gạch ngang ở đầu và cuối
                slug = '@' + slug + '@';
                slug = slug.replace(/\@\-|\-\@|\@/gi, '');
                //In slug ra textbox có id “slug”
                return slug;
            };
            class TableOfContents {
                constructor({
                    from,
                    to
                }) {
                    this.fromElement = from;
                    this.toElement = to;
                    // Get all the ordered headings.
                    this.headingElements = this.fromElement.querySelectorAll("h1, h2, h3,h4,h5,h6");
                    this.tocElement = document.createElement("div")
                }
                /*  Get the most important heading level.
        For example if the article has only <h2>, <h3> and <h4> tags
        this method will return 2.
     */
                getMostImportantHeadingLevel() {
                    let mostImportantHeadingLevel = 6; // <h6> heading level
                    for (let i = 0; i < this.headingElements.length; i++) {
                        let headingLevel = TableOfContents.getHeadingLevel(this.headingElements[i]);
                        mostImportantHeadingLevel = (headingLevel < mostImportantHeadingLevel) ?
                            headingLevel : mostImportantHeadingLevel;
                    }
                    return mostImportantHeadingLevel;
                }
                static generateId(headingElement) {
                    return urlfriendly(headingElement.textContent)
                }
                static getHeadingLevel(headingElement) {
                    switch (headingElement.tagName.toLowerCase()) {
                        case "h2":
                            return 2;
                        case "h3":
                            return 3;
                            break;
                        default:
                            return 4;
                    }
                }
                generateTable() {
                    let currentLevel = this.getMostImportantHeadingLevel() - 1,
                        currentElement = this.tocElement;
                    for (let i = 0; i < this.headingElements.length; i++) {
                        let headingElement = this.headingElements[i],
                            headingLevel = TableOfContents.getHeadingLevel(headingElement),
                            headingLevelDifference = headingLevel - currentLevel,
                            linkElement = document.createElement("a");
                        if (!headingElement.id) {
                            headingElement.id = TableOfContents.generateId(headingElement);
                        }
                        linkElement.href = `#${headingElement.id}`;
                        linkElement.textContent = headingElement.textContent;

                        if (headingLevelDifference > 0) {
                            // Go down the DOM by adding list elements.
                            for (let j = 0; j < headingLevelDifference; j++) {
                                let listElement = document.createElement("ul"),
                                    listItemElement = document.createElement("li");
                                listElement.appendChild(listItemElement);
                                currentElement.appendChild(listElement);
                                currentElement = listItemElement;
                            }
                            currentElement.appendChild(linkElement);
                        } else {
                            // Go up the DOM.
                            for (let j = 0; j < -headingLevelDifference; j++) {
                                currentElement = currentElement.parentNode.parentNode;
                            }
                            let listItemElement = document.createElement("li");
                            listItemElement.appendChild(linkElement);
                            currentElement.parentNode.appendChild(listItemElement);
                            currentElement = listItemElement;
                        }
                        currentLevel = headingLevel;
                    }
                    if (this.tocElement.firstChild != null) {
                        this.toElement.appendChild(this.tocElement.firstChild);
                    } else {
                        document.getElementById("table-content-container").remove();
                    }
                }
            }
            (function($) {
                var stringtemplate = $('<div id="table-content-container" class="table-of-contents"><div class="table-title"><div class="htitle">Các nội dung chính<span class="toc_toggle">[<a class="icon-list" href="javascript:void(0)">Ẩn</a>]</span></div></div></div>');
                stringtemplate.insertBefore(".article-table-contents");

                new TableOfContents({
                    from: document.querySelector(".article-table-contents"),
                    to: document.querySelector("#table-content-container")
                }).generateTable();
                $("#table-content-container .icon-list").click(function() {
                    $(this).parents("#table-content-container").find("ul:first").slideToggle({
                        direction: "left"
                    }, 100);
                    var texxx = $(this).text();
                    if (texxx == "Ẩn") {
                        $(this).html("Hiện")
                    } else {
                        $(this).html("Ẩn")
                    }
                })

                var buttontable = '<div class="table-content-button"><button class="btn-icolist"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 511.994 511.994"><path d="M35.537 292.17l-.225-.863 14.613-15.857c9.495-10.333 16.006-18.227 19.544-23.47s5.3-11.326 5.3-18.148c0-10.135-3.326-18.146-9.974-23.984-6.65-5.83-15.9-8.76-27.775-8.76-11.174 0-20.15 3.467-26.923 10.412S.06 226.807.3 236.795l.15.34 24.473.002c0-4.403 1.076-8.9 3.227-12.097s5.105-4.73 8.863-4.73c4.202 0 7.355 1.26 9.457 3.73s3.152 5.8 3.152 9.955c0 2.917-1.04 6.36-3.115 10.313s-5.72 8.458-10.122 13.5L1.28 294.304v15.478h74.847v-17.6h-40.6zM51.9 127.068V37.72L1.28 45.283v17.945h24.215v63.84H1.28v19.812h74.846v-19.812zm21.156 299.964c-3.265-4.33-7.8-7.542-13.574-9.668 5.092-2.325 9.16-5.55 12.2-9.677s4.56-8.643 4.56-13.534c0-9.84-3.5-17.442-10.53-22.806s-16.4-8.046-28.1-8.046c-10.087 0-18.665 2.67-25.736 8S1.418 384.007 1.716 392.6l.15.83h24.327c0-4.403 1.233-5.774 3.707-7.654s5.34-3 8.603-3c4.154 0 7.317 1.065 9.495 3.4s3.262 5.142 3.262 8.555c0 4.3-1.2 7.868-3.632 10.3s-5.884 3.837-10.384 3.837h-11.75v17.6h11.75c4.995 0 8.863 1.475 11.608 3.872s4.117 6.358 4.117 11.597c0 3.76-1.312 6.943-3.93 9.415s-6.133 3.74-10.534 3.74c-3.857 0-7.13-1.662-9.827-4s-4.042-4.803-4.042-9.206H.16l-.147.95c-.247 10.087 3.423 18.042 11.013 23.357s16.453 8.1 26.588 8.1c11.77 0 21.435-2.765 29-8.427S77.96 452.44 77.96 442.55c0-6.033-1.63-11.195-4.894-15.523zm75.7-64.426h363.227v72.645H148.767zm0-143.09h363.227v72.645H148.767zm0-147.483h363.227v72.645H148.767z"></path></svg></button> </div><div class="table-content-fixed"><div class="table-of-header"><span class="hTitle"> Các nội dung chính</span><span class="hClose"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512.001 512.001"><path d="M284.286 256.002L506.143 34.144c7.81-7.81 7.81-20.475 0-28.285s-20.475-7.81-28.285 0L256 227.717 34.143 5.86c-7.81-7.81-20.475-7.81-28.285 0s-7.81 20.475 0 28.285L227.715 256 5.858 477.86c-7.81 7.81-7.81 20.475 0 28.285C9.763 510.05 14.882 512 20 512a19.94 19.94 0 0 0 14.143-5.857L256 284.287l221.857 221.857C481.762 510.05 486.88 512 492 512a19.94 19.94 0 0 0 14.143-5.857c7.81-7.81 7.81-20.475 0-28.285L284.286 256.002z"></path></svg></span></div><div id="clone-table" class="table-of-contents"></div></div>';
                $("#article").append(buttontable).ready(function() {
                    var tablehtml = $("#table-content-container").html()
                    $("#clone-table").html(tablehtml);
                });
            })(jQuery);

            $('body').on('click', '#table-content-containe ul li a, #clone-tabl  ul li a', function(e) {
                e.preventDefault();
                var id = $(this).attr('href');
                $("html,body").animate({
                    scrollTop: $(id).offset().top - 70
                }, 600);
                $('.table-content-fixed').removeClass('active');
            })
            $('.table-content-button .btn-icolist').on('click', function(e) {

                $('.table-content-fixed').toggleClass('active');
            })
            $('.table-content-fixed .table-of-header .hClose').on('click', function(e) {
                $('.table-content-fixed').toggleClass('active');
            })
            if ($('#table-content-container').length > 0) {
                var ofsettop_ = $(".article-table-contents").offset().top - 300;
                $(window).scroll(function() {
                    if ($(window).scrollTop() > ofsettop_) {
                        $(".table-content-button").addClass('active');
                    } else {
                        $(".table-content-button").removeClass('active');
                        $('.table-content-fixed').removeClass('active');
                    }
                });
            }
        }
    },
    sliderRelatedBlog: function() {
        var swiper = new Swiper('#slideBlogsRelated', {
            slidesPerView: 3,
            spaceBetween: 30,
            loop: false,
            navigation: {
                nextEl: ".swiper-article-next",
                prevEl: ".swiper-article-prev",
            },
            breakpoints: {
                0: {
                    slidesPerView: 1.6,
                    spaceBetween: 15,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
            }
        });
    }
}

HRT.Blog = {
    init: function() {
        var that = this;
    },
}

HRT.Quickview = {
    init: function() {
        var that = this;
        that.showQuickview();
        that.closeQuickView();
        that.addCartProductQuickview();
    },
    renderQuickview: function(url, id, title, preorder) {
        jQuery.ajax({
            type: 'GET',
            url: url + (url.indexOf('?') > -1 ? '&' : '?') + "view=quickview",
            async: false,
            success: function(data) {
                htmlQv = data;
                $('#modal-quickview .wrapper-quickview').html(htmlQv);
                $('#modal-quickview').modal("show");
                if (preorder != undefined && preorder == true) {
                    $('#modal-quickview').addClass('has-preorder');
                } else {
                    $('#modal-quickview').removeClass('has-preorder');
                }
                setTimeout(function() {
                    HRT.Quickview.submitPreorderQv(url);
                }, 800);
            }
        });
        if ($('#modal-quickview').hasClass('show')) {
            $('.mainHeader').removeClass('hSticky-up');
        }
    },
    showQuickview: function() {
        jQuery(document).on("click", ".icon-quickview", function(e) {
            var id = $(this).closest('.product-loop').attr('data-id');
            var title = $(this).closest('.product-loop').find('.proloop-detail h3 a').html();
            var prolink = $(this).attr("data-handle");
            var proId = $(this).parents('.product-loop .product-inner').attr("data-proid");
            if ($(this).hasClass('is-preorder')) {
                var preorderQv = true;
            }

            if (jQuery(window).width() >= 768) {
                if (promotionApp) {
                    if (!$('.product-loop[data-id="' + id + '"]').find('.gift.product_gift_label').hasClass('d-none')) {
                        e.preventDefault();
                        //window.location.href = $(this).closest('.product-loop').find('a').attr('href');	
                        HRT.Quickview.renderQuickview(prolink, proId, title, preorderQv);
                        setTimeout(function() {
                            $('.modal-quickview .product-promotion').show();
                        }, 150);
                    } else {
                        e.preventDefault();
                        HRT.Quickview.renderQuickview(prolink, proId, title, preorderQv);
                    }
                } else {
                    e.preventDefault();
                    HRT.Quickview.renderQuickview(prolink, proId, title, preorderQv);
                }
            } else {
                window.location.href = $(this).closest('.product-loop').find('a').attr('href');
            }
        });
    },
    closeQuickView: function() {
        jQuery(window).on('popstate', function() {
            location.reload(true);
        });
        jQuery(document).on('click', '.quickview-close', function(e) {
            $('#modal-quickview').modal("hide");
        });
    },
    addCartProductQuickview: function() {
        $(document).on('click', '#add-to-cart-qv', function(e) {
            e.preventDefault();
            var min_qty = parseInt(jQuery('#quickview-qtyvalue[name="quantity"]').val());
            var variant_id = $('#product-select-qv').val();
            var product_id = $(this).attr('data-pid');
            var title = $('.modal-detailProduct h2').html();
            if ($(this).hasClass('add-xy')) {
                $(this).addClass('clicked_buy_qv');
                buyXgetY.addCartBuyXGetY_detail(false, variant_id, product_id, min_qty, title, 'quick-view', function() {
                    HRT.All.getCartModal(true);
                    $('#add-to-cartQuickview').removeClass('clicked_buy_qv');
                    $('#quick-view-modal').modal('hide');
                    if ($(window).width() < 992) {
                        HRT.All.sidenav_open($body, '#js-sitenav-cart', 'js-current')
                    }
                });
            } else {
                jQuery.ajax({
                    type: 'POST',
                    url: '/cart/add.js',
                    async: true,
                    data: 'quantity=' + min_qty + '&id=' + variant_id,
                    dataType: 'json',
                    success: function(line_item) {
                        if (template.indexOf('cart') > -1) {
                            var x = $('#layout-cart').offset().top;
                            window.scrollTo({
                                top: x,
                                behavior: 'smooth'
                            });
                            setTimeout(function() {
                                window.location.reload();
                            }, 300);
                        } else {
                            var image = '';
                            if (line_item['image'] == null) {
                                image = 'https://hstatic.net/0/0/global/noDefaultImage6.gif';
                            } else {
                                image = Haravan.resizeImage(line_item['image'], 'small');
                            }
                            var $info = '<div class="row"><div class="col-md-12 col-xs-12"><p class="jGowl-text">Đã thêm vào giỏ hàng thành công!</p></div><div class="col-md-4 col-xs-4"><a href="' + line_item['url'] + '"><img width="70px" src="' + image + '" alt="' + line_item['title'] + '"/></a></div><div class="col-md-8 col-xs-8"><div class="jGrowl-note"><a class="jGrowl-title" href="' + line_item['url'] + '">' + line_item['title'] + '</a><ins>' + Haravan.formatMoney(line_item['price'], formatMoney) + '</ins></div></div></div>';
                            $('#modal-quickview').modal('hide');
                            HRT.All.notifyProduct($info);
                            $('.proloop-actions[data-vrid="' + variant_id + '"] .proloop-value').val(line_item.quantity);
                            HRT.All.getCartModal();
                            if ($(window).width() < 992) {
                                HRT.All.sidenav_open($body, '#js-sitenav-cart', 'js-current')
                            }
                        }
                        $('.proloop-actions[data-vrid=' + variant_id + ']').addClass('action-count');
                    },
                    error: function(XMLHttpRequest, textStatus) {
                        alert('Sản phẩm bạn vừa mua đã vượt quá tồn kho');
                    }
                });
            }
        });
    },
    plusQtyView: function() {
        if (jQuery('#quickview-qtyvalue[name="quantity"]').val() != undefined) {
            var currentVal = parseInt(jQuery('#quickview-qtyvalue[name="quantity"]').val());
            //console.log(currentVal)
            if (!isNaN(currentVal)) {
                jQuery('#quickview-qtyvalue[name="quantity"]').val(currentVal + 1);
            } else {
                jQuery('#quickview-qtyvalue[name="quantity"]').val(1);
            }
        } else {
            console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
        }
    },
    minusQtyView: function() {
        if (jQuery('#quickview-qtyvalue[name="quantity"]').val() != undefined) {
            var currentVal = parseInt(jQuery('#quickview-qtyvalue[name="quantity"]').val());
            if (!isNaN(currentVal) && currentVal > 1) {
                jQuery('#quickview-qtyvalue[name="quantity"]').val(currentVal - 1);
            }
        } else {
            console.log('error: Not see elemnt ' + jQuery('input[name="quantity"]').val());
        }
    },
    submitPreorderQv: function(url) {
        $('#modal-quickview form.contact-form').submit(function(e) {
            e.preventDefault();
            var self = $(this);
            var vlTextbody = 'Nội dung: ' + $('textarea.product-body-val').val();
            var handlePr = window.location.origin + url;
            var vlTextPr = $('input.detailPr').val() + '\n' + 'Link sản phẩm: ' + handlePr;
            var swatchSize = parseInt($('#add-item-form-qv .select-swatch .swatch').length);
            if (swatchSize == 1) {
                var vlVariant = 'Biến thể: ' + $('.select-swatch .swatch').find('label.sd span').html();
            } else if (swatchSize == 2) {
                var vlVariant = 'Biến thể: ' + $('.select-swatch .swatch').find('label.sd span').html() + ' | ' +
                    $('.select-swatch .swatch').next().find('label.sd span').html();
            } else if (swatchSize == 3) {
                var vlVariant = 'Biến thể: ' + $('.select-swatch .swatch').find('label.sd span').html() + ' | ' +
                    $('.select-swatch .swatch').next().find('label.sd span').html() + ' | ' +
                    $('.select-swatch .swatch').next().next().find('label.sd span').html();
            } else {
                var vlVariant = '';
            }
            grecaptcha.ready(function() {
                grecaptcha.execute('6LdD18MUAAAAAHqKl3Avv8W-tREL6LangePxQLM-', {
                    action: 'submit'
                }).then(function(token) {
                    self.find('input[name="g-recaptcha-response"]').val(token);
                    $('input.detailPr').val(vlTextPr + '\n' + vlVariant + '\n' + vlTextbody);
                    $.ajax({
                        type: 'POST',
                        url: '/contact',
                        data: $('#modal-quickview form.contact-form').serialize(),
                        success: function(data) {
                            $('.success-form-pr-contact').removeClass('d-none');
                            setTimeout(function() {
                                $('#modal-quickview').modal('hide');
                                location.reload();
                            }, 2500)
                        }
                    })
                });
            });
        });
    }
}

HRT.Cart = {
    init: function() {
        var that = this;
        if ($('.summary-picktime').length > 0) {
            that.initTimeCart();
            that.pickOptionTime();
            that.checkTimeExist();
        }
        that.clickCheckoutCart();
        that.addCartSocial();
        that.clickCheckbill();
        that.checkChangeInput();
        that.clickSaveInfoBill();
        that.sliderCoupon();
        that.sliderProduct();
    },
    updatePriceChange: function(action, line, vId, pId, qty) {
        var updates = [];
        var qtyGift = 0;
        $('.cart-ajloading').show();
        if (promotionApp && promotionApp_name == 'app_buyxgety' || promotionApp_name == 'app_combo') {
            if (promotionApp_name == 'app_buyxgety') {
                var old_promotion_variant_id = buyXgetY.getPromotionStorage(vId);
                var dataPost = $('#cartformpage').serialize();

                if (old_promotion_variant_id !== undefined) {

                    var gOSP = 0, //Gift other but same main product 
                        gOPR = 0, //Gift priority but same main product
                        gCurrent = null;

                    var giftExistInCart = true,
                        qtyGiftNotInCart = 0;
                    if (old_promotion_variant_id != undefined) {
                        $.each(old_promotion_variant_id, function(vIdGift, infoGift) {
                            var filterGiftInCart = cartGet.items.filter(x => x.variant_id == vIdGift && x.promotionby.length > 0 && x.promotionby[0].product_id == pId);
                            if (infoGift.priority == false && filterGiftInCart.length > 0) {
                                gOSP += filterGiftInCart[0].quantity;
                            }

                            if (infoGift.priority == true) {
                                if (vIdGift != 'not_gift') {
                                    if (filterGiftInCart.length > 0) {
                                        if (action == 'plus') {
                                            gOPR += filterGiftInCart[0].quantity;
                                        } else {
                                            gOPR += filterGiftInCart[0].quantity * infoGift.count_buy / infoGift.count_gift;
                                        }
                                    } else {
                                        giftExistInCart = false;
                                    }
                                }
                                gCurrent = infoGift;
                                gCurrent.vId = vIdGift;
                            }
                        });

                        if (giftExistInCart == false && action == 'plus' && gCurrent.vId != 'not_gift') {
                            qtyGift = (qty - gOSP) / gCurrent.count_buy * gCurrent.count_gift;
                        }
                    }

                    cartGet.items.map((item, index) => {
                        if (item.variant_id == vId) {
                            updates[index] = qty;
                        } else {
                            if (item.promotionby.length > 0 && item.promotionby[0].product_id == pId) {
                                if (gCurrent != null) {
                                    if (gCurrent.priority == true && gCurrent.vId != 'not_gift' && gCurrent.vId == item.variant_id) {
                                        var haohut = qty - (gOSP + gOPR);
                                        qtyGift = (item.quantity + haohut) / gCurrent.count_buy * gCurrent.count_gift;
                                        updates[index] = qtyGift;
                                    } else {
                                        updates[index] = item.quantity;
                                    }
                                }
                            } else {
                                updates[index] = item.quantity;
                            }
                        }
                    });

                    dataPost = {
                        'updates[]': updates
                    };
                }

                var params = {
                    type: 'POST',
                    url: '/cart/update.js',
                    data: dataPost,
                    async: false,
                    dataType: 'json',
                    success: function(data) {
                        if (old_promotion_variant_id !== undefined) {
                            if (giftExistInCart) {
                                window.location.reload();
                            } else {
                                $.post('/cart/add.js', 'id=' + gCurrent.vId + '&quantity=' + qtyGift).done(function() {
                                    window.location.reload();
                                });
                            }
                        } else {
                            window.location.reload();
                        }
                    },
                    error: function(XMLHttpRequest, textStatus) {
                        Haravan.onError(XMLHttpRequest, textStatus);
                    }
                };
                jQuery.ajax(params);

            } else {

            }
        } else {
            var params = {
                type: 'POST',
                url: '/cart/update.js',
                data: $('#cartformpage').serialize(),
                async: false,
                dataType: 'json',
                success: function(data) {
                    /*cartItem = {};
                    cartGet = data;
                    $.each(data.items,function(i,v){
                    	var id = v.variant_id;
                    	cartItem[v.variant_id] = v.quantity;
                    	$('.table-cart .line-item:eq('+i+') .line-item-total').html(Haravan.formatMoney(v.line_price, formatMoney));
                    });	
                    $('.summary-total span').html(Haravan.formatMoney(data.total_price, formatMoney));
                    $('.cart-total-price').html(Haravan.formatMoney(data.total_price, formatMoney));
                    $('.total_price').html(Haravan.formatMoney(data.total_price, formatMoney));
                    $('.count-cart').html( data.item_count + " sản phẩm");
                    $('.count-holder .count').html(data.item_count );
                    setTimeout(function(){
                    	$('.cart-ajloading').hide();
                    },400);*/
                    if (window.buy2get1) {
                        buy2get1.checkCart()
                    }
                    window.location.reload();
                },
                error: function(XMLHttpRequest, textStatus) {
                    Haravan.onError(XMLHttpRequest, textStatus);
                }
            };
            jQuery.ajax(params);
        }
    },
    initQuantityCart: function() {
        $(document).on('click', '.qty-click .qtyplus', function(e) {
            e.preventDefault();
            $(this).parent('.quantity-partent').find('.qtyminus').removeClass('stop');
            var input = $(this).parent('.quantity-partent').find('input');
            var currentVal = parseInt(input.val());
            if (!isNaN(currentVal)) {
                input.val(currentVal + 1);
            } else {
                input.val(1);
            }
            var line = input.attr('line');
            var vId = input.attr('variantid');
            var pId = input.attr('productid');
            var currentQty = parseInt(input.val());
            HRT.Cart.updatePriceChange('plus', line, vId, pId, currentQty);
        });

        $(document).on('click', '.qty-click .qtyminus:not(.stop)', function(e) {
            e.preventDefault();
            var input = $(this).parent('.quantity-partent').find('input');
            var currentVal = parseInt(input.val());
            if (!isNaN(currentVal) && currentVal > 1) {
                input.val(currentVal - 1);
                if (currentVal - 1 == 1) $(this).addClass('stop');
            } else {
                input.val(1);
                $(this).addClass('stop');
            }

            var line = input.attr('line');
            var vId = input.attr('variantid');
            var pId = input.attr('productid');
            var currentQty = parseInt(input.val());
            HRT.Cart.updatePriceChange('minus', line, vId, pId, currentQty);
        });
    },
    removeItemCart: function(t, url) {
        var self = $(t)
        Swal.fire({
            title: "Bạn chắc chắn muốn bỏ sản phẩm này ra khỏi giỏ hàng?",
            showCancelButton: true,
            cancelButtonText: 'Hủy',
            confirmButtonText: 'Đồng ý',
            customClass: "swal-cart-remove"
        }).then((result) => {
            if (result.isConfirmed) {
                //$('body').on('click', '.swal2-confirm', function() {
                jQuery.ajax({
                    type: 'GET',
                    url: url,
                    dataType: 'json',
                    success: function(data) {
                        console.log(data)
                        var elItem = self.closest('.line-item')
                        elItem.css('background-color', '#fcfcfc').fadeOut();
                        setTimeout(function() {
                            var elParentItem = elItem.parent();
                            elItem.remove();
                            var itemLength = elParentItem.find('.line-item').length;
                            if (itemLength == 0) {
                                elParentItem.remove();
                            }
                        }, 200);
                        window.location.reload();
                        /*	if (data.item_count == 0) {
							window.location.href = '/';
							return;
						}	else{}*/
                    },
                    error: function(erorr) {
                        console.log(error);
                    }
                });
                //});
            }
        });
    },
    checkTimeExist: function() {
        $.when($.get('/cart.js')).then(function(result) {
            if (result != null && result.attributes.hasOwnProperty('Delivery Time')) {
                var now = new Date().getTime();
                var txtNow = $("#picktime_radio label[for='timeRadios-1']").text();
                if (result.attributes['Delivery Time'] == txtNow) {
                    var maxExist = dateNowJs + ' ' + $("#picktime_radio").attr("data-time-start");
                    maxExist = new Date(maxExist).getTime();
                } else {
                    var dataTime = result.attributes['Delivery Time'].split(' ');
                    var maxExist = dataTime[0].split('/').reverse().join('/') + ' ' + dataTime[dataTime.length - 1] + ':00';
                    maxExist = new Date(maxExist).getTime();
                }
                if (now > maxExist || maxExist - now < 45 * 60 * 1000) {
                    $('.txt-time span').html('Chọn thời gian');
                    //delete result.attributes['Delivery Time'];
                    result.attributes['Delivery Time'] = null;
                    $.post('/cart/update.js', {
                        "attributes": result.attributes
                    }).done(function(cart) {
                        cartGet = cart;
                    });
                }
            }
        });
    },
    checkTimeAvailable: function(time) {
        var countDisable = 0;
        var rangeTime = $('#time_shipping option').length;
        /* Check trong ngày từ 8h đến 21h */
        var stillAvailable = true;
        /* Nếu nhập giờ bắt đầu ko nhận đơn và giờ bắt đầu mở cửa */
        var startStop = endStop = null;

        if ($("#picktime_radio").attr("data-time-end") != '' && $("#picktime_radio").attr("data-time-start") != '') {
            //debugger;
            var dataStart = Number($("#picktime_radio").attr("data-time-start").replace(/\:/g, ''));
            var dataEnd = Number($("#picktime_radio").attr("data-time-end").replace(/\:/g, ''));
            startStop = new Date(dateNowJs + ' ' + $("#picktime_radio").attr("data-time-start")).getTime();
            endStop = new Date(dateNowJs + ' ' + $("#picktime_radio").attr("data-time-end")).getTime() + (dataStart > dataEnd ? 84600000 : 0);
            if (dataStart < dataEnd) {
                if (time > startStop && time <= endStop) stillAvailable = false;
            } else {
                if (startStop < endStop && time <= endStop) stillAvailable = false;
            }
        }

        var timeOpenWork = 0;
        var newChange = false;
        $('#time_shipping option').each(function(j, t) {
            var min_time = new Date(dateNowJs + ' ' + $(this).attr('data-min'));
            var max_time = new Date(dateNowJs + ' ' + $(this).attr('data-max'));
            min_time = min_time.getTime();
            max_time = max_time.getTime();
            if (j == 0) timeOpenWork = min_time;

            var checkLimitTime = false;
            //debugger;
            if (startStop != null && endStop != null) {
                if (dataStart < dataEnd) {
                    if (max_time <= endStop) checkLimitTime = true;
                } else {
                    //if((min_time >= startStop && time <= endStop) || time < timeOpenWork) checkLimitTime = true;
                    if ((min_time >= startStop && time <= endStop) || time < timeOpenWork) checkLimitTime = true;
                }
            }

            if (time > max_time || (max_time > time && time > min_time && (max_time - time < 45 * 60 * 1000)) || checkLimitTime) {
                $(this).attr('disabled', true);
                countDisable++;
            } else {
                if (newChange == false) {
                    $('#time_shipping').val($(this).attr('value')).change();
                    newChange = true;
                }
            }
        });

        if (countDisable == rangeTime) $('#btn-cart-accepttime').attr('disabled', true).addClass('disabled');
        if (stillAvailable == false) $('#btnCart-checkout').addClass('btntime-disable').html('Đã ngưng nhận đơn hôm nay');

    },
    initTimeCart: function() {
        var now = new Date();
        var nowObj = {
            'date': now.getDate(),
            'month': now.getMonth() + 1,
            'year': now.getFullYear()
        };
        dateNow = (nowObj.month < 10 ? '0' + nowObj.month : nowObj.month) + '/' + (nowObj.date < 10 ? '0' + nowObj.date : nowObj.date) + '/' + nowObj.year;
        dateNowVN = (nowObj.date < 10 ? '0' + nowObj.date : nowObj.date) + '/' + (nowObj.month < 10 ? '0' + nowObj.month : nowObj.month) + '/' + nowObj.year;
        dateNowJs = nowObj.year + '/' + (nowObj.month < 10 ? '0' + nowObj.month : nowObj.month) + '/' + (nowObj.date < 10 ? '0' + nowObj.date : nowObj.date);
        var time = now.getTime();
        var date1 = new Date(time + 86400000);
        var date2 = new Date(time + 2 * 86400000);
        date1 = {
            'date': date1.getDate(),
            'month': date1.getMonth() + 1,
            'year': date1.getFullYear()
        };
        date2 = {
            'date': date2.getDate(),
            'month': date2.getMonth() + 1,
            'year': date2.getFullYear()
        };
        var date1Text = (date1.date < 10 ? '0' + date1.date : date1.date) + '/' + (date1.month < 10 ? '0' + date1.month : date1.month) + '/' + date1.year;
        var date2Text = (date2.date < 10 ? '0' + date2.date : date2.date) + '/' + (date2.month < 10 ? '0' + date2.month : date2.month) + '/' + date2.year;
        var htmlDate = '<option value="' + date1Text + '">' + date1Text + '</option>';
        htmlDate += '<option value="' + date2Text + '">' + date2Text + '</option>';
        $('#date_shipping').append(htmlDate);
        this.checkTimeAvailable(time);
    },
    pickOptionTime: function() {
        var that = this;
        $("#picktime_radio input[name='timeRadios']").on('change', function() {
            if ($("#picktime_radio input[name='timeRadios']:checked").length == 0) {
                //$(".side-cart--time").addClass('js-opacity-time');
            } else {
                //$(".side-cart--time").removeClass('js-opacity-time');
                if ($("#picktime_radio input[name='timeRadios']:checked").val() == 'timeNow') {
                    $('.picktime_selecter').slideUp(300);
                    $('.boxtime-title .txt-time span').html($("#picktime_radio label[for='timeRadios-1']").text());

                    var startStop = endStop = null;
                    var stillAvailable = true;

                    var now = new Date().getTime();
                    if ($("#picktime_radio").attr("data-time-end") != '' && $("#picktime_radio").attr("data-time-start") != '') {
                        var dataStart = Number($("#picktime_radio").attr("data-time-start").replace(/\:/g, ''));
                        var dataEnd = Number($("#picktime_radio").attr("data-time-end").replace(/\:/g, ''));
                        endStop = new Date(dateNowJs + ' ' + $("#picktime_radio").attr("data-time-end")).getTime() + (dataStart > dataEnd ? 84600000 : 0);
                        startStop = new Date(dateNowJs + ' ' + $("#picktime_radio").attr("data-time-start")).getTime();
                        if (dataStart < dataEnd) {
                            if (now > startStop && now <= endStop) stillAvailable = false;
                        } else {
                            if (startStop < endStop && now <= endStop) stillAvailable = false;
                        }
                        //if(now > startStop && now <= endStop) stillAvailable = false;
                    }

                    if (startStop != null && endStop != null) {
                        if (stillAvailable == false) {
                            $('#btnCart-checkout').addClass('btntime-disable').html('Đã ngưng nhận đơn hôm nay');
                        } else {
                            cartGet.attributes['Delivery Time'] = $("#picktime_radio label[for='timeRadios-1']").text();
                            $.post('/cart/update.js', {
                                attributes: cartGet.attributes
                            }).done(function(cart) {
                                cartGet = cart;
                                cartAttributes = cart.attributes;
                                if (cart.total_price > 0) $('#btnCart-checkout').removeClass('btntime-disable').html('Thanh toán');
                            });
                        }
                    } else {
                        cartGet.attributes['Delivery Time'] = $("#picktime_radio label[for='timeRadios-1']").text();
                        $.post('/cart/update.js', {
                            attributes: cartGet.attributes
                        }).done(function(cart) {
                            cartGet = cart;
                            cartAttributes = cart.attributes;
                            if (cart.total_price > 0) $('#btnCart-checkout').removeClass('btntime-disable').html('Thanh toán');
                        });
                    }
                } else if ($("#picktime_radio input[name='timeRadios']:checked").val() == 'timeDate') {
                    $('.picktime_selecter').slideDown(300);
                }
            }
        });

        $('#date_shipping').on('change', function() {
            var dateOrder = $(this).val();
            if (dateNowVN == dateOrder) {
                var now = new Date();
                var time = now.getTime();
                that.checkTimeAvailable(time);
            } else {
                $('#time_shipping option').removeAttr('disabled');
                $('#btn-cart-accepttime').removeAttr('disabled').removeClass('disabled');
                $('#btnCart-checkout').removeClass('btntime-disable').html('Thanh toán');
            }
        });

        $('#btn-cart-accepttime').on('click', function(e) {
            e.preventDefault();
            var time = $("#picktime_radio label[for='timeRadios-1']").text();
            if ($("#picktime_radio input[name='timeRadios']:checked").val() == 'timeDate') {
                time = $('#date_shipping').val() + ' ' + $('#time_shipping').val();
                cartGet.attributes['Delivery Time'] = time;
            }
            $('.boxtime-title .txt-time span').html(time);
            $('.picktime_selecter').slideUp(300);
            $("#picktime_radio input[value='timeDate']").prop('checked', false);
            $.post('/cart/update.js', {
                attributes: cartGet.attributes
            }).done(function(cart) {
                cartGet = cart;
                cartAttributes = cart.attributes;
                //debugger;
                $('#btnCart-checkout').removeClass('btntime-disable').html('Thanh toán');
            });
        });
    },
    clickCheckoutCart: function() {
        $(document).on("click", "#btnCart-checkout:not(.disabled)", function(e) {
            e.preventDefault();
            var updateNote = $('#note').val();
            var total_price = Number($('.summary-total span').html().replace(/\,/g, '').replace('₫', ''));
            var a = $(this);

            if (Number(priceMin) <= total_price) {
                $('.summary-alert').removeClass('inn').slideUp('200');
                if ($('#checkbox-bill').is(':checked')) {
                    var a = $(this);
                    swal.fire({
                        title: "Bạn có muốn xuất hóa đơn?",
                        text: "Hãy kiểm tra lại thông tin hóa đơn của mình thật chính xác!",
                        icon: "warning",
                        showCancelButton: true,
                        cancelButtonText: 'Không',
                        confirmButtonText: 'Có',
                        customClass: "swal-cart-checkInvoice"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            //$('body').on('click', '.swal-button--confirm', function(){
                            var f = true;
                            $('#cartformpage .val-f').each(function() {
                                if ($(this).val() === '') {
                                    f = false;
                                    if ($(this).siblings('span.text-danger').length == 0)
                                        $(this).after('<span class="text-danger">Bạn không được để trống trường này</span>');
                                } else {
                                    $(this).siblings('span.text-danger').remove();
                                }
                                if ($(this).hasClass('val-n') && $(this).val().trim().length < 10) {
                                    f = false;
                                    if ($(this).siblings('span.text-danger').length == 0)
                                        $(this).after('<span class="text-danger">Mã số thuế phải tối thiểu 10 ký tự</span>');
                                }
                                if ($(this).hasClass('val-mail') && HRT.All.checkemail($(this).val()) == false) {
                                    if ($(this).siblings('span.text-danger').length == 0)
                                        $(this).after('<span class="text-danger">Email không hợp lệ</span>');
                                }

                            });

                            if (f) {

                                var company = $('input[name="attributes[bill_order_company]"]').val();
                                var address = $('input[name="attributes[bill_order_address]"]').val();
                                var tax = $('input[name="attributes[bill_order_tax_code]"]').val();
                                var mail = $('input[name="attributes[bill_email]"]').val();
                                //var cart_info = {'company':company, 'address': address, 'tax':tax};
                                //Cookies.set('cart_info', cart_info);
                                //a.unbind(e).click();
                                cartAttributes.invoice = 'yes';
                                if (company == '' && cartAttributes.hasOwnProperty('bill_order_company')) {
                                    cartAttributes.bill_order_company = null;
                                } else {
                                    cartAttributes.bill_order_company = company;
                                }

                                if (address == '' && cartAttributes.hasOwnProperty('bill_order_address')) {
                                    cartAttributes.bill_order_address = null;
                                } else {
                                    cartAttributes.bill_order_address = address;
                                }

                                if (tax == '' && cartAttributes.hasOwnProperty('bill_order_tax_code')) {
                                    cartAttributes.bill_order_tax_code = null;
                                } else {
                                    cartAttributes.bill_order_tax_code = tax;
                                }

                                if (mail == '' && cartAttributes.hasOwnProperty('bill_email')) {
                                    cartAttributes.bill_email = null;
                                } else {
                                    cartAttributes.bill_email = mail;
                                }

                                $.ajax({
                                    url: '/cart/update.js',
                                    type: 'POST',
                                    data: {
                                        "attributes": cartAttributes,
                                        "note": updateNote
                                    },
                                    success: function(data) {
                                        window.location = '/checkout';
                                    }
                                });
                            }
                            if (!f) return false;
                            //});
                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                            //$('body').on('click', '.swal-button--cancel', function(){
                            if (cartAttributes.hasOwnProperty('invoice')) cartAttributes.invoice = "no";
                            if (cartAttributes.hasOwnProperty('bill_order_company')) cartAttributes.bill_order_company = null;
                            if (cartAttributes.hasOwnProperty('bill_order_address')) cartAttributes.bill_order_address = null;
                            if (cartAttributes.hasOwnProperty('bill_order_tax_code')) cartAttributes.bill_order_tax_code = null;
                            if (cartAttributes.hasOwnProperty('bill_email')) cartAttributes.bill_email = null;

                            $.ajax({
                                url: '/cart/update.js',
                                type: 'POST',
                                data: {
                                    "attributes": cartAttributes,
                                    "note": updateNote
                                },
                                success: function(data) {
                                    window.location = '/checkout';
                                }
                            });
                            //});
                        }
                    });
                } else {
                    if (cartAttributes.hasOwnProperty('invoice')) cartAttributes.invoice = "no";
                    if (cartAttributes.hasOwnProperty('bill_order_company')) cartAttributes.bill_order_company = null;
                    if (cartAttributes.hasOwnProperty('bill_order_address')) cartAttributes.bill_order_address = null;
                    if (cartAttributes.hasOwnProperty('bill_order_tax_code')) cartAttributes.bill_order_tax_code = null;
                    if (cartAttributes.hasOwnProperty('bill_email')) cartAttributes.bill_email = null;
                    $.ajax({
                        url: '/cart/update.js',
                        type: 'POST',
                        data: {
                            "attributes": cartAttributes,
                            "note": updateNote
                        },
                        success: function(data) {
                            window.location = '/checkout';
                        }
                    });
                }
            } else {
                $('.summary-alert').addClass('inn').slideDown('200');
            }
        });
    },
    addCartSocial: function() {
        var href = window.location.href;
        if (href.indexOf("?add=") != -1) {
            var splitHref = href.split("?add=")[1];
            var variantId = parseInt($.trim(splitHref.split("&ref=")[0]));
            $.ajax({
                url: "/cart/" + variantId + ":1",
                success: function(data) {
                    var x = false;
                    if (data.items.length > 0) {
                        data.items.map(function(v, i) {
                            if (v.variant_id == variantId) {
                                x = true;
                            }
                        });
                    }
                    if (!x) {
                        alert('Sản phẩm bạn vừa mua đã hết hàng');
                    }
                    window.location = '/cart';
                },
                error: function(XMLHttpRequest, textStatus) {
                    Haravan.onError(XMLHttpRequest, textStatus);
                }
            });
        }
    },
    clickCheckbill: function() {
        if ($('.order-invoice-block .regular-checkbox').is(':checked')) {
            $('.bill-field').show();
        }
        $('#cartformpage .regular-checkbox').click(function() {
            if ($(this).is(':checked')) {
                $(this).siblings('#re-checkbox-bill').val('yes');
            } else {
                $(this).siblings('#re-checkbox-bill').val('no');
                $('#cartformpage .val-f').siblings('span.text-danger').remove();
            }
            $('#cartformpage .bill-field').slideToggle(300);
        })
    },
    checkChangeInput: function() {
        $(".check_change").on("change paste keyup", function() {
            jQuery('.btn-save').html("Lưu thông tin");
        });
    },
    clickSaveInfoBill: function() {
        $('.order-invoice-block .btn-save').on('click', function(e) {
            e.preventDefault();
            $('#cartformpage .val-f').each(function() {
                if ($(this).val() === '') {
                    if ($(this).siblings('span.text-danger').length == 0)
                        $(this).after('<span class="text-danger">Bạn không được để trống trường này</span>');
                } else {
                    $(this).siblings('span.text-danger').remove();
                    setTimeout(function() {
                        jQuery('.btn-save').html("Đã lưu thông tin");
                    }, 500);
                }
                if ($(this).hasClass('val-n') && $(this).val().trim().length < 10) {
                    if ($(this).siblings('span.text-danger').length == 0)
                        $(this).after('<span class="text-danger">Mã số thuế phải tối thiểu 10 ký tự</span>');
                }

                if ($(this).hasClass('val-mail') && HRT.All.checkemail($(this).val()) == false) {
                    if ($(this).siblings('span.text-danger').length == 0)
                        $(this).after('<span class="text-danger">Email không hợp lệ</span>');
                }

            });
        });
    },
    sliderCoupon: function() {
        var swiper = new Swiper("#cartCoupon", {
            spaceBetween: 12,
            navigation: {
                nextEl: ".swiper-coupon-cart-next",
                prevEl: ".swiper-coupon-cart-prev",
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    grid: {
                        rows: 2,
                        fill: "row",
                    },
                },
                768: {
                    slidesPerView: 2,
                    grid: {
                        rows: 2,
                        fill: "row",
                    },
                },
                1024: {
                    slidesPerView: 1,
                    grid: {
                        rows: 2,
                        fill: "row",
                    },
                },
            },
        });
    },
    sliderProduct: function() {
        var swiper = new Swiper('#slideProductCart', {
            slidesPerView: 3,
            spaceBetween: 15,
            loop: false,
            navigation: {
                nextEl: ".swiper-product-cart-next",
                prevEl: ".swiper-product-cart-prev",
            },
            breakpoints: {
                0: {
                    slidesPerView: 2,
                    spaceBetween: 15,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 15,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 15,
                },
            }
        });
    },
};

HRT.Ldpage = {
    init: function() {
        var that = this;
        that.countdown();
        that.slideClient();
        that.copyCodeCoupon();
        that.popoverCoupon();
    },
    countdown: function() {
        if ($('.flip-js-countdown').length > 0) {
            var element = document.getElementById('soon-espa');
            var time_start = $('.flip-js-countdown .auto-due').attr('data-start');
            var time_end = $('.flip-js-countdown .auto-due').attr('data-end');
            var beforeRun = new Date(time_start);
            beforeRun = beforeRun.getTime();
            var afterRun = new Date(time_end);
            afterRun = afterRun.getTime();
            var now = new Date();
            now = now.getTime();

            function tick(milliseconds, beforeRun) {
                if (milliseconds == 0) {
                    $('#label-due').html('Ưu đãi kết thúc').removeClass('hidden');
                } else {
                    $('#label-due').html('Sắp diễn ra:').removeClass('hidden');
                }
            }

            function tick2(milliseconds, afterRun) {
                if (milliseconds == 0) {
                    $('#label-due').html('Ưu đãi kết thúc').removeClass('hidden');
                } else {
                    $('#label-due').html('Kết thúc sau:').removeClass('hidden');
                }
            }

            function complete() {
                var today = new Date();
                var cdate = today.getTime();
                if (cdate < afterRun) {
                    Soon.destroy(element);
                    Soon.create(element, {
                        due: time_end,
                        now: null,
                        layout: "group label-small",
                        face: "flip color-light",
                        format: "d,h,m,s",
                        labelsYears: null,
                        labelsDays: 'Ngày',
                        labelsHours: 'Giờ',
                        labelsMinutes: 'Phút',
                        labelsSeconds: 'Giây',
                        separateChars: false,
                        scaleMax: "l",
                        separator: "",
                        singular: true,
                        paddingDays: "00",
                        eventTick: tick2,
                        eventComplete: function() {
                            //	$('.tabslist-product-countdown').hide();

                        }
                    });
                }
            }
            /*if(now < afterRun){}*/
            Soon.create(element, {
                due: time_start,
                now: null,
                layout: "group label-small",
                face: "flip color-light",
                format: "d,h,m,s",
                labelsYears: null,
                labelsDays: 'Ngày',
                labelsHours: 'Giờ',
                labelsMinutes: 'Phút',
                labelsSeconds: 'Giây',
                separateChars: false,
                scaleMax: "l",
                separator: "",
                paddingDays: "00",
                singular: true,
                eventTick: tick,
                eventComplete: complete
            });
        }
    },
    slideClient: function() {
        var swiper = new Swiper("#ldpage01-slide-client", {
            slidesPerView: 2,
            spaceBetween: 30,
            loop: true,
            navigation: {
                nextEl: ".swiper-client-next",
                prevEl: ".swiper-client-prev",
            },
            pagination: {
                el: ".swiper-pagination-client",
                clickable: true,
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    spaceBetween: 15,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
            }
        });
    },
    copyCodeCoupon: function() {
        $(document).on('click', '.coupon-item .cpi-button', function(e) {
            e.preventDefault();
            $('.coupon-item .cpi-button').html('Sao chép mã').removeClass('disabled');
            var copyText = $(this).attr('data-coupon');
            var el = document.createElement('textarea');
            el.value = copyText;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            $(this).html('Đã sao chép').addClass('disabled');
        });
        $(document).on('click', '.popover-content__coupon .btn-popover-code', function(e) {
            e.preventDefault();
            var btnPopover = $(this).attr('data-coupon');
            $(".coupon-item .cpi-button[data-coupon=" + btnPopover + "]").click();
            $(this).html('Đã sao chép').addClass('disabled');
        });
        $(document).on('click', '.cpi-trigger', function(e) {
            e.preventDefault();
            var btnPopover = $(this).attr('data-coupon');
            $(".coupon-item .cpi-button[data-coupon=" + btnPopover + "]").click();
        });
    },
    popoverCoupon: function() {
        var popover = '.cpi-tooltip .cpi-tooltip__dot[data-bs-toggle="popover"]';
        $(popover).popover({
            html: true,
            animation: true,
            sanitize: false,
            placement: function(popover, trigger) {
                var placement = jQuery(trigger).attr('data-bs-placement');
                var dataClass = jQuery(trigger).attr('data-class');
                jQuery(trigger).addClass('is-active');
                jQuery(popover).addClass(dataClass);
                if (jQuery(trigger).offset().top - $(window).scrollTop() > 280) {
                    return "top";
                }
                return placement;
            },
            content: function() {
                var elementId = $(this).attr("data-content-id");
                return $('#' + elementId).html();
            },
            delay: {
                show: 60,
                hide: 40
            }
        });

        function eventPopover() {
            if ($(window).width() >= 768) {
                $(popover).on('mouseenter', function() {
                    var self = this;
                    jQuery(this).popover("show");
                    jQuery(".popover.coupon-popover").on('mouseleave', function() {
                        jQuery(self).popover('hide');
                    });
                }).on('mouseleave', function() {
                    var self = this;
                    setTimeout(function() {
                        if (!jQuery('.popover.coupon-popover:hover').length) {
                            jQuery(self).popover('hide');
                        }
                    }, 300);
                });
            } else {
                $(popover).off('mouseenter mouseleave');
            }
        };
        eventPopover();
        $(window).resize(function() {
            eventPopover();
        });
        $(popover).popover().on("hide.bs.popover", function() {
            $(".modal-coupon--backdrop").removeClass("js-modal-show");
        });
        $(popover).popover().on("show.bs.popover", function() {
            $(".modal-coupon--backdrop").addClass("js-modal-show");
        });
        $(popover).popover().on("shown.bs.popover", function() {
            $('.btn-popover-close,.modal-coupon--backdrop').click(function() {
                $(popover).not(this).popover('hide');
                var $this = $(this);
                $this.popover('hide');
            });
        });
        //$('body').on('hidden.bs.popover', function (e) {
        //	$(e.target).data('bs.popover').inState = { click: false, hover: false, focus: false };
        //});		
        $(document).on('click', '.cpi-trigger', function(e) {
            e.preventDefault();
            var btnPopover = $(this).attr('data-coupon');
            $(".coupon-item .cp-btn[data-coupon=" + btnPopover + "]").click();
        });
        $(document).on('click', '.popover-content__coupon .btn-popover-code', function(e) {
            e.preventDefault();
            var btnPopover = $(this).attr('data-coupon');
            $(".coupon-item .cp-btn[data-coupon=" + btnPopover + "]").click();
            $(this).html('Đã sao chép').addClass('disabled');
        });
    },
};

jQuery(document).ready(function() {
    HRT.All.checkCart();
    HRT.init();
});