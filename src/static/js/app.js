     // activate overlay on load
        const overlays = document.getElementsByClassName('js-overlay-link')
        const close = document.getElementsByClassName('js-overlay-close')
        const className = 'activated'

        for (var i = 0; i < overlays.length; i++) {
            let overlay = overlays[i]
            //console.log(overlay)
            let modal = document.getElementById(overlay.getAttribute('data-target'))
            overlay.addEventListener("click", function(){
                let el = modal
                //let className = 'activated'
                el.classList.add(className)
                //console.log(el)
            }, false);
        }
        //console.log(close);
        for (var i = 0; i < close.length; i++) {
            close[i].addEventListener("click", function(){
                let parentEl = findAncestor(this,'Overlay');
                //console.log(this)
                parentEl.classList.remove(className)
            }, false);
        }

        function findAncestor (el, cls) {
            while ((el = el.parentElement) && !el.classList.contains(cls));
            return el;
        }
