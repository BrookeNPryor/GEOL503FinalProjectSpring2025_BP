(function($) {

  // 1. Disable flipping because overlays currently don't work with it 
  $.Viewport.prototype.toggleFlip = function() {
    return this;
  };

  // 2. Get rid of overlays trembling on animation 
  $.Overlay.prototype.drawHTML = function(container, viewport) {
    var element = this.element;
    if (element.parentNode !== container) {
        //save the source parent for later if we need it
        element.prevElementParent = element.parentNode;
        element.prevNextSibling = element.nextSibling;
        container.appendChild(element);

        // have to set position before calculating size, fix #1116
        this.style.position = "absolute";
        // this.size is used by overlays which don't get scaled in at
        // least one direction when this.checkResize is set to false.
        this.size = $.getElementSize(element);
    }

    //this.location = new $.Point(this.location.x, this.location.y);  //Fix Pavel Martynov
    var positionAndSize = this._getOverlayPositionAndSize(viewport);

    var position = positionAndSize.position;
    var size = this.size = positionAndSize.size;
    var rotate = positionAndSize.rotate;

    // call the onDraw callback if it exists to allow one to overwrite
    // the drawing/positioning/sizing of the overlay
    if (this.onDraw) {
        this.onDraw(position, size, this.element);
    } else {
        var style = this.style;
        var transformOriginProp = $.getCssPropertyWithVendorPrefix(
            'transformOrigin');
        var transformProp = $.getCssPropertyWithVendorPrefix(
            'transform'); 
        switch ($.Browser.vendor) {
          case $.BROWSERS.FIREFOX:
            //style.left = Math.round(position.x) + "px";   // PAVEL MARTYNOV
            //style.top = Math.floor(position.y) + "px";    // PAVEL MARTYNOV                    
            //style[transformProp] = "scale(1.0) rotate(0.02deg) translate("+Math.floor(position.x)+"px,"+Math.floor(position.y)+"px)";                   
            position.y = Math.floor(position.y)+0.5;
            style[transformProp] = "scale(1.0) rotate(0.02deg) translate("+position.x+"px,"+position.y+"px)";                   
            if (!this.scales) {
               var transitionProp = $.getCssPropertyWithVendorPrefix('transition');                         
               //style[transitionProp] = "transform 0.00001s";
            }  
            break;
          case $.BROWSERS.CHROME:
            style[transformProp] = "translateZ(0) scale(1.0, 1.0) translate("+position.x+"px,"+position.y+"px)";
            break;
          default:
            style[transformProp] = "translate("+position.x+"px,"+position.y+"px)";
            break;
        }

        // style.left = position.x + "px";   // PAVEL MARTYNOV
        // style.top = position.y + "px";    // PAVEL MARTYNOV
        if (this.width !== null) {
            style.width = size.x + "px";
        }
        if (this.height !== null) {
            style.height = size.y + "px";
        }
        if (transformOriginProp && transformProp) {
            if (rotate) {
                style[transformOriginProp] = this._getTransformOrigin();
                style[transformProp] = style[transformProp] + " rotate(" + rotate + "deg)";
            } else {
                style[transformOriginProp] = "";
                //style[transformProp] = "";    PAVEL MARTYNOV
            }
        }

        if (style.display !== 'none') {
            style.display = 'block';
        }
    }
  };

}(OpenSeadragon));  