/** 
* modified by @author Pavel Martynov <pavel.bw@gmail.com>
* OSD filtering plugin was modified to add support for functions that merge two or more images into one
*/

/*
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

(function() {

    'use strict';

    var $ = window.OpenSeadragon;
    if (!$) {
        $ = require('openseadragon');
        if (!$) {
            throw new Error('OpenSeadragon is missing.');
        }
    }
    // Requires OpenSeadragon >=2.1
    if (!$.version || $.version.major < 2 ||
        $.version.major === 2 && $.version.minor < 1) {
        throw new Error(
            'Filtering plugin requires OpenSeadragon version >= 2.1');
    }

    $.Viewer.prototype.setFilterOptions = function(options) {
        if (!this.filterPluginInstance) {
            options = options || {};
            options.viewer = this;
            this.filterPluginInstance = new $.FilterPlugin(options);
        } else {
            setOptions(this.filterPluginInstance, options);
        }
    };

    /**
     * @class FilterPlugin
     * @param {Object} options The options
     * @param {OpenSeadragon.Viewer} options.viewer The viewer to attach this
     * plugin to.
     * @param {String} [options.loadMode='async'] Set to sync to have the filters
     * applied synchronously. It will only work if the filters are all synchronous.
     * Note that depending on how complex the filters are, it may also hang the browser.
     * @param {Object[]} options.filters The filters to apply to the images.
     * @param {OpenSeadragon.TiledImage[]} options.filters[x].items The tiled images
     * on which to apply the filter.
     * @param {function|function[]} options.filters[x].processors The processing
     * function(s) to apply to the images. The parameters of this function are
     * the context to modify and a callback to call upon completion.
     */
    $.FilterPlugin = function(options) {
        options = options || {};
        if (!options.viewer) {
            throw new Error('A viewer must be specified.');
        }
        var self = this;
        this.viewer = options.viewer;

        this.viewer.addHandler('tile-loaded', tileLoadedHandler);

        // filterIncrement allows to determine whether a tile contains the
        // latest filters results.
        this.filterIncrement = 0;

        setOptions(this, options);


        function tileLoadedHandler(event) {
            var processors = getFiltersProcessors(self, event.tiledImage);
            var mergeProcessor = getMergeProcessors(self, event.tiledImage);          
            if (processors.length === 0 && mergeProcessor.length === 0 ) {
                return;
            }
            var tile = event.tile;
            var image = event.image;          
            var contextFrom = [];
            var merge = true;    

            if (image !== null && typeof(image) != "undefined") {
                var callback = event.getCompletionCallback();
                var canvas = window.document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var context0 = canvas.getContext('2d');
                context0.drawImage(image, 0, 0);

                if (processors.length > 0) {
                   //var callback = event.getCompletionCallback();
                   applyFilters(context0, processors, callback); //function(){  });
                   tile._filterIncrement = self.filterIncrement;
                }               
              
                if (mergeProcessor.length > 0) {
                    tile._context2DnotDraw = context0;  
                } else {
                    tile.context2D = context0;
                    merge = false;
                }
               
                if (mergeProcessor.length > 0){ 
                  var sourceTiles = GetMergeSourceTiles(self, event.tiledImage, event.tile);
                  for (var i=0; i<sourceTiles.length; i++){
                    if (sourceTiles[i]._context2DnotDraw != null) {
                      contextFrom[i] = sourceTiles[i]._context2DnotDraw;    
                    } else {
                      merge = false; // not all source tiles have been loaded yet. not ready for merging
                    } 
                  }                             
               
                  if (merge) {
                        var mergeProcessors = getMergeProcessors(self, event.tiledImage);
                        mergeProcessors[0](contextFrom, callback); 
                        sourceTiles[0].context2D = contextFrom[0];
                        sourceTiles[0]._filterIncrement = self.filterIncrement;
                  } 

                }                 
                //tile._filterIncrement = self.filterIncrement;
            }
        }

    function GetMergeSourceTiles (instance, tiledImage, tile) {
        if (instance.filters.length === 0) {
            return [];
        }
        var sourceTiledImages = [];
        var sourceTiles = [];
        for (var i = 0; i < instance.filters.length; i++) {
            var filter = instance.filters[i];       
            if ($.isArray(filter.items) && filter.merge==true && filter.items.indexOf(tiledImage) >= 0) {
                sourceTiledImages = $.isArray(filter.items) ? filter.items : [filter.items];              
                break;
            }
        }
        var LNG = sourceTiledImages.length;
        for (var i = 0; i < LNG; i++) {        
             sourceTiles[i] = sourceTiledImages[i].tilesMatrix[tile.level][tile.x][tile.y];
        } 
        return sourceTiles ? sourceTiles : [];
    }      


    function getMergeProcessors(instance, item) {
        if (instance.filters.length === 0) {
            return [];
        }
        var mergeProcessors = [];
        for (var i = 0; i < instance.filters.length; i++) {
            var filter = instance.filters[i];        
            if ($.isArray(filter.items) && filter.merge==true && filter.items.indexOf(item) >= 0) {
                mergeProcessors = filter.mergeProcessor;
                break;
            }
        }
        return mergeProcessors ? mergeProcessors : [];
    }       
      
          function applyFilters(context, filtersProcessors, callback) {
            if (callback) {
                var currentIncrement = self.filterIncrement;
                var callbacks = [];
                for (var i = 0; i < filtersProcessors.length - 1; i++) {
                    (function(i) {
                        callbacks[i] = function() {
                            // If the increment has changed, stop the computation
                            // chain immediately.
                            if (self.filterIncrement !== currentIncrement) {
                                return;
                            }
                            filtersProcessors[i + 1](context, callbacks[i + 1]);
                        };
                    })(i);
                }
                callbacks[filtersProcessors.length - 1] = function() {
                    // If the increment has changed, do not call the callback.
                    // (We don't want OSD to draw an outdated tile in the canvas).
                    if (self.filterIncrement !== currentIncrement) {
                        return;
                    }
                    callback();
                };
                filtersProcessors[0](context, callbacks[0]);
            } else {
                for (var i = 0; i < filtersProcessors.length; i++) {
                    filtersProcessors[i](context, function() {
                    });
                }
            }
        }     
    };
  
    function setOptions(instance, options) {
        options = options || {};
        var filters = options.filters;
        instance.filters = !filters ? [] :
            $.isArray(filters) ? filters : [filters];
        for (var i = 0; i < instance.filters.length; i++) {
            var filter = instance.filters[i];
            if (!filter.processors && !filter.merge) {
                throw new Error('Filter processors must be specified.');
            } 
            if (!filter.mergeProcessor && filter.merge) {
                throw new Error('Filter mergeProcessor must be specified.');
            }
            if (!$.isArray(filter.items) && filter.merge){
                throw new Error('Items must be set as an array of two or more images if merge is used');
            }
            if (!filter.merge) {
            filter.processors = $.isArray(filter.processors) ?
                filter.processors : [filter.processors];
            }         
            if (filter.merge) {
            filter.mergeProcessor = $.isArray(filter.mergeProcessor) ?
                filter.mergeProcessor : [filter.mergeProcessor];
            }           
        }
        instance.filterIncrement++;

        if (options.loadMode === 'sync') {
            instance.viewer.forceRedraw();
        } else {
            var itemsToReset = [];
            for (var i = 0; i < instance.filters.length; i++) {
                var filter = instance.filters[i];
                if (!filter.items) {
                    itemsToReset = getAllItems(instance.viewer.world);
                    break;
                }
                if ($.isArray(filter.items)) {
                    for (var j = 0; j < filter.items.length; j++) {
                        addItemToReset(filter.items[j], itemsToReset);
                    }
                } else {
                    addItemToReset(filter.items, itemsToReset);
                }
            }
            for (var i = 0; i < itemsToReset.length; i++) {
              if(itemsToReset[i]) itemsToReset[i].reset(); 
            }
           // bug: for some reason if no merging is used, only filters, after itemsToReset clears initial tiles, visible when the viewer starts, they are not redrawn 
           // forceRedraw below doesn't help
           //  instance.viewer.forceRedraw();
           //  setTimeout(function(){
           //       for (var i = 0; i < itemsToReset.length; i++) {
           //         itemsToReset[i].draw();
           //     }                      
           // }, 100);
        }
    }

    function addItemToReset(item, itemsToReset) {
        if (itemsToReset.indexOf(item) >= 0) {
//TODO correct or delete          
//            throw new Error('An item can not have filters ' +
//                'assigned multiple times.');
        }
        itemsToReset.push(item);
    }

    function getAllItems(world) {
        var result = [];
        for (var i = 0; i < world.getItemCount(); i++) {
            result.push(world.getItemAt(i));
        }
        return result;
    }

    function getFiltersProcessors(instance, item) {
        if (instance.filters.length === 0) {
            return [];
        }

        var globalProcessors = null;
        for (var i = 0; i < instance.filters.length; i++) {
            var filter = instance.filters[i];
            if (!filter.items) {
                globalProcessors = filter.processors;
            } else if (filter.processors && (filter.items === item ||
                $.isArray(filter.items) && filter.items.indexOf(item) >= 0)) {
                globalProcessors = filter.processors;
            }
        }
        return globalProcessors ? globalProcessors : [];
    }

    $.Filters = {      
        ANAGLYPH: function(anaglyphMode, glassesType, leftImageFirst) {  
            //anaglyphMode   : 'Optimized+', 'Optimized', 'Color', 'Grey', 'True' 
            //glassesType    : 'RedCyan', 'GreenMagenta'
            //leftImageFirst : true, false 
            return function(context, callback) {
                var index = 0;
                var idr, idg, idb;     
                var r, g, b;
                var source1, source2;
                if (leftImageFirst){
                  source1 = context[0]; 
                  source2 = context[1];
                } else {
                  source1 = context[1];
                  source2 = context[0];                  
                } 
                var iData1 = source1.getImageData(0,0,source1.canvas.width,source1.canvas.height);
                var iData2 = source2.getImageData(0,0,source1.canvas.width,source1.canvas.height);
                var y = source1.canvas.width * source1.canvas.height;
	              var imageData = source1.createImageData(source1.canvas.width,source1.canvas.height);
                if (glassesType == 'GreenMagenta'){      
                  idr = iData2;
                  idg = iData1;
                  idb = iData2;              
                // } else if (glassesType == 'YellowBlue') {    
                //   idr = iData2;
                //   idg = iData2;
                //   idb = iData1;                 
                } else {   // glassesType == 'RedCyan'                
                  idr = iData1;
                  idg = iData2;
                  idb = iData2;        
                }                 
                switch(anaglyphMode){
                  case 'Optimized+':
                      for (var x = 0; x++ < y; ){
                        g = idr.data[index+1] + 0.45 * Math.max(0, idr.data[index+0] - idr.data[index+1]);
                        b = idr.data[index+2] + 0.25 * Math.max(0, idr.data[index+0] - idr.data[index+2]);
                        r = g * 0.749 + b * 0.251;
                        //r = Math.pow(g * 0.749 + b * 0.251, 1/1.6);
                        g = idg.data[index+1] + 0.45 * Math.max(0, idg.data[index+0] - idg.data[index+1]);
                        b = idb.data[index+2] + 0.25 * Math.max(0, idb.data[index+0] - idb.data[index+2]);
                        r = Math.min(Math.max(r, 0), 255);
                        g = Math.min(Math.max(g, 0), 255);
                        b = Math.min(Math.max(b, 0), 255);
                        imageData.data[index++] = r;
                        imageData.data[index++] = g;
                        imageData.data[index++] = b;
                        imageData.data[index++] = 0xFF;                        
                      };
                      break;
                    
                   case 'Optimized':
                      for (x = 0; x++ < y; ) {
                        r = idr.data[index+1] * 0.7 + idr.data[index+2] * 0.3;
                        g = idg.data[index+1];
                        b = idb.data[index+2];
                        r = Math.min(Math.max(r, 0), 255);			
                        imageData.data[index++] = r;
                        imageData.data[index++] = g;
                        imageData.data[index++] = b;
                        imageData.data[index++] = 0xFF;
                      };
                      break;	
                    
                    case 'Color':
                        for (x = 0; x++ < y; ) {
                          imageData.data[index] = idr.data[index++];
                          imageData.data[index] = idg.data[index++];
                          imageData.data[index] = idb.data[index++];
                          imageData.data[index] = 0xFF; index++;
                        };
                        break;
                  
                    case 'Grey':
                        for (x = 0; x++ < y; ) {
                          r = idr.data[index+0] * 0.299 + idr.data[index+1] * 0.587 + idr.data[index+2] * 0.114;
                          g = idg.data[index+0] * 0.299 + idg.data[index+1] * 0.587 + idg.data[index+2] * 0.114;
                          b = idb.data[index+0] * 0.299 + idb.data[index+1] * 0.587 + idb.data[index+2] * 0.114;
                          r = Math.min(Math.max(r, 0), 255);
                          g = Math.min(Math.max(g, 0), 255);
                          b = Math.min(Math.max(b, 0), 255);
                          imageData.data[index++] = r;
                          imageData.data[index++] = g;
                          imageData.data[index++] = b;
                          imageData.data[index++] = 0xFF;
                        };
                        break;
                    
                    case 'True':
                      if (glassesType == 'GreenMagenta') { idb = idg; }  
             
                      for (x = 0; x++ < y; ) {
                        r = idr.data[index+0] * 0.299 + idr.data[index+1] * 0.587 + idr.data[index+2] * 0.114;
                        if (glassesType == 'GreenMagenta') {
                          g = idg.data[index+0] * 0.299 + idg.data[index+1] * 0.587 + idg.data[index+2] * 0.114;
                          b = 0;
                        } else {
                          g = 0;
                          b = idb.data[index+0] * 0.299 + idb.data[index+1] * 0.587 + idb.data[index+2] * 0.114;
                        }
                        r = Math.min(Math.max(r, 0), 255);
                        b = Math.min(Math.max(b, 0), 255);
                        imageData.data[index++] = r;
                        imageData.data[index++] = g;
                        imageData.data[index++] = b;
                        imageData.data[index++] = 0xFF;
                      }
                      break;
                }              
                context[0].putImageData(imageData, 0, 0); 
                callback();
            };
        },
        INTERLACE: function(mode, leftImageFirst) {  
          //mode   : 'row', 'column' 
          //leftImageFirst : true, false 
          return function(context, callback) {
              var source1, source2;
              if (leftImageFirst){
                source1 = context[0]; 
                source2 = context[1];
              } else {
                source1 = context[1];
                source2 = context[0];                  
              } 
              var width = source1.canvas.width;
              var height = source1.canvas.height;
             // var context2D = source1.canvas.getContext();
              //var iData1 = source1.getImageData(0,0,width,height);
              var iData2 = source2.getImageData(0,0,width,height);
              if(mode=='row'){
                for (var i=0;i<height;i+=2) {	
                  source1.drawImage(                      
                    source2.canvas,
                    0,
                    0 + i,
                    width,
                    1,
                    0,
                    0 + i,
                    width,
                    1
                  );
                }
              } else {
                for (var j=0;j<width;j+=2) {	
                  source1.drawImage(
                    source2.canvas,
                    0 + j,
                    0,
                    1,
                    height,
                    0 + j,
                    0,
                    1,
                    height
                  );
                }	                  
              }            
              context[0] = source1; 
              callback();
          };
        },        
        THRESHOLDING: function(threshold) {
            if (threshold < 0 || threshold > 255) {
                throw new Error('Threshold must be between 0 and 255.');
            }
            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    var r = pixels[i];
                    var g = pixels[i + 1];
                    var b = pixels[i + 2];
                    var v = (r + g + b) / 3;
                    pixels[i] = pixels[i + 1] = pixels[i + 2] =
                        v < threshold ? 0 : 255;
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        BRIGHTNESS: function(adjustment) {
            if (adjustment < -255 || adjustment > 255) {
                throw new Error(
                    'Brightness adjustment must be between -255 and 255.');
            }
            var precomputedBrightness = []
            for (var i = 0; i < 256; i++) {
                precomputedBrightness[i] = i + adjustment;
            }
            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    pixels[i] = precomputedBrightness[pixels[i]];
                    pixels[i + 1] = precomputedBrightness[pixels[i + 1]];
                    pixels[i + 2] = precomputedBrightness[pixels[i + 2]];
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        CONTRAST: function(adjustment) {
            if (adjustment < 0) {
                throw new Error('Contrast adjustment must be positive.');
            }
            var precomputedContrast = []
            for (var i = 0; i < 256; i++) {
                precomputedContrast[i] = i * adjustment;
            }
            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    pixels[i] = precomputedContrast[pixels[i]];
                    pixels[i + 1] = precomputedContrast[pixels[i + 1]];
                    pixels[i + 2] = precomputedContrast[pixels[i + 2]];
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        GAMMA: function(adjustment) {
            if (adjustment < 0) {
                throw new Error('Gamma adjustment must be positive.');
            }
            var precomputedGamma = []
            for (var i = 0; i < 256; i++) {
                precomputedGamma[i] = Math.pow(i / 255, adjustment) * 255;
            }
            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    pixels[i] = precomputedGamma[pixels[i]];
                    pixels[i + 1] = precomputedGamma[pixels[i + 1]];
                    pixels[i + 2] = precomputedGamma[pixels[i + 2]];
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        GREYSCALE: function() {
            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    var val = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
                    pixels[i] = val;
                    pixels[i + 1] = val;
                    pixels[i + 2] = val;
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        INVERT: function () {
            var precomputedInvert = [];
            for (var i = 0; i < 256; i++) {
                precomputedInvert[i] = 255 - i;
            }
            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    pixels[i] = precomputedInvert[pixels[i]];
                    pixels[i + 1] = precomputedInvert[pixels[i + 1]];
                    pixels[i + 2] = precomputedInvert[pixels[i + 2]];
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        MORPHOLOGICAL_OPERATION: function(kernelSize, comparator) {
            if (kernelSize % 2 === 0) {
                throw new Error('The kernel size must be an odd number.');
            }
            var kernelHalfSize = Math.floor(kernelSize / 2);

            if (!comparator) {
                throw new Error('A comparator must be defined.');
            }

            return function(context, callback) {
                var width = context.canvas.width;
                var height = context.canvas.height;
                var imgData = context.getImageData(0, 0, width, height);
                var originalPixels = context.getImageData(0, 0, width, height)
                    .data;
                var offset;

                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        offset = (y * width + x) * 4;
                        var r = originalPixels[offset];
                        var g = originalPixels[offset + 1];
                        var b = originalPixels[offset + 2];
                        for (var j = 0; j < kernelSize; j++) {
                            for (var i = 0; i < kernelSize; i++) {
                                var pixelX = x + i - kernelHalfSize;
                                var pixelY = y + j - kernelHalfSize;
                                if (pixelX >= 0 && pixelX < width &&
                                    pixelY >= 0 && pixelY < height) {
                                    offset = (pixelY * width + pixelX) * 4;
                                    r = comparator(originalPixels[offset], r);
                                    g = comparator(
                                        originalPixels[offset + 1], g);
                                    b = comparator(
                                        originalPixels[offset + 2], b);
                                }
                            }
                        }
                        imgData.data[offset] = r;
                        imgData.data[offset + 1] = g;
                        imgData.data[offset + 2] = b;
                    }
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        },
        CONVOLUTION: function(kernel) {
            if (!$.isArray(kernel)) {
                throw new Error('The kernel must be an array.');
            }
            var kernelSize = Math.sqrt(kernel.length);
            if ((kernelSize + 1) % 2 !== 0) {
                throw new Error('The kernel must be a square matrix with odd' +
                    'width and height.');
            }
            var kernelHalfSize = (kernelSize - 1) / 2;

            return function(context, callback) {
                var width = context.canvas.width;
                var height = context.canvas.height;
                var imgData = context.getImageData(0, 0, width, height);
                var originalPixels = context.getImageData(0, 0, width, height)
                    .data;
                var offset;

                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        var r = 0;
                        var g = 0;
                        var b = 0;
                        for (var j = 0; j < kernelSize; j++) {
                            for (var i = 0; i < kernelSize; i++) {
                                var pixelX = x + i - kernelHalfSize;
                                var pixelY = y + j - kernelHalfSize;
                                if (pixelX >= 0 && pixelX < width &&
                                    pixelY >= 0 && pixelY < height) {
                                    offset = (pixelY * width + pixelX) * 4;
                                    var weight = kernel[j * kernelSize + i];
                                    r += originalPixels[offset] * weight;
                                    g += originalPixels[offset + 1] * weight;
                                    b += originalPixels[offset + 2] * weight;
                                }
                            }
                        }
                        offset = (y * width + x) * 4;
                        imgData.data[offset] = r;
                        imgData.data[offset + 1] = g;
                        imgData.data[offset + 2] = b;
                    }
                }
                context.putImageData(imgData, 0, 0);
                callback();
            };
        }
    };

}());