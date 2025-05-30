/* 


IMPORTANT NOTE. This version is EDITED by Jolyon & Pavel to allow dragging.




 * This software was developed at the National Institute of Standards and
 * Technology by employees of the Federal Government in the course of
 * their official duties. Pursuant to title 17 Section 105 of the United
 * States Code this software is not subject to copyright protection and is
 * in the public domain. This software is an experimental system. NIST assumes
 * no responsibility whatsoever for its use by other parties, and makes no
 * guarantees, expressed or implied, about its quality, reliability, or
 * any other characteristic. We would appreciate acknowledgement if the
 * software is used.
 */

/**
 *
 * @author Antoine Vandecreme <antoine.vandecreme@nist.gov>
 */
(function($) {

  if (!$.version || $.version.major < 2) {
      throw new Error('This version of OpenSeadragonScalebar requires ' +
              'OpenSeadragon version 2.0.0+');
  }

  $.Viewer.prototype.scalebar = function(options) {
      if (!this.scalebarInstance) {
          options = options || {};
          options.viewer = this;
          this.scalebarInstance = new $.Scalebar(options);
      } else {
          this.scalebarInstance.refresh(options);
      }
  };

  $.ScalebarType = {
      NONE: 0,
      MICROSCOPY: 1,
      MAP: 2,
      CIRCLE: 3
  };

  $.ScalebarLocation = {
      NONE: 0,
      TOP_LEFT: 1,
      TOP_RIGHT: 2,
      BOTTOM_RIGHT: 3,
      BOTTOM_LEFT: 4
  };

  /**
   * 
   * @class Scalebar
   * @param {Object} options
   * @param {OpenSeadragon.Viewer} options.viewer The viewer to attach this
   * Scalebar to.
   * @param {OpenSeadragon.ScalebarType} options.type The scale bar type.
   * Default: microscopy
   * @param {Integer} options.pixelsPerMeter The pixels per meter of the
   * zoomable image at the original image size. If null, the scale bar is not
   * displayed. default: null
   * @param {Integer} options.referenceItemIdx Specify the item from
   * viewer.world to which options.pixelsPerMeter is refering.
   * default: 0
   * @param (String} options.minWidth The minimal width of the scale bar as a
   * CSS string (ex: 100px, 1em, 1% etc...) default: 150px
   * @param {OpenSeadragon.ScalebarLocation} options.location The location
   * of the scale bar inside the viewer. default: bottom left
   * @param {Integer} options.xOffset Offset location of the scale bar along x.
   * default: 5
   * @param {Integer} options.yOffset Offset location of the scale bar along y.
   * default: 5
   * @param {Boolean} options.stayInsideImage When set to true, keep the 
   * scale bar inside the image when zooming out. default: true
   * @param {String} options.color The color of the scale bar using a color
   * name or the hexadecimal format (ex: black or #000000) default: black
   * @param {String} options.fontColor The font color. default: black
   * @param {String} options.backgroundColor The background color. default: none
   * @param {String} options.fontSize The font size. default: not set
   * @param {String} options.barThickness The thickness of the scale bar in px.
   * default: 2
   * @param {function} options.sizeAndTextRenderer A function which will be
   * called to determine the size of the scale bar and it's text content.
   * The function must have 2 parameters: the PPM at the current zoom level
   * and the minimum size of the scale bar. It must return an object containing
   * 2 attributes: size and text containing the size of the scale bar and the text.
   * default: $.ScalebarSizeAndTextRenderer.METRIC_LENGTH
   */
  $.Scalebar = function(options) {
      options = options || {};
      if (!options.viewer) {
          throw new Error("A viewer must be specified.");
      }
      this.viewer = options.viewer;
      this.container = options.container;

      this.divElt = document.createElement("div");
      if(this.container){
        this.container.appendChild(this.divElt);
      } else {
        this.viewer.container.appendChild(this.divElt);
      } 
      //this.viewer.container.parentNode.parentNode.insertBefore(this.divElt, this.viewer.container.nextSibling);   
      this.divElt.style.position = "absolute";
      this.divElt.style.margin = "0";
      this.divElt.style.cursor = 'move';
      this.divElt.classList.add("OSD-scalebar");      
      //this.divElt.style.pointerEvents = "none";

      this.setMinWidth(options.minWidth || "150px");

      this.type = options.type || $.ScalebarType.MICROSCOPY;
      this.setDrawScalebarFunction(options.type || $.ScalebarType.MICROSCOPY);
      this.color = options.color || "black";
      this.fontColor = options.fontColor || "black";
      this.backgroundColor = options.backgroundColor || "none";
      this.fontSize = options.fontSize || "";
      this.barThickness = options.barThickness || 2;
      this.pixelsPerMeter = options.pixelsPerMeter || null;
      this.referenceItemIdx = options.referenceItemIdx || 0;
      this.location = options.location || $.ScalebarLocation.BOTTOM_LEFT;
      this.xOffset = options.xOffset || 5;
      this.yOffset = options.yOffset || 5;
      this.stayInsideImage = isDefined(options.stayInsideImage) ?
              options.stayInsideImage : true;
      this.sizeAndTextRenderer = options.sizeAndTextRenderer ||
              $.ScalebarSizeAndTextRenderer.METRIC_LENGTH;

      this.moved = 0;
      this.manualSize = 0;

      this.rightBorder = $.makeNeutralElement('div');
      this.borderStyle = {
          width:      '15px',
          color:      '#fff'
      };
      this.rightBorder.className        = 'rightBorder';
      this.rightBorder.style.position   = 'absolute';
      this.rightBorder.style.width      = this.borderStyle.width;
      this.rightBorder.style.height     = this.borderStyle.width;
      this.rightBorder.style.background = this.borderStyle.color;      
      this.rightBorder.style.right = '-5px';
      this.rightBorder.style.height = '100%';
      this.rightBorder.style.opacity = 0;
      this.rightBorder.style.cursor = 'e-resize';
      this.divElt.appendChild(this.rightBorder);
      this.textElt = $.makeNeutralElement('div');
      this.textElt.style.display = 'inline-block';
      this.divElt.appendChild(this.textElt);

      new $.MouseTracker({
        element:     this.rightBorder,
        dragHandler: this.onScalebarBorderDrag.bind(this),
      });      

      var self = this;
      this.viewer.addHandler("open", function() {
          self.refresh();
      });
      this.viewer.addHandler("animation", function() {
          self.refresh();
      });
      this.viewer.addHandler("resize", function() {
          self.refresh();
      });

      this.mouseTracker = new OpenSeadragon.MouseTracker({
        element:     this.divElt,
        dragHandler: this.onScalebarDrag.bind(this),
        dblClickHandler: this.onScalebarDblClick.bind(this)
      });

  };

  $.Scalebar.prototype = {
      updateOptions: function(options) {
          if (!options) {
              return;
          }
          if (isDefined(options.type)) {
              this.type = options.type;  
              this.setDrawScalebarFunction(options.type);
          }
          if (isDefined(options.minWidth)) {
              this.setMinWidth(options.minWidth);
          }
          if (isDefined(options.color)) {
              this.color = options.color;
          }
          if (isDefined(options.fontColor)) {
              this.fontColor = options.fontColor;
          }
          if (isDefined(options.backgroundColor)) {
              this.backgroundColor = options.backgroundColor;
          }
          if (isDefined(options.fontSize)) {
              this.fontSize = options.fontSize;
          }
          if (isDefined(options.barThickness)) {
              this.barThickness = options.barThickness;
          }
          if (isDefined(options.pixelsPerMeter)) {
              this.pixelsPerMeter = options.pixelsPerMeter;
          }
          if (isDefined(options.referenceItemIdx)) {
              this.referenceItemIdx = options.referenceItemIdx;
          }
          if (isDefined(options.location)) {
              this.location = options.location;
          }
          if (isDefined(options.xOffset)) {
              this.xOffset = options.xOffset;
          }
          if (isDefined(options.yOffset)) {
              this.yOffset = options.yOffset;
          }
          if (isDefined(options.stayInsideImage)) {
              this.stayInsideImage = options.stayInsideImage;
          }
          if (isDefined(options.sizeAndTextRenderer)) {
              this.sizeAndTextRenderer = options.sizeAndTextRenderer;
          }
      },
      setDrawScalebarFunction: function(type) {
          if (!type) {
              this.drawScalebar = null;
          }
          else if (type === $.ScalebarType.MAP) {
              this.drawScalebar = this.drawMapScalebar;
          }
          else if (type === $.ScalebarType.CIRCLE) {
              this.drawScalebar = this.drawCircleScalebar;              
          } else {
              this.drawScalebar = this.drawMicroscopyScalebar;
          }
      },
      setMinWidth: function(minWidth) {
          this.divElt.style.width = minWidth;
          // Make sure to display the element before getting is width
          this.divElt.style.display = "";
          this.minWidth = this.divElt.offsetWidth;
      },
      /**
       * Refresh the scalebar with the options submitted.
       * @param {Object} options
       * @param {OpenSeadragon.ScalebarType} options.type The scale bar type.
       * Default: microscopy
       * @param {Integer} options.pixelsPerMeter The pixels per meter of the
       * zoomable image at the original image size. If null, the scale bar is not
       * displayed. default: null
       * @param {Integer} options.referenceItemIdx Specify the item from
       * viewer.world to which options.pixelsPerMeter is refering.
       * default: 0
       * @param (String} options.minWidth The minimal width of the scale bar as a
       * CSS string (ex: 100px, 1em, 1% etc...) default: 150px
       * @param {OpenSeadragon.ScalebarLocation} options.location The location
       * of the scale bar inside the viewer. default: bottom left
       * @param {Integer} options.xOffset Offset location of the scale bar along x.
       * default: 5
       * @param {Integer} options.yOffset Offset location of the scale bar along y.
       * default: 5
       * @param {Boolean} options.stayInsideImage When set to true, keep the 
       * scale bar inside the image when zooming out. default: true
       * @param {String} options.color The color of the scale bar using a color
       * name or the hexadecimal format (ex: black or #000000) default: black
       * @param {String} options.fontColor The font color. default: black
       * @param {String} options.backgroundColor The background color. default: none
       * @param {String} options.fontSize The font size. default: not set
       * @param {String} options.barThickness The thickness of the scale bar in px.
       * default: 2
       * @param {function} options.sizeAndTextRenderer A function which will be
       * called to determine the size of the scale bar and it's text content.
       * The function must have 2 parameters: the PPM at the current zoom level
       * and the minimum size of the scale bar. It must return an object containing
       * 2 attributes: size and text containing the size of the scale bar and the text.
       * default: $.ScalebarSizeAndTextRenderer.METRIC_LENGTH
       */
      refresh: function(options) {
          this.updateOptions(options);

          if (!this.viewer.isOpen() ||
                  !this.drawScalebar ||
                  !this.pixelsPerMeter ||
                  !this.location) {
              this.divElt.style.display = "none";
              return;
          }

          this.divElt.style.display = "";

          var viewport = this.viewer.viewport;
          var tiledImage = this.viewer.world.getItemAt(this.referenceItemIdx);
          var zoom = tiledImageViewportToImageZoom(tiledImage,
                  viewport.getZoom(true));        
          
          var currentPPM = zoom * this.pixelsPerMeter;

          function roundWithUnit(valueWithUnit, precision){
            var split = valueWithUnit.match(/^(\d+(?:\.\d+)?)(.*)$/);
            var value = parseFloat(split[1]);
            var unit = split[2];            
            return value.toPrecision(precision) + unit;
          }

          function getScalebarTextFromSizeForMetric(ppm, size, minSize, unitSuffix) {   
            size = parseFloat(size);
            var value = size / minSize;
            var factor = value / ppm * minSize; //getSignificand(value / ppm * minSize);
            var valueWithUnit = getWithUnit(factor, unitSuffix);
            valueWithUnit = roundWithUnit(valueWithUnit, 3);
            return {
                size: size,
                text: valueWithUnit
            };
          }            

          var props = {};
          if(!this.manualSize){
            props = this.sizeAndTextRenderer(currentPPM, this.minWidth);
          } else {                      
            props = getScalebarTextFromSizeForMetric(currentPPM, this.manualSize, this.minWidth, "m");
          }        
          this.drawScalebar(props.size, props.text);

          //Mindat specific - to delete
          var location = {};
          location = this.getScalebarLocation();
          var y = location.y;
          var x = location.x;

          var cpf = document.getElementById("copyrightfloat");
          if(cpf)
          {
              if(cpf.offsetTop) {
                  var maxy = cpf.offsetTop - 25;
                  if (y > maxy) y = maxy;
              }
          }
          if(x<33) x=33;

          if(!this.moved){  
                this.divElt.style.left = x + "px";
                this.divElt.style.top = y + "px";
          }      
      },

      setWidthToFillContainer: function(){
        var containerLeft = 0;
        if(this.container){
            this.manualSize = this.container.offsetWidth;
            containerLeft = this.container.offsetLeft;
        } else {
            this.manualSize = this.viewer.container.offsetWidth;
            containerLeft = this.viewer.container.offsetLeft;
        } 
        this.divElt.style.left = parseInt(containerLeft) +'px';
        this.moved = 1;
        this.refresh();
      },  

      onScalebarDrag: function (e) {      
        this.moved = 1;
        var el = e.eventSource.element;
        var delta = e.delta;
        x = parseFloat(el.style.left);
        y = parseFloat(el.style.top);
        x += delta.x;
        y += delta.y;       
        el.style.left = x+'px';
        el.style.top = y+'px';     
      },     
      onScalebarDblClick: function (){  
        if(!this.moved && !this.manualSize) return;
        this.moved = 0; 
        this.manualSize = 0;
        this.refresh();
      },  
      onScalebarBorderDrag: function (e) {
        var delta = e.delta; 
        x = parseFloat(this.divElt.style.width);
        x += delta.x;
        if(x < parseFloat(this.textElt.clientWidth) + 20) return;
        this.divElt.style.width = x+'px'; 
        this.manualSize = this.divElt.style.width;    
        this.refresh();
      },      

      drawMicroscopyScalebar: function(size, text) {
          this.divElt.style.borderRadius = null;
          this.textElt.style.paddingTop = null;
          this.divElt.style.height = null;
          this.divElt.style.fontSize = this.fontSize;
          this.divElt.style.textAlign = "center";
          this.divElt.style.color = this.fontColor;
          this.divElt.style.border = "none";
          this.divElt.style.borderBottom = this.barThickness + "px solid " + this.color;
          this.divElt.style.backgroundColor = this.backgroundColor;
          this.textElt.innerHTML = text;
          this.divElt.style.width = size + "px";
      },
      drawMapScalebar: function(size, text) {
          this.divElt.style.borderRadius = null;
          this.textElt.style.paddingTop = null;
          this.divElt.style.height = null;        
          this.divElt.style.fontSize = this.fontSize;
          this.divElt.style.textAlign = "center";
          this.divElt.style.color = this.fontColor;
          this.divElt.style.border = this.barThickness + "px solid " + this.color;
          this.divElt.style.borderTop = "none";
          this.divElt.style.backgroundColor = this.backgroundColor;
          this.textElt.innerHTML = text;
          this.divElt.style.width = size + "px";
      },
      drawCircleScalebar: function(size, text) {
        this.divElt.style.fontSize = this.fontSize;
        this.divElt.style.textAlign = "center";
        this.divElt.style.color = this.fontColor;
        this.divElt.style.border = this.barThickness + "px solid " + this.color;
        this.divElt.style.backgroundColor = this.backgroundColor;
        this.textElt.innerHTML = text;
        this.divElt.style.width = size + "px";
        this.divElt.style.height = this.divElt.style.width;
        var paddingTop = this.divElt.clientHeight / 2 - parseFloat(this.divElt.style.fontSize) / 2;
        this.textElt.style.paddingTop = paddingTop +"px";
        this.divElt.style.borderRadius = "50%";     
        // if(!this.lineElt){
        //   this.lineElt = document.createElement("div");  
        //   this.divElt.appendChild(this.lineElt);
        // }           
        // this.lineElt.style.height = "1px";
        // this.lineElt.style.border = this.barThickness + "px solid " + this.color;
    },      
      /**
       * Compute the location of the scale bar.
       * @returns {OpenSeadragon.Point}
       */
      getScalebarLocation: function() {
          var container;
          if (this.location === $.ScalebarLocation.TOP_LEFT) {
              var x = 0;
              var y = 0;
              if (this.stayInsideImage) {
                  var pixel = this.viewer.viewport.pixelFromPoint(
                          new $.Point(0, 0), true);
                  if (!this.viewer.wrapHorizontal) {
                      x = Math.max(pixel.x, 0);
                  }
                  if (!this.viewer.wrapVertical) {
                      y = Math.max(pixel.y, 0);
                  }
              }
              return new $.Point(x + this.xOffset, y + this.yOffset);
          }
          if (this.location === $.ScalebarLocation.TOP_RIGHT) {
              var barWidth = this.divElt.offsetWidth;
              if(this.container){
                container = this.container;
              } else {
                container = this.viewer.container;
              } 
              var x = container.offsetWidth - barWidth;
              var y = 0;
              if (this.stayInsideImage) {
                  var pixel = this.viewer.viewport.pixelFromPoint(
                          new $.Point(1, 0), true);
                  if (!this.viewer.wrapHorizontal) {
                      x = Math.min(x, pixel.x - barWidth);
                  }
                  if (!this.viewer.wrapVertical) {
                      y = Math.max(y, pixel.y);
                  }
              }
              return new $.Point(x - this.xOffset, y + this.yOffset);
          }
          if (this.location === $.ScalebarLocation.BOTTOM_RIGHT) {
              var barWidth = this.divElt.offsetWidth;
              var barHeight = this.divElt.offsetHeight;
              if(this.container){
                container = this.container;
              } else {
                container = this.viewer.container;
              } 
              var x = container.offsetWidth - barWidth;
              var y = container.offsetHeight - barHeight;
              if (this.stayInsideImage) {
                  var pixel = this.viewer.viewport.pixelFromPoint(
                          new $.Point(1, 1 / this.viewer.source.aspectRatio),
                          true);
                  if (!this.viewer.wrapHorizontal) {
                      x = Math.min(x, pixel.x - barWidth);
                  }
                  if (!this.viewer.wrapVertical) {
                      y = Math.min(y, pixel.y - barHeight);
                  }
              }
              return new $.Point(x - this.xOffset, y - this.yOffset);
          }
          if (this.location === $.ScalebarLocation.BOTTOM_LEFT) {
              var barHeight = this.divElt.offsetHeight;
              if(this.container){
                container = this.container;
              } else {
                container = this.viewer.container;
              }  
              var x = 0;
              var y = container.offsetHeight - barHeight;
              if (this.stayInsideImage) {
                  var pixel = this.viewer.viewport.pixelFromPoint(
                          new $.Point(0, 1 / this.viewer.source.aspectRatio),
                          true);
                  if (!this.viewer.wrapHorizontal) {
                      x = Math.max(x, pixel.x);
                  }
                  if (!this.viewer.wrapVertical) {
                      y = Math.min(y, pixel.y - barHeight);
                  }
              }
              return new $.Point(x + this.xOffset, y - this.yOffset);
          }
      },
      /**
       * Get the rendered scalebar in a canvas.
       * @returns {Element} A canvas containing the scalebar representation
       */
      getAsCanvas: function() {
          var canvas = document.createElement("canvas");
          canvas.width = this.divElt.offsetWidth;
          canvas.height = this.divElt.offsetHeight;
          var context = canvas.getContext("2d");
          context.fillStyle = this.backgroundColor;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = this.color;
          context.fillRect(0, canvas.height - this.barThickness,
                  canvas.width, canvas.height);
          if (this.drawScalebar === this.drawMapScalebar) {
              context.fillRect(0, 0, this.barThickness, canvas.height);
              context.fillRect(canvas.width - this.barThickness, 0,
                      this.barThickness, canvas.height);
          }
          context.font = window.getComputedStyle(this.divElt).font;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillStyle = this.fontColor;
          var hCenter = canvas.width / 2;
          var vCenter = canvas.height / 2;
          context.fillText(this.divElt.textContent, hCenter, vCenter);
          return canvas;
      }
  };

  $.ScalebarSizeAndTextRenderer = {
      /**
       * Metric length. From nano meters to kilometers.
       */
      METRIC_LENGTH: function(ppm, minSize) {
          return getScalebarSizeAndTextForMetric(ppm, minSize, "m");
      },
      /**
       * Imperial length. Choosing the best unit from thou, inch, foot and mile.
       */
      IMPERIAL_LENGTH: function(ppm, minSize) {
          var maxSize = minSize * 2;
          var ppi = ppm * 0.0254;
          if (maxSize < ppi * 12) {
              if (maxSize < ppi) {
                  var ppt = ppi / 1000;
                  return getScalebarSizeAndText(ppt, minSize, "th");
              }
              return getScalebarSizeAndText(ppi, minSize, "in");
          }
          var ppf = ppi * 12;
          if (maxSize < ppf * 2000) {
              return getScalebarSizeAndText(ppf, minSize, "ft");
          }
          var ppmi = ppf * 5280;
          return getScalebarSizeAndText(ppmi, minSize, "mi");
      },
      /**
       * Standard time. Choosing the best unit from second (and metric divisions),
       * minute, hour, day and year.
       */
      STANDARD_TIME: function(pps, minSize) {
          var maxSize = minSize * 2;
          if (maxSize < pps * 60) {
              return getScalebarSizeAndTextForMetric(pps, minSize, "s", false);
          }
          var ppminutes = pps * 60;
          if (maxSize < ppminutes * 60) {
              return getScalebarSizeAndText(ppminutes, minSize, "minute", true);
          }
          var pph = ppminutes * 60;
          if (maxSize < pph * 24) {
              return getScalebarSizeAndText(pph, minSize, "hour", true);
          }
          var ppd = pph * 24;
          if (maxSize < ppd * 365.25) {
              return getScalebarSizeAndText(ppd, minSize, "day", true);
          }
          var ppy = ppd * 365.25;
          return getScalebarSizeAndText(ppy, minSize, "year", true);
      },
      /**
       * Generic metric unit. One can use this function to create a new metric
       * scale. For example, here is an implementation of energy levels:
       * function(ppeV, minSize) {
       *   return OpenSeadragon.ScalebarSizeAndTextRenderer.METRIC_GENERIC(
       *           ppeV, minSize, "eV");
       * }
       */
      METRIC_GENERIC: getScalebarSizeAndTextForMetric
  };

  // Missing TiledImage.viewportToImageZoom function in OSD 2.0.0
  function tiledImageViewportToImageZoom(tiledImage, viewportZoom) {
      var ratio = tiledImage._scaleSpring.current.value *
              tiledImage.viewport._containerInnerSize.x /
              tiledImage.source.dimensions.x;      
      return ratio * viewportZoom;
  }

  function getScalebarSizeAndText(ppm, minSize, unitSuffix, handlePlural) {
      var value = normalize(ppm, minSize);
      var factor = roundSignificand(value / ppm * minSize, 3);
      var size = value * minSize;
      var plural = handlePlural && factor > 1 ? "s" : "";
      return {
          size: size,
          text: factor + " " + unitSuffix + plural
      };
  }

  function getScalebarSizeAndTextForMetric(ppm, minSize, unitSuffix) {
    var value = normalize(ppm, minSize);
    var factor = roundSignificand(value / ppm * minSize, 3);
    var size = value * minSize;
    var valueWithUnit = getWithUnit(factor, unitSuffix);
    return {
        size: size,
        text: valueWithUnit
    };
  }

  function normalize(value, minSize) {
      var significand = getSignificand(value);
      var minSizeSign = getSignificand(minSize);
      var result = getSignificand(significand / minSizeSign);
      if (result >= 5) {
          result /= 5;
      }
      if (result >= 4) {
          result /= 4;
      }
      if (result >= 2) {
          result /= 2;
      }
      return result;
  }

  function getSignificand(x) {
      return x * Math.pow(10, Math.ceil(-log10(x)));
  }

  function roundSignificand(x, decimalPlaces) {
      var exponent = -Math.ceil(-log10(x));
      var power = decimalPlaces - exponent;
      var significand = x * Math.pow(10, power);
      // To avoid rounding problems, always work with integers
      if (power < 0) {
          return Math.round(significand) * Math.pow(10, -power);
      }
      return Math.round(significand) / Math.pow(10, power);
  }

  function log10(x) {
      return Math.log(x) / Math.log(10);
  }

  function getWithUnit(value, unitSuffix) {
      if (value < 0.000001) {
          return value * 1000000000 + " n" + unitSuffix;
      }
      if (value < 0.0001) {
          return value * 1000000 + " μ" + unitSuffix;
      }	
      if (value < 0.01) {
          return value * 1000 + " m" + unitSuffix;
      }		
      if (value < 1) {
          return value * 100 + " c" + unitSuffix;
      }
      if (value >= 1000) {
          return value / 1000 + " k" + unitSuffix;
      }
      return value + " " + unitSuffix;
  }

  function isDefined(variable) {
      return typeof (variable) !== "undefined";
  }
}(OpenSeadragon));