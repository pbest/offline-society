 /* ------------------------------------
    OVERLAYS
   ------------------------------------ */
/* activate overlay on load */
        var overlays = document.getElementsByClassName('js-overlay-link')
        var close = document.getElementsByClassName('js-overlay-close')
        var className = 'activated'

        for (var i = 0; i < overlays.length; i++) {
            var thisOverlayLink = overlays[i]

            //console.log(modal);
            thisOverlayLink.addEventListener("click", function() {
                //var el = modal
                console.log(this);

                var targetOverlayID = this.getAttribute('data-target')
                var thisModal = document.getElementById(targetOverlayID)
                thisModal.classList.add(className)
            }, false);
        }
        for (var i = 0; i < close.length; i++) {
            close[i].addEventListener("click", function(){
                var parentEl = findAncestor(this,'Overlay');
                console.log(parentEl)
                parentEl.classList.remove(className)
            }, false);
        }

        function findAncestor (el, cls) {
            while ((el = el.parentElement) && !el.classList.contains(cls));
            return el;
        }

/* ------------------------------------
   DROPDOWN
   ------------------------------------ */
 var dropdowns = document.getElementsByClassName('drop-target')
          // console.log(dropdowns)
            for (var i = 0; i < dropdowns.length; i++) {
               // console.log(dropdowns[i].childNodes)
                var drop = new Drop({
                    target: dropdowns[i],
                    content: dropdowns[i].getElementsByClassName('drop-content-hider')[0].innerHTML,
                    classes: 'drop-theme-arrows-bounce-dark drop-hero',
                    attach: 'bottom left',
                    openOn: 'click'
                });

                drop.on(close, function(){
                 console.log("test");
                //var parentEl = findAncestor(this,'Overlay');
                //console.log(this)
                //this.classList.add(matchClass)
                });
            }

 /* ------------------------------------
    MOBILE NAV
   ------------------------------------ */
// Open Mobile Nav
var openNav = document.getElementById('js-navOpen');
var closeNav = document.getElementById('js-navClose');
var navEl = document.getElementsByClassName('nav')[0];
var navOpenClass = 'navOpen';

openNav.addEventListener("click", function(){
    console.log("navClick");
    navEl.classList.add(navOpenClass);
});

closeNav.addEventListener("click", function(){
    navEl.classList.remove(navOpenClass);
});


 /* ------------------------------------
    MATCHES
 ------------------------------------ */

var matchEls   = document.getElementsByClassName('match');
var matchesEl   = document.getElementById('js-matches');
var matchClass = 'match--open';
for (var i = 0; i < matchEls.length; i++) {

            matchEls[i].addEventListener("click", function(){
               // console.log(this);
                //var parentEl = findAncestor(this,'Overlay');
                //console.log(this)
                matchesEl.classList.toggle('matching')
                this.classList.add(matchClass)
            }, false);
        }

 var matchClicks = document.getElementsByClassName('js-match-click');
 for (var i = 0; i < matchClicks.length; i++) {
         matchClicks[i].addEventListener("click", function(){

            var matchTarget = this.getAttribute('data-matchnum')
           // console.log(matchTarget);
            matchWrapperEl = document.getElementById('matchWrapper_' + matchTarget)
           // console.log(matchWrapperEl);
            //this.classList.remove('matching');
            matchWrapperEl.classList.add('match-processed');
            console.log(matchesEl.classList);
            matchesEl.classList.remove('matching')
         },false);
 }

 /* ------------------------------------
    PHOTOSWIPE
   ------------------------------------ */
   var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements
    // (children of gallerySelector)
    var parseThumbnailElements = function(el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element

            // include only element nodes
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };



            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML;
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            }

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if(!clickedListItem) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if(childNodes[i].nodeType !== 1) {
                continue;
            }

            if(childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if(pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
            }

        };

        // PhotoSwipe opened from URL
        if(fromURL) {
            if(options.galleryPIDs) {
                // parse real index when custom PIDs are used
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for(var j = 0; j < items.length; j++) {
                    if(items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }
};

// execute above function
initPhotoSwipeFromDOM('.gallery');
