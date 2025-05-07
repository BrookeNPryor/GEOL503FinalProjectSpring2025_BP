(function($) {

  $.Drawer.prototype.blendSketch = function(opacity, scale, translate, compositeOperation) {
      var options = opacity;
      if (!$.isPlainObject(options)) {
          options = {
              opacity: opacity,
              scale: scale,
              translate: translate,
              compositeOperation: compositeOperation
          };
      }
      if (!this.useCanvas || !this.sketchCanvas) {
          return;
      }
      opacity = options.opacity;
      compositeOperation = options.compositeOperation;
      var bounds = options.bounds;
      var co_opts = {};

      this.context.save();
      this.context.globalAlpha = opacity;
      if (compositeOperation && (typeof(compositeOperation) != 'function')) {
          this.context.globalCompositeOperation = compositeOperation;
      }
      if (bounds) {
          if (bounds.x < 0) {
            bounds.width += bounds.x;
            bounds.x = 0;
          }
          if (bounds.x + bounds.width > this.canvas.width) {
            bounds.width = this.canvas.width - bounds.x;
          }
          if (bounds.y < 0) {
            bounds.height += bounds.y;
            bounds.y = 0;
          }
          if (bounds.y + bounds.height > this.canvas.height) {
            bounds.height = this.canvas.height - bounds.y;
          }     
          if (typeof(compositeOperation) != 'function'){     
              this.context.drawImage(
                  this.sketchCanvas,
                  bounds.x,
                  bounds.y,
                  bounds.width,
                  bounds.height,
                  bounds.x,
                  bounds.y,
                  bounds.width,
                  bounds.height
              );
          } else {
              co_opts = {
                bounds: bounds
              };
              compositeOperation(this, co_opts);
          }  
      } else {        
          scale = options.scale || 1;
          translate = options.translate;
          var position = translate instanceof $.Point ?
              translate : new $.Point(0, 0);

          var widthExt = 0;
          var heightExt = 0;
          if (translate) {
              var widthDiff = this.sketchCanvas.width - this.canvas.width;
              var heightDiff = this.sketchCanvas.height - this.canvas.height;
              widthExt = Math.round(widthDiff / 2);
              heightExt = Math.round(heightDiff / 2);
          }
          if (typeof(compositeOperation) != 'function'){           			       
            this.context.drawImage(
                this.sketchCanvas,
                position.x - widthExt * scale,
                position.y - heightExt * scale,
                (this.canvas.width + 2 * widthExt) * scale,
                (this.canvas.height + 2 * heightExt) * scale,
                -widthExt,
                -heightExt,
                this.canvas.width + 2 * widthExt,
                this.canvas.height + 2 * heightExt
            );
          } else {
            co_opts = {
              position: position,
              widthExt: widthExt,
              heightExt: heightExt,
              scale: scale
            };
            compositeOperation(this, co_opts);       
          }
      }
      this.context.restore();
  };


  $.halfWidth = function() {
    return function(drawer, opts) {
      var imgData = {};
      if(opts.bounds){
        imgData = drawer.context.getImageData(0, 0, drawer.canvas.width, drawer.canvas.height);
        imgData.data.fill(0);
        drawer.context.putImageData(imgData, 0, 0);
        drawer.context.drawImage(
            drawer.sketchCanvas,
            opts.bounds.x,
            opts.bounds.y,
            opts.bounds.width,
            opts.bounds.height,
            //opts.bounds.x,
            opts.bounds.x + opts.bounds.width / 4,
            opts.bounds.y,
            opts.bounds.width / 2,
            //opts.bounds.width,
            opts.bounds.height
          );         
          console.log(drawer);
          console.log('drawer');
          //drawer.canvas.width = drawer.canvas.width/2;
          
      } else {
        imgData = drawer.context.getImageData(0, 0, drawer.canvas.width, drawer.canvas.height);
        imgData.data.fill(0);
        drawer.context.putImageData(imgData, 0, 0);
        drawer.context.drawImage(
          drawer.sketchCanvas,
          opts.position.x - opts.widthExt * opts.scale,
          opts.position.y - opts.heightExt * opts.scale,
          (drawer.canvas.width + 2 * opts.widthExt) * opts.scale,
          (drawer.canvas.height + 2 * opts.heightExt) * opts.scale,
          -0.5 * opts.widthExt + drawer.canvas.width / 4,
          -opts.heightExt,
          drawer.canvas.width / 2 + 1 * opts.widthExt,
          drawer.canvas.height + 2 * opts.heightExt
        );                              
      }  
    };
  };

  $.interlaced = function(mode, leftImageFirst) {
    //mode: 'row', 'column'
    return function(drawer, opts) {
      var _start = leftImageFirst ? 1 : 0;        
      var imgData = {};
      var i = 0;
      var j = 0;
      var k = 0;
      var k0 =0;      
      var p = 0;

      function get_window_pos(axis){
        if(axis=='y'){
          if(window.screenY) return window.screenY;
          if(window.screenTop) return window.screenTop;
        } else {
          if(window.screenX) return window.screenX;
          if(window.screenLeft) return window.screenLeft;	
        }  			
        return(0);
      }

      if(opts.bounds){
          if(mode=='row'){
            _start = ( _start + drawer.canvas.getBoundingClientRect().top + get_window_pos('y') + opts.bounds.y ) % 2;
            for (i=_start;i<opts.bounds.height;i+=2) {	
              drawer.context.drawImage(                      
                drawer.sketchCanvas,
                opts.bounds.x,
                opts.bounds.y + i,
                opts.bounds.width,
                1,
                opts.bounds.x,
                opts.bounds.y + i,
                opts.bounds.width,
                1
              );
            }
          } else if (mode=='chessboard'){
            imgData = drawer.context.getImageData(0, 0, drawer.canvas.width, drawer.canvas.height);
            _start = ( _start + drawer.canvas.getBoundingClientRect().top + drawer.canvas.getBoundingClientRect().left + get_window_pos('y') + get_window_pos('x') ) % 2;
            p = _start;
            for (i = 0; i < imgData.height; i += 1) {
              k0 = (i * imgData.width + p) * 4;
              for (j = 0; j < imgData.width; j+=2) {
                  k = k0 + j * 4;
                  imgData.data[k + 3] = 0;
              }
              p = 1 - p;
            }

            drawer.context.putImageData(imgData, 0, 0);
            drawer.context.globalCompositeOperation = 'destination-over';              

            drawer.context.drawImage(
                drawer.sketchCanvas,
                opts.bounds.x,
                opts.bounds.y,
                opts.bounds.width,
                opts.bounds.height,
                opts.bounds.x,
                opts.bounds.y,
                opts.bounds.width,
                opts.bounds.height
              );                         
          } else { //mode == 'column'
            _start = ( _start + drawer.canvas.getBoundingClientRect().left + get_window_pos('x') + opts.bounds.x ) % 2;
            //test = drawer.canvas.getBoundingClientRect().left + get_window_pos('x') + opts.bounds.x;
            // console.dir("_start="+_start);
            // console.dir("get_window_pos('x')="+get_window_pos('x'));
            // console.dir("opts.bounds.x="+opts.bounds.x);
            // console.dir("test="+test);
            for (i=_start;i<opts.bounds.width;i+=2) {	
              drawer.context.drawImage(
                drawer.sketchCanvas,
                opts.bounds.x + i,
                opts.bounds.y,
                1,
                opts.bounds.height,
                opts.bounds.x + i,
                opts.bounds.y,
                1,
                opts.bounds.height
              );
            }	                  
          } 
      } else {
          if(mode=='row'){     
            _start = ( _start + drawer.canvas.getBoundingClientRect().top + get_window_pos('y') ) % 2;               
            for (i=_start;i<drawer.canvas.height;i+=2) {	
              drawer.context.drawImage(                      
                drawer.sketchCanvas,
                opts.position.x - opts.widthExt * opts.scale,
                opts.position.y + - opts.heightExt * opts.scale + i * opts.scale,
                (drawer.canvas.width + 2 * opts.widthExt) * opts.scale,
                1,
                -opts.widthExt,
                -opts.heightExt + i,
                drawer.canvas.width + 2 * opts.widthExt,
                1
              );
            }                 
          } else if (mode=='chessboard'){
            imgData = drawer.context.getImageData(0, 0, drawer.canvas.width, drawer.canvas.height);
            _start = ( _start + drawer.canvas.getBoundingClientRect().top + drawer.canvas.getBoundingClientRect().left + get_window_pos('y') + get_window_pos('x') ) % 2;
            p = _start;
            for (i = 0; i < imgData.height; i += 1) {
              k0 = (i * imgData.width + p) * 4;
              for (j = 0; j < imgData.width; j += 2 ) {
                k = k0 + j * 4 + 3;
                  imgData.data[k] = 0;
              }
              p = 1 - p;
            }
            drawer.context.putImageData(imgData, 0, 0);
            drawer.context.globalCompositeOperation = 'destination-over';
            drawer.context.drawImage(
              drawer.sketchCanvas,
              opts.position.x - opts.widthExt * opts.scale,
              opts.position.y - opts.heightExt * opts.scale,
              (drawer.canvas.width + 2 * opts.widthExt) * opts.scale,
              (drawer.canvas.height + 2 * opts.heightExt) * opts.scale,
              -opts.widthExt,
              -opts.heightExt,
              drawer.canvas.width + 2 * opts.widthExt,
              drawer.canvas.height + 2 * opts.heightExt
            );                      
        } else { //mode == 'column'
            _start = ( _start + drawer.canvas.getBoundingClientRect().left + get_window_pos('x') ) % 2;        
            for (i=_start;i<drawer.canvas.width;i+=2) {	
              drawer.context.drawImage(                      
                drawer.sketchCanvas,
                opts.position.x - opts.widthExt * opts.scale + i * opts.scale,
                opts.position.y - opts.heightExt * opts.scale,
                1,
                (drawer.canvas.height + 2 * opts.heightExt) * opts.scale,
                -opts.widthExt + i,
                -opts.heightExt,
                1,
                drawer.canvas.height + 2 * opts.heightExt
              );
            } 
        }         
      }  
    };
  };

}(OpenSeadragon));  